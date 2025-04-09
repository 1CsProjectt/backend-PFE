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


// const { DataTypes } = require("sequelize");
// const sequelize = require("../config/db");
// const User = require("./user");

const Company = sequelize.define('Company', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: User,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isNumeric: { msg: "Phone number must contain only numbers" }
        }
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'companies'
});


User.hasOne(Company, { foreignKey: 'id',as: 'company' });
Company.belongsTo(User, { foreignKey: 'id' });

export default Company;

//module.exports = Company;




