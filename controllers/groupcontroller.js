import Team from '../models/groupModel.js';
import appError from '../utils/appError.js';
import Student from '../models/studenModel.js';
import User from '../models/UserModel.js';
import { catchAsync } from '../utils/catchAsync.js';
import { Op, Sequelize } from "sequelize";
import jwt from "jsonwebtoken";

export const createTeam = catchAsync(async (req, res, next) => {
    const { groupName } = req.body;
    console.log(req.maxnum);

    if (!req.user || !req.user.id) {
        return next(new appError('Unauthorized: No user found in request', 401));
    }

    const id = req.user.id;
    const mystudent = await Student.findOne({ where: { id } });
    if (!mystudent) {
        return next(new appError('Invalid token, login again', 400));
    }

    if (!groupName || groupName.trim() === '') {
        return next(new appError('Team name is required', 400));
    }

    if (mystudent.team_id) {
        return next(new appError('You are already part of a group', 400));
    }

    const newTeam = await Team.create({
        groupName: groupName.trim(),
        supervisorId: null,
        maxNumber: req.maxnum || 5 
    });

    mystudent.team_id = newTeam.id;
    await mystudent.save();

    return res.status(201).json({
        status: 'success',
        message: 'Team created successfully',
        group: newTeam
    });
});

export const leaveTeam = catchAsync(async (req, res, next) => {
    try {
        const user = req.user;
        const student = await Student.findOne({ where: { id: user.id } });

        if (!student) {
            return next(new appError("Student not found", 404));
        }

        student.team_id = null;
        await student.save();

        res.status(200).json({ message: "You have left the team successfully" });
    } catch (error) {
        console.error("Error leaving team:", error);
        next(new appError("Server error", 500));
    }
});















// const Team = require('../models/groupModel.js');
// const appError = require('../utils/appError.js');
// const Student = require('../models/studentModel.js');
// const User = require('../models/UserModel.js');
// const { catchAsync } = require('../utils/catchAsync.js');
// const { Op, Sequelize } = require("sequelize");
// const jwt = require("jsonwebtoken");

// exports.createTeam = catchAsync(async (req, res, next) => {
//     const { groupName } = req.body;
//     console.log(req.maxnum);

//     if (!req.user || !req.user.id) {
//         return next(new appError('Unauthorized: No user found in request', 401));
//     }

//     const id = req.user.id;
//     const mystudent = await Student.findOne({ where: { id } });
//     if (!mystudent) {
//         return next(new appError('Invalid token, login again', 400));
//     }

//     if (!groupName || groupName.trim() === '') {
//         return next(new appError('Team name is required', 400));
//     }

//     if (mystudent.team_id) {
//         return next(new appError('You are already part of a group', 400));
//     }

//     const newTeam = await Team.create({
//         groupName: groupName.trim(),
//         supervisorId: null,
//         maxNumber: req.maxnum || 5 
//     });

//     mystudent.team_id = newTeam.id;
//     await mystudent.save();

//     return res.status(201).json({
//         status: 'success',
//         message: 'Team created successfully',
//         group: newTeam
//     });
// });

// exports.leaveTeam = catchAsync(async (req, res, next) => {
//     try {
//         const user = req.user;
//         const student = await Student.findOne({ where: { id: user.id } });

//         if (!student) {
//             return next(new appError("Student not found", 404));
//         }

//         student.team_id = null;
//         await student.save();

//         res.status(200).json({ message: "You have left the team successfully" });
//     } catch (error) {
//         console.error("Error leaving team:", error);
//         next(new appError("Server error", 500));
//     }
// });
