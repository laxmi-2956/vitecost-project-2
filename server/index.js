const express = require("express");
const connection = require("./config/db");
const userRouter = require("./routes/user.routes");
const cors = require("cors");
require("dotenv").config();
var cookieParser = require("cookie-parser");
const productRouter = require("./routes/products.route");
const cartRouter = require("./routes/cart.routes");
const PORT = process.env.PORT || 8080;

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
app.set("view engine", "ejs");
app.use(express.json());
app.use(cookieParser());

app.use("/api/user", userRouter);

app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
connection
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB:", err);
    process.exit(1); // Stop if DB connection fails
  });
