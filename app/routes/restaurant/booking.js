const express = require('express');
const router = express.Router();

const { booking } = require("../../controllers")
const { verifyToken} = require('../../middlewares/jwtAuth');




router.post("/:id",verifyToken, booking.bookingTable);

router.put("/verifyPayment", booking.verifyBookingPayment);

router.put("/cancel-booking/:id",verifyToken, booking.cancelBooking);

router.put("/update/:id", booking.updateBookingTime);

router.get("/",verifyToken, booking.getAllBookings);

module.exports = router;
