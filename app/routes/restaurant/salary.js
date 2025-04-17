const express = require('express');
const router = express.Router();

const { salary } = require("../../controllers")
const { verifyToken } = require('../../middlewares/jwtAuth');



router.post("/:staffId", verifyToken, salary.createStaffSalary);

 router.get("/:staffId", verifyToken, salary.getStaffSalaryById);

// router.get("/", verifyToken, staff.getAllStaffMembers);

// router.delete("/:id", verifyToken, staff.deleteStaffMember);

// router.put("/:id", verifyToken, upload, staff.updateStaffMember);




module.exports = router;
