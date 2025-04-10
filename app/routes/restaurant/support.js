const express = require('express');
const router = express.Router();

const { support } = require("../../controllers")
const { verifyToken } = require('../../middlewares/jwtAuth');



router.post("/", support.createSupport);

router.get("/:id", support.getSupportDetailsById);

router.get("/", support.getSupportDetails)

router.delete("/:id", support.deleteSupportDetails)



module.exports = router;
