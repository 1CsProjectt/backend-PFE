import Team from './groupModel.js';
import Student from './studenModel.js';
import teacher from './teacherModel.js';
import PFE from './PFEmodel.js';
import User from './UserModel.js';
import Company from './companyModel.js';



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




