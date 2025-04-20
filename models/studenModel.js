// models/Student.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './UserModel.js';
import Team from './groupModel.js';

// const { DataTypes } = require("sequelize");
// const sequelize = require("../database.js");
// const User = require("./UserModel.js");
// const Group = require("./groupModel.js");
// const Student = require("./studenModel.js");
// const teacher = require("./teacherModel.js"); // Capitalized for consistency
// const PFE = require("./PFEmodel.js");
// const Company = require("./companyModel.js");
// const bcrypt = require("bcryptjs");

const Student = sequelize.define('Student', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: User,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    firstname: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastname: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name: { 
        type: DataTypes.STRING ,
        allowNull:true
    },
    year: {
        type: DataTypes.ENUM('2CP', '1CS', '2CS', '3CS'),
        allowNull: false
    },
    specialite: {
        type:DataTypes.ENUM("ISI", "SIW", "IASD"),
        allowNull:true
    },
    status: {
        type: DataTypes.ENUM("available", "in a team"),
        defaultValue: "available"
      },
      team_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Team, 
            key: 'id'
        },
        onDelete: 'SET NULL'
    },
    roleINproject:{
        type:DataTypes.ENUM("front_end", "back_end","design","member","conception"),
        defaultValue:"member"
      }
}, {
    tableName: 'students'
});


User.hasOne(Student, { foreignKey: 'id', as: "student" }); 
Student.belongsTo(User, { foreignKey: 'id', as: "user" });


export default Student;

//module.exports = Student;
