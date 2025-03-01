import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // console.log(file);
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
// console.log("Dirname", process.cwd());

export const upload = multer({ storage });
