import Team from './groupModel.js';
import Student from './studenModel.js';
import teacher from './teacherModel.js';
import PFE from './PFEmodel.js';
import User from './UserModel.js';
import JoinRequest from './jointeamModel.js';
import Preflist from './preflistModel.js';


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
Team.belongsTo(teacher, { foreignKey: 'supervisorId', as: 'supervisor' });
teacher.hasMany(Team, { foreignKey: 'supervisorId', as: 'groups' });


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

Team.hasMany(Preflist, { foreignKey: 'teamId' });
Preflist.belongsTo(Team, { foreignKey: 'teamId' });

PFE.hasMany(Preflist, { foreignKey: 'pfeId' });
Preflist.belongsTo(PFE, { foreignKey: 'pfeId' });





Team.belongsTo(PFE, {foreignKey: 'pfe_id',as: 'assignedPFE'});
PFE.hasMany(Team, {foreignKey: 'pfe_id',as: 'teams'});






