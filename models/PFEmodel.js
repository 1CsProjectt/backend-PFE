import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./UserModel.js";
import teacher from "./teacherModel.js";
import Extern from "./externModel.js";

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
    type: DataTypes.ARRAY(DataTypes.ENUM("ISI", "SIW", "IASD")),
     allowNull: true,
     field: 'specialization'
    },
    year: {
        type: DataTypes.ENUM('2CP', '1CS', '2CS', '3CS'),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,  
        allowNull: true, 
    },
    pdfFile: {
        type: DataTypes.STRING,   
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('NOT_VALIDE','VALIDE','REJECTED'),
        allowNull: false,
        defaultValue: "NOT_VALIDE"
    },
    reason:{
        type:DataTypes.STRING,
        allowNull:true
    },
    resonfile:{
        type:DataTypes.STRING,
        allowNull:true
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
