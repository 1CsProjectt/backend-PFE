import sequelize from "../config/database.js";
import PFE from "../models/PFEmodel.js";
import { upload } from "../middlewares/file_uploading.js";
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
// const sequelize = require("../database.js");
// const PFE = require("../models/PFEmodel.js");
// const { upload } = require("../file_uploading.js");
// const express = require("express");
// const app = require("../index.js");
// const path = require("path");
// const fs = require("fs");
// const { catchAsync } = require("../utils/catchAsync.js");
// const appError = require("../utils/appError.js");
// const teacher = require("../models/teacherModel.js");
// const Student = require("../models/studenModel.js");
// const { Op, fn, col, literal } = require("sequelize");

// // Get __dirname equivalent in CommonJS
// const __dirname = path.dirname(require.main.filename);
// const __filename = __filename



const deletePFE = catchAsync(async (req, res,next) => {
    const { id } = req.params;

    const pfe = await PFE.findByPk(id);
    if (!pfe) {
        return next(new appError('PFE not found',404));
    }

    // Optional: Delete the associated PDF file from storage
    const pdfPath = path.join(__dirname,'..', 'uploads',  pfe.pdfFile);
    try {
        await fs.promises.unlink(pdfPath);
    } catch (err) {
        if (err.code !== 'ENOENT') { 
            console.error(`Error deleting file: ${err.message}`);
        }
    };
    

    await pfe.destroy();

    res.status(200).json({ message: "PFE deleted successfully" });
});






const uploadfile=()=>{   
    return upload.single('pdfFile')  
}
export const createPFE = catchAsync(async (req, res, next) => {
    const { title, specialization, supervisor, description, year } = req.body;
    const pdfFile = req.file.filename;
    const userId = req.user.id;
    const role = req.user.role;
    const createdBy = req.user.id;

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

        // Validate provided supervisor IDs
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
        createdBy
    });

    await pfe.setSupervisors(supervisorsArray);

    return res.status(201).json({
        message: "PFE created successfully",
        pfe
    });
});




export const deletePFEforcreator = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const currentUserId = req.user.id; // Logged-in user's ID

    const pfe = await PFE.findByPk(id);
    if (!pfe) {
        return next(new appError('PFE not found', 404));
    }

    // 🔥 Ensure the logged-in user is the creator
    if (Number(pfe.createdBy) !== Number(currentUserId)) {
        return next(new appError('You are not authorized to delete this PFE', 403));
    }

    // Optional: Delete the associated PDF file from storage
    if (pfe.pdfFile) {
        const pdfPath = path.resolve(__dirname, "..", "uploads", pfe.pdfFile);
        fs.unlink(pdfPath, (err) => {
            if (err && err.code !== "ENOENT") {
                console.error(`Error deleting PDF file: ${err.message}`);
            }
        });
    }

    await pfe.destroy();
    res.status(200).json({ message: "PFE deleted successfully" });
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

    const displayPFE= catchAsync( async(req,res,next)=>{
      const currentYear = new Date().getFullYear();

      const pfe = await PFE.findAll({
        where: {
          valide:false,
          [Op.and]: where(fn('YEAR', col('createdAt')), currentYear) 
      }});

        res.send({
            status: "success",
            pfe
        });
    });



    const displaythisyearsPFE = catchAsync(async (req, res, next) => {


            if (!req.user || !req.user.id) {
                return next(new appError('Unauthorized: No user found in request', 401));
            }
    
            
            const currentStudent = await Student.findByPk(req.user.id);
            if (!currentStudent) {
                return next(new appError('Student not found', 404));
            }
    
        
            const year = currentStudent.year;
            if (!year) {
                return next(new appError('Student year is missing', 400));
            }
    
            
            const pfe = await PFE.findAll({
                where: { year }
            });
    
            res.status(200).json({
                status: "success",
                pfe
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

    pfe.valide = true;
    await pfe.save();

    res.status(200).json({
        message: "PFE validated successfully",
        pfe
    });
});

  
const displayPFEforstudents = catchAsync(async (req, res, next) => {
    if (!req.user) {
        return next(new appError('Unauthorized: No user found in request', 401));
    }

    const currentStudent = await Student.findByPk(req.user.id);
    if (!currentStudent) {
        return next(new appError('Student not found', 404));
    }

    const currentYear = new Date().getFullYear();

    let filterConditions = {
        year: currentStudent.year,
        valide: true,
    };

    if (!["2CP", "1CS"].includes(currentStudent.year)) {
        filterConditions.specialite = currentStudent.specialite;
    }

    console.log("Query Filters:", filterConditions); 

    const pfe = await PFE.findAll({
        where: {
            ...filterConditions,
            [Op.and]: [
                literal(`EXTRACT(YEAR FROM "createdAt") = ${currentYear}`)
            ]
        }
    });

    res.status(200).json({
        status: "success",
        pfe
    });
});



export const displayAllPFE = catchAsync(async (req, res, next) => {
      const pfes = await PFE.findAll({
          order: [['createdAt', 'DESC']]
      });
  
      res.status(200).json({
          message: "All PFEs retrieved successfully",
          results: pfes.length,
          pfes
      });
  });



  export const searchForPfes = catchAsync(async (req, res, next) => {
    const { query } = req.query;
    console.log(query)

    if (!query) {
        return next(new appError("Query parameter is required", 400));
    }

    const pfes = await PFE.findAll({
        where: {
            [Op.or]: [
                { title: { [Op.iLike]: `%${query}%` } },
                { '$supervisors.firstname$': { [Op.iLike]: `%${query}%` } }, // Corrected alias
                { '$supervisors.lastname$': { [Op.iLike]: `%${query}%` } }, // Corrected alias
                { '$supervisors.User.email$': { [Op.iLike]: `%${query}%` } }, // Corrected alias
                { '$creator.email$': { [Op.iLike]: `%${query}%` } } // Searching creator's email
            ]
        },
        include: [
            {
                model: teacher,
                as: "supervisors", // This must match your alias in the PFE model
                required: false,
                include: [{ model: User, as: "User", attributes: ["email"], required: false }]
            },
            {
                model: User,
                as: "creator", // Ensure it matches the alias for createdBy
                attributes: ["email"]
            }
        ]
    });

    if (pfes.length === 0) {
        return next(new appError("No PFEs found matching the search criteria.", 404));
    }

    res.status(200).json({ status: "success", data: pfes });
});


// Get PFEs by specialization (optimized)  
export const getPfesBySpecialization = catchAsync(async (req, res, next) => {
    const { specialization } = req.params;

    // Validate specialization
    if (!["ISI", "IASD", "SIW"].includes(specialization.toUpperCase())) {
        return next(new appError("Invalid specialization", 400));
    }

    // Fetch PFEs with the given specialization
    const pfes = await PFE.findAll({ where: { specialization: specialization.toUpperCase() } });

    // Check if no PFEs were found
    if (pfes.length === 0) {
        return next(new appError("No PFEs found for this specialization.", 404));
    }

    res.status(200).json({ status: "success", data: pfes });
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
  


export {displayPFEforstudents}; 
export {displayPFE};
export {displaythisyearsPFE};
export {downloadfile};
export {uploadfile}; 
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
// };
