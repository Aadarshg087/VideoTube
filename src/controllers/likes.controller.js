import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Video } from "../models/video.model.js";
import { Likes } from "../models/likes.model.js";

/* 

- I should get videoLink either from URL or from the frontend (that I need to figure out)
- Find teh object in DB using the videoLink
- Check for the if user has already liked the video or not (likedBy entry as array in the DB)
- If not, update the likedCount and add the user ID in the array

*/
const likeVideo = asyncHandler(async (req, res) => {
  const currUser = req.user;
  if (!currUser) {
    throw new ApiError(400, "User is not loggedi in");
  }
  const { currVideoLink } = req.body;
  // const currVideoLink = req.params;
  if (!currVideoLink) {
    throw new ApiError(400, "Cannot find the video link");
  }

  // if user had already liked the video, it will dec the counter by one getting to neutral state
  let likedByUser = await Likes.findOneAndUpdate(
    {
      videoLink: currVideoLink,
      likedBy: user._id,
    },
    {
      $pull: { likedBy: user._id },
      $inc: { likeCount: -1 },
    },
    { new: true }
  );

  if (!likedByUser) {
    // if not liked by user, adding it contribution
    likedByUser = await Likes.findOneAndUpdate(
      { videoLink: currVideoLink },
      {
        $addToSet: { likedBy: user._id },
        $inc: { likeCount: 1 },
      },
      { new: true }
    );
    if (!likedByUser) {
      throw new ApiError(500, "Error in liking the video");
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, likedByUser, "Liked Count Updated Succesfully"));
});

const dislikeVideo = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(400, "User is not logged in");
  }

  const currVideoLink = req.body;
  // const currVideoLink = req.params;
  if (!currVideoLink) {
    throw new ApiError(400, "Could not find the video link");
  }

  let dislikeByUser = await Likes.findOneAndUpdate(
    {
      videoLink: currVideoLink,
      dislikedBy: user._id,
    },
    {
      $pull: { likedBy: user._id },
      $inc: { dislikeCount: -1 },
    },
    { new: true }
  );

  if (!dislikeByUser) {
    // if not liked by user, adding it contribution
    dislikeByUser = await Likes.findOneAndUpdate(
      { videoLink: currVideoLink },
      {
        $addToSet: { dislikedBy: user._id },
        $inc: { dislikeCount: 1 },
      },
      { new: true }
    );
    if (!dislikeByUser) {
      throw new ApiError(500, "Error in disliking the video");
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, dislikeByUser, "Disliked Count Updated Successfully")
    );
});

export { likeVideo, dislikeVideo };
