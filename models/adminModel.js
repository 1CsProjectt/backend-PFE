import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./UserModel.js";


// const { DataTypes } = require("sequelize");
// const sequelize = require("../database.js");
// const User = require("./UserModel.js");
// const Group = require("./groupModel.js");
// const Student = require("./studenModel.js");
// const teacher = require("./teacherModel.js"); // Capitalized for consistency
// const PFE = require("./PFEmodel.js");
// const Company = require("./companyModel.js");
// const bcrypt = require("bcryptjs");






const Admin = sequelize.define("Admin", {
    id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        allowNull: false,
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
         type: DataTypes.STRING,
          allowNull: true 
        },

    admin_level:{type:DataTypes.STRING,allowNull:true},
    permissions: { type: DataTypes.STRING, allowNull: true } 
});


User.hasOne(Admin, { foreignKey: "id" });
Admin.belongsTo(User, { foreignKey: "id"});




export default Admin;

//module.exports = Admin;

