import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./UserModel.js";








const Request = sequelize.define("Request", {
    id:{ 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        allowNull: false,
        autoIncrement: true,
        onDelete: 'CASCADE' 
    },
    team_id:{
        type: DataTypes.INTEGER,
        allowNull: false,
        onDelete: 'CASCADE' 
    },
    grade:{
        type: DataTypes.STRING,
        allowNull: false,
        onDelete: 'CASCADE' 
    },
    pfe_title:{
        type: DataTypes.STRING,
        allowNull: false,
        onDelete: 'CASCADE' 
    }
});






export default Request;

