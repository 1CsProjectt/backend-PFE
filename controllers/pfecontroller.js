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
import Company from "../models/companyModel.js";
import Team from "../models/groupModel.js";




const deletePFE = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const pfe = await PFE.findByPk(id);
    if (!pfe) {
        return next(new appError("PFE not found", 404));
    }

    try {
        // 🗑️ Delete the associated PDF file from storage
        if (pfe.pdfFile) {
            const pdfPath = path.resolve(__dirname, "..", "uploads", pfe.pdfFile);
            await fs.promises.unlink(pdfPath);
        }

        // 🖼️ Delete the associated photo from storage
        if (pfe.photo) {
            const photoPath = path.resolve(__dirname, "..", "photos", pfe.photo);
            await fs.promises.unlink(photoPath);
        }
    } catch (err) {
        if (err.code !== "ENOENT") {
            console.error(`Error deleting file: ${err.message}`);
        }
    }

    await pfe.destroy();
    res.status(200).json({ message: "PFE and associated files deleted successfully" });
});





export const createPFE = catchAsync(async (req, res, next) => {
    const { title, specialization, supervisor, description, year } = req.body;
    const pdfFile = req.files?.pdfFile?.[0]?.filename; 
    const photo = req.files?.photo?.[0]?.filename; 
    const userId = req.user.id;
    const role = req.user.role;
    const createdBy = req.user.id;

    if (!pdfFile) {
        return next(new appError("PDF file is required", 400));
    }

    let supervisorsArray = [];

    if (role === 'teacher') {
        const myteacher = await teacher.findByPk(userId);
        if (!myteacher) {
            return next(new appError('Teacher not found', 404));
        }
        supervisorsArray.push(myteacher.id);
    } else if (role === 'company') {
        if (!supervisor || supervisor.length === 0) {
            return next(new appError('Company must provide at least one teacher supervisor', 400));
        }

        supervisorsArray = Array.isArray(supervisor) ? supervisor : [supervisor];

        const validTeachers = await teacher.findAll({
            where: { id: supervisorsArray }
        });

        if (validTeachers.length !== supervisorsArray.length) {
            return next(new appError('One or more supervisors are invalid (must be teachers)', 400));
        }
    } else {
        return next(new appError('Invalid role', 403));
    }

    const pfe = await PFE.create({
        title,
        specialization,
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






export const getAllPFE = catchAsync(async (req, res, next) => {
    const pfeList = await PFE.findAll({
        include: [
            {
                model: User,
                as: "creator",
                attributes: ["id", "username", "email"],
            },
            {
                model: teacher,
                as: "supervisors",
                attributes: ["id", "name"],
                through: { attributes: [] }, 
            }
        ],
    });

    // Add full URLs for pdfFile and photo
    const formattedPFEList = pfeList.map((pfe) => ({
        ...pfe.toJSON(),
        pdfFile: pfe.pdfFile ? `${req.protocol}://${req.get("host")}/uploads/${pfe.pdfFile}` : null,
        photo: pfe.photo ? `${req.protocol}://${req.get("host")}/photos/${pfe.photo}` : null,
    }));

    res.status(200).json({
        status: "success",
        count: formattedPFEList.length,
        pfeList: formattedPFEList,
    });
});


export const getMyPfe = catchAsync(async (req, res, next) => {

        const userId = req.user?.id;

        if (!userId) {
            return next(new appError("User not authenticated", 401));
        }

        const pfes = await PFE.findAll({
            where: {
                createdBy: userId
            },
            include: [
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
                            model: Company,
                            as: 'company',  
                            required: false
                        }
                    ]
                },
                {
                    model: teacher,
                    as: 'supervisors',
                    required: false,
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['email'],
                            required: false
                        }
                    ]
                }
            ]
        });

        if (!pfes || pfes.length === 0) {
            return next(new appError("You have not created any PFEs.", 404));
        }

        const formattedPfes = pfes.map((pfe) => ({
            ...pfe.toJSON(),
            pdfFile: pfe.pdfFile ? `${req.protocol}://${req.get("host")}/uploads/${pfe.pdfFile}` : null,
            photo: pfe.photo ? `${req.protocol}://${req.get("host")}/photos/${pfe.photo}` : null,
            creator: {
                ...pfe.creator?.toJSON(),
                firstname: pfe.creator?.teacher?.firstname || null,
                lastname: pfe.creator?.teacher?.lastname || null
            }
        }));

        res.status(200).json({
            status: "success",
            data: formattedPfes
        });
    
});




export const deletePFEforcreator = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    if(!id){
        return next(new appError('you must provide id',404))
    }
    console.log(id)
    const currentUserId = req.user.id; 
    if(!currentUserId){
        return next(new appError('user not found',404))
    }

    const pfe = await PFE.findByPk(id);
    if (!pfe) {
        return next(new appError("PFE not found", 404));
    }

    if (Number(pfe.createdBy) !== Number(currentUserId)) {
        return next(new appError("You are not authorized to delete this PFE", 403));
    }

    // 🗑️ Delete the associated PDF file from storage
    if (pfe.pdfFile) {
        const pdfPath = path.resolve(__dirname, "..", "uploads", pfe.pdfFile);
        fs.unlink(pdfPath, (err) => {
            if (err && err.code !== "ENOENT") {
                console.error(`Error deleting PDF file: ${err.message}`);
            }
        });
    }

    // 🖼️ Delete the associated photo from storage
    if (pfe.photo) {
        const photoPath = path.resolve(__dirname, "..", "photos", pfe.photo);
        fs.unlink(photoPath, (err) => {
            if (err && err.code !== "ENOENT") {
                console.error(`Error deleting photo file: ${err.message}`);
            }
        });
    }
    if (pfe.photo) {
        const photoPath = path.resolve(__dirname, "..", "photos", pfe.photo);
        fs.unlink(photoPath, (err) => {
            if (err && err.code !== "ENOENT") {
                console.error(`Error deleting photo file: ${err.message}`);
            }
        });
    }

    await pfe.destroy();
    res.status(200).json({ message: "PFE and associated files deleted successfully" });
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
            {
                model: User,
                as: "creator",
                attributes: ["id", "username", "email"],
            },
            {
                model: teacher,
                as: "supervisors",
                attributes: ["id", "name"],
                through: { attributes: [] }, 
            }
        ],
    });

    const formattedPFEList = pfeList.map((pfe) => ({
        ...pfe.toJSON(),
        pdfFile: pfe.pdfFile ? `${req.protocol}://${req.get("host")}/uploads/${pfe.pdfFile}` : null,
        photo: pfe.photo ? `${req.protocol}://${req.get("host")}/photos/${pfe.photo}` : null,
    }));

    res.status(200).json({
        status: "success",
        count: formattedPFEList.length,
        pfeList: formattedPFEList,
    });
});



    export const displaythisyearsPFE = catchAsync(async (req, res, next) => {
        if (!req.user || !req.user.id) {
            return next(new appError("Unauthorized: No user found in request", 401));
        }
    
        // Find the student based on user ID
        const currentStudent = await Student.findByPk(req.user.id);
        if (!currentStudent) {
            return next(new appError("Student not found", 404));
        }
    
        // Get the student's year
        const year = currentStudent.year;
        if (!year) {
            return next(new appError("Student year is missing", 400));
        }
    
        const currentYear = new Date().getFullYear();
    
        // Fetch PFEs for the student's year and created in the current year
        const pfeList = await PFE.findAll({
            where: {
                year,
                [Op.and]: [literal(`EXTRACT(YEAR FROM "createdAt") = ${currentYear}`)]
            },
            include: [
                {
                    model: User,
                    as: "creator",
                    attributes: ["id", "username", "email"],
                },
                {
                    model: teacher,
                    as: "supervisors",
                    attributes: ["id", "name"],
                    through: { attributes: [] }, // Hide the join table data
                },
            ],
        });
    
        // Add full URLs for pdfFile and photo
        const formattedPFEList = pfeList.map((pfe) => ({
            ...pfe.toJSON(),
            pdfFile: pfe.pdfFile ? `${req.protocol}://${req.get("host")}/uploads/${pfe.pdfFile}` : null,
            photo: pfe.photo ? `${req.protocol}://${req.get("host")}/photos/${pfe.photo}` : null,
        }));
    
        res.status(200).json({
            status: "success",
            count: formattedPFEList.length,
            pfeList: formattedPFEList,
        });
    });


    export const displayvalidePFE = catchAsync(async (req, res, next) => {
        const currentYear = new Date().getFullYear();
    
        const pfeList = await PFE.findAll({
            where: {
                status: 'VALIDE',
                [Op.and]: [literal(`EXTRACT(YEAR FROM "PFE"."createdAt") = ${currentYear}`)],
            },
            include: [
                {
                    model: User,
                    as: "creator",
                    attributes: ["id", "username", "email"],
                },
                {
                    model: teacher,
                    as: "supervisors",
                    attributes: ["id", "name"],
                    through: { attributes: [] }, 
                }
            ],
        });
    
        const formattedPFEList = pfeList.map((pfe) => ({
            ...pfe.toJSON(),
            pdfFile: pfe.pdfFile ? `${req.protocol}://${req.get("host")}/uploads/${pfe.pdfFile}` : null,
            photo: pfe.photo ? `${req.protocol}://${req.get("host")}/photos/${pfe.photo}` : null,
        }));
    
        res.status(200).json({
            status: "success",
            count: formattedPFEList.length,
            pfeList: formattedPFEList,
        });
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
    


export  const validatePFE = catchAsync(async (req, res, next) => {

    const { id } = req.params; 
    
    const pfe = await PFE.findByPk(id);
    if (!pfe) {
        return next(new appError('PFE not found', 404));
    }

    pfe.status = 'VALIDE';
    await pfe.save();

    res.status(200).json({
        message: "PFE validated successfully",
        pfe
    });
});


export  const rejectPFE = catchAsync(async (req, res, next) => {

    const { id } = req.params; 
    
    const pfe = await PFE.findByPk(id);
    if (!pfe) {
        return next(new appError('PFE not found', 404));
    }

    pfe.status = 'REJECTED';
    await pfe.save();

    res.status(200).json({
        message: "PFE rejected successfully",
        pfe
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

    if (!["2CP", "1CS"].includes(currentStudent.year)&& currentStudent.specialite) {
        filterConditions.specialization = currentStudent.specialite;
    }

    console.log("Query Filters:", filterConditions);

    
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
                    {
                        model: User,  
                        as: "user",  
                        attributes: ["id", "username", "email"],
                    }
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
                : "Company or Other Entity",  // Fallback for company or others
            pdfFile: pfe.pdfFile ? `${req.protocol}://${req.get("host")}/uploads/${pfe.pdfFile}` : null,
            // photo: pfe.photo ? `${req.protocol}://${req.get("host")}/photos/${pfe.photo}` : null,
            photo: "https://s3-alpha-sig.figma.com/img/3c09/f76d/8de97470c93e1e24bac8b4d8a1f71e7e?Expires=1745193600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=rtzL3QzYfNGLbbbFzQ-DLvr~umpe0nCpcF2OvL8G~OqHqeK0bukfumJWE9S-bFNF3b8cyt6SKx3Ij5KbuMfpdZhfXZhb4rBOKnzxOQEn9RHz8062nwzScMphgqBf6PqIoMeN24MClice5rXLnUuCK2jHy7lx6UZk9ekGzaRDiX22lzRheztSLuCsNtcq2uQ8Jf-WEOQiutkPzDsMzfVCAjCd8ao3SkuleQvlRO25EXiefzknwyh5a210rpuUz-N5sO7--q8PAD-fqe4GXP7WjXDALqdLPVvv-Jkrev9K17DNOi2IkJlbO2krEMLEK--g4LbwTIxQe0pdjiq8wVMxEQ__",
        };
    });

    res.status(200).json({
        status: "success",
        count: formattedPFEList.length,
        pfeList: formattedPFEList,
    });
});








export const searchForPfes = catchAsync(async (req, res, next) => {
    const { query } = req.query;
    console.log(query);

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

    const formattedPfes = pfes.map((pfe) => ({
        ...pfe.toJSON(),
        pdfFile: pfe.pdfFile ? `${req.protocol}://${req.get("host")}/uploads/${pfe.pdfFile}` : null,
        photo: pfe.photo ? `${req.protocol}://${req.get("host")}/photos/${pfe.photo}` : null,
    }));

    res.status(200).json({ status: "success", data: formattedPfes });
});



export const getPfesBySpecialization = catchAsync(async (req, res, next) => {
    const { specialization } = req.params;

    // Validate specialization
    if (!["ISI", "IASD", "SIW"].includes(specialization.toUpperCase())) {
        return next(new appError("Invalid specialization", 400));
    }

    // Fetch PFEs with the given specialization
    const pfes = await PFE.findAll({
        where: { specialization: specialization.toUpperCase() }
    });

    // Check if no PFEs were found
    if (pfes.length === 0) {
        return next(new appError("No PFEs found for this specialization.", 404));
    }

    // Add full URLs for pdfFile and photo
    const formattedPfes = pfes.map((pfe) => ({
        ...pfe.toJSON(),
        pdfFile: pfe.pdfFile ? `${req.protocol}://${req.get("host")}/uploads/${pfe.pdfFile}` : null,
        photo: pfe.photo ? `${req.protocol}://${req.get("host")}/photos/${pfe.photo}` : null,
    }));

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
 // doka nwlilha 
export const autoAssignPfes = catchAsync(async (req, res, next) => {
  const teamsWithoutPFE = await Team.findAll({
    where: {
      pfe_id: null,
    },
  });

  if (teamsWithoutPFE.length === 0) {
    return next(new appError('All teams have PFEs assigned', 404));
  }

  const usedPfeIds = await Team.findAll({
    where: {
      pfe_id: {
        [Op.ne]: null,
      },
    },
    attributes: ['pfe_id'],
  });

  const usedIds = usedPfeIds.map((team) => team.pfe_id);

  const assignmentLog = [];

  for (const team of teamsWithoutPFE) {
    const students = await Student.findAll({
      where: {
        team_id: team.id,
      },
    });

    if (students.length === 0) continue;

    const studentYear = students[0].year;
    const studentSpecialite = students[0].specialite;

    let availablePfes;

    if (studentYear === '3CS') {
      availablePfes = await PFE.findAll({
        where: {
          year: '3CS',
          specialization: studentSpecialite,
          id: {
            [Op.notIn]: usedIds,
          },
        },
      });
    } else {
      availablePfes = await PFE.findAll({
        where: {
          year: studentYear,
          specialization: studentSpecialite,
        },
      });
    }

    if (availablePfes.length === 0) continue;

    const randomIndex = Math.floor(Math.random() * availablePfes.length);
    const selectedPfe = availablePfes[randomIndex];

    team.pfe_id = selectedPfe.id;
    await team.save();

    if (studentYear === '3CS') {
      usedIds.push(selectedPfe.id); }

    assignmentLog.push({
      teamId: team.id,
      pfeTitle: selectedPfe.title,
      specialization: studentSpecialite,
      year: studentYear,
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'PFEs successfully assigned to teams',
    assigned: assignmentLog,
  });
});



  
 
export {downloadfile};
export { deletePFE };



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
