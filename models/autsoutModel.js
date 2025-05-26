// models/soutenanceAuthorization.model.js
import { DataTypes } from 'sequelize';
import Team from './groupModel.js';
import teacher from './teacherModel.js';


const SoutenanceAuthorization = (sequelize) => {
  return sequelize.define('SoutenanceAuthorization', {
    id: {
       type: DataTypes.INTEGER, 
        primaryKey: true, 
        allowNull: false,
        autoIncrement:true,
    },
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
       references: {
            model: Team,
            key: 'id'
        },
        onDelete: 'CASCADE' 
    },
    supervisorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
       references: {
            model: teacher,
            key: 'id'
        },
        onDelete: 'CASCADE' 
    },
    pfeTitle: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    authorizationDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    documentUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'soutenance_authorizations',
    timestamps: true,
  });
};

export default SoutenanceAuthorization;
