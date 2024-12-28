import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  uploadVideo,
  subscribedChannelVideos,
} from "../controllers/video.controller.js";

const router = Router();

// Only authenticated user
router.use(verifyJWT);

router.route("/uploadVideo").post(
  upload.fields([
    {
      name: "videoLocal",
      maxCount: 1,
    },
    {
      name: "thumbNailLocal",
      maxCount: 1,
    },
  ]),
  uploadVideo
);

router.route("/home").get(subscribedChannelVideos);

export default router;
