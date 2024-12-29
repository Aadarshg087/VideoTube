import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Subscription } from "../models/subscription.model.js";
import mongoose from "mongoose";

const uploadVideo = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { title, description } = req.body;
  const details = [title, description];
  const detailsName = ["title", "description"];

  for (let i = 0; i < details.length; i++) {
    if (details[i] === "") {
      throw new ApiError(400, `Please provide the ${detailsName[i]} field!`);
    }
  }

  const videoLocalPath = req.files?.videoLocal?.[0].path || "";
  const thumbNailLocalPath = req.files?.thumbNailLocal?.[0].path || "";
  if (videoLocalPath === "" || thumbNailLocalPath === "") {
    throw new ApiError(400, "Please provide the video file");
  }
  const videoLink = await uploadOnCloudinary(videoLocalPath);
  const thumbNailLink = await uploadOnCloudinary(thumbNailLocalPath);
  if (!videoLink || !thumbNailLink) {
    throw new ApiError(500, "Error while uploading");
  }

  const video = await Video.create({
    title,
    description,
    videoLink: videoLink.url,
    thumbNail: thumbNailLink.url,
    owner: userId,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: req.user.username, video },
        "Video Uploaded Successfully"
      )
    );
});
/* 

HOME PAGE OF VIDEOTUBE:
- Brings the videos of the subscribed videotube channel
- then loads the rest of explore section which simply means random videos

-- Find subcribed channels and bring their videos (Double aggregation)
*/
const subscribedChannelVideos = asyncHandler(async (req, res) => {
  const username = req.user.username;
  if (!username) {
    throw new ApiError(400, "User is not logged in");
  }

  const subscribedChannelVideos = await Subscription.aggregate([
    {
      $match: { subscriber: new mongoose.Types.ObjectId(req.user._id) },
    },
    {
      $lookup: {
        from: "videos", // The collection where videos are stored
        localField: "channel", // The subscribed channel field in subscriptions
        foreignField: "owner", // The owner field in videos
        as: "channelVideos", // Alias for the fetched videos
      },
    },
    {
      $project: {
        _id: 0,
        channel: 1,
        channelVideos: {
          videoLink: 1,
          thumbNail: 1,
          title: 1,
          views: 1,
          duration: 1,
          createdAt: 1,
        },
      },
    },
  ]);
  if (!subscribedChannelVideos) {
    throw new ApiError(500, "Error in fetching the video");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribedChannelVideos, "Data Fetched Successfully")
    );
});

const likeVideo = asyncHandler(async (req, res) => {
  
});

export { uploadVideo, subscribedChannelVideos };
