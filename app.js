const dotenv = require("dotenv");
dotenv.config();

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET must be defined in .env file");
  process.exit(1);
}

const express = require("express");
const app = express();
const path = require("path");

app.use(express.static(path.join(__dirname, "/public")));


const bodyParser = require("body-parser");
const db = require("./database");
const studentRoutes = require("./routes/studentRoute");
const staffRoutes = require("./routes/staffRoute");
const authRoutes = require("./routes/authRoute");
const collegeRoutes = require("./routes/collegeRoute");
const programRoutes = require("./routes/programRoute");
const sectionRoutes = require("./routes/sectionRoute");
const eventRoutes = require("./routes/eventRoute");
const logRoutes = require("./routes/logRoute");
const statsRoutes = require("./routes/statsRoute");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve login page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Serve staff portal
app.get("/portal", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "portal.html"));
});

// Routes
app.use("/", authRoutes);
app.use("/", studentRoutes);
app.use("/", staffRoutes);
app.use("/", collegeRoutes);
app.use("/", programRoutes);
app.use("/", sectionRoutes);
app.use("/", eventRoutes);
app.use("/", logRoutes);
app.use("/", statsRoutes);

const port = process.env.SERVER_PORT || 3300;

db.query("SELECT 1")
  .then((data) => {
    console.log("Database connected successfully.", data);
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => console.log("Database error:", err));

