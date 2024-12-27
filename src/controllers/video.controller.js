import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

import mongoose from "mongoose";

const getAllVideos = asyncHandler(async (req, res) => {
  /* 
  Map req.user._id with owner._id
  and return the object of the Video

  We will use mongo aggregation pipelines.
  We need only thumbnail, videoLink, Title, owner name, maybe Views

  I am confused between whether I should make this as the card info or get the allVid of particular user
  If it is a particular user, I need to extract the info from the params
*/
  const userId = req.user._id;
  const allVideos = await Video.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    {
      $project: {
        _id: 1,
        videoLink: 1,
        thumbNail: 1,
        title: 1,
        views: 1,
        duration: 1,
        ownerDetails: {
          username: 1,
          email: 1,
        },
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

export { getAllVideos, uploadVideo };
