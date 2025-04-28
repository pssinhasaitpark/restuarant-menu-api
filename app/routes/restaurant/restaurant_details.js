const express = require('express');
const router = express.Router();

const { restaurant_details } = require("../../controllers")
const { upload } = require('../../middlewares/upload');

const { verifyToken } = require('../../middlewares/jwtAuth');


router.post("/", verifyToken, upload, restaurant_details.addRestaurantDetails);

router.get("/", verifyToken, restaurant_details.getRestaurentDetails);

router.delete("/:id", verifyToken, restaurant_details.deleteRestaurentDetailsById);


module.exports = router;
