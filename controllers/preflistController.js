import {catchAsync} from '../utils/catchAsync.js';
import appError from '../utils/appError.js';
import Preflist from '../models/preflistModel.js';
import Student from '../models/studenModel.js';
import PFE from '../models/PFEmodel.js';
import SupervisionRequest from '../models/SupervisionRequestModel.js';
import sequelize from '../config/database.js';
import teacher from '../models/teacherModel.js';
import Team from '../models/groupModel.js';
import app from '../index.js';
import { Op } from 'sequelize';


// export const createPreflist = catchAsync(async (req, res, next) => {
//   const { pfeIds } = req.body;

//   if (!req.user) {
//     return next(new appError('User was not found, login and try again', 403));
//   }

//   const user = req.user;
//   const mystudent = await Student.findByPk(user.id); 

//   if (!mystudent) {
//     return next(new appError('Student not found', 403));
//   }

//   if (!Array.isArray(pfeIds) || pfeIds.length !== 5) {
//     return next(new appError('You must provide exactly 5 PFE IDs.', 400));
//   }

//   const unique = new Set(pfeIds);
//   if (unique.size !== 5) {
//     return next(new appError('Duplicate PFE IDs are not allowed.', 400));
//   }

//   const teamId = mystudent.team_id;

//   if (!teamId) {
//     return next(new appError('Student is not in a team', 403));
//   }

//   const existing = await Preflist.findOne({ where: { teamId } });
//   if (existing) {
//     return next(new appError('This team has already submitted a preflist.', 400));
//   }
//   const pfes = await PFE.findAll({ where: { id: pfeIds } });
//   if (pfes.length !== 5) {
//     return next(new appError('One or more selected PFEs do not exist.', 400));
//   }

//   const { year: studentYear, specialite: studentSpec } = mystudent;
//   console.log('Student year:', studentYear);
//   console.log('Student specialite:', studentSpec);

//   for (const pfe of pfes) {
//     if (pfe.year !== studentYear) {
//       return next(
//         new appError(`
//           PFE ${pfe.id} year (${pfe.year}) does not match student's year (${studentYear}).`,
//           400
//         )
//       );
//     }
    
//     if (studentSpec && pfe.specialization !== studentSpec) {
//       return next(
//         new appError(`
//           PFE ${pfe.id} specialite (${pfe.specialization}) does not match student's specialite (${studentSpec}).`,
//           400
//         )
//       );
//     }
//   }

//   const preflistEntries = pfeIds.map((pfeId, index) => ({
//     teamId,
//     pfeId,
//     order: index + 1,
//     ML: req.files?.ML?.[0]?.path || null
//   }));

//   const created = await Preflist.bulkCreate(preflistEntries);
//   console.log('Creating SupervisionRequest...');
//   await SupervisionRequest.create({
//     teamId,
//     pfeId: pfeIds[0], 
//     status: 'PENDING',
//     sentAt: new Date(),
//     ML: req.files?.ML?.[0]?.path || null
//   });
//   console.log('SupervisionRequest...Created');
//   res.status(201).json({
//     status: 'success',
//     message: `Preflist created for team ${teamId}`,
//     data: created,
//   });
// });


export const createPreflist = catchAsync(async (req, res, next) => {
  let { pfeIds } = req.body;

  console.log("Raw pfeIds:", pfeIds);
  console.log("ML File Path:", req.files?.ML?.[0]?.path);

  if (!req.user) {
    return next(new appError('User was not found, login and try again', 403));
  }

  const user = req.user;
  const mystudent = await Student.findByPk(user.id); 
  if (!mystudent) {
    return next(new appError('Student not found', 403));
  }

  // Ensure pfeIds is an array of integers
  if (typeof pfeIds === 'string') {
    try {
      pfeIds = JSON.parse(pfeIds);
    } catch (err) {
      return next(new appError('Invalid pfeIds format', 400));
    }
  }

  if (!Array.isArray(pfeIds)) {
    return next(new appError('You must provide exactly 5 PFE IDs as an array.', 400));
  }

  pfeIds = pfeIds.map(id => parseInt(id, 10));
  if (pfeIds.some(id => isNaN(id))) {
    return next(new appError('All PFE IDs must be valid integers.', 400));
  }

  if (pfeIds.length !== 5) {
    return next(new appError('You must provide exactly 5 PFE IDs.', 400));
  }
  


  const unique = new Set(pfeIds);
  if (unique.size !== 5) {
    return next(new appError('Duplicate PFE IDs are not allowed.', 400));
  }

  const teamId = mystudent.team_id;
  if (!teamId) {
    return next(new appError('Student is not in a team', 403));
  }

  const existingEntries = await Preflist.findAll({ where: { teamId }, order: [['order', 'ASC']] });

  // If preflist already approved, deny changes
  if (existingEntries.length && existingEntries[0].approved === true) {
    return next(new appError('Preflist is already approved and cannot be modified.', 403));
  }

  const pfes = await PFE.findAll({ where: { id: pfeIds } });
  if (pfes.length !== 5) {
    return next(new appError('One or more selected PFEs do not exist.', 400));
  }
  const invalidPfe = pfes.find(pfe => pfe.status !== 'VALIDE');
if (invalidPfe) {
  return next(new appError(`PFE ${invalidPfe.id} is not valid (status: ${invalidPfe.status}) and cannot be added to the preflist.`, 400));
}

  const { year: studentYear, specialite: studentSpec } = mystudent;

  for (const pfe of pfes) {
    if (pfe.year !== studentYear) {
      return next(new appError(
        `PFE ${pfe.id} year (${pfe.year}) does not match student's year (${studentYear}).`,
        400
      ));
    }

    if (
  studentSpec &&
  (!Array.isArray(pfe.specialization) || !pfe.specialization.includes(studentSpec))
) {
  return next(new appError(
    `PFE ${pfe.id} specialization (${pfe.specialization}) does not match student's specialization (${studentSpec}).`,
    400
  ));
}


  }

  const MLPath = req.files?.ML?.[0]?.path || null;

  // Wrap delete + insert in a transaction
  await sequelize.transaction(async (t) => {
    if (existingEntries.length) {
      await Preflist.destroy({ where: { teamId }, transaction: t });
    }

    const preflistEntries = pfeIds.map((pfeId, index) => ({
      teamId,
      pfeId,
      order: index + 1,
      ML: MLPath
    }));

    const created = await Preflist.bulkCreate(preflistEntries, { transaction: t });

    res.status(existingEntries.length ? 200 : 201).json({
      status: 'success',
      message: `Preflist ${existingEntries.length ? 'updated' : 'created'} for team ${teamId}`,
      data: created,
    });
  });
});




export const approvePreflist = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new appError('Forbidden: You are not logged in.', 403));
  }

  const mystudent = await Student.findByPk(req.user.id);
  if (!mystudent) {
    return next(new appError('Student not found.', 403));
  }

  const teamId = mystudent.team_id;
  if (!teamId) {
    return next(new appError('Student is not in a team.', 403));
  }

  const entries = await Preflist.findAll({
    where: { teamId },
    order: [['order', 'ASC']],
  });

  if (!entries.length) {
    return next(new appError('No preflist found to approve.', 404));
  }

  // Check if already approved
  if (entries[0].approved === true) {
    return next(new appError('Preflist has already been approved.', 400));
  }

  // Approve all entries in the list
  await Preflist.update(
    { approved: true },
    { where: { teamId } }
  );

  // Send supervision request for the first PFE
  const firstPfeId = entries[0].pfeId;
  await SupervisionRequest.create({
    teamId,
    pfeId: firstPfeId,
    status: 'PENDING',
    sentAt: new Date(),
    ML: entries[0].ML
  });

  res.status(200).json({
    status: 'success',
    message: `Preflist for team ${teamId} approved. Supervision request sent for PFE ${firstPfeId}.`
  });
});




export const updatePreflist = catchAsync(async (req, res, next) => {
  const { pfeIds } = req.body;

  if (!req.user) {
    return next(new appError('User was not found, login and try again', 403));
  }

  const user = req.user;
  const mystudent = await Student.findByPk(user.id); 

  if (!mystudent) {
    return next(new appError('Student not found', 403));
  }
  
  if (!Array.isArray(pfeIds) || pfeIds.length !== 5) {
    return next(new appError('You must provide exactly 5 PFE IDs.', 400));
  }

  const unique = new Set(pfeIds);
  if (unique.size !== 5) {
    return next(new appError('Duplicate PFE IDs are not allowed.', 400));
  }

  const teamId = mystudent.team_id;

  if (!teamId) {
    return next(new appError('Student is not in a team', 403));
  }
  const alreadyApproved = await Preflist.findOne({
    where: { teamId, approved: true }
  });

  if (alreadyApproved) {
    return next(
      new appError(
        'Preflist has already been approved; you cannot update it now.',
        400
      )
    );
  }

  
  await Preflist.destroy({ where: { teamId } });


  const pfes = await PFE.findAll({ where: { id: pfeIds } });
  if (pfes.length !== 5) {
    return next(new appError('One or more selected PFEs do not exist.', 400));
  }

  const { year: studentYear, specialite: studentSpec } = mystudent;
  for (const pfe of pfes) {
    if (pfe.year !== studentYear || pfe.specialite !== studentSpec) {
      return next(
        new appError(
          `PFE ${pfe.id} does not match the student's year or specialite.`,
          400
        )
      );
    }
  }
  const preflistEntries = pfeIds.map((pfeId, index) => ({
    teamId,
    pfeId,
    order: index + 1,
    ML: req.files?.ML?.[0]?.path || null
  }));

  const created = await Preflist.bulkCreate(preflistEntries);

  res.status(200).json({
    status: 'success',
    message: `Preflist updated for team ${teamId}`,
    data: created,
  });
});


export const removeFromPreflist = catchAsync(async (req, res, next) => {
  const { pfeId } = req.params;

  if (!req.user) {
    return next(new appError('User was not found, login and try again', 403));
  }

  const user = req.user;
  const mystudent = await Student.findByPk(user.id); 

  if (!mystudent) {
    return next(new appError('Student not found', 403));
  }

  const teamId = mystudent.team_id;

  if (!teamId) {
    return next(new appError('Student is not in a team', 403));
  }
const alreadyApproved = await Preflist.findOne({
    where: { teamId, approved: true }
  });
  if (alreadyApproved) {
    return next(
      new appError(
        'Preflist has already been approved; you cannot update it now.',
        400
      )
    );
  }
  const preflists = await Preflist.findAll({
    where: {
      teamId,
      pfeId,
    },
  });

  if (!preflists || preflists.length === 0) {
    return next(new appError('PFE not found in your team\'s preflist.', 404));
  }
  

  const deleteCloudinaryFile = async (url) => {
          if (!url) return;
        
          try {
            const uploadIndex = url.indexOf('/upload/');
            if (uploadIndex === -1) {
              console.error('Invalid Cloudinary URL format');
              return;
            }
        
            const pathAfterUpload = url.substring(uploadIndex + 8);
            const parts = pathAfterUpload.split('/');
        
            // Remove version if present
            if (parts[0].startsWith('v')) {
              parts.shift();
            }
        
            const fileWithExtension = parts.pop();
            let fileNameWithoutExtension = fileWithExtension;
        
            // Remove .jpg or .pdf extension if present
            if (fileWithExtension.endsWith('.jpg')) {
              fileNameWithoutExtension = fileWithExtension.slice(0, -4);
            } else if (fileWithExtension.endsWith('.pdf')) {
              fileNameWithoutExtension = fileWithExtension.slice(0, -4);
            }
        
            parts.push(fileNameWithoutExtension);
            const publicId = parts.join('/');
            console.log(`Public ID: ${publicId}`);
        
            const resourceType = url.includes('/raw/') ? 'raw' : 'image';
        
            await cloudinary.uploader.destroy(publicId, {
              resource_type: resourceType,
              invalidate: true,
            });
        
            console.log(`Deleted ${resourceType} from Cloudinary: ${publicId}`);
          } catch (err) {
            console.error(`Error deleting file from Cloudinary: ${err.message}`);
          }
        };
        await deleteCloudinaryFile(preflists.ML);
        await preflists.destroy();
  res.status(200).json({
    status: 'success',
    message: `PFE ${pfeId} removed from preflist.`,
  });
});


export const respondToRequest = catchAsync(async (req, res, next) => {
  const { status } = req.body; // 'ACCEPTED' or 'REJECTED'
  const { id } = req.params;
  console.log(id);

  const request = await SupervisionRequest.findByPk(id);

  if (!request) {
    return next(new appError('Request not found', 404));
  }

  if (request.status !== 'PENDING') {
    return next(new appError('This request has already been processed', 400));
  }

  if (!['ACCEPTED', 'REJECTED'].includes(status)) {
    return next(new appError('Invalid status', 400));
  }

  request.status = status;
  await request.save();

  if (status === 'ACCEPTED') {
    const pfe = await PFE.findByPk(request.pfeId, {
      include: [{ model: teacher, as: 'supervisors' }]
    });
    if (!pfe) {
      return next(new appError('PFE not found', 404));
    }

    const team = await Team.findByPk(request.teamId);
    if (!team) {
      return next(new appError('Team not found', 404));
    }

    await team.update({ pfe_id: pfe.id });

    await team.setSupervisor(pfe.supervisors); 

  }

  if (status === 'REJECTED') {
    const preflist = await Preflist.findAll({
      where: { teamId: request.teamId },
      order: [['order', 'ASC']]
    });

    const currentIndex = preflist.findIndex(p => p.pfeId === request.pfeId);
    const next = preflist[currentIndex + 1];

    if (next) {
      await SupervisionRequest.create({
        teamId: request.teamId,
        pfeId: next.pfeId,
        status: 'PENDING',
        sentAt: new Date()
      });
    }
  }

  res.status(200).json({
    status: 'success',
    message: `Request ${status.toLowerCase()} successfully.`
  });
});




export const acceptRandomRequestsForMultiplePFEs = catchAsync(async (req, res, next) => {
  const { pfeIds, numberToAccept } = req.body;

  if (!Array.isArray(pfeIds) || pfeIds.length === 0 || !numberToAccept || isNaN(numberToAccept)) {
    return next(new appError('Invalid input: provide pfeIds (array) and numberToAccept (number)', 400));
  }

  const results = [];

  for (const pfeId of pfeIds) {
    const pendingRequests = await SupervisionRequest.findAll({
      where: {
        pfeId,
        status: 'PENDING',
      },
      order: sequelize.random(),
    });

    const toAccept = pendingRequests.slice(0, numberToAccept);
    const toReject = pendingRequests.slice(numberToAccept);

    await Promise.all(toAccept.map(async (req) => {
      req.status = 'ACCEPTED';
      await req.save();

      const team = await Team.findByPk(req.teamId);
      const pfe = await PFE.findByPk(req.pfeId, {
        include: [{ model: teacher, as: 'supervisors' }]
      });

      if (!team || !pfe) return;

      if (!team.pfe_id) {
        team.pfe_id = pfe.id;
        await team.save();
      }

      if (pfe.supervisors && pfe.supervisors.length > 0) {
        await team.addSupervisors(pfe.supervisors);
      }
    }));

    await Promise.all(toReject.map(req => {
      req.status = 'REJECTED';
      return req.save();
    }));

    results.push({
      pfeId,
      accepted: toAccept.map(r => r.id),
      rejected: toReject.map(r => r.id),
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Requests processed successfully for all PFEs',
    results,
  });
});


export const getAllrequests = catchAsync(async (req, res, next) => {

  if (!req.user){
    next(new appError('you are not authenticated , please login again!!!!!!',403))
  }
  const userId = req.user.id;
  const role = req.user.role;

  let requests;

  if (role === 'teacher') {
    requests = await SupervisionRequest.findAll({
      include: [
        {
          model: PFE,
          as: 'pfe',
          where: { createdBy: userId },
          attributes: [
            'id',
            'title',
            'specialization',
            'year',
            'description',
            'pdfFile',
            'status',
            'reason',
            'resonfile',
            'createdBy',
            'photo'
          ]
        }
      ]
    });
  } else if (role === 'student') {
    const student = await Student.findOne({ where: { userId } });

    if (!student || !student.team_id) {
      return next(new appError('Student or team not found', 404));
    }

    requests = await SupervisionRequest.findAll({
      where: { teamId: student.team_id },
      include: [
        {
          model: PFE,
          as: 'pfe',
          attributes: [
            'id',
            'title',
            'specialization',
            'year',
            'description',
            'pdfFile',
            'status',
            'reason',
            'resonfile',
            'createdBy',
            'photo'
          ]
        }
      ]
    });
  } else {
    return next(new appError('Unauthorized role', 403));
  }

  if (!requests || requests.length === 0) {
    return next(new appError('No requests found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'All requests retrieved successfully',
    data: requests,
  });
});


export const filterRequestsByGrade = catchAsync(async (req, res, next) => {
  const { grade } = req.params;
  if (!grade) {
    return next(new appError('Grade is required.', 400));
  }

  if (!req.user) {
    return next(new appError('User not authenticated.', 401));
  }

  const user = req.user;
  const myteacher = await teacher.findByPk(user.id);
  if (!myteacher) {
    return next(new appError('Teacher not found.', 404));
  }

  const requests = await SupervisionRequest.findAll({
    include: [
      {
        model: Team,
        as: 'team',
        required: true,
        include: [
          {
            model: Preflist,
            required: true,
            include: [
              {
                model: PFE,
                required: true,
                include: [
                  {
                    model: teacher,
                    as: 'supervisors',
                    where: { id: teacher.id }, // Only PFEs where the teacher is a supervisor
                    required: true,
                    through: { attributes: [] } // omit join table
                  }
                ]
              }
            ]
          },
          {
            model: Student,
            as: 'members',
            required: true,
            where: { year: grade.toUpperCase() } // Filter by grade
          }
        ]
      }
    ]
  });

  if (!requests || requests.length === 0) {
    return next(new appError('No requests found for this grade.', 404));
  }

  // Add 'grade', 'specialization', and 'pfeTitle' to each request in the data array
  requests.forEach(request => {
    const team = request.team;
    const grade = team.members[0].year || null; // Ensures grade exists
    const specialization = team.Preflist.PFE.specialization || null;
    request.dataValues.grade = grade;
    request.dataValues.specialization = specialization;
    request.dataValues.pfeTitle = team.Preflist.PFE.title;
  });

  res.status(200).json({
    status: 'success',
    results: requests.length,
    data: requests,
  });
});



export const filterRequestsBySpecialization = catchAsync(async (req, res, next) => {
  const { specialization } = req.params;
  if (!specialization) {
    return next(new appError('Specialization is required.', 400));
  }

  if (!req.user) {
    return next(new appError('User not authenticated.', 401));
  }

  const user = req.user;
  const myteacher = await teacher.findByPk(user.id);
  if (!myteacher) {
    return next(new appError('Teacher not found.', 404));
  }

  const requests = await SupervisionRequest.findAll({
    include: [
      {
        model: Team,
        as: 'team',
        required: true,
        include: [
          {
            model: Preflist,
            required: true,
            include: [
              {
                model: PFE,
                required: true,
                include: [
                  {
                    model: teacher,
                    as: 'supervisors',
                    where: { id: teacher.id }, // Only PFEs where the teacher is a supervisor
                    required: true,
                    through: { attributes: [] } // omit join table
                  }
                ]
              }
            ]
          },
          {
            model: Student,
            as: 'members',
            required: true,
            where: { specialite: specialization.toUpperCase() } // Filter by specialization
          }
        ]
      }
    ]
  });

  if (!requests || requests.length === 0) {
    return next(new appError('No requests found for this specialization.', 404));
  }

  // Add 'specialization', 'grade', and 'pfeTitle' to each request in the data array
  requests.forEach(request => {
    const team = request.team;
    const specialization = team.Preflist.PFE.specialization || null;  // Ensure specialty is handled correctly
    const grade = team.members[0].year; // Assuming all members have the same year
    request.dataValues.specialization = specialization;
    request.dataValues.grade = grade;
    request.dataValues.pfeTitle = team.Preflist.PFE.title;
  });

  res.status(200).json({
    status: 'success',
    results: requests.length,
    data: requests,
  });
});



export const getMyPreflist = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new appError('User not authenticated.', 401));
  }
  const mystudent = await Student.findByPk(req.user.id);
  if (!mystudent) {
    return next(new appError('Student not found.', 404));
  }

  const teamId = mystudent.team_id;
  if (!teamId) {
    return next(new appError('Student is not in a team.', 403));
  }

  
  const preflist = await Preflist.findAll({
    where: { teamId },
    order: [['order', 'ASC']],
    include: [
      {
        model: PFE, 
        attributes: ['id', 'title', 'description', 'year', 'specialization',"photo","pdfFile"],
        required: true,
        include: [
          {
            model: teacher,
            as: 'supervisors', 
            through: { attributes: [] }, 
            attributes: ['id', 'firstname', 'lastname'], 
          },
          {
            model: SupervisionRequest,
            as: 'supervisionRequests', 
            where: { teamId },
            required: false,
            attributes: ['status'], 
          }
        ]
      },
    ],
  });

  
  res.status(200).json({
    status: 'success',
    results: preflist.length,
    data: preflist,
  });
});

export const getpreflist = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new appError('User not authenticated.', 401));
  }
  const {teamId} = req.params;
  if (!teamId) {
    return next(new appError('Student is not in a team.', 403));
  }

  
  const preflist = await Preflist.findAll({
    where: { teamId },
    order: [['order', 'ASC']],
    include: [
      {
        model: PFE, 
        attributes: ['id', 'title', 'description', 'year', 'specialization',"photo","pdfFile"],
        include: [
          {
            model: teacher,
            as: 'supervisors', 
            through: { attributes: [] }, 
            attributes: ['id', 'firstname', 'lastname'], 
          },
          {
            model: SupervisionRequest,
            as: 'supervisionRequests', 
            where: { teamId },
            required: false,
            attributes: ['status'], 
          }

        ]
      },
    ],
  });

  
  res.status(200).json({
    status: 'success',
    results: preflist.length,
    data: preflist,
  });
});




