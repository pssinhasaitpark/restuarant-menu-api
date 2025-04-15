const express = require('express');
const router = express.Router();

const { order } = require("../../controllers")



router.post("/",order.placeOrder);



module.exports = router;
