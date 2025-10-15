require("dotenv").config();
const express = require("express");
const { Sequelize } = require("sequelize");
// const userRoutes = require('./routes/userRoutes');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: "localhost",
    dialect: "mysql",
  }
);
sequelize
  .authenticate()
  .then(() => console.log("Database connected..."))
  .catch((err) => console.log("Error: " + err));

// app.get("/api/test", (req, res) => {
//   res.json({ message: "Test API is working!" });
// });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));

const userRoutes = require('./routes/userRoutes');
app.use('/api', userRoutes);
