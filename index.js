// Load env
import dotenv from "dotenv";
dotenv.config({ path: "config.env", quiet: true });

// Core imports
import express, { json } from "express";
import morgan from "morgan";
import cors from "cors";

// Security & utils
import "./utils/cronJob.js";
import applySecurity from "./middlewares/securityMiddleware.js";
import globalError from "./middlewares/errorMiddleware.js";
import ApiError from "./utils/apiError.js";
import dbConnection from "./config/dataBase.js";

// Centralized route mounting
import mountRoutes from "./modules/mountRoutes.js";

// App init
const app = express();
app.use(json({ limit: "350kb" }));
app.set("trust proxy", 1);

// Security middlewares
applySecurity(app);

// CORS
app.use(
  cors({
    origin: "*",
  })
);

// Dev logging
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// Mount all module routes
mountRoutes(app);

// Welcome route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to Akhdar-ERP Back-End API 🚀",
  });
});

// Not found
app.use((req, res, next) => {
  next(new ApiError(`🛑 Can not find this route: ${req.originalUrl}`, 404));
});

// Global error
app.use(globalError);

// Server settings
const PORT = process.env.PORT || 8000;
const MODE = process.env.NODE_ENV;

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error(`🛑 Uncaught Exception: ${err.name} | ${err.message}`);
  process.exit(1);
});

// Server Initialization

(async () => {
  try {
    // Connect to MongoDB
    await dbConnection();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`🟢 Mode: ${MODE}`);
      console.log(`🟢 Server running on port: ${PORT}`);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", async (err) => {
      console.error(`🔴 Unhandled Rejection: ${err.name} | ${err.message}`);
      console.error(err.stack);

      if (server) {
        server.close(async () => {
          console.log("🧹 Server closed due to unhandled promise rejection");
          await disconnectRedis();
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    });

    // Graceful shutdown on Ctrl+C
    process.on("SIGINT", async () => {
      console.log("🧹 Gracefully shutting down...");
      await disconnectRedis();
      server.close(() => process.exit(0));
    });

    // handle SIGTERM
    process.on("SIGTERM", async () => {
      console.log("🧹 SIGTERM received, shutting down...");
      await disconnectRedis();
      server.close(() => process.exit(0));
    });
  } catch (error) {
    console.error(`🔴 Server Startup Failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
})();
