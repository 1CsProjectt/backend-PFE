// models/Student.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './UserModel.js';


// const { DataTypes } = require("sequelize");
// const sequelize = require("../database.js");
// const User = require("./UserModel.js");
// const Group = require("./groupModel.js");
// const Student = require("./studenModel.js");
// const teacher = require("./teacherModel.js"); // Capitalized for consistency
// const PFE = require("./PFEmodel.js");
// const Company = require("./companyModel.js");
// const bcrypt = require("bcryptjs");

const teacher = sequelize.define('Teacher', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: User,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },firstname:{
        type:DataTypes.STRING,
        allowNull:false
    },lastname:{
        type:DataTypes.STRING,
        allowNull:false
    },
    name: { 
        type: DataTypes.STRING,
         allowNull: true
    },
}, {
    tableName: 'Teachers'
});

// Associations
User.hasOne(teacher, { foreignKey: 'id',as: 'teacher'  });
teacher.belongsTo(User, { foreignKey: 'id', onDelete: "CASCADE",as: 'user' });



export default teacher;

//module.exports = teacher;
