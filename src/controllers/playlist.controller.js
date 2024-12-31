import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { Video } from "../models/video.model.js";
import { Playlist } from "../models/playlist.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const currUser = req.user;
  if (!currUser) {
    throw new ApiError(400, "User is not logged in");
  }

  const { name, description, currVideo } = req.body;

  if (!name) {
    throw new ApiError(400, "Playlist name is required");
  }
  if (!currVideo) {
    throw new ApiError(400, "Current video is empty");
  }

  const isPlaylistExists = await Playlist.findOne({ name: name });
  if (isPlaylistExists) {
    throw new ApiError(400, "Playlist already exists");
  }
  const video = await Video.findOne({ videoLink: currVideo });
  if (!video) {
    throw new ApiError(500, "There is some error in fetching the video");
  }

  const createdPlaylist = await Playlist.create({
    name: name,
    description: description || "",
    video: [video._id],
    owner: currUser._id,
  });

  if (!createdPlaylist) {
    throw new ApiError(500, "Error creating the playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, createdPlaylist, "Playlist Created Successfully")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const currUser = req.user;
  if (!currUser) {
    throw new ApiError(400, "User is not logged in");
  }

  const { name, currVideo } = req.body;
  if (!name) {
    throw new ApiError(400, "Playlist name is required");
  }
  if (!currVideo) {
    throw new ApiError(400, "Current video is empty");
  }
  const video = await Video.findOne({ videoLink: currVideo });
  if (!video) {
    throw new ApiError(
      500,
      "There is some error in fetching the video from DB"
    );
  }
  const updatedPlaylist = await Playlist.findOneAndUpdate(
    { name: name },
    { $push: { video: video._id } },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(500, "Error in updating the playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist Updated Successfully")
    );
});

const removeFromPlaylist = asyncHandler(async (req, res) => {
  const currUser = req.user;
  if (!currUser) {
    throw new ApiError(400, "User is not logged in");
  }

  const { name, currVideo } = req.body;
  if (!name) {
    throw new ApiError(400, "Playlist name is required");
  }
  if (!currVideo) {
    throw new ApiError(400, "Current video is empty");
  }
  const video = await Video.findOne({ videoLink: currVideo });
  if (!video) {
    throw new ApiError(
      500,
      "There is some error in fetching the video from DB"
    );
  }
  const isExist = await Playlist.findOne({ name: name, video: video._id });
  if (!isExist) {
    throw new ApiError(400, "The video does not exist in this playlist");
  }

  const updatePlalist = await Playlist.findOneAndUpdate(
    { name: name },
    {
      $pull: { video: video._id },
    },
    { new: true }
  );
  if (!updatePlalist) {
    throw new ApiError(500, "Error in removing the video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatePlalist, "Video removed successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const currUser = req.user;
  if (!currUser) {
    throw new ApiError(400, "User is not logged in");
  }

  const { name } = req.body;
  if (!name) {
    throw new ApiError(400, "Playlist name is required");
  }

  const isDeleted = await Playlist.findOneAndDelete({ name: name });
  if (!isDeleted) {
    throw new ApiError(500, "Error in deleting");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, isDeleted, "Successfully deleted the playlist"));
});
export { createPlaylist, updatePlaylist, removeFromPlaylist, deletePlaylist };
