import { compare } from "bcryptjs";
import asyncHandler from "express-async-handler";
import sendEmail from "../../../utils/sendEmail.js";
import userModel from "../models/userModel.js";
import { sanitizeUser } from "../../../utils/sanitizeData.js";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../../../utils/createToken.js";
import { verifyToken } from "../../../middlewares/verifyTokenMiddleware.js";

const logger = new Logger("auth");

// Register user
export const registerUser = asyncHandler(async (userData, req) => {
  const existingUser = await userModel.findOne({ email: userData.email });
  if (existingUser) {
    await logger.error("Registration failed - email already exists", {
      email: userData.email,
    });
    throw new ApiError("🛑 Email already in use", 400);
  }

  const user = await userModel.create(userData);

  // create tokens
  const accessToken = createAccessToken(user._id);
  const { token: refreshToken, hashed } = await createRefreshToken(user._id);
  user.refreshToken = hashed;
  user.refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await user.save();

  sendEmail({
    email: user.email,
    subject: "Welcome to Styles Dispatch",
    message:
      "Your account has been successfully created!\nThank you for joining us.",
  }).catch((err) =>
    logger.error("Email sending failed", { error: err.message })
  );

  await logger.info("User registered successfully", { email: user.email });
  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
});

// Login user
export const loginUser = asyncHandler(async (email, password) => {
  const user = await userModel.findOne({ email }).select("+password");
  if (!user) {
    await logger.error("Login failed - user not found", { email });
    throw new ApiError("🛑 Invalid email or password", 401);
  }

  if (user.active === false) {
    await logger.error("Login failed - account deactivated", { email });
    throw new ApiError(
      "🛑 Your account has been deactivated. Please contact support.",
      403
    );
  }

  const isMatch = await compare(password, user.password);
  if (!isMatch) {
    await logger.error("Login failed - incorrect password", { email });
    throw new ApiError("🛑 Invalid email or password", 401);
  }

  // create tokens
  const accessToken = createAccessToken(user._id);
  const { token: refreshToken, hashed } = await createRefreshToken(user._id);
  user.refreshToken = hashed;
  user.refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await user.save();

  await logger.info("User logged in successfully", { email });
  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
});

// Refresh token
export const refreshTokenService = asyncHandler(async (token) => {
  if (!token) throw new ApiError("Refresh token required", 401);

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    throw new ApiError("Invalid refresh token", 401);
  }

  const user = await userModel.findById(decoded.userId);
  if (!user) throw new ApiError("User not found", 404);

  const valid = await user.compareRefreshToken(token);
  if (!valid) throw new ApiError("Invalid refresh token", 401);

  const accessToken = createAccessToken(user._id);
  return { accessToken };
});

// Logout
export const logoutService = asyncHandler(async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) throw new ApiError("User not found", 404);

  user.refreshToken = null;
  user.refreshTokenExpires = null;
  await user.save();

  return { message: "Logged out successfully" };
});

// Protect route
export const protect = asyncHandler(async (req) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  const user = await verifyToken(token);
  return user;
});

// Role-based authorization
export const allowedTo = asyncHandler(async (user, roles) => {
  if (!roles.includes(user.role)) {
    throw new ApiError("🚫 You are not authorized to access this route", 403);
  }
});
