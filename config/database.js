import { Sequelize }  from "sequelize";


// const { Sequelize } = require("sequelize");


const sequelize = new Sequelize("postgres", "postgres", "mohamed", {
  host: "localhost",
  dialect: "postgres", // Tells Sequelize we're using PostgreSQL
  logging: false, // Disable SQL query logs (optional)
});


sequelize.authenticate()
  .then(() => console.log("✅ Connected to PostgreSQL successfully!"))
  .catch(err => console.error("❌ Unable to connect:", err));


export default sequelize; 
//module.exports = sequelize;
 