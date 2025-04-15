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
        const teamId = student.team_id;
        student.team_id = null;
        student.status="available"
        await student.save();

        const remainingMembers = await Student.count({ where: { team_id: teamId } });

    if (remainingMembers === 0 && teamId) {
        
        await Team.destroy({ where: { id: teamId } });
    }

        res.status(200).json({ message: "You have left the team successfully" });
    
});


export const destroyTeam = catchAsync(async (req, res, next) => {

    const { team_id } = req.params;
  
    if (!team_id) {
      return next(new appError("Team ID is required", 400));
    }
  
    const team = await Team.findByPk(team_id);
    if (!team) {
      return next(new appError("Team not found", 404));
    }
    await Student.update(
      { team_id: null, status: 'available' },
      { where: { team_id } }
    );
    await team.destroy();
    res.status(200).json({
      status: 'success',
      message: 'Team deleted and members updated successfully',
    });
  });


  export const addStudentsToTeam = catchAsync(async (req, res, next) => {
    const { student_ids, team_id } = req.body;
  
    if (!Array.isArray(student_ids) || student_ids.length === 0 || !team_id) {
      return next(new appError("student_ids array and team_id are required", 400));
    }
  
    const team = await Team.findByPk(team_id);
    if (!team) {
      return next(new appError("Team not found", 404));
    }
  
    const currentMembers = await Student.count({ where: { team_id } });
    const availableSpots = team.maxNumber - currentMembers;
  
    if (student_ids.length > availableSpots) {
      return next(
        new appError(`Team only has ${availableSpots} spot(s) left`, 400)
      );
    }
  
    const students = await Student.findAll({ where: { id: student_ids } });
  
    if (students.length !== student_ids.length) {
      return next(new appError("Some students were not found", 404));
    }
    await Promise.all(
      students.map(async (student) => {
        student.team_id = team.id;
        student.status = "in a team";
        await student.save();
      })
    );
  
    const updatedMembers = await Student.count({ where: { team_id } });
    if (updatedMembers >= team.maxNumber && !team.full) {
      team.full = true;
      await team.save();
    }
    res.status(200).json({
      status: "success",
      message: "Students added to the team successfully",
      added: student_ids.length,
    });
  });
  



  export const moveStudentsToTeam = catchAsync(async (req, res, next) => {
    const { studentIds, newTeamId } = req.body;
  
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0 || !newTeamId) {
      return next(new appError("Student IDs array and new Team ID are required", 400));
    }
  
    const newTeam = await Team.findByPk(newTeamId);
    if (!newTeam) {
      return next(new appError("Target team not found", 404));
    }
  
    const currentMembers = await Student.count({ where: { team_id: newTeamId } });
  
    const remainingSpots = newTeam.maxNumber - currentMembers;
  
    if (studentIds.length > remainingSpots) {
      return next(new appError(`Team only has ${remainingSpots} spot(s) left`, 400));
    }
  
    const students = await Student.findAll({ where: { id: studentIds } });
  
    if (students.length !== studentIds.length) {
      return next(new appError("Some students were not found", 404));
    }
  
    await Promise.all(students.map(async (student) => {
      student.team_id = newTeamId;
      student.status = "in a team";
      await student.save();
    }));
  
    
    const updatedCount = await Student.count({ where: { team_id: newTeamId } });
    if (updatedCount >= newTeam.maxNumber && !newTeam.full) {
      newTeam.full = true;
      await newTeam.save();
    }
  
    res.status(200).json({
      status: "success",
      message: "All students moved to the new team successfully",
      studentsMoved: studentIds.length
    });
  });
  




