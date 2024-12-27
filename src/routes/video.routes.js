import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAllVideos, uploadVideo } from "../controllers/video.controller.js";

const router = Router();

// Only authenticated user
router.use(verifyJWT);

router.route("/getAllVideos").get(getAllVideos);

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

export default router;
