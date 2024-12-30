import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";

const countSubscriber = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(400, "User is not logged in");
  }
  const currVideo = req.body; // figure out how will you recieve this from frontend
  if (!currVideo) {
    throw new ApiError(400, "Error in video URL");
  }

  const video = await Video.findOne({ videoLink: currVideo });

  const subscriptions = await Subscription.find({
    subscriber: new mongoose.Types.ObjectId(video.owner),
  });

  const count = subscriptions.length;
  //   console.log(count);
  return res
    .status(200)
    .json(new ApiResponse(200, count, "Subscriber fetched successfully"));
});

const addSubscriber = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(400, "User is not logged in");
  }
  const currVideo = req.body; // figure out how will you recieve this from frontend
  if (!currVideo) {
    throw new ApiError(400, "Error in video URL");
  }
  const video = await Video.findOne({ videoLink: currVideo });
  const isAdded = await Subscription.create({
    subscriber: user._id,
    channel: video.owner,
  });
  if (!isAdded) {
    throw new ApiError(200, "Error in subscribing");
  }

  return res.status(200).json(200, isAdded, "Subscriber Successfully");
});

const unSubscribe = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(400, "User is not logged in");
  }
  const currVideo = req.body; // figure out how will you recieve this from frontend
  if (!currVideo) {
    throw new ApiError(400, "Error in video URL");
  }
  const video = await Video.findOne({ videoLink: currVideo });
  const isDeleted = await Subscription.findOneAndDelete(
    {
      subscriber: user._id,
      channel: video.owner,
    },
    { new: true }
  );
  if (!isDeleted) {
    throw new ApiError(400, "Cannot unsubscribe");
  }

  return res.status(200).json(200, isDeleted, "Unsubscribed Successfully");
});

export { countSubscriber, addSubscriber, unSubscribe };
