// models/GroupModel.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import teacher from './teacherModel.js';

// const { DataTypes } = require("sequelize");
// const sequelize = require("../database.js");
// const User = require("./UserModel.js");
// const Group = require("./groupModel.js");
// const Student = require("./studenModel.js");
// const teacher = require("./teacherModel.js"); // Capitalized for consistency
// const PFE = require("./PFEmodel.js");
// const Company = require("./companyModel.js");
// const bcrypt = require("bcryptjs");

const Team = sequelize.define('Team', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  groupName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  supervisorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: teacher,
      key: 'id',
    },
    onDelete: 'SET NULL', 
  },maxNumber:{
    type:DataTypes.INTEGER,
    allowNull:false
  }
},
 {
  tableName: 'groups',
});




export default Team;


//module.exports = Group;