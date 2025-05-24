import Team from './groupModel.js';
import Student from './studenModel.js';
import teacher from './teacherModel.js';
import PFE from './PFEmodel.js';
import User from './UserModel.js';
import JoinRequest from './jointeamModel.js';
import Preflist from './preflistModel.js';
import SupervisionRequest from './SupervisionRequestModel.js';
import Meet from './meetingModel.js';
import Notification from './notificationModel.js';

// const { DataTypes } = require("sequelize");
// const sequelize = require("../database.js");
// const User = require("./UserModel.js");
// const Group = require("./groupModel.js");
// const Student = require("./studenModel.js");
// const teacher = require("./teacherModel.js"); // Capitalized for consistency
// const PFE = require("./PFEmodel.js");
// const Company = require("./companyModel.js");
// const bcrypt = require("bcryptjs");



// Group - Student
Student.belongsTo(Team, { foreignKey: 'team_id' , as: 'team' });
Team.hasMany(Student, { foreignKey: 'team_id' , as: 'members'});




// Teacher - Group
Team.belongsToMany(teacher, { through: 'TeamSupervisors', as: 'supervisor', foreignKey: 'teamId', otherKey: 'teacherId' });
teacher.belongsToMany(Team, { through: 'TeamSupervisors', as: 'supervisedTeams', foreignKey: 'teacherId', otherKey: 'teamId' });

PFE.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
PFE.belongsToMany(teacher, { through: "PFE_Teachers", as: "supervisors" });

JoinRequest.belongsTo(Team, {
  foreignKey: "team_id",
  as: "team",
  onDelete: "CASCADE"
});

JoinRequest.belongsTo(Student, {
  foreignKey: "student_id",
  as: "student",
  onDelete: "CASCADE"
});

Team.hasMany(Preflist, { foreignKey: 'teamId',as: 'preflists' });
Preflist.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });

PFE.hasMany(Preflist, { foreignKey: 'pfeId' });
Preflist.belongsTo(PFE, { foreignKey: 'pfeId' });





Team.belongsTo(PFE, {foreignKey: 'pfe_id',as: 'assignedPFE'});
PFE.hasMany(Team, {foreignKey: 'pfe_id',as: 'teams'});



Team.hasMany(SupervisionRequest, {
  foreignKey: 'teamId',
  as: 'supervisionRequests',
  onDelete: 'CASCADE',
  hooks: true,
});

SupervisionRequest.belongsTo(Team, {
  foreignKey: 'teamId',
  as: 'team',
  onDelete: 'CASCADE',
});

PFE.hasMany(SupervisionRequest, {
  foreignKey: 'pfeId',
  as: 'supervisionRequests',
  onDelete: 'CASCADE',
  hooks: true,
});

SupervisionRequest.belongsTo(PFE, {
  foreignKey: 'pfeId',
  as: 'pfe',
  onDelete: 'CASCADE',
});


Meet.belongsTo(Team, {
  foreignKey: 'teamId',
  as: 'team',
  onDelete: 'CASCADE',
});

Meet.belongsTo(PFE, {
  foreignKey: 'pfeId',
  as: 'pfe',
  onDelete: 'CASCADE',
});

Meet.belongsTo(teacher, {
  foreignKey: 'supervisorId',
  as: 'supervisor',
  onDelete: 'CASCADE',
});

Notification.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});





