const express = require('express');
const router = express.Router();

const { verifyToken } = require('../../middlewares/jwtAuth');

const { order } = require("../../controllers")



router.post("/",order.placeOrder);


router.get("/",verifyToken,order.getAllOrders);


router.get('/export-orders',verifyToken, order.exportOrdersToCSV);


module.exports = router;
