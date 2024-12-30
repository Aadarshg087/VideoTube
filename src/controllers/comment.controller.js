import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";

const addCommentOnVideo = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(400, "User not logged in");
  }
  /* 

  Need to figure out the videoFileLink
  Can frontend send this details?
  or may I need to install the middleware to track the currently playing
  video and extract the videoLink of cloudinary

  */
  const { comment, videoFileLink } = req.body;
  if (!comment) {
    throw new ApiError(400, "Comment field is empty");
  }
  if (!videoFileLink) {
    throw new ApiError(500, "Error in video file link");
  }

  const videoCreatorId = await Video.findOne({
    videoLink: videoFileLink,
  }).select("_id");

  if (!videoCreatorId) {
    throw new ApiError(500, "Error finding the owner of the video");
  }

  const addedComment = await Comment.create({
    content: comment,
    video: videoCreatorId,
    owner: user._id, // commented by this user
  });

  if (!addedComment) {
    throw new ApiError(500, "Erorr in adding comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, addedComment, "Comment added successfully"));
});
/* 
- - Frontend will send the comment and commentor details to me (can he really)
*/
const deleteCommentOnVideo = asyncHandler(async (req, res) => {
  const currUser = req.user;
  const { owner, comment, createdAt } = req.body;
  if (!currUser) {
    throw new ApiError(400, "User not logged in");
  }
  if (!owner || !comment) {
    throw new ApiError(400, "Either comment or owner is not defined");
  }
  if (owner != currUser._id) {
    throw new ApiError(400, "Unauthorized operation");
  }
  const response = await Comment.findByIdAndDelete({ createdAt: createdAt });
  if (!response) {
    throw new ApiError(500, "Error in deleting the comment");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, response, "Comment Successfully Deleted"));
});

const updateComment = asyncHandler(async (req, res) => {
  const user = req.user;
  const { newComment, owner, createdAt } = req.body;
  if (!user) {
    throw new ApiError(400, "User is not logged in");
  }
  if (owner != user._id) {
    throw new ApiError(400, "Unauthorize operation");
  }
  const id = await Comment.findOne({ createdAt: createdAt });
  if (newComment.trim() == "") {
    throw new ApiError(400, "Please enter some characters");
  }

  Comment.content = newComment;
  const response = await Comment.save({ validateBeforeSave: false });
  if (!response) {
    throw new ApiError(500, "Error updating the comment");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, response, "Comment Updated Successfully"));
});

export { addCommentOnVideo, deleteCommentOnVideo, updateComment };
