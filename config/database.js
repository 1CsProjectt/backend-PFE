import { Sequelize } from "sequelize";

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

export default sequelize;
