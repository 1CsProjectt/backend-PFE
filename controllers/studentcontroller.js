import Team from '../models/groupModel.js';
import appError from '../utils/appError.js';
import Student from '../models/studenModel.js';
import User from '../models/UserModel.js';
import { catchAsync } from '../utils/catchAsync.js';
import { Op } from 'sequelize';
import Preflist from '../models/preflistModel.js';
// const Team = require('../models/groupModel.js');
// const appError = require('../utils/appError.js');
// const Student = require('../models/studenModel.js'); // Ensure correct casing for Student model
// const User = require('../models/UserModel.js');
// const { catchAsync } = require('../utils/catchAsync.js');


export const getStudentsByTeam = catchAsync(async (req, res, next) => {
  const { team_id } = req.params;

  if (!team_id) {
    return next(new appError('Team id is required', 400));
  }

  const team = await Team.findOne({
    where: { id: team_id },
    include: [
      {
        model: Student,
        as: 'members',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email', 'username']
          }
        ]
      },
      {
        model: Preflist,
        as: 'preflists',
        separate: true,  
        limit: 1,
        order: [['order', 'ASC']],
        attributes: ['ML']
      }
    ]
  });

  if (!team) {
    return next(new appError('Team not found', 404));
  }

  return res.status(200).json({
    message: 'Team and its students retrieved successfully',
    team
  });
});



export const listAllStudents = catchAsync(async (req, res, next) => {

  if (!req.user || !req.user.id) {
    return next(new appError("Unauthorized: No user found in request", 401));
  }

  const id = req.user.id;

  if ((req.user.role !== "student") ) {
    return next(new appError("You are not a student , you're signed in as : " + req.user.role, 403));
  }

  const mystudentinfo = await Student.findOne({ where: { id } });

  if (!mystudentinfo) {
    return next(new appError("Student record not found", 404));
  }

  const userYear = mystudentinfo.year;
  if (!userYear) {
    return next(new appError("Missing year information for student", 400));
  }

  const students = await Student.findAll({
    where: { year: userYear,
      specialite:mystudentinfo.specialite,
      id: { [Op.ne]: id }
     },
    include: [
      {
        model: User,
        as: "user", 
        attributes: ["email", "username"],
      },
    ],
  });

  

  return res.status(200).json({ status: "success", students });
});


export const setStudentRole = catchAsync(async (req, res, next) => {
  
  if(!req.user){
    return next(new appError('user not found , login again and try ',403))
  }
  const userId = req.user.id; 
  const { role } = req.body;

  if (!role) {
    return next(new appError('Role is required', 400));
  }

  const student = await Student.findOne({ where: { id: userId } });

  if (!student) {
    return next(new appError('Student not found', 404));
  }

  if (student.role !== 'member') {
    return next(new appError('Role already set. Use edit instead.', 400));
  }

  student.role = role;
  await student.save();

  return res.status(200).json({
    message: 'Role set successfully.',
    student,
  });
});

export const editStudentRole = catchAsync(async (req, res, next) => {

  if(!req.user){
    return next(new appError('user not found , login again and try ',403))
  }
  const userId = req.user.id;
  const { role } = req.body;

  if (!role) {
    return next(new appError('Role is required', 400));
  }

  const student = await Student.findOne({ where: { id: userId } });

  if (!student) {
    return next(new appError('Student not found', 404));
  }

  student.roleINproject = role;
  await student.save();

  return res.status(200).json({
    message: 'Role updated successfully.',
    student,
  });
});




//   module.exports = {
//     getStudentsByTeam,
//     listAllStudents
// };

  