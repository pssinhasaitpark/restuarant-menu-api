const express = require('express');
const router = express.Router();

const { table } = require("../../controllers")
const { verifyToken } = require('../../middlewares/jwtAuth');



router.post("/",verifyToken,table.addTable);

router.get("/availables",verifyToken,table.availableTables)

router.get("/:tableNumber",verifyToken,table.getTableByNumber);

router.get("/",verifyToken,table.getAllTableDetails)

router.delete("/:id",verifyToken,table.deleteTable)




module.exports = router;
