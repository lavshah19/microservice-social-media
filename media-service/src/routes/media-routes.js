const express = require("express");

const multer = require("multer");
const { uploadMedia,getAllMedias } = require("../controllers/mediaController");
const logger = require("../utlis/logger");
const authenticateUser  = require("../middleware/auth-middleware");
const router = express.Router();

// configure multer storage later i will create a separe file for this i just want to pratice so  remineder for me
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).single("file");

// Define the media upload route
router.post("/upload", authenticateUser, (req, res, next) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      logger.error("Media upload failed cause multer error", err);
      return res
        .status(400)
        .json({ message: "File upload failed due to a multer error",
            error: err.message,
            stack: err.stack,
         });
    } else if (err) {
      logger.error("Media upload failed cause error", err);
      return res
        .status(400)
        .json({ message: "File upload failed due to an error",
            error: err.message,
            stack: err.stack,
         });
    }
    if(!req.file){
        logger.error("Media upload failed cause no file");
        return res
        .status(400)
        .json({ message: "File upload failed due to no file" });
    }
    next();
  });
},uploadMedia);

router.get('/getmedias',authenticateUser,getAllMedias)


module.exports = router;
