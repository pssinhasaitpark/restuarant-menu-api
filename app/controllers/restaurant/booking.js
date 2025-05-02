const { handleResponse } = require('../../utils/helper');
const { PrismaClient } = require('@prisma/client');
const { bookingSchema } = require('../../vailidators/validaters');
const prisma = new PrismaClient();
const razorpayInstance = require('../../utils/razorpay');
const crypto = require('crypto');



exports.bookingTable = async (req, res) => {
  try {

    const { error } = bookingSchema.validate(req.body);
    if (error) {
      return handleResponse(res, 400, error.details[0].message);
    }

    const restaurant_id = req.params.id;
    const user_id = req.user.sub;

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

    const user = await prisma.user.findUnique({
      where: { id: user_id },
    });

    if (!user) {
      return handleResponse(res, 404, "User not found.");
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
      const menuItemIds = menu_items.filter(Boolean).map(item => item.id);

      const menuItemDetails = await prisma.menu_items.findMany({
        where: {
          id: { in: menuItemIds },
          restaurant_id: restaurant.id,
        },
      });

      if (menuItemDetails.length !== menuItemIds.length) {
        return handleResponse(
          res,
          400,
          "Some menu items do not belong to the specified restaurant."
        );
      }

      menu_items.forEach(item => {
        const menuItem = menuItemDetails.find(m => m.id === item.id);
        if (menuItem) {
          totalCharge += parseFloat(menuItem.item_price) * item.quantity;
          selectedMenuItems.push({
            ...menuItem,
            quantity: item.quantity,
          });
        }
      });

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
      razorpay_order_id: order.id,
      payment_id: "null",
      is_visited: "false",
      restaurant: {
        connect: { id: restaurant.id },
      },
      tables: {
        connect: tables.map((table) => ({ id: table.id })),
      },
      user: {
        connect: { id: user_id },
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
        user: true,
      },
    });

    if (selectedMenuItems.length > 0) {
      const orderItemsData = selectedMenuItems.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        user_id: user_id,
        booking_id: newBooking.id,
      }));

      await prisma.order_menu_items.createMany({
        data: orderItemsData,
        skipDuplicates: true,
      });
    }

   
    const updatedBooking = await prisma.booking.findUnique({
      where: { id: newBooking.id },
      include: {
        tables: true,
        user: true,
        order_menu_items: {
          include: {
            menu_item: true,
          },
        },
      },
    });

    const sanitizedUser = {
      id: updatedBooking.user.id,
      user_name: updatedBooking.user.user_name,
      email: updatedBooking.user.email,
      mobile_no: updatedBooking.user.mobile_no,
      createdAt: updatedBooking.user.createdAt,
    };

  
    return handleResponse(
      res,
      201,
      "Table booking initiated successfully. Proceed to payment.",
      {
        id: updatedBooking.id,
        customer_name: updatedBooking.customer_name,
        contact_no: updatedBooking.contact_no,
        num_of_people: updatedBooking.num_of_people,
        booking_time: updatedBooking.booking_time,
        date: updatedBooking.date,
        total_charge: updatedBooking.total_charge,
        instruction: updatedBooking.instruction,
        status: updatedBooking.status,
        payment_status: updatedBooking.payment_status || "pending",
        razorpay_order_id: updatedBooking.razorpay_order_id,
        payment_id: updatedBooking.payment_id || "null",
        token_number: updatedBooking.token_number || null,
        is_visited: updatedBooking.is_visited,
        restaurant_id: updatedBooking.restaurant_id,
        user_id: updatedBooking.user_id,
        createdAt: updatedBooking.createdAt,
        updatedAt: updatedBooking.updatedAt,
        tables: updatedBooking.tables,
        user: sanitizedUser,
        ordered_items: updatedBooking.order_menu_items.map(item => ({
          id: item.menu_item.id,
          name: item.menu_item.item_name,
          price: item.menu_item.item_price,
          quantity: item.quantity,
        })),
      }
    );
  } catch (err) {
    if (err.code === "P2023") {
      return handleResponse(res, 400, "Please provide a valid id");
    }
    console.error(err);
    return handleResponse(res, 500, "Error in booking table");
  }
};


exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.sub;

    const booking = await prisma.booking.findUnique({
      where: {
        id: id,
        user_id: user_id
      },
      include: {
        tables: true
      }
    });

    if (!booking) {
      return handleResponse(res, 404, 'Booking not found.');
    }

    if (booking.status === 'cancelled') {
      return handleResponse(res, 400, 'Booking is already cancelled.');
    }

    const updateTables = booking.tables.map((table) =>
      prisma.table.update({
        where: { id: table.id },
        data: { status: 'free' }
      })
    );

    await Promise.all(updateTables);


    const data = await prisma.booking.update({
      where: { id: id, user_id: user_id },
      data: {
        status: 'cancelled',
      }
    });

    return handleResponse(res, 200, 'Booking cancelled successfully.', data);
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


  const role_type = req.user?.role_type;
  const restaurant_id = req.query.id || req.user.restaurant_id;

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
          menu_items: true,
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
          menu_items: true,
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



