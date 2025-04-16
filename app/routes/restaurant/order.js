const express = require('express');
const router = express.Router();

const { order } = require("../../controllers")



router.post("/",order.placeOrder);

router.get("/",order.getAllOrders);




module.exports = router;
