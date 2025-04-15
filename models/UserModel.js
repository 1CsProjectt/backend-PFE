import {  DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import bcrypt from "bcryptjs";


// const { DataTypes } = require("sequelize");
// const sequelize = require("../database.js");
// const User = require("./UserModel.js");
// const Group = require("./groupModel.js");
// const Student = require("./studenModel.js");
// const teacher = require("./teacherModel.js"); // Capitalized for consistency
// const PFE = require("./PFEmodel.js");
// const Company = require("./companyModel.js");
// const bcrypt = require("bcryptjs");


const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },id:{
  type:DataTypes.INTEGER,
  autoIncrement:true,
  allowNull:false,
  primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: "Invalid email format" },
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role:{
    type: DataTypes.ENUM("student", "teacher","company","admin"),
    allowNull: false,
  },
  resetToken: { 
    type: DataTypes.STRING,
     allowNull: true },
  resetTokenExpiry: { 
    type: DataTypes.DATE,
     allowNull: true } 
  ,
  passwordChangedAt:{
    type:DataTypes.DATE,
    allowNull:true
  }
});




User.beforeCreate(async(user)=>{
  if (user.changed('password')) {
    
    user.password = await bcrypt.hash(user.password, 10);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});




User.prototype.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
      console.log(changedTimestamp, JWTTimestamp);
      return JWTTimestamp < changedTimestamp;
  }
  //means not changed
  return false;
};


export default  User;
//module.exports = User;
