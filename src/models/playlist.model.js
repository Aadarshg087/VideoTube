import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const playlistSchema = new Schema(
  {
    name: {
      type: String, // name of playlist
      required: true,
    },
    description: {
      type: String,
    },
    video: {
      type: [Schema.Types.ObjectId],
      ref: "Video",
      required: true,
    },
  },
  { timestamps: true }
);

playlistSchema.plugin(mongooseAggregatePaginate);

export const Playlist = mongoose.model("Playlist", playlistSchema);
