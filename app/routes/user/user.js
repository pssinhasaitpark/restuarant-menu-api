const express = require('express');
const router = express.Router();

const { user } = require("../../controllers")
const { verifyToken } = require('../../middlewares/jwtAuth');



router.post("/", user.registerUser);

router.post("/login", user.loginUser);

router.post('/verify-otp', user.verifyOtp);

router.get("/get",verifyToken, user.getUserById);

router.get("/", user.getAllUser);

router.get("/me",verifyToken, user.me);

router.delete("/:id",user.deleteUser)



module.exports = router;
