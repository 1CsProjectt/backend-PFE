import appError from '../utils/appError.js';
import Team from '../models/groupModel.js';
import Student from '../models/studenModel.js';
import User from '../models/UserModel.js';
import JoinRequest from '../models/jointeamModel.js'; 
import teacher from '../models/teacherModel.js';
import Preflist from '../models/preflistModel.js';
import invitation from '../models/invitationModel.js';
import PFE from '../models/PFEmodel.js';
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
    let maxNumber ;
    if (mystudent.year=='3CS'){
      maxNumber=2;}
      else{
        maxNumber=5;
      }

    const newTeam = await Team.create({
        groupName: groupName.trim(),
        supervisorId: null,
        maxNumber: req.maxnum || maxNumber
        
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
        attributes: ['id', 'firstname', 'lastname', 'year', 'specialite'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email'],
          }
        ]
      },
      {
        model: teacher,
        as: 'supervisors',
        attributes: ['id', 'firstname', 'lastname']
      }
    ],
    attributes: ['id', 'groupName', 'maxNumber', 'createdAt']
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
                attributes: ['id', 'firstname', 'lastname','roleINproject'],
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
        attributes: ['id', 'firstname', 'lastname','year','specialite','roleINproject'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email'],
          }
        ]
      },{
        model: teacher,         
        as: 'supervisor',
        attributes: ['id', 'firstname', 'lastname']
      },
      {
        model: PFE,             
        as: 'assignedPFE',
        attributes: ['id', 'title'] 
      }
    ],
    attributes: ['id', 'groupName', 'supervisorId', 'maxNumber', 'createdAt','pfe_id']
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

        await invitation.destroy({where:{sender_id:student.id}});
        const teamId = student.team_id;
        student.team_id = null;
        student.status="available";
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

  if (!year) {
    return next(new appError('Year is required', 400));
  }
  year = year.toUpperCase();

  let whereClause = {
    team_id: null,
    status: 'available',
    year,
  };

  if (year === '2CS' || year === "3CS") {
    if (!specialite) {
      return next(new appError(`Specialite is required for ${year}`, 400));
    }
    whereClause.specialite = specialite;
  }

  //Tracking des changements
  const createdTeams = [];
  const deletedTeams = [];
  const studentAssignments = [];

  // Step 2: Clean weak teams
  const teamsToCheck = await Team.findAll({
    include: [{
      model: Student,
      as: 'members',
      attributes: ['id'],
      required: true,
      where: {
        year: year.toUpperCase(),
        ...(specialite ? { specialite } : {}),
      },
    }],
  });

  const weakTeams = teamsToCheck.filter(team => {
    const threshold = Math.round(team.maxNumber / 2) + 1;
    return (team.members || []).length < threshold;
  });

  for (const team of weakTeams) {
    deletedTeams.push({ id: team.id, name: team.groupName });
    const members = await Student.findAll({ where: { team_id: team.id } });
    for (const student of members) {
      student.team_id = null;
      student.status = 'available';
      await student.save();
    }
    await JoinRequest.destroy({ where: { team_id: team.id } });
    await team.destroy();
  }

  // Step 1: Get students without a team
  let studentsWithoutATeam = await Student.findAll({ where: whereClause });

  if (studentsWithoutATeam.length === 0) {
    return res.status(200).json({
      status: 'success',
      message: 'No students available for team assignment',
    });
  }

  // Step 1.5: Special case for 3CS
  if (year === '3CS') {
    const students3CS = studentsWithoutATeam.filter(s => s.year.toUpperCase() === '3CS');

    if (students3CS.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No 3CS students available for individual team assignment',
      });
    }

    for (const student of students3CS) {
      const newTeam = await Team.create({
        groupName: `Group-3CS-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        maxNumber: 1,
        full: true,
      });
      createdTeams.push({ id: newTeam.id, name: newTeam.groupName });

      student.team_id = newTeam.id;
      student.status = 'in a team';
      await student.save();

      studentAssignments.push({ studentId: student.id, teamId: newTeam.id, teamName: newTeam.groupName });
    }

    return res.status(200).json({
      status: 'success',
      message: '3CS students have been assigned to individual teams',
      createdTeams,
      studentAssignments,
      deletedTeams,
    });
  }

  // Step 3: Refresh data
  studentsWithoutATeam = await Student.findAll({ where: whereClause });

  let allTeams = await Team.findAll({
    include: [
      {
        model: Student,
        as: 'members',
        attributes: ['id', 'year', 'specialite'],
        required: true,
        where: {
          year: year.toUpperCase(),
          ...(specialite ? { specialite } : {}),
        },
      },
    ],
  });

  //On ne garde que les équipes avec moins de 8 membres
  allTeams = allTeams.filter(team => (team.members?.length || 0) < 8);
  const maxNumber = allTeams[0]?.maxNumber || 5;
  const overflowThreshold = Math.round(maxNumber / 2) + 1;

  const isCompatible = (team, student) => {
    const members = team.members || [];
    const sameYear = members.every(m => m.year === student.year);
    if (!sameYear) return false;

    if (student.year === '2CS') {
      return members.every(m => m.specialite === student.specialite);
    }

    return true;
  };

  // Step 4: Assign students to compatible teams
  for (const student of studentsWithoutATeam) {
    const compatibleTeams = allTeams.filter(team => isCompatible(team, student));
    const nonFullCompatibleTeams = compatibleTeams.filter(team => (team.members?.length || 0) < maxNumber);

    let chosenTeam = null;
    if (nonFullCompatibleTeams.length > 0) {
      chosenTeam = nonFullCompatibleTeams[Math.floor(Math.random() * nonFullCompatibleTeams.length)];
    } else if (studentsWithoutATeam.length < overflowThreshold && compatibleTeams.length > 0) {
      chosenTeam = compatibleTeams[Math.floor(Math.random() * compatibleTeams.length)];
    }

    if (chosenTeam) {
      student.team_id = chosenTeam.id;
      student.status = 'in a team';
      await student.save();

      studentAssignments.push({ studentId: student.id, teamId: chosenTeam.id, teamName: chosenTeam.groupName });

      const count = await Student.count({ where: { team_id: chosenTeam.id } });
      if (count >= maxNumber && !chosenTeam.full) {
        chosenTeam.full = true;
        await chosenTeam.save();
      }

      chosenTeam.members.push(student);

      //Si l'équipe a maintenant ≥ 8 membres, on la retire de allTeams
      if ((chosenTeam.members?.length || 0) >= 8) {
        allTeams = allTeams.filter(team => team.id !== chosenTeam.id);
      }
    }
  }

  // Step 5: Create new teams if students still remain
  studentsWithoutATeam = await Student.findAll({ where: whereClause });
  if (studentsWithoutATeam.length > 0) {
    let index = 0;
    const newTeams = [];

    while (studentsWithoutATeam.length - index >= maxNumber) {
      const group = studentsWithoutATeam.slice(index, index + maxNumber);
      const newTeam = await Team.create({
        groupName: `Group-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        maxNumber,
        full: true,
      });
      createdTeams.push({ id: newTeam.id, name: newTeam.groupName });

      for (const student of group) {
        student.team_id = newTeam.id;
        student.status = 'in a team';
        await student.save();

        studentAssignments.push({ studentId: student.id, teamId: newTeam.id, teamName: newTeam.groupName });
      }

      newTeam.members = group;
      newTeams.push(newTeam);
      index += maxNumber;
    }

    // Step 6: Handle overflow students
    const overflowStudents = studentsWithoutATeam.slice(index);
    const availableTeams = [...allTeams, ...newTeams];

    for (const student of overflowStudents) {
      const compatibleTeams = availableTeams.filter(team => isCompatible(team, student));
      const nonFullCompatibleTeams = compatibleTeams.filter(team => (team.members?.length || 0) < maxNumber);

      let chosenTeam = null;
      if (nonFullCompatibleTeams.length > 0) {
        chosenTeam = nonFullCompatibleTeams[Math.floor(Math.random() * nonFullCompatibleTeams.length)];
      } else if (overflowStudents.length < overflowThreshold && compatibleTeams.length > 0) {
        chosenTeam = compatibleTeams[Math.floor(Math.random() * compatibleTeams.length)];
      }

      if (chosenTeam) {
        student.team_id = chosenTeam.id;
        student.status = 'in a team';
        await student.save();

        studentAssignments.push({ studentId: student.id, teamId: chosenTeam.id, teamName: chosenTeam.groupName });

        const count = await Student.count({ where: { team_id: chosenTeam.id } });
        if (count >= maxNumber && !chosenTeam.full) {
          chosenTeam.full = true;
          await chosenTeam.save();
        }

        chosenTeam.members.push(student);

        // Même vérification ici
        if ((chosenTeam.members?.length || 0) >= 8) {
          allTeams = allTeams.filter(team => team.id !== chosenTeam.id);
        }
      } else {
        const newTeam = await Team.create({
          groupName: `Group-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          maxNumber,
        });
        createdTeams.push({ id: newTeam.id, name: newTeam.groupName });

        student.team_id = newTeam.id;
        student.status = 'in a team';
        await student.save();

        studentAssignments.push({ studentId: student.id, teamId: newTeam.id, teamName: newTeam.groupName });

        newTeam.members = [student];
        availableTeams.push(newTeam);

        // On peut même vérifier ici si >= 8 et ne plus utiliser cette team après
        if ((newTeam.members?.length || 0) >= 8) {
          allTeams = allTeams.filter(team => team.id !== newTeam.id);
        }
      }
    }
  }

  return res.status(200).json({
    status: 'success',
    message: 'Students have been automatically organized into teams',
    createdTeams,
    studentAssignments,
    deletedTeams,
  });
});





export const getAllTeams_supervisedByMe = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new appError('Forbidden: you are not logged in', 403));
  }

  const teacherID = req.user.id;
  const myTeacher = await teacher.findByPk(teacherID);
  if (!myTeacher) {
    return next(new appError('Teacher was not found, login again or contact the administration', 401));
  }

  const teams = await Team.findAll({
    where: {
      supervisorId: teacherID  
    },
    include: [
      {
        model: Student,
        as: 'members',
        attributes: ['id', 'firstname', 'lastname', 'year'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email'],
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
    ],
    attributes: ['id', 'groupName', 'supervisorId', 'maxNumber', 'createdAt']
  });

  return res.status(200).json({
    status: 'success',
    total: teams.length,
    teams,
  });
});
