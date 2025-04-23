const express = require("express");
const router = express.Router();
const {social_media}=require("../../controllers")



router.post("/", social_media.createSocialMedia);

router.get("/", social_media.getSocialMedia); 

router.delete("/:id", social_media.deleteSocialMedia);

router.put("/:id", social_media.updateSocialMedia)

module.exports = router;






