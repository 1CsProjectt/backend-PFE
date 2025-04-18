import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Student from "./studenModel.js";
import Team from "./groupModel.js";

const JoinRequest = sequelize.define("join_request", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  student_id: { type: DataTypes.INTEGER, allowNull: false },
  team_id: { type: DataTypes.INTEGER, allowNull: false, onDelete: 'CASCADE', },

  status:{
    type: DataTypes.ENUM("pending", "accepted", "rejected"),
    defaultValue: "pending",
  },
});


export default JoinRequest;
