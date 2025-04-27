  // models/GroupModel.js
  import { DataTypes } from 'sequelize';
  import sequelize from '../config/database.js';
 

  // const { DataTypes } = require("sequelize");
  // const sequelize = require("../database.js");
  // const User = require("./UserModel.js");
  // const Group = require("./groupModel.js");
  // const Student = require("./studenModel.js");
  // const teacher = require("./teacherModel.js"); // Capitalized for consistency
  // const PFE = require("./PFEmodel.js");
  // const Company = require("./companyModel.js");
  // const bcrypt = require("bcryptjs");

  const Team = sequelize.define('Meeting', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    room: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    work_Status: {
      type: DataTypes.ENUM('Approved', 'Unfinished', 'Rejected'),
      allowNull: false,
      defaultValue: 'Unfinished',
    },
    Meeting_objectives_files: {
       type: DataTypes.STRING,
       allowNull: true,
    },
    Support_files: {
       type: DataTypes.STRING,
       allowNull: true,
    },
    Team_deliverables_files:{
       type: DataTypes.STRING,
       allowNull: true,

    },
    My_review_for_deliverables_files:{
        type: DataTypes.STRING,
       allowNull: true,

    },
    Meeting_pv_files:{
       type: DataTypes.STRING,
       allowNull: true,

    }



   
  },
  {
    tableName: 'Meetings',
  });






  export default Team;


  //module.exports = Group;