const express = require('express');
const router = express.Router();

const { menu_management } = require("../../controllers")
const { verifyToken } = require('../../middlewares/jwtAuth');
const { upload } = require('../../middlewares/upload');



router.get("/", verifyToken, menu_management.getAllCategories);

router.post("/", upload,verifyToken, menu_management.addMenuItems);

router.delete("/category/:category_id",verifyToken,menu_management.deleteCategory);

router.delete("/menu_item/:menu_item_id",verifyToken,menu_management.deleteMenuItems);

router.put("/category/:category_id",verifyToken,menu_management.updateCategory);

router.put("/menu_item/:menu_item_id",verifyToken,upload,menu_management.updateMenuItem);


module.exports = router;
