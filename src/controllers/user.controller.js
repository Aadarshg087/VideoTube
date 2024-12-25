import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
  console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path || "";

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  // console.log("req ", req);
  // console.log("req.files from multer ", req.files);

  const aavatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // console.log(avatar);

  if (!aavatar) {
    throw new ApiError(
      500,
      "File is not uploaded due to internal server error"
    );
  }
  // console.log(username.toLowerCase());
  // console.log(avatar.url);

  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    password,
    avatar: aavatar.url,
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
  console.log(username, email, password);
  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  // console.log(user, password);
  const isPasswordValid = await user.isPasswordCorrect(password);
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
  res
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
- 
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

export { registerUser, loginUser, logoutUser };
