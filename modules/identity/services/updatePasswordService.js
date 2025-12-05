import asyncHandler from "express-async-handler";
import { compare } from "bcryptjs";

import userModel from "../models/userModel.js";
import ApiError from "../../../utils/apiError.js";
import { sanitizeUser } from "../../../utils/sanitizeData.js";
import Logger from "../../../utils/loggerService.js";
import {
  createAccessToken,
  createRefreshToken,
} from "../../../utils/createToken.js";

const logger = new Logger("update-password");

export const updateMyPasswordService = asyncHandler(
  async (userId, currentPassword, newPassword) => {
    const user = await userModel.findById(userId);
    if (!user) {
      await logger.error("User not found", { userId });
      throw new ApiError(
        "🛑 Current or new password is invalid. Please check and try again.",
        400
      );
    }

    const isMatch = await compare(currentPassword, user.password);
    if (!isMatch) {
      await logger.error("Incorrect current password", { userId });
      throw new ApiError(
        "🛑 Current or new password is invalid. Please check and try again.",
        400
      );
    }

    user.password = newPassword;
    user.changedPasswordAt = Date.now();

    // Create new tokens
    const accessToken = createAccessToken(user._id);
    const { token: refreshToken, hashed } = await createRefreshToken(user._id);

    // Store new hashed refresh token in DB
    user.refreshToken = hashed;
    user.refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30d

    await user.save();

    await logger.info("Password updated successfully", { userId: user._id });

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }
);
