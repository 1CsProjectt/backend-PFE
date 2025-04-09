import { Sequelize }  from "sequelize";
import dotenv from 'dotenv';
dotenv.config(); // ✅ this should be before using process.env


// const { Sequelize } = require("sequelize");


const sequelize = new Sequelize(
  process.env.DB_NAME,      // "3csprj"
  process.env.DB_USER,      // "abdouknc"
  process.env.DB_PASSWORD,  // "your_password"
  {
    host: process.env.DB_HOST, // "127.0.0.1"
    dialect: "mysql",          // ✅ MySQL
    logging: false,
  }
);

sequelize.authenticate()
  .then(() => console.log("✅ Connected to mysql successfully!"))
  .catch(err => console.error("❌ Unable to connect:", err));


export default sequelize; 
//module.exports = sequelize;
 