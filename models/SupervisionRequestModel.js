import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./UserModel.js";
import PFE from "./PFEmodel.js";
import Team from "./groupModel.js";






const SupervisionRequest = sequelize.define('SupervisionRequest', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Team, key: 'id' },
      onDelete: 'CASCADE',
    },
    pfeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: PFE, key: 'id' },
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'REJECTED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    requestedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    respondedAt: DataTypes.DATE,
    ML:{
      type:DataTypes.STRING,
      allowNull:true
    }
  }, {
    tableName: 'supervision_requests',
    timestamps: false,
  });






export default SupervisionRequest;

