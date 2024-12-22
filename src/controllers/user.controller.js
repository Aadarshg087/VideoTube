import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
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

  const existedUser = User.findOne({
    $or: [{ email }, { username }],
  });

  console.log("existedUser ", existedUser);

  if (existedUser) {
    throw new ApiError(409, "Username or email already exists"); // 409 - conflict
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  console.log("req ", req);
  console.log("req.files from multer ", req.files);

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(
      500,
      "File is not uploaded due to internal server error"
    );
  }

  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatar.url,
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

export { registerUser };
