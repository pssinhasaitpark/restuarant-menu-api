const express = require('express');
const router = express.Router();

const { support } = require("../../controllers")
const { verifyToken } = require('../../middlewares/jwtAuth');



router.post("/:restaurantId", verifyToken, support.createSupport);

router.get("/:id", support.getSupportDetailsById);

router.get("/", support.getSupportDetails)

router.delete("/:id", support.deleteSupportDetails)

router.post("/issues/:supportId",verifyToken, support.replyOfIssues)

router.get("/replies/:supportId", support.getReplies)



module.exports = router;
