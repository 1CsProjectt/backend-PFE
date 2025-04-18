// models/Event.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";


// const { DataTypes } = require("sequelize");
// const sequelize = require("../database.js");
// const User = require("./UserModel.js");
// const Group = require("./groupModel.js");
// const Student = require("./studenModel.js");
// const teacher = require("./teacherModel.js"); // Capitalized for consistency
// const PFE = require("./PFEmodel.js");
// const Company = require("./companyModel.js");
// const bcrypt = require("bcryptjs");

const Event = sequelize.define("Event", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.ENUM('PFE_SUBMISSION', 'PFE_VALIDATION', 'TEAM_CREATION','PFE_ASSIGNMENT','WORK_STARTING'),
        allowNull: false,
    },
    
    startTime: {
        type: DataTypes.DATE,
        allowNull: false
    },targeted:{
        type:DataTypes.ENUM('teachers','students'),
        defaultValue:'students'
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    year:{
        type:DataTypes.ENUM('2CP','1CS','2CS','3CS'),
         allowNull:true
    },
    maxNumber :{
        type:DataTypes.INTEGER,
        allowNull:true
    }
});

export default Event;

//module.exports = Event;
