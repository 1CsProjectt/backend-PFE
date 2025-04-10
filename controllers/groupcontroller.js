import Team from '../models/groupModel.js';
import appError from '../utils/appError.js';
import Student from '../models/studenModel.js';
import User from '../models/UserModel.js';
import { catchAsync } from '../utils/catchAsync.js';
import { Op, Sequelize } from "sequelize";
import jwt from "jsonwebtoken";
import app from '../index.js';

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

export const listAllTeams = catchAsync(async (req, res, next) => {


    const teams = await Team.findAll({
        include: [
            {
                model: Student,
                as: 'members',
                attributes: ['id', 'firstname', 'lastname'],
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['email'],
                    }
                ]
            }
        ],
        attributes: ['id', 'groupName', 'supervisorId', 'maxNumber', 'createdAt']
    });

    return res.status(200).json({
        status: 'success',
        results: teams.length,
        teams
    });
});

export const listAllTeamsforstudent = catchAsync(async (req, res, next) => {
        if (!req.user || !req.user.id) {
            return next(new appError("Unauthorized: No user found in request", 401));
        }
        const student = await Student.findOne({ where: { id: req.user.id } });
    
        if (!student) {
            return next(new appError("Student not found", 404));
        }
        const userYear = student.year; 
    
        const teams = await Team.findAll({
            include: [
                {
                    model: Student,
                    as: 'members',
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['email'],
                        }
                    ]
                }
            ],
            where: {
                '$members.year$': userYear 
            },
            attributes: ['id', 'groupName', 'supervisorId', 'maxNumber', 'createdAt']
        });
    
        return res.status(200).json({
            status: 'success',
            results: teams.length,
            teams
        });
    });
    





export const showMyTeam = catchAsync(async (req, res, next) => {


    if (!req.user || !req.user.id) {
        return next(new appError('Unauthorized: No user found in request', 401));
    }

    const student = await Student.findOne({ where: { id: req.user.id } });

    if (!student) {
        return next(new appError('Student not found', 404));
    }

    if (!student.team_id) {
        return res.status(200).json({
            status: 'success',
            team_id: null,
            team:[]
        });;
    }

    const team = await Team.findOne({
        where: { id: student.team_id },
        include: [
            {
                model: Student,
                as: 'members',
                attributes: ['id', 'firstname', 'lastname'],
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['email'],
                    }
                ]
            }
        ],
        attributes: ['id', 'groupName', 'supervisorId', 'maxNumber', 'createdAt']
    });
    if (!team){
        return next(new appError('no team found , there must be an error',404));
    }

    return res.status(200).json({
        status: 'success',
        team
    });
});



export const leaveTeam = catchAsync(async (req, res, next) => {
    
        const user = req.user;
        if(!user){
            return next(new appError('user not found',400));
        }
        const student = await Student.findOne({ where: { id: user.id } });

        if (!student) {
            return next(new appError("Student not found", 404));
        }

        student.team_id = null;
        await student.save();

        res.status(200).json({ message: "You have left the team successfully" });
    
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
