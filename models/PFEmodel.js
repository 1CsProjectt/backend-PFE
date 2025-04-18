import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./UserModel.js";
import teacher from "./teacherModel.js";
import Company from "./companyModel.js";

const PFE = sequelize.define("PFE", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    specialization: {
        type: DataTypes.ENUM("ISI", "SIW", "IASD"),
        allowNull: true
    },
    year: {
        type: DataTypes.ENUM('2CP', '1CS', '2CS', '3CS'),
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true, 
    },
    pdfFile: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('NOT_VALIDE','VALIDE','REJECTED'),
        allowNull: false,
        defaultValue: "NOT_VALID"
    },
    createdBy: {  
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    photo: { 
        type: DataTypes.STRING,
        allowNull: true,
    }
});




export default PFE;
