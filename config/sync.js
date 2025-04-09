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


// const sequelize = require("../database.js");
// const User = require("../models/UserModel.js"); 
// const PFE = require("../models/PFEmodel.js");
// const Event = require("../models/eventModel.js");
// const Student = require("../models/studenModel.js");
// const Teacher = require("../models/teacherModel.js");
// const Company = require("../models/companyModel.js");
// const Admin = require("../models/adminModel.js");



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
