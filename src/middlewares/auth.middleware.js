import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

const verifyJWT = asyncHandler(async (req, _, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    throw new ApiError(401, "Unauthrozise access");
  }

  const decodedInfo = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  const user = await User.findById(decodedInfo._id).select(
    "-password -refreshToken"
  );
  if (!user) {
    throw new ApiError(401, "Invalid access token");
  }
  req.user = user;
  next();
});

export { verifyJWT };
