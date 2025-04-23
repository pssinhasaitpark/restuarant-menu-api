const express = require('express');
const router = express.Router();

const { salary } = require("../../controllers")
const { verifyToken } = require('../../middlewares/jwtAuth');



router.post("/:staffId", verifyToken, salary.createStaffSalary);

router.get("/:staffId", verifyToken, salary.getStaffSalaryById);


module.exports = router;
