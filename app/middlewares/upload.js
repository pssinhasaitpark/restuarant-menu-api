const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");


const upload = (req, res, next) => {
  const BASE_PATH = path.join(__dirname, "../uploads");

  if (!fs.existsSync(BASE_PATH)) {
    fs.mkdirSync(BASE_PATH, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, BASE_PATH);
    },
    filename: function (req, file, cb) {
      const fileNameWithoutExt = path.parse(file.originalname).name;
      cb(null, fileNameWithoutExt + Date.now() + path.extname(file.originalname));
    },
  });

  const fileFilter = (req, file, cb) => {
   
    cb(null, true);
  };

  const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 1024 * 5 }, 
    fileFilter: fileFilter,
  });

  const allowedFields = ["images", "logo","profile_image"];

  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "logo", maxCount: 10 },
    { name: "profile_image", maxCount: 10 },
    

   
  ])(req, res, async (err) => {

    if (err) {
      console.log("err===", err);
      return res.status(400).send({ message: "File upload failed." });
    }

    if (req.files) {
      const unexpectedFields = Object.keys(req.files).filter(
        (key) => !allowedFields.includes(key)
      );

      if (unexpectedFields.length > 0) {
        return res.status(400).send({
          message: `Unexpected file fields: ${unexpectedFields.join(", ")}`,
        });
      }
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return next();
    }

    const fileKeys = Object.keys(req.files);
    let convertedFiles = {};

    try {
      for (const key of fileKeys) {
        const files = req.files[key];
        const convertedFilePaths = [];

        for (const file of files) {
          const uploadedFilePath = path.join(BASE_PATH, file.filename);
          const webpFileName = Date.now() + "-" + file.originalname.split('.')[0] + ".webp";
          const webpFilePath = path.join(BASE_PATH, webpFileName);

          await sharp(uploadedFilePath)
            .webp({ quality: 80 })
            .toFile(webpFilePath);

          fs.unlinkSync(uploadedFilePath); 

          const convertedFileUrl = `${process.env.IMAGEURL}image/${webpFileName}`;
          convertedFilePaths.push(convertedFileUrl);
        }

        convertedFiles[key] = convertedFilePaths;
      }

      req.convertedFiles = convertedFiles;

      next();
    } catch (error) {
      console.error("Error converting images to webp:", error);
      return res.status(500).send({ message: "Failed to convert images." });
    }
  });
};


module.exports = { upload };
