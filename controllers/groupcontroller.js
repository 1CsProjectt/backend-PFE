import Team from '../models/groupModel.js';
import appError from '../utils/appError.js';
import Student from '../models/studenModel.js';
import User from '../models/UserModel.js';
import JoinRequest from '../models/jointeamModel.js'; 
import teacher from '../models/teacherModel.js';
import Preflist from '../models/preflistModel.js';
import { catchAsync } from '../utils/catchAsync.js';
import { Op, Sequelize } from "sequelize";



const checkAndDestroyEmptyTeam = async (teamId) => {
    const currentMembers = await Student.count({ where: { team_id: teamId } });
    if (currentMembers === 0) {
      const team = await Team.findByPk(teamId);
      if (team) {
        await team.destroy();
        console.log(`Team with ID ${teamId} has been destroyed due to no members.`);
      }
    }
  };

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
    mystudent.status = 'in a team';
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

export const getAllTeams = catchAsync(async (req, res, next) => {
  const teams = await Team.findAll({
    include: [
      {
        model: Student,
        as: 'members',
        attributes: ['id', 'firstname', 'lastname','year'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email'],
          }
        ]
      },{
        model: Preflist,
        as: 'preflists',
        separate: true,  
        limit: 1,          
        order: [['order', 'ASC']],
        attributes: ['ML']
      }
    ],
    attributes: ['id', 'groupName', 'supervisorId', 'maxNumber', 'createdAt']
  });

  return res.status(200).json({
    status: 'success',
    total: teams.length,
    teams,
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
  
    const team = await Team.findByPk(team_id, {
      include: [{ model: Student, as: 'members', limit: 1 }]
    });
  
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
  
    let targetSpecialite = null;
  
    if (team.members.length > 0) {
      targetSpecialite = team.members[0].specialite;
    } else {
      targetSpecialite = students[0].specialite;
    }
    for (const student of students) {
      if (student.specialite !== targetSpecialite) {
        return next(
          new appError(
            `Student ${student.full_name || student.id} has a different specialite (${student.specialite}) than the team (${targetSpecialite})`,
            400
          )
        );
      }
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
  
  



  export const moveStudentsToAnotherTeam = catchAsync(async (req, res, next) => {
    const { studentIds, newTeamId } = req.body;
  
    if (!studentIds || !newTeamId) {
      return next(new appError("Student IDs and new Team ID are required", 400));
    }
  
    const newTeam = await Team.findByPk(newTeamId, {
      include: [{ model: Student, as: 'members', limit: 1 }] 
    });
  
    if (!newTeam) {
      return next(new appError("Target team not found", 404));
    }
  
    const currentMembers = await Student.count({ where: { team_id: newTeamId } });
  
    if (currentMembers + studentIds.length > newTeam.maxNumber) {
      return next(new appError("Target team does not have enough space", 400));
    }
  
    let targetSpecialite = null;
  
    if (newTeam.members.length > 0) {
      targetSpecialite = newTeam.members[0].specialite;
    } else {
      const refStudent = await Student.findByPk(studentIds[0]);
      if (!refStudent) {
        return next(new appError(`Student with ID ${studentIds[0]} not found`, 404));
      }
      targetSpecialite = refStudent.specialite;
    }
  
    for (const studentId of studentIds) {
      const student = await Student.findByPk(studentId);
      if (!student) {
        return next(new appError(`Student with ID ${studentId} not found`, 404));
      }
  
      if (student.specialite !== targetSpecialite) {
        return next(
          new appError(
            `Student with ID ${studentId} has a different specialite (${student.specialite}) than the target team (${targetSpecialite})`,
            400
          )
        );
      }
  
      const oldTeamId = student.team_id;
  
      student.team_id = newTeamId;
      student.status = "in a team";
      await student.save();
  
      if (oldTeamId && oldTeamId !== newTeamId) {
        await checkAndDestroyEmptyTeam(oldTeamId);
      }
    }
  
    const updatedMembers = await Student.count({ where: { team_id: newTeamId } });
    if (updatedMembers >= newTeam.maxNumber) {
      newTeam.full = true;
      await newTeam.save();
    }
  
    res.status(200).json({
      status: "success",
      message: "Students moved to the new team successfully",
    });
  });
  
  
  
  
  export const createTeamByAdmin = catchAsync(async (req, res, next) => {
    const { groupName, supervisorId, maxNumber } = req.body;

    if (!maxNumber || isNaN(maxNumber) || maxNumber < 1) {
        return next(new appError('Valid maxNumber is required', 400));
    }

    if (supervisorId) {
        const supervisorExists = await teacher.findByPk(supervisorId);
        if (!supervisorExists) {
            return next(new appError('Supervisor not found', 404));
        }
    }

    const newTeam = await Team.create({
        groupName: groupName.trim(),
        supervisorId: supervisorId || null,
        maxNumber,
    });

    return res.status(201).json({
        status: 'success',
        message: 'Team created successfully by admin',
        team: newTeam
    });
});

export const autoOrganizeTeams = catchAsync(async (req, res, next) => {
  let { year, specialite } = req.body;

  if (!year) return next(new appError('Year is required', 400));
  year = year.toUpperCase();

  let whereClause = {
    team_id: null,
    status: 'available',
    year,
  };

  if (year === '2CS') {
    if (!specialite) return next(new appError('Specialite is required for 2CS', 400));
    whereClause.specialite = specialite;
  }

  // Step 1: Get students without a team
  let studentsWithoutATeam = await Student.findAll({ where: whereClause });

  console.log("Students without a team:", studentsWithoutATeam);  // Debugging line

  if (studentsWithoutATeam.length === 0) {
    return res.status(200).json({
      status: 'success',
      message: 'All students are already in teams',
    });
  }

  // Step 2: Check teams with fewer members than the threshold
  const teamsToCheck = await Team.findAll({
    include: [
      {
        model: Student,
        as: 'members',
        attributes: ['id'],
      },
    ],
  });

  console.log("Teams to check:", teamsToCheck);  // Debugging line

  let weakTeams = []; // This will store teams that are too small

  for (const team of teamsToCheck) {
    const members = team.members || [];
    const threshold = Math.round(team.maxNumber / 2) + 1;

    // If the team has fewer members than the threshold
    if (members.length < threshold) {
      weakTeams.push({
        teamId: team.id,
        groupName: team.groupName,
        membersCount: members.length,
        maxNumber: team.maxNumber,
      });
    }
  }

  // Return weak teams in the response for debugging
  return res.status(200).json({
    status: 'success',
    weakTeams: weakTeams, // This will show the teams with fewer than maxNumber / 2 + 1 members
  });
});












