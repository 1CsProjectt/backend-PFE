import {catchAsync} from '../utils/catchAsync.js';
import appError from '../utils/appError.js';
import Preflist from '../models/preflistModel.js';
import Student from '../models/studenModel.js';
import PFE from '../models/PFEmodel.js';
import SupervisionRequest from '../models/SupervisionRequestModel.js';

import Teacher from '../models/teacherModel.js';
import Team from '../models/groupModel.js';

export const createPreflist = catchAsync(async (req, res, next) => {
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

  const existing = await Preflist.findOne({ where: { teamId } });
  if (existing) {
    return next(new appError('This team has already submitted a preflist.', 400));
  }
  const pfes = await PFE.findAll({ where: { id: pfeIds } });
  if (pfes.length !== 5) {
    return next(new appError('One or more selected PFEs do not exist.', 400));
  }

  const { year: studentYear, specialite: studentSpec } = mystudent;
  console.log('Student year:', studentYear);
  console.log('Student specialite:', studentSpec);

  for (const pfe of pfes) {
    if (pfe.year !== studentYear) {
      return next(
        new appError(
          `PFE ${pfe.id} year (${pfe.year}) does not match student's year (${studentYear}).`,
          400
        )
      );
    }
    
    if (studentSpec && pfe.specialization !== studentSpec) {
      return next(
        new appError(
          `PFE ${pfe.id} specialite (${pfe.specialization}) does not match student's specialite (${studentSpec}).`,
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


  res.status(201).json({
    status: 'success',
    message: `Preflist created for team ${teamId}`,
    data: created,
  });
});

export const approvePreflist = catchAsync(async (req, res, next) => {

  const { teamId } = req.params;
  const entries = await Preflist.findAll({
    where: { teamId },
    order: [['order', 'ASC']]
  });
  if (!entries.length) {
    return next(new appError('No preflist found to approve', 404));
  }

  await Preflist.update(
    { approved: true },
    { where: { teamId } }
  );

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
  const deleted = await Preflist.destroy({
    where: {
      teamId,
      pfeId,
    },
  });

  if (!deleted) {
    return next(new appError('PFE not found in your team\'s preflist.', 404));
  }

  res.status(200).json({
    status: 'success',
    message: `PFE ${pfeId} removed from preflist.`,
  });
});



export const respondToRequest = catchAsync(async (req, res, next) => {
  const { status } = req.body; // 'ACCEPTED' or 'REJECTED'
  const { id } = req.params;

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

  // Optional: if accepted, cancel future requests for this team
  if (status === 'ACCEPTED') {
    await SupervisionRequest.update(
      { status: 'REJECTED' },
      {
        where: {
          teamId: request.teamId,
          status: 'PENDING',
          id: { [Op.ne]: id }
        }
      }
    );
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

    await Promise.all(toAccept.map(req => {
      req.status = 'ACCEPTED';
      return req.save();
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
  const requests=await SupervisionRequest.findAll({});
  if (!requests) {
    return next(new appError('No requests found', 404));
  }
  res.status(200).json({
    status: 'success',
    message: 'All requests retrieved successfully',
    data: requests,
  });
})




export const filterRequestsByGrade = catchAsync(async (req, res, next) => {
  const { grade } = req.body;
  if (!grade) {
    return next(new appError('Grade is required.', 400)); 
  }

  if (!req.user) {
    return next(new appError('User not authenticated.', 401));
  }

  const user = req.user;
  const teacher = await Teacher.findByPk(user.id);
  if (!teacher) {
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
                as: 'pfe',
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
            where: { year: grade.toUpperCase() }
          }
        ]
      }
    ]
  });

  if (!requests || requests.length === 0) {
    return next(new appError('No requests found for this grade.', 404));
  }

  res.status(200).json({
    status: 'success',
    results: requests.length,
    data: requests,
  });
});



const filterRequestsBySpecialization = catchAsync(async (req, res, next) => {

})

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
        attributes: ['id', 'title', 'description', 'year', 'specialization'],
      },
    ],
  });

  if (!preflist || preflist.length === 0) {
    return next(new appError('No preflist found for your team.', 404));
  }

  res.status(200).json({
    status: 'success',
    results: preflist.length,
    data: preflist,
  });
});

