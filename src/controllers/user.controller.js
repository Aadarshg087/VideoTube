import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";

/*

STEPS TO REGISTER THE USER :
- Get user setails from the frontend
- Validations for the values (should not empty)
- Check if user already exists : username and email
- Check for images, check for avatar
- Upload them to cloudinary (it is used for storing images and multer is used for uploading files)
- Check avatar is uploaded on cloudinary
- Create user object to save in mongodb
- Note : You get the same object from the db which you are trying to save
- Therefore, remove password field and refresh token field from response before sending to the frontend
- Return the user creation status

*/

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;
  // console.log(req.body);
  // console.log(req.body);

  // one way
  // if (fullName === "" || email === "" || username === "" || password === "") {
  //   throw new ApiError(400, "Full name is required");
  // }

  // other way
  // const arr = [fullName, email, username, password];
  // for (let i = 0; i < arr.length; i++) {
  //   if (arr[i].trim() === "") {
  //     throw new ApiError(400, "All fields are required");
  //   }
  // }

  // JS way
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  // console.log("existedUser ", existedUser);

  if (existedUser) {
    throw new ApiError(409, "Username or email already exists"); // 409 - conflict
  }
  // console.log(req.files);

  const avatarLocalPath = req.files?.avatar?.[0]?.path || "";
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path || "";

  // if (!avatarLocalPath) {
  //   throw new ApiError(400, "Avatar is required");
  // }

  // console.log("req ", req);
  // console.log("req.files from multer ", req.files);
  let aavatar, coverImage;
  if (avatarLocalPath != "") {
    aavatar = await uploadOnCloudinary(avatarLocalPath);
  }
  if (coverImageLocalPath != "") {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }

  // console.log(avatar);

  // if (!aavatar) {
  //   throw new ApiError(
  //     500,
  //     "File is not uploaded due to internal server error"
  //   );
  // }
  // console.log(username.toLowerCase());
  // console.log(avatar.url);

  const user = await User.create({
    fullName,
    username: username,
    email,
    password,
    avatar: aavatar?.url || "",
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went while registering the user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

/*

STEPS TO LOGIN THE USER : 
- Retreive username , email and password from req.body
- Check if anyone(username or email) of them is available
- Check if username or email exists in the database
- Hashout the password and compare it with the saved password
- Generate access and refresh token
- Send them as cookie back

*/
const generateTokens = async (userid) => {
  try {
    const user = await User.findOne(userid);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ ValidateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(500, "Error in generating tokens", error);
  }
};

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  console.log(req.body);
  // console.log(req);
  // console.log(req.body);
  // console.log(username, email, password);
  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  console.log(username);
  console.log(email);
  console.log(password);
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  // console.log(user, password);
  const isPasswordValid = await user.isPasswordCorrect(password);
  // const tempPassword = await bcrypt.hash(password, 10);
  // console.log(password);
  // user.password = password;
  // console.log(tempPassword);
  // await user.save({ validateBeforeSave: false });
  // return res.status(200).json({ Status: "Successfully update hased password" });

  if (!isPasswordValid) {
    throw new ApiError(409, "Invalid user credentials");
  }

  const { refreshToken, accessToken } = await generateTokens(user._id);

  const loggedInUser = await User.findOne(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User loggedin successfully"
      )
    );
});

/* 

STEP TO LOGOUT THE USER :
- Find the _id or email or username of the current loggedin user
- We can do that using middleware using jwt tokens
- Then, we can import the user data here and clear refreshToken from the database

*/

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

/* 

STEPS TO REFRESH THE TOKEN AFTER USER LOGGED OUT AFTER TIME OUT OF ACCESS TOKEN :
- User will hit the endpoint
- Then, we will extract the refreshToken from the cookies
- If it matches from our refreshToken, then we will login the user, otherwise throw error

*/
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (!incomingRefreshToken) {
    console.log("Didn't found the refreshToken");
    throw new ApiError(401, "Unatuhorized Request");
  }

  const decodeToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decodeToken?._id);
  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  // console.log(decodeToken);
  // console.log(user.username);
  // console.log(user.refreshToken);

  if (incomingRefreshToken !== user.refreshToken) {
    throw new ApiError(401, "Unauthorized access");
  }

  // creating the new token since the old access token are expired
  const { refreshToken, accessToken } = await generateTokens(user._id);
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "User loggedin Successfully"
      )
    );
});

/* 

STEPS TO UPDATE THE PASSWORD
- We can validate the loggedin from the middleware or get the current user details
- Then, we can take oldPassword, newPassword and confirmPassword
- if checks are fine
- We can update the user with a new password
- 
*/

const updatePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "New Password does not match confirm password");
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(400, "Unauthorized request");
  }
  // console.log(oldPassword);
  // console.log(user);
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  // console.log(isPasswordValid);
  if (!isPasswordValid) {
    throw new ApiError(400, "Password does not match");
  }

  const updatedUser = await User.findById(user._id);
  updatedUser.password = newPassword;
  await user.save({ ValidateBeforeSave: true });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Password Updated Successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;
  const currUser = req.user;

  const user = await User.findOne(currUser._id);

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  const userFields = ["fullName", "username", "email", "password"];
  const userValues = [fullName, username, email, password];
  for (let i = 0; i < userFields.length; i++) {
    // console.log(userFields[i]);
    // console.log(userValues[i]);
    if (userValues[i] !== undefined && userFields[i] !== "password") {
      user[userFields[i]] = userValues[i];
    }
  }
  await user.save({ ValidateBeforeSave: false });

  if (password) {
    user.password = password;

    await user.save();
  }

  // const { password: hashPassword, refershToken, ...updatedUser } = user;
  // console.log("updatedUser : ", updatedUser);
  // console.log("default User : ", user);

  const updatedUser = await User.findById(currUser._id).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User Updated Successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const currUser = req.user;
  const user = await User.findById(currUser._id).select("-password");
  if (!user) {
    throw new ApiError(400, "User is not logged in");
  }
  // console.log("req.files", req.files);
  const newAvatar = req.files?.avatar[0].path;
  if (!newAvatar) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const newAvatarPath = await uploadOnCloudinary(newAvatar);
  if (!newAvatarPath) {
    throw new ApiError(500, "Error while uploading file");
  }

  user.avatar = newAvatarPath.url;
  user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar is update successfully"));
});

/* 

  STEPS TO GET THE USER PROFILE:

  - Check username in the database
  - Extract the corresponding info from the Video schema of the current user
  - Map user._id to the Video.owner

  We will use mongo aggregation pipelines.
  We need only thumbnail, videoLink, Title, owner name, maybe Views

  This will return User and All Video details of that user
*/

const getUserProfile = asyncHandler(async (req, res) => {
  let username = req.params.username;
  username = username.substring(1);
  console.log(username);

  const user = await User.findOne({ username: username });
  if (!user) {
    throw new ApiError(400, "Username does not exist");
  }

  const allVideos = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(user._id) } },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "videoDetails",
      },
    },
    {
      $project: {
        _id: 1,
        username: 1,
        email: 1,
        fullName: 1,
        "videoDetails.videoLink": 1,
        "videoDetails.thumbNail": 1,
        "videoDetails.title": 1,
        "videoDetails.views": 1,
        "videoDetails.duration": 1,
        "videoDetails.createdAt": 1,

        // videoDetails: { // this will work too
        //   videoLink: 1,
        //   thumbNail: 1,
        //   title: 1,
        // },
      },
    },
  ]);

  if (!allVideos) {
    throw new ApiError(500, "Error in fecthing the details");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, allVideos, "Data Fetched Successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updatePassword,
  updateAccountDetails,
  updateUserAvatar,
  getUserProfile,
};
