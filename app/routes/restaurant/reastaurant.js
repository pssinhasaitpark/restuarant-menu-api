const express = require('express');
const router = express.Router();

const { restaurant } = require("../../controllers")
const { upload } = require('../../middlewares/upload');

const { verifyToken, verifyRole } = require('../../middlewares/jwtAuth');


router.post("/create", upload, restaurant.addRestaurant);

router.post("/super_admin", upload, restaurant.superAdminRegister);

router.get("/me", verifyToken, restaurant.me);

router.put("/:restaurant_id", upload, verifyToken, restaurant.updateRestaurant);

router.delete("/:id", restaurant.deleteRestaurant);

router.get("/customers", verifyToken, restaurant.getRestaurantCustomers)

router.get("/wishlist", restaurant.getWishlist);

router.get("/:id", restaurant.getRestaurentById);

router.post("/login", restaurant.login, verifyRole);

router.put("/wishlist/:restaurant_id", restaurant.addWishlist)


router.get("/", restaurant.getAllRestaurent);


module.exports = router;
