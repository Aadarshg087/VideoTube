import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const LikesSchema = new Schema(
  {
    videoLink: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },
    likedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    likeCount: {
      type: Number,
      default: 0,
    },
    dislikedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    dislikeCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamp: true }
);

LikesSchema.plugin(mongooseAggregatePaginate);

export const Likes = mongoose.model("Likes", LikesSchema);
