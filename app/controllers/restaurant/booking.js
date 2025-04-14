const { handleResponse } = require('../../utils/helper');
const { PrismaClient } = require('@prisma/client');
const { bookingSchema } = require('../../vailidators/validaters');
const prisma = new PrismaClient();
const razorpayInstance = require('../../utils/razorpay');
const crypto = require('crypto');



exports.bookingTable = async (req, res) => {
  try {
    const restaurant_id = req.query.id;

    if (!restaurant_id) {
      return handleResponse(res, 400, "Provide a restaurant id");
    }

    const {
      customer_name,
      contact_no,
      table_numbers,
      num_of_people,
      booking_time,
      instruction,
      date,
      menu_items,
    } = req.body;

    if (!Array.isArray(table_numbers) || table_numbers.length === 0) {
      return handleResponse(res, 400, "Provide at least one table number");
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurant_id },
    });

    if (!restaurant) {
      return handleResponse(res, 404, "Restaurant not found.");
    }

    const tables = await prisma.table.findMany({
      where: {
        table_number: { in: table_numbers },
        restaurant_id: restaurant.id,
      },
    });

    if (tables.length !== table_numbers.length) {
      return handleResponse(
        res,
        400,
        "One or more tables not found or don't belong to this restaurant."
      );
    }

    const alreadyBooked = tables.find((table) => table.status === "booked");

    if (alreadyBooked) {
      return handleResponse(
        res,
        400,
        `Table ${alreadyBooked.table_number} is already booked.`
      );
    }

    let totalCharge = 0;
    let selectedMenuItems = [];
    let tokenNumber = null;

    if (menu_items && menu_items.length > 0) {
      const menuItemIds = menu_items.map((item) => item.id);

      const menuItemDetails = await prisma.menu_items.findMany({
        where: {
          id: { in: menuItemIds },
          restaurant_id: restaurant.id,
        },
      });

      if (menuItemDetails.length !== menu_items.length) {
        return handleResponse(
          res,
          400,
          "Some menu items do not belong to the specified restaurant."
        );
      }

      totalCharge += menu_items.reduce((sum, item) => {
        const menuItemDetail = menuItemDetails.find((mi) => mi.id === item.id);
        return sum + parseInt(menuItemDetail.item_price) * item.quantity;
      }, 0);

      selectedMenuItems = menuItemDetails;

      const latestBookingWithToken = await prisma.booking.findFirst({
        where: {
          restaurant_id: restaurant.id,
          token_number: { not: null },
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          token_number: true,
        },
      });

      if (latestBookingWithToken?.token_number) {
        const lastTokenNum = parseInt(
          latestBookingWithToken.token_number.split("-")[1] || "0"
        );
        tokenNumber = `token-${lastTokenNum + 1}`;
      } else {
        tokenNumber = "token-1";
      }
    } else {
      totalCharge = tables.reduce(
        (sum, t) => sum + t.cover_charges * num_of_people,
        0
      );
    }

    const orderOptions = {
      amount: totalCharge * 100,
      currency: "INR",
      receipt: `booking_receipt_${new Date().getTime()}`,
      payment_capture: 1,
    };

    const order = await razorpayInstance.orders.create(orderOptions);

    if (!order) {
      return handleResponse(res, 500, "Error creating Razorpay order");
    }

    const newBookingData = {
      customer_name,
      contact_no,
      num_of_people,
      booking_time,
      date,
      total_charge: totalCharge,
      instruction,
      status: "pending",
      restaurant: { connect: { id: restaurant.id } },
      razorpay_order_id: order.id,
      tables: {
        connect: tables.map((table) => ({ id: table.id })),
      },
    };

    if (selectedMenuItems.length > 0) {
      newBookingData.token_number = tokenNumber;
      newBookingData.menu_items = {
        connect: selectedMenuItems.map((item) => ({ id: item.id })),
      };
    }

    const newBooking = await prisma.booking.create({
      data: newBookingData,
      include: {
        tables: true,
        menu_items: true,
      },
    });

    return handleResponse(
      res,
      201,
      "Table booking initiated successfully. Proceed to payment.",
      newBooking
    );
  } catch (err) {
    console.error(err);
    return handleResponse(res, 500, "Error in booking table");
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: {
        id: id
      },
      include: {
        table: true
      }
    });

    if (!booking) {
      return handleResponse(res, 404, 'Booking not found.');
    }

    await prisma.booking.update({
      where: { id: id },
      data: {
        status: 'cancelled',
      }
    });

    await prisma.table.update({
      where: { id: booking.table_id },
      data: {
        status: 'free',
      }
    });

    return handleResponse(res, 200, 'Booking cancelled successfully.');
  } catch (err) {
    console.error(err);
    return handleResponse(res, 500, 'Error in cancelling booking');
  }
};

exports.updateBookingTime = async (req, res) => {
  try {
    const { new_booking_time } = req.body;
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: {
        id: id
      },
      include: {
        table: true
      }
    });

    if (!booking) {
      return handleResponse(res, 404, 'Booking not found.');
    }

    const existingBooking = await prisma.booking.findFirst({
      where: {
        table_id: booking.table_id,
        booking_time: new_booking_time,
        status: 'pending'
      }
    });

    if (existingBooking) {
      return handleResponse(res, 400, 'Table is already booked for the new time.');
    }

    await prisma.booking.update({
      where: { id: id },
      data: {
        booking_time: new_booking_time,
      }
    });

    return handleResponse(res, 200, 'Booking time updated successfully.');
  } catch (err) {
    console.error(err);
    return handleResponse(res, 500, 'Error in updating booking time');
  }
};

exports.getAllBookings = async (req, res) => {
  const { role_type, restaurant_id } = req.user;
  try {
    let bookings;

    if (role_type === 'super_admin') {
      bookings = await prisma.booking.findMany({
        include: {
          tables: {
            select: {
              table_number: true,
              capacity: true,
              status: true,
            },
          },
          restaurant: {
            select: {
              restaurant_name: true,
              location: true,
            },
          },
          menu_items: true, // Optional: only include if you want menu items too
        },
      });
    } else {
      bookings = await prisma.booking.findMany({
        where: {
          restaurant_id: restaurant_id,
        },
        include: {
          tables: {
            select: {
              table_number: true,
              capacity: true,
              status: true,
            },
          },
          restaurant: {
            select: {
              restaurant_name: true,
              location: true,
            },
          },
          menu_items: true, // Optional
        },
      });
    }

    if (bookings.length === 0) {
      return handleResponse(res, 404, 'No bookings found.');
    }

    return handleResponse(res, 200, 'Bookings fetched successfully.', bookings);
  } catch (err) {
    console.error(err);
    return handleResponse(res, 500, 'Error in fetching bookings');
  }
};

exports.verifyBookingPayment = async (req, res) => {

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generatedSignature === razorpay_signature) {
    try {
      const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);

      if (payment.status === 'captured' && payment.order_id === razorpay_order_id) {
        const booking = await prisma.booking.findUnique({
          where: { razorpay_order_id },
          include: { tables: true }
        });

        if (booking) {

          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: 'confirmed',
              payment_status: 'completed',
              payment_id: razorpay_payment_id
            }
          });

          for (const table of booking.tables) {
            await prisma.table.update({
              where: { id: table.id },
              data: { status: 'booked' }
            });
          }

          const updatedBooking = await prisma.booking.findUnique({
            where: { id: booking.id },
            include: { tables: true }
          });



          return handleResponse(res, 200, "Payment verified and table booking confirmed", updatedBooking);
        } else {
          return handleResponse(res, 404, "Booking not found for the provided order ID");
        }
      } else {
        return handleResponse(res, 400, "Payment not captured or incorrect order ID");
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      return handleResponse(res, 500, "Error verifying payment", error.message);
    }
  } else {
    return handleResponse(res, 400, "Signature mismatch");
  }
};

