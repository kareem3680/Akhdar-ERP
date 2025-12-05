import asyncHandler from "express-async-handler";
import * as authService from "../services/authService.js";

export const signUp = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body, req);
  res.status(201).json({
    message: "User registered successfully",
    data: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
});

export const logIn = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body.email, req.body.password);
  res.status(200).json({
    message: "Logged in successfully",
    data: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const token = await authService.refreshTokenService(refreshToken);
  res.status(200).json({
    status: "success",
    data: token,
  });
});

export const logout = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const data = await authService.logoutService(userId);
  res.status(200).json({
    status: "success",
    data,
  });
});

export const protect = asyncHandler(async (req, res, next) => {
  const user = await authService.protect(req);
  req.user = user;
  next();
});

export const allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    await authService.allowedTo(req.user, roles);
    next();
  });
