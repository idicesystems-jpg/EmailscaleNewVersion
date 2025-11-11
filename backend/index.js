require("dotenv").config();
const express = require("express");
const { Sequelize } = require("sequelize");
const userRoutes = require('./routes/userRoutes');
const app = express();
const cors = require('cors');
const path = require("path");
const fs = require("fs");
const  {startSchedulers } =  require('./scheduler.js');



// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:5173', // frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // if you are sending cookies/auth headers
}));



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


app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve files
app.get("/api/files/:filename", (req, res) => {
  const filePath = path.join(__dirname, "uploads", req.params.filename);

  if (!fs.existsSync(filePath)) return res.status(404).send("File not found");

  const ext = path.extname(filePath).toLowerCase();

  // Set MIME type
  if (ext === ".pdf") res.setHeader("Content-Type", "application/pdf");
  else if (ext === ".csv") res.setHeader("Content-Type", "text/csv");
  else if (ext === ".png") res.setHeader("Content-Type", "image/png");
  else if (ext === ".jpg" || ext === ".jpeg") res.setHeader("Content-Type", "image/jpeg");

  // Force download for PDF/CSV
  if (ext === ".pdf" || ext === ".csv") {
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${req.params.filename}"`
    );
  }

  res.sendFile(filePath);
});

app.use('/api', userRoutes);


const PORT = process.env.PORT || 5000;
//app.listen(PORT, () => console.log(`Server running on ${PORT}`));

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
  //startSchedulers();
});