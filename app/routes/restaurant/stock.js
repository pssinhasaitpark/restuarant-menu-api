const express = require('express');
const router = express.Router();

const { stock } = require("../../controllers")
const { verifyToken } = require('../../middlewares/jwtAuth');
const { upload } = require('../../middlewares/upload');



router.post("/", verifyToken, upload, stock.createStock);

router.put("/:id", verifyToken, stock.updateStock);

router.get("/export-stock", verifyToken, stock.exportStockToCSV);

router.get("/:id", verifyToken, stock.getStockItemById)

router.get("/", verifyToken, stock.getStockDetails)

router.delete("/:id", verifyToken, stock.deleteStock)


module.exports = router;
