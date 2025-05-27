import sequelize from "../config/database.js";
import PFE from "../models/PFEmodel.js";
import express from 'express'
import app from "../index.js";
import path from'path';
import { fileURLToPath } from 'url'
import fs from 'fs';
import { catchAsync } from "../utils/catchAsync.js";
import appError from "../utils/appError.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import teacher from "../models/teacherModel.js";
import Student from "../models/studenModel.js";
import { Op, fn, col,literal } from "sequelize"; 
import User from "../models/UserModel.js";
import Extern from "../models/externModel.js";
import Team from "../models/groupModel.js";
import { v2 as cloudinary } from 'cloudinary';
import { count } from "console";
import Notification from "../models/notificationModel.js";


export const createPFE = catchAsync(async (req, res, next) => {
    const { title, specialization, supervisor, description, year } = req.body;
    const pdfFile = req.files?.pdfFile?.[0]?.path;
    const photo = req.files?.photo?.[0]?.path;
    const userId = req.user.id;
    const role = req.user.role;
    const createdBy = req.user.id;

    if (!pdfFile) {
        return next(new appError("PDF file is required", 400));
    }

    let supervisorsArray = [];
    let specialite = null;

    // Safely parse supervisor input
    let supervisorList = supervisor;

    if (typeof supervisor === 'string') {
        try {
            const parsed = JSON.parse(supervisor);
            supervisorList = Array.isArray(parsed) ? parsed : [parsed];
        } catch (err) {
            supervisorList = [supervisor];
        }
    } else if (!Array.isArray(supervisorList)) {
        supervisorList = [supervisorList];
    }

    if (role === 'teacher') {
        const myteacher = await teacher.findByPk(userId);
        if (!myteacher) {
            return next(new appError('Teacher not found', 404));
        }

        // Include current teacher by default
        supervisorsArray = [myteacher.id];

        // Add any additional valid supervisor IDs
        supervisorList.forEach(id => {
            const parsedId = parseInt(id);
            if (!isNaN(parsedId) && !supervisorsArray.includes(parsedId)) {
                supervisorsArray.push(parsedId);
            }
        });

        // Set specialization only for 2CS or 3CS
        if (year === "2CS" || year === "3CS") {
            if (Array.isArray(specialization)) {
                specialite = specialization;
            } else if (typeof specialization === 'string') {
                specialite = [specialization]; // Convert to array
            } else {
                specialite = null;
            }
        }

    } else if (role === 'extern') {
        supervisorsArray = []; // No supervisors for extern
        specialite = null;
    } else {
        return next(new appError('Invalid role', 403));
    }

    // Debug logs (optional)
    console.log("Parsed supervisorList:", supervisorList);
    console.log("Final supervisorsArray:", supervisorsArray);
    console.log("Specialite (array):", specialite);

    const pfe = await PFE.create({
        title,
        specialization: specialite,
        description,
        year: year.toUpperCase(),
        pdfFile,
        photo,
        createdBy
    });

    await pfe.setSupervisors(supervisorsArray);

    return res.status(201).json({
        message: "PFE created successfully",
        pfe
    });
});



export const deletePFE = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const pfe = await PFE.findByPk(id);
    if (!pfe) {
        return next(new appError("PFE not found", 404));
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
      

    await deleteCloudinaryFile(pfe.pdfFile);
    await deleteCloudinaryFile(pfe.photo);

    await pfe.destroy();
    res.status(200).json({ message: "PFE and associated files deleted successfully" });
});


export const deletePFEforcreator = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    if (!id) {
        return next(new appError('You must provide an ID', 404));
    }

    const currentUserId = req.user.id; 
    if (!currentUserId) {
        return next(new appError('User not found', 404));
    }

    const pfe = await PFE.findByPk(id);
    if (!pfe) {
        return next(new appError("PFE not found", 404));
    }

    if (Number(pfe.createdBy) !== Number(currentUserId)) {
        return next(new appError("You are not authorized to delete this PFE", 403));
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
      
      
      
      
      
      

    await deleteCloudinaryFile(pfe.pdfFile);
    await deleteCloudinaryFile(pfe.photo);

    await pfe.destroy();
    res.status(200).json({ message: "PFE and associated files deleted successfully" });
});


const formatPFEUrls = (pfeList) => {
    return pfeList.map((pfe) => ({
        ...pfe.toJSON(),
        pdfFile: pfe.pdfFile || null,
        photo: pfe.photo || null,
    }));
};

export const getAllPFE = catchAsync(async (req, res, next) => {
    const pfeList = await PFE.findAll({
        include: [
            {
                model: User,
                as: "creator",
                attributes: ["id", "username", "email"],
                include: [
                    {
                        model: teacher,
                        as: "teacher",
                        attributes: ["firstname", "lastname"],
                        required: false
                    },
                    {
                        model: Extern,
                        as: "extern",
                        attributes: ["name"],
                        required: false
                    }
                ]
            },
            {
                model: teacher,
                as: "supervisors",
                attributes: ["id", "firstname", "lastname"],
                through: { attributes: [] }
            }
        ],
    });

    const formattedPFEList = formatPFEUrls(pfeList)

    res.status(200).json({
        status: "success",
        count: formattedPFEList.length,
        pfeList: formattedPFEList
    });
});




export const getMyPfe = catchAsync(async (req, res, next) => {
    const userId = req.user?.id;
    let pfes;
    if (!userId) return next(new appError("User not authenticated", 401));
 if (req.user?.role =='teacher'){
    const myTeacher = await teacher.findOne({ where: { id: userId } });
    if (!myTeacher) return next(new appError("User is not a teacher", 403));
     pfes = await PFE.findAll({
        include: [
            {
                model: teacher,
                as: 'supervisors',
                where: { id: req.user.id },
                through: { attributes: [] }, 
                required: true,
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['email'],
                        required: false
                    }
                ]
            },
            {
                model: User,
                as: 'creator',
                attributes: ['id', 'email'],
                include: [
                    {
                        model: teacher,
                        as: 'teacher',
                        attributes: ['firstname', 'lastname'],
                        required: false
                    },
                    {
                        model: Extern,
                        as: 'extern',
                        required: false
                    }
                ]
            }
        ]
    }); }else{
        const myextern = await Extern.findOne({ where: { id: userId } });
        if (!myextern) return next(new appError("User is not a Extern", 403));
         pfes = await PFE.findAll({
            where: { createdBy: req.user.id },
            include: [
              {
                model: teacher,
                as: 'supervisors',
                through: { attributes: [] },
                include: [
                  {
                    model: User,
                    as: 'user',
                    attributes: ['email'],
                  },
                ],
              },
              {
                model: User,
                as: 'creator',
                attributes: ['id', 'email'],
                include: [
                  {
                    model: teacher,
                    as: 'teacher',
                    attributes: ['firstname', 'lastname'],
                  },
                  {
                    model: Extern,
                    as: 'extern',
                  },
                ],
              },
            ],
          });
     }

    if (!pfes || pfes.length === 0) {
        return next(new appError("You are not supervising any PFEs.", 404));
    }

    const formattedPfes = formatPFEUrls(pfes).map((pfe) => ({
        ...pfe,
        creator: {
            ...pfe.creator,
            firstname: pfe.creator?.teacher?.firstname || null,
            lastname: pfe.creator?.teacher?.lastname || null
        }
    }));

    res.status(200).json({ status: "success", data: formattedPfes });
});



const downloadfile=(req, res) => {
      const filePath = path.join(__dirname,'..', 'uploads', req.params.filename);
      console.log(filePath)
      fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
          return res.status(404).json({ status: 'fail', message: "File not found",filePath:filePath });
        }});
      res.download(filePath, req.params.filename, (err) => {
        if (err) {
          res.status(500).send('<f1>Error downloading the file</f1>' );
          console.log(err)
        }
      }); 
    }

 
    export const displayPFE = catchAsync(async (req, res, next) => {
        const currentYear = new Date().getFullYear();
    
        const pfeList = await PFE.findAll({
            where: {
                status: 'NOT_VALIDE',
                [Op.and]: [literal(`EXTRACT(YEAR FROM "PFE"."createdAt") = ${currentYear}`)],
            },
            include: [
                { model: User, as: "creator", attributes: ["id", "username", "email","role"] },
                { model: teacher, as: "supervisors", attributes: ["id", "firstname","lastname"],include: [
                { model: User, as: "user", attributes: ["id", "email","role"] }
                ], through: { attributes: [] } }
            ],
        });
    
        const formattedPFEList = formatPFEUrls(pfeList);
    
        res.status(200).json({ status: "success", count: formattedPFEList.length, pfeList: formattedPFEList });
    });
    
    export const displaythisyearsPFE = catchAsync(async (req, res, next) => {
        if (!req.user || !req.user.id) {
            return next(new appError("Unauthorized: No user found in request", 401));
        }
    
        const currentStudent = await Student.findByPk(req.user.id);
        if (!currentStudent) {
            return next(new appError("Student not found", 404));
        }
    
        const year = currentStudent.year;
        if (!year) {
            return next(new appError("Student year is missing", 400));
        }
    
        const currentYear = new Date().getFullYear();
    
        const pfeList = await PFE.findAll({
            where: {
                year,
                [Op.and]: [literal(`EXTRACT(YEAR FROM "createdAt") = ${currentYear}`)]
            },
            include: [
                { model: User, as: "creator", attributes: ["id", "username", "email","role"] },
                { model: teacher, as: "supervisors", attributes: ["id", "name"], through: { attributes: [] } }
            ],
        });
    
        const formattedPFEList = formatPFEUrls(pfeList);
    
        res.status(200).json({ status: "success", count: formattedPFEList.length, pfeList: formattedPFEList });
    });
    
    export const displayvalidePFE = catchAsync(async (req, res, next) => {
        const currentYear = new Date().getFullYear();
    
        const pfeList = await PFE.findAll({
            where: {
                status: 'VALIDE',
                [Op.and]: [literal(`EXTRACT(YEAR FROM "PFE"."createdAt") = ${currentYear}`)]
  //                createdAt: {
  //   [Op.or]: [
  //     {
  //       [Op.between]: [sepLastYear, junThisYear]
  //     },
  //     {
  //       [Op.between]: [sepThisYear, junNextYear]
  //     }
  //   ]
  // }
            },
            include: [
                { model: User, as: "creator", attributes: ["id", "username", "email","role"] },
                { model: teacher, as: "supervisors", attributes: ["id", "firstname","lastname"],include: [
                { model: User, as: "user", attributes: ["id", "email","role"] }
                ], through: { attributes: [] } }
            ],
        });
    
        const formattedPFEList = formatPFEUrls(pfeList);
    
        res.status(200).json({ status: "success", count: formattedPFEList.length, pfeList: formattedPFEList });
    });


    export const displayallvalidePFE = catchAsync(async (req, res, next) => {
        const currentYear = new Date().getFullYear();
     const id=req.user.id
        const pfeList = await PFE.findAll({
                 where: {
              status: 'VALIDE',
              createdBy: {
                [Op.ne]: id
              }
            },
            include: [
                { model: User, as: "creator", attributes: ["id", "username", "email","role"] },
                { model: teacher, as: "supervisors", attributes: ["id", "firstname","lastname"],include: [
                { model: User, as: "user", attributes: ["id", "email","role"] }
                ], through: { attributes: [] } }
            ],
        });
    
        const formattedPFEList = formatPFEUrls(pfeList);
    
        res.status(200).json({ status: "success", count: formattedPFEList.length, pfeList: formattedPFEList });
    });

    export const displayrejectedPFE = catchAsync(async (req, res, next) => {
        const currentYear = new Date().getFullYear();
    
        const pfeList = await PFE.findAll({
            where: {
                status: 'REJECTED',
                [Op.and]: [literal(`EXTRACT(YEAR FROM "PFE"."createdAt") = ${currentYear}`)]
            },
            include: [
                { model: User, as: "creator", attributes: ["id", "username", "email","role"] },
                { model: teacher, as: "supervisors", attributes: ["id", "firstname","lastname"], through: { attributes: [] } }
            ],
        });
    
        const formattedPFEList = formatPFEUrls(pfeList);
    
        res.status(200).json({ status: "success", count: formattedPFEList.length, pfeList: formattedPFEList });
    });
    
    
    export const addSupervisor = catchAsync(async (req, res, next) => {
        const { pfeId } = req.params;
        const { supervisors } = req.body; 
    
        if (!supervisors || !Array.isArray(supervisors) || supervisors.length === 0) {
            return next(new appError('Please provide at least one valid supervisor ID', 400));
        }
    
        //
        const pfe = await PFE.findByPk(pfeId, { include: { model: teacher, as: "supervisors" } });
        if (!pfe) {
            return next(new appError('PFE not found', 404));
        }
    
        // 🔍 Find valid teachers from the list
        const validTeachers = await teacher.findAll({
            where: { id: supervisors }
        });
    
        if (validTeachers.length !== supervisors.length) {
            return next(new appError('One or more supervisor IDs are invalid', 400));
        }
    
        
        await pfe.addSupervisors(validTeachers);
    
        res.status(200).json({
            message: "Supervisors added successfully",
            supervisors: await pfe.getSupervisors() 
        });
    });


      
      export const addSpecialization = catchAsync(async (req, res, next) => {
        const { pfeId } = req.params;
        const { specialization } = req.body;
    
        const allowedSpecializations = ['ISI', 'SIW', 'IASD'];
    console.log('this is specialization =========================>',specialization)
        if (!specialization) {
            return next(new appError('Please provide a valid specialization (ISI, SIW, IASD)', 400));
        }
    
        const pfe = await PFE.findByPk(pfeId);
        if (!pfe) {
            return next(new appError('PFE not found', 404));
        }
    
        pfe.specialization = specialization;
        await pfe.save();
    
        res.status(200).json({
            message: "Specialization added successfully",
            specialization: pfe.specialization
        });
    });
  


    export const validatePFE = catchAsync(async (req, res, next) => {
      const { id } = req.params;
    
      const pfe = await PFE.findByPk(id);
      if (!pfe) {
        return next(new appError('PFE not found', 404));
      }
    
      // Update PFE status
      pfe.status = 'VALIDE';
      await pfe.save();
    
      // Get associated supervisors (teachers)
      const supervisors = await pfe.getSupervisors(); // thanks to belongsToMany with alias 'supervisors'
    
      // Send a notification to each supervisor
      await Promise.all(
        supervisors.map(async (teacher) => {
          await Notification.create({
            user_id: teacher.id, // assuming teacher.id matches user_id in Notification
            type: "pfe-validated",
            content: `The PFE titled "${pfe.title}" has been validated.`,
            is_read: false,
            metadata: {
              pfeId: pfe.id,
              title: pfe.title,
              validatedAt: new Date(),
            },
          });
        })
      );
    
      res.status(200).json({
        message: "PFE validated successfully",
        pfe,
      });
    });
    



    export const rejectPFE = catchAsync(async (req, res, next) => {
      const { id } = req.params;
      const { reason } = req.body;
    
      const pfe = await PFE.findByPk(id);
      if (!pfe) {
        return next(new appError('PFE not found', 404));
      }
    
      pfe.status = 'REJECTED';
      pfe.reason = reason || null;
    
      if (req.files?.resonfile?.[0]) {
        pfe.resonfile = req.files.resonfile[0].path;
      }
    
      await pfe.save();
    
      // Notify all supervisors
      const supervisors = await pfe.getSupervisors(); // belongsToMany alias
    
      await Promise.all(
        supervisors.map(async (teacher) => {
          await Notification.create({
            user_id: teacher.id,
            type: "pfe-rejected",
            content: `The PFE titled "${pfe.title}" has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
            is_read: false,
            metadata: {
              pfeId: pfe.id,
              title: pfe.title,
              rejectedAt: new Date(),
              reason: reason || null,
            },
          });
        })
      );
    
      res.status(200).json({
        message: 'PFE rejected successfully',
        pfe,
      });
    });
    
  


  
export const displayPFEforstudents = catchAsync(async (req, res, next) => {
    if (!req.user) {
        return next(new appError("Unauthorized: No user found in request", 401));
    }

    const currentStudent = await Student.findByPk(req.user.id);
    if (!currentStudent) {
        return next(new appError("Student not found", 404));
    }

    const currentYear = new Date().getFullYear();

    let filterConditions = {
        year: currentStudent.year,
        status: 'VALIDE',
    };

    if (!["2CP", "1CS"].includes(currentStudent.year) && currentStudent.specialite) {
    filterConditions.specialization = {
        [Op.contains]: [currentStudent.specialite],
    };
}


    const pfeList = await PFE.findAll({
        where: {
            ...filterConditions,
            [Op.and]: [literal(`EXTRACT(YEAR FROM "PFE"."createdAt") = ${currentYear}`)],
        },
        include: [
            {
                model: teacher,
                as: "supervisors",
                attributes: ["id", "firstname", "lastname"],
                include: [
                    { model: User, as: "user", attributes: ["id", "username", "email"] }
                ]
            },
        ],
    });

    if (pfeList.length === 0) {
        return res.status(200).json({
            status: "success",
            message: "No PFE found for your criteria.",
            count: 0,
            pfeList: [],
        });
    }

    const formattedPFEList = pfeList.map((pfe) => {
        const supervisor = pfe.supervisors[0];
        const createdBy = supervisor ? supervisor.user : null;

        return {
            ...pfe.toJSON(),
            createdBy: createdBy
                ? {
                    id: createdBy.id,
                    username: createdBy.username,
                    email: createdBy.email,
                    firstname: supervisor.firstname,
                    lastname: supervisor.lastname,
                }
                : "Extern or Other Entity",
            pdfFile: pfe.pdfFile || null,
            photo: pfe.photo || null,
        };
    });

    res.status(200).json({ status: "success", count: formattedPFEList.length, pfeList: formattedPFEList });
});

export const searchForPfes = catchAsync(async (req, res, next) => {
    const { query } = req.query;
    if (!query) {
        return next(new appError("Query parameter is required", 400));
    }

    const pfes = await PFE.findAll({
        where: {
            [Op.or]: [
                { title: { [Op.iLike]: `%${query}%` } },
                { '$supervisors.firstname$': { [Op.iLike]: `%${query}%` } },
                { '$supervisors.lastname$': { [Op.iLike]: `%${query}%` } },
                { '$supervisors.user.email$': { [Op.iLike]: `%${query}%` } },
                { '$creator.email$': { [Op.iLike]: `%${query}%` } }
            ]
        },
        include: [
            {
                model: teacher,
                as: "supervisors",
                required: false,
                include: [{ model: User, as: "user", attributes: ["email"], required: false }]
            },
            {
                model: User,
                as: "creator",
                attributes: ["id", "email"],
                include: [
                    {
                        model: teacher,
                        as: "teacher",
                        attributes: ["firstname", "lastname"],
                        required: false
                    }
                ]
            }
        ]
    });

    if (pfes.length === 0) {
        return next(new appError("No PFEs found matching the search criteria.", 404));
    }

    const formattedPfes = formatPFEUrls(pfes);

    res.status(200).json({ status: "success", data: formattedPfes });
});

export const getPfesBySpecialization = catchAsync(async (req, res, next) => {
    const { specialization } = req.params;

    if (!["ISI", "IASD", "SIW"].includes(specialization.toUpperCase())) {
        return next(new appError("Invalid specialization", 400));
    }

    const pfes = await PFE.findAll({
        where: { specialization: specialization.toUpperCase() }
    });

    if (pfes.length === 0) {
        return next(new appError("No PFEs found for this specialization.", 404));
    }

    const formattedPfes = formatPFEUrls(pfes);

    res.status(200).json({ status: "success", data: formattedPfes });
});


export const getIsiPfes = async (req, res) => {
    return getPfesBySpecialization("ISI", res);
  };
  export const getIasdPfes = async (req, res) => {
    return getPfesBySpecialization("IASD", res);
  };
  export const getSiwPfes = async (req, res) => {
    return getPfesBySpecialization("SIW", res);
  };  










export const autoAssignPfesToTeamsWithoutPfe = catchAsync(async (req, res, next) => {
  const { year, specialite } = req.body;

  if (!year) {
    return next(new appError('Year is required', 400));
  }

  const upperYear = year.toUpperCase();
  const upperSpecialite = specialite ? specialite.toUpperCase() : null;

  const initialPfeWhere = {
    year: upperYear,
    status: 'VALIDE',
    ...(upperYear === '2CS' || upperYear === '3CS'
      ? { specialization: upperSpecialite }
      : {}),
  };

  const availablePfesCount = await PFE.count({ where: initialPfeWhere });

  if (availablePfesCount === 0) {
    return res.status(200).json({
      status: 'success',
      message: `No PFEs available for ${upperYear}${upperSpecialite ? ' - ' + upperSpecialite : ''}`,
      count: 0,
      assigned: [],
    });
  }

  if ((upperYear === '2CS' || upperYear === '3CS') && !upperSpecialite) {
    return next(new appError('Specialite is required for 2CS and 3CS', 400));
  }

  const teamsWithoutPFE = await Team.findAll({
    where: {
      pfe_id: null,
    },
    include: [
      {
        model: Student,
        as: 'members',
        required: true,
        where: {
          year: upperYear,
          ...(upperYear === '2CS' || upperYear === '3CS'
            ? { specialite: upperSpecialite }
            : {}),
        },
      },
    ],
  });

  if (teamsWithoutPFE.length === 0) {
    return next(
      new appError(
        `All teams from ${upperYear}${upperSpecialite ? ' - ' + upperSpecialite : ''} already have assigned PFEs`,
        404
      )
    );
  }

  // Get all PFE IDs already used in other teams
  const usedPfeRecords = await Team.findAll({
    attributes: ['pfe_id'],
    where: {
      pfe_id: { [Op.ne]: null },
    },
    raw: true,
  });

  const usedPfeIds = new Set(usedPfeRecords.map(record => record.pfe_id));

  const assignmentLog = [];

  for (const team of teamsWithoutPFE) {
    const students = team.members;
    if (!students || students.length === 0) continue;

    const studentYear = students[0].year?.toUpperCase();
    const studentSpecialite = students[0].specialite?.toUpperCase() ?? null;

    const pfeWhere = {
      year: studentYear,
      status: 'VALIDE',
      ...(studentYear === '2CS' || studentYear === '3CS'
        ? { specialization: studentSpecialite }
        : {}),
    };

    const availablePfes = await PFE.findAll({ where: pfeWhere });

    let selectedPfe;

    if (studentYear === '3CS') {
      const unassignedPfes = availablePfes.filter(pfe => !usedPfeIds.has(pfe.id));
      if (unassignedPfes.length === 0) continue;

      selectedPfe = unassignedPfes[Math.floor(Math.random() * unassignedPfes.length)];
      usedPfeIds.add(selectedPfe.id);
    } else {
      const unassignedPfes = availablePfes.filter(pfe => !usedPfeIds.has(pfe.id));
      if (unassignedPfes.length > 0) {
        selectedPfe = unassignedPfes[Math.floor(Math.random() * unassignedPfes.length)];
        usedPfeIds.add(selectedPfe.id);
      } else if (availablePfes.length > 0) {
        selectedPfe = availablePfes[Math.floor(Math.random() * availablePfes.length)];
      } else {
        continue;
      }
    }

    team.pfe_id = selectedPfe.id;

    const supervisors = await selectedPfe.getSupervisors();
    console.log(supervisors)
    await team.setSupervisor(supervisors); 

    await team.save();

    assignmentLog.push({
      team: {
        id: team.id,
        name: team.groupName,
      },
      pfe: {
        id: selectedPfe.id,
        title: selectedPfe.title,
      },
      specialization: studentSpecialite,
      year: studentYear,
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'PFEs successfully assigned to all teams without PFE',
    count: assignmentLog.length,
    assigned: assignmentLog,
  });
});

  
  
  
  






export const autoAssignPfesToTeamWithoutPfe = catchAsync(async (req, res, next) => {
  const { teamId } = req.body;
  if (!teamId) 
    return next(new appError('Team id is required', 400));

  // 1. Fetch team
  const team = await Team.findByPk(teamId);
  if (!team) 
    return next(new appError('Team not found', 404));
  if (team.pfe_id !== null) 
    return next(new appError('This team already has a PFE assigned', 400));

  // 2. Fetch members
  const members = await Student.findAll({ where: { team_id: teamId } });
  if (!members.length) 
    return next(new appError('Team has no members', 400));

  const { year: teamYear, specialite: teamSpec } = members[0];
  if (!teamYear) 
    return next(new appError('Team members must have a year defined', 400));

  // 3. Build PFE query
  const where = { year: teamYear, status: 'VALIDE' };
  if (['2CS','3CS'].includes(teamYear)) {
    if (!teamSpec)
      return next(new appError('Specialization is required for 2CS and 3CS teams', 400));
    where.specialization = teamSpec;
  }

  const pfes = await PFE.findAll({ where });
  if (!pfes.length) 
    return next(new appError(`No available PFEs for ${teamYear}${teamSpec ? ` - ${teamSpec}` : ''}`, 404));

  // 4. Exclude already-assigned
  const assigned = await Team.findAll({
    attributes: ['pfe_id'],
    where: { pfe_id: { [Op.ne]: null } }
  });
  const usedIds = new Set(assigned.map(t => t.pfe_id));

  // 5. Pick one
  let pool = pfes.filter(p => !usedIds.has(p.id));
  if (!pool.length) {
    if (teamYear === '3CS') {
      return next(new appError('No unassigned PFEs available for 3CS teams', 404));
    }
    pool = pfes; // allow sharing for lower years
  }
  const selected = pool[Math.floor(Math.random() * pool.length)];
  team.pfe_id = selected.id;

  // 6. Fetch supervisors **via the singular alias**,
  //    map to IDs, and pass *that* array into setSupervisor(...)
  let supervisors = await selected.getSupervisor();  
  // getSupervisor() should return an array, but just in case:
  if (!Array.isArray(supervisors)) supervisors = [ supervisors ];

  const supervisorIds = supervisors.map(s => s.id);
  await team.setSupervisor(supervisorIds);  

  // 7. Save and respond
  await team.save();

  res.status(200).json({
    status: 'success',
    message: `PFE ${selected.id} assigned to team ${teamId}`,
    assigned: selected,
  });
});




  export const changePfeForTeam = catchAsync(async (req, res, next) => {
      const { teamId, newPfeId } = req.body;

      if (!teamId || !newPfeId) {
          return next(new appError('Team ID and new PFE ID are required', 400));
      }

      // Find the team by its ID
      const team = await Team.findByPk(teamId);
      if (!team) {
          return next(new appError('Team not found', 404));
      }

      // Find the new PFE by its ID
      const newPfe = await PFE.findByPk(newPfeId);
      if (!newPfe) {
          return next(new appError('New PFE not found', 404));
      }

      // Get the year of the team by fetching the first student (assuming all team members have the same year)
      const students = await Student.findAll({
          where: { team_id: team.id },
      });

      if (students.length === 0) {
          return next(new appError('No students found in the team', 404));
      }

      const teamYear = students[0].year.toUpperCase();  // Assumes all students in the team have the same year

      // Check if the PFE's year matches the team's year
      if (newPfe.year !== teamYear) {
          return next(new appError(`PFE year (${newPfe.year}) does not match the team's year (${teamYear})`, 400));
      }
      // All students in the team share the same specialite
    const teamSpecialite = students[0].specialite;

    // Check if the team's specialite is included in the PFE's specialization array
      const pfeSpecializations = newPfe.specialization || [];

    if (!pfeSpecializations.includes(teamSpecialite)) {
    return next(new appError(
        `The team's specialization (${teamSpecialite}) is not allowed for this PFE`,
        400
    ));
    }


      // Assign the new PFE to the team
      team.pfe_id = newPfe.id;
      const supervisors = await newPfe.getSupervisors(); 
      await team.setSupervisor(supervisors); 

      await team.save();

      res.status(200).json({
          status: 'success',
          message: 'PFE successfully changed for the team',
          team,
      });
  });


export const getPFEByID = catchAsync(async (req, res, next) => {
    const { id } = req.params;
  
    const pfe = await PFE.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email'],
          include: [
            {
              model: teacher,
              as: 'teacher',
              attributes: ['firstname', 'lastname'],
              required: false,
            },
            {
              model: Extern,
              as: 'extern',
              attributes: ['name'],
              required: false,
            },
          ],
        },
        {
          model: teacher,
          as: 'supervisors',
          attributes: ['id', 'firstname', 'lastname'],
          through: { attributes: [] },
        },
      ],
    });
  
    if (!pfe) {
      return next(new AppError(`No PFE found with ID ${id}`, 404));
    }
  
    const formatted = formatPFEUrls([pfe])[0];
  
    res.status(200).json({
      status: 'success',
      pfe: formatted,
    });
  });




  
 
export {downloadfile};




// module.exports = {
//     deletePFE,
//     uploadfile,
//     createpfe,
//     deletePFEforcreator,
//     downloadfile,
//     displayPFE,
//     displaythisyearsPFE,
//     addSupervisor,
//     validatePFE,
//     displayPFEforstudents,
//     displayAllPFE
// }
