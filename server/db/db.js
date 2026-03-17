import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
  }
);

export const initDb = async () => {
  try {
    console.log("DB_USER:", process.env.DB_USER);

    await sequelize.authenticate();
    console.log("✅ Database connected");
  } catch (error) {
    console.error("❌ DB Error:", error.message);
  }
};

export default sequelize;
