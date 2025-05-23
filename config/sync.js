import sequelize from "./database.js";
import User from "../models/UserModel.js"; // Import the model
import PFE from "../models/PFEmodel.js";
import Event from "../models/eventModel.js";
import Student from "../models/studenModel.js";
import teacher from "../models/teacherModel.js";
import Company from "../models/companyModel.js";
import Admin from "../models/adminModel.js";
import JoinRequest from "../models/jointeamModel.js";
import invitation from "../models/invitationModel.js";
import preflistroute from '../Routes/preflistRoute.js'
import meetingsroute from '../Routes/meetingsRoute.js'



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
