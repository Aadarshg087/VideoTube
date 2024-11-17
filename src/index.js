import dotenv from "dotenv";
dotenv.config({
  path: "./env",
});
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./databases/index.js";

connectDB()
  .then(() => {
    application.listen(process.env.PORT || 3000, () => {
      console.log(`Server is running on ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("Mongo connection failed :", err);
  });
