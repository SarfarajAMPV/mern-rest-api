import express from 'express';
import dotenv from 'dotenv';
import mongoose from "mongoose";
import productRoute from "./route/product.route.js";
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();

dotenv.config();

// Middleware
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

const PORT = process.env.PORT || 4000;
const URI = process.env.MongoDBURLLIVECOMPASS;

// Connect to MongoDB
mongoose.connect(URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(error => console.error("MongoDB Connection Error: ", error));

// Routes
app.use("/product", productRoute);

app.get('*',(req,res,next)=>{
    res.status(200).json({
      message:'bad request'
    })
  })
// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});