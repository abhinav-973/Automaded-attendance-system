import app from "./src/app.js";
import dotenv from "dotenv";
import connectDB from "./db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();
