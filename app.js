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
const userRoutes = require("./routes/userRoute");
const authRoutes = require("./routes/authRoute");
const collegeRoutes = require("./routes/collegeRoute");
const programRoutes = require("./routes/programRoute");
const sectionRoutes = require("./routes/sectionRoute");
const eventRoutes = require("./routes/eventRoute");
const logRoutes = require("./routes/logRoute");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
app.use("/", authRoutes);
app.use("/", userRoutes);
app.use("/", collegeRoutes);
app.use("/", programRoutes);
app.use("/", sectionRoutes);
app.use("/", eventRoutes);
app.use("/", logRoutes);

const port = process.env.SERVER_PORT || 3300;

db.query("SELECT 1")
  .then((data) => {
    console.log("Database connected successfully.", data);
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => console.log("Database error:", err));

