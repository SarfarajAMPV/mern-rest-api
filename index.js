import express from 'express';
import dotenv from 'dotenv';
import mongoose from "mongoose";
import productRoute from "./route/product.route.js";
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();

dotenv.config();

// Middleware
app.use(cors({
    origin: ["https://mern-app-frontend-nine.vercel.app"], // Frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // HTTP methods
    credentials: true // Allow credentials (cookies)
}));

// Handle preflight requests
app.options('*', cors({
    origin: "https://mern-app-frontend-nine.vercel.app",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

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

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});