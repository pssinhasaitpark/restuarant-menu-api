const express = require('express');
const router = express.Router();

const { booking } = require("../../controllers")
const { verifyToken} = require('../../middlewares/jwtAuth');


router.post("/", booking.bookingTable);

router.post("/verifyPayment", booking.verifyBookingPayment);

router.put("/:id", booking.cancelBooking);

router.put("/update/:id", booking.updateBookingTime);

router.get("/",verifyToken, booking.getAllBookings);

module.exports = router;
