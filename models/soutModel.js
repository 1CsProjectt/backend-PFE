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
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
