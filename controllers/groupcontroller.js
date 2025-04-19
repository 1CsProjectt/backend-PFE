import Team from '../models/groupModel.js';
import appError from '../utils/appError.js';
import Student from '../models/studenModel.js';
import User from '../models/UserModel.js';
import JoinRequest from '../models/jointeamModel.js'; 
import teacher from '../models/teacherModel.js';

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
  



  export const moveStudentsToAnotherTeam = catchAsync(async (req, res, next) => {
    const { studentIds, newTeamId } = req.body;
  
    if (!studentIds || !newTeamId) {
      return next(new appError("Student IDs and new Team ID are required", 400));
    }
  
    const newTeam = await Team.findByPk(newTeamId);
    if (!newTeam) {
      return next(new appError("Target team not found", 404));
    }
  
    const currentMembers = await Student.count({ where: { team_id: newTeamId } });
  
    if (currentMembers + studentIds.length > newTeam.maxNumber) {
      return next(new appError("Target team does not have enough space", 400));
    }
  
    for (const studentId of studentIds) {
      const student = await Student.findByPk(studentId);
      if (!student) {
        return next(new appError(`Student with ID ${studentId} not found`, 404));
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
  const year = req.user.year; // Assuming you have the user's year in the request
  if (!year) { 
    return next(new appError('Year is required', 400));
  }

  // Check if there are any students without a team
  let studentsWithoutATeam = await Student.findAll({
    where: {
      team_id: null,
      status: 'available',
      year: year, 
    },
  });

  if (studentsWithoutATeam.length === 0) {
    return res.status(200).json({
      status: 'success',
      message: 'All students are already in teams',
    });
  }

  let teams = await Team.findAll({ where: { full: false, year: year } });
  
  // ✅ Destroy teams with < threshold members
  for (const team of teams) {
    const members = await Student.findAll({ where: { team_id: team.id } });
    const threshold = Math.round(team.maxNumber / 2) + 1;

    if (members.length < threshold) {
      for (const student of members) {
        student.team_id = null;
        student.status = 'available';
        await student.save();
      }

      await JoinRequest.destroy({ where: { team_id: team.id } });
      await team.destroy();
    }
  }

  // Refresh students and teams after cleaning
  studentsWithoutATeam = await Student.findAll({
    where: {
      team_id: null,
      status: 'available',
      year: year,
    },
  });

  let allTeams = await Team.findAll({
    where: {
      full: false,
      year: year, 
    },
    include: [
      {
        model: Student,
        as: 'members',
        attributes: ['id'],
      },
    ],
  });

  // Set default maxNumber if there are no teams
  let maxNumber = allTeams[0]?.maxNumber || 5;
  const overflowThreshold = Math.round(maxNumber / 2) + 1;

  // ✅ Fix: Declare newTeamCount once at top
  let newTeamCount = 0;

  // ✅ Fix: If no teams, create one with year and name
  if (allTeams.length === 0) {
    const newTeam = await Team.create({
      name: `Generated Team ${++newTeamCount}`, // ✅ Added
      groupName: `Group ${newTeamCount}`,
      maxNumber: maxNumber,
      year: year // ✅ Added
    });
    allTeams.push(newTeam);
  }

  // ✅ CASE 1: Overflow into existing teams
  if (studentsWithoutATeam.length <= overflowThreshold) {
    for (const student of studentsWithoutATeam) {
      const teamsWithSpace = [];

      for (const team of allTeams) {
        const count = await Student.count({ where: { team_id: team.id, year } });
        if (count < team.maxNumber) {
          teamsWithSpace.push(team);
        }
      }

      let chosenTeam;
      if (teamsWithSpace.length > 0) {
        chosenTeam = teamsWithSpace[Math.floor(Math.random() * teamsWithSpace.length)];
      } else {
        const newTeam = await Team.create({
          name: `Generated Team ${++newTeamCount}`, // ✅ Added
          groupName: `Group ${newTeamCount}`,
          maxNumber: maxNumber,
          year: year // ✅ Added
        });
        allTeams.push(newTeam);
        chosenTeam = newTeam;
      }

      student.team_id = chosenTeam.id;
      student.status = 'in a team';
      await student.save();

      const memberCount = await Student.count({ where: { team_id: chosenTeam.id } });
      if (memberCount >= chosenTeam.maxNumber && !chosenTeam.full) {
        chosenTeam.full = true;
        await chosenTeam.save();
      }
    }
  } else {
    // ✅ CASE 2: Create new full teams
    let index = 0;
    const newTeams = [];

    while (studentsWithoutATeam.length - index >= maxNumber) {
      const newTeam = await Team.create({
        name: `Generated Team ${++newTeamCount}`, // ✅ Added
        groupName: `Group ${newTeamCount}`,
        maxNumber: maxNumber,
        year: year // ✅ Added
      });

      const group = studentsWithoutATeam.slice(index, index + maxNumber);
      for (const student of group) {
        student.team_id = newTeam.id;
        student.status = 'in a team';
        await student.save();
      }

      newTeam.full = true;
      await newTeam.save();
      newTeams.push(newTeam);
      index += maxNumber;
    }

    // ✅ Handle overflow
    const overflowStudents = studentsWithoutATeam.slice(index);
    const availableTeams = [...allTeams, ...newTeams];

    if (overflowStudents.length >= overflowThreshold) {
      const newTeam = await Team.create({
        groupName: `Group ${newTeamCount}`,
        maxNumber: maxNumber,
        year: year // ✅ Added
      });

      for (const student of overflowStudents) {
        student.team_id = newTeam.id;
        student.status = 'in a team';
        await student.save();
      }

      if (overflowStudents.length === maxNumber) {
        newTeam.full = true;
        await newTeam.save();
      }

      newTeams.push(newTeam);
    } else {
      if (availableTeams.length === 0) {
        const newTeam = await Team.create({
          groupName: `Group ${newTeamCount}`,
          maxNumber: maxNumber,
          year: year // ✅ Added
        });
        availableTeams.push(newTeam);
      }

      for (const student of overflowStudents) {
        const randomTeam = availableTeams[Math.floor(Math.random() * availableTeams.length)];
        student.team_id = randomTeam.id;
        student.status = 'in a team';
        await student.save();
      }
    }
  }

  res.status(200).json({
    status: 'success',
    message: 'Students have been automatically organized into teams',
  });
});


