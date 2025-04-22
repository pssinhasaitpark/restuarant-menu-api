const express = require('express');
const router = express.Router();

const { review } = require("../../controllers")
const { verifyToken } = require('../../middlewares/jwtAuth');



router.post("/:id", verifyToken, review.addReviews);

router.get("/user/:id", verifyToken, review.getReviewDetailById)

router.get("/getAll", review.getAllReviews)

router.get("/restaurant", verifyToken, review.getReviewsDetails)

router.delete("/:id", review.deleteReviewDetail);

router.put("/update/:id", review.updateReviewDetials)

module.exports = router;
