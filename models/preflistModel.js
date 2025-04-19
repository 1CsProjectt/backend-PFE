import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Team from './groupModel.js';
import PFE from './PFEmodel.js';


const Preflist = sequelize.define('Preflist', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Team,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    pfeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: PFE,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
  }, {
    tableName: 'preflists',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['teamId', 'order'], 
      },
      {
        unique: true,
        fields: ['teamId', 'pfeId'], 
      },
    ],
  });
  
  export default Preflist;




