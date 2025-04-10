const express = require('express');
const router = express.Router();

const { menu_management } = require("../../controllers")
const { verifyToken } = require('../../middlewares/jwtAuth');
const { upload } = require('../../middlewares/upload');




router.get("/qrCode",verifyToken,menu_management.getQrCode)

router.get("/", verifyToken, menu_management.getAllCategories);

router.post("/", upload,verifyToken, menu_management.addMenuItems);

router.delete("/category/:categoryId",verifyToken,menu_management.deleteCategory);

router.delete("/menu_item/:menuItemId",verifyToken,menu_management.deleteMenuItems);

router.put("/category/:categoryId",verifyToken,menu_management.updateCategory);

router.put("/menu_item/:menuItemId",verifyToken,upload,menu_management.updateMenuItem);

router.get("/:menuItemId",menu_management.getMenuItemById)



module.exports = router;
