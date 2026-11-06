import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

// register routes
import eventRoutes from "./routes/event.routes.js";
import customerRoutes from "./routes/customer.routes.js";


import mcpRoutes from "./mcp/mcp.routes.js";

import { startBookingScheduler } from "./services/booking.scheduler.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL
}));

app.use(express.json());
app.use("/api/events", eventRoutes);
app.use("/api/customer", customerRoutes);
app.use("/mcp", mcpRoutes);


// Health check
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "TicketFlow API is running"
    });
});

// Start server
const startServer = async () => {
    try {
        await connectDB();

        // Start booking scheduler only after DB connection - imp
        startBookingScheduler();

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
};

startServer();
