const express = require('express');
const router = express.Router();

const { staff } = require("../../controllers")
const { verifyToken } = require('../../middlewares/jwtAuth');
const { upload } = require('../../middlewares/upload');



router.post("/", verifyToken, upload, staff.addStaffMember);

router.get("/:id", verifyToken, staff.getStaffMemberById);

router.get("/", verifyToken, staff.getAllStaffMembers);

router.delete("/:id", verifyToken, staff.deleteStaffMember);

router.put("/:id", verifyToken, upload, staff.updateStaffMember);




module.exports = router;
