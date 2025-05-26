// models/soutenance.model.js
import { DataTypes } from 'sequelize';
import Team from './groupModel.js';
import sequelize from '../config/database.js';
  const Soutenance = sequelize.define('Soutenance', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    soutplanning: {
      type: DataTypes.STRING,
      allowNull: true,
    },
     year:{
        type:DataTypes.ENUM('2CP','1CS','2CS','3CS'),
         allowNull:true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true,
      references: {
            model: Team,
            key: 'id'
        },
        onDelete: 'CASCADE' 
    },
    reportGrade: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    presentationGrade: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    finalGrade: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'soutenances',
    timestamps: true,
  });


export default Soutenance;
