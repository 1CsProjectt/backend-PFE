import { Sequelize } from "sequelize";
import User from "../models/UserModel.js"; // Import the model
import PFE from "../models/PFEmodel.js";
import Event from "../models/eventModel.js";
import Student from "../models/studenModel.js";
import teacher from "../models/teacherModel.js";
import Company from "../models/companyModel.js";
import Admin from "../models/adminModel.js";
import JoinRequest from "../models/jointeamModel.js";
import invitation from "../models/invitationModel.js";









const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: process.env.DB_PORT || 5432,
    logging: false,
    dialectOptions: {
      // ssl: {
      //   require: true,
      //   rejectUnauthorized: false, // needed for Render
      // },
    },
  }
);

sequelize.authenticate()
  .then(() => console.log("✅ Connected to PostgreSQL successfully!"))
  .catch(err => console.error("❌ Unable to connect:", err));

  (async () => {
    try {
      await sequelize.sync({  alter: true }); // Creates or updates tables 
      console.log("✅ Database synced!");
      
    } catch (error) {
      console.error("❌ Sync error:", error); 
    } finally {
      await sequelize.close(); // Close the database connection
    }
  })();

export default sequelize;
