const { handleResponse } = require('../../utils/helper');
const { PrismaClient } = require('@prisma/client');
const { bookingSchema } = require('../../vailidators/validaters');
const prisma = new PrismaClient();
const razorpayInstance = require('../../utils/razorpay');
const crypto = require('crypto');

/*
exports.bookingTable = async (req, res) => {
  try {

    const { error } = bookingSchema.validate(req.body);
    if (error) {
      return handleResponse(res, 400, error.details[0].message);
    }

    const { customer_name, contact_no, table_number, num_of_people, booking_time, instruction, date } = req.body;


    const table = await prisma.table.findUnique({
      where: {
        table_number: table_number
      }
    });

    if (!table) {
      return handleResponse(res, 404, 'Table not found.');
    }

    if (table.status === 'booked') {
      return handleResponse(res, 400, 'Table is already booked.');
    }

    const totalCharge = table.cover_charges * num_of_people;


    // await prisma.table.update({
    //   where: { table_number: table_number },
    //   data: {
    //     status: 'booked',
    //   }
    // });



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


    const newBooking = await prisma.booking.create({
      data: {
        customer_name: customer_name,
        contact_no: contact_no,
        num_of_people: num_of_people,
        booking_time: booking_time,
        date: date,
        total_charge: totalCharge,
        instruction: instruction,
        status: 'pending',
        table: { connect: { id: table.id } },
        restaurant: { connect: { id: table.restaurant_id } },
        razorpay_order_id: order.id,
      }
    });


    return handleResponse(res, 201, 'Table booking initiated successfully. Proceed to payment.', newBooking);

  } catch (err) {
    console.error(err);
    return handleResponse(res, 500, 'Error in booking table');
  }
};


exports.bookingTable = async (req, res) => {
  try {
    const { error } = bookingSchema.validate(req.body);
    if (error) {
      return handleResponse(res, 400, error.details[0].message);
    }

    const { customer_name, contact_no, table_number, num_of_people, booking_time, instruction, date, menu_items } = req.body;

    const table = await prisma.table.findUnique({
      where: {
        table_number: table_number
      }
    });

    if (!table) {
      return handleResponse(res, 404, 'Table not found.');
    }

    if (table.status === 'booked') {
      return handleResponse(res, 400, 'Table is already booked.');
    }

    let totalCharge = 0;
    let selectedMenuItems = [];
    let tokenCounter = 0;

    
    if (menu_items && menu_items.length > 0) {
      const menuItemDetails = await prisma.menu_items.findMany({
        where: {
          id: { in: menu_items }
        }
      });

      selectedMenuItems = menuItemDetails;
      totalCharge += menuItemDetails.reduce((sum, item) => sum + parseInt(item.item_price), 0); 

      
      tokenCounter += 1;
    } else {
      
      totalCharge = table.cover_charges * num_of_people; 
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
      customer_name: customer_name,
      contact_no: contact_no,
      num_of_people: num_of_people,
      booking_time: booking_time,
      date: date,
      total_charge: totalCharge,
      instruction: instruction,
      status: 'pending',
      table: { connect: { id: table.id } },
      restaurant: { connect: { id: table.restaurant_id } },
      razorpay_order_id: order.id,
    };

   
    if (selectedMenuItems.length > 0) {
      newBookingData.token_number = `token-${tokenCounter}`;  
    }


    if (selectedMenuItems.length > 0) {
      newBookingData.menu_items = {
        connect: selectedMenuItems.map(item => ({ id: item.id }))
      };
    }


    const newBooking = await prisma.booking.create({
      data: newBookingData
    });

    return handleResponse(res, 201, 'Table booking initiated successfully. Proceed to payment.', newBooking);

  } catch (err) {
    console.error(err);
    return handleResponse(res, 500, 'Error in booking table');
  }
};*/


exports.bookingTable = async (req, res) => {
  try {
    const { error } = bookingSchema.validate(req.body);
    if (error) {
      return handleResponse(res, 400, error.details[0].message);
    }

    const restaurant_id = req.query.id;

    if (!restaurant_id) {
      return handleResponse(res, 400, "Provide a restaurant id");
    }

    const { customer_name, contact_no, table_number, num_of_people, booking_time, instruction, date, menu_items } = req.body;

    // Validate the restaurant ID and fetch the restaurant details
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: restaurant_id
      }
    });

    if (!restaurant) {
      return handleResponse(res, 404, 'Restaurant not found.');
    }

    // Fetch the table in the correct restaurant
    const table = await prisma.table.findUnique({
      where: {
        table_number: table_number
      },
      include: {
        restaurant: true // Include the related restaurant to match with the restaurant_id in the request
      }
    });

    if (!table) {
      return handleResponse(res, 404, 'Table not found.');
    }

    if (table.status === 'booked') {
      return handleResponse(res, 400, 'Table is already booked.');
    }

    // Check if the table belongs to the specified restaurant
    if (table.restaurant_id !== restaurant.id) {
      return handleResponse(res, 400, 'Table does not belong to the specified restaurant.');
    }

    let totalCharge = 0;
    let selectedMenuItems = [];
    let tokenCounter = 0;

    // If menu items are selected, validate them and calculate the total charge
    if (menu_items && menu_items.length > 0) {
      // Ensure all menu items belong to the correct restaurant
      const menuItemDetails = await prisma.menu_items.findMany({
        where: {
          id: { in: menu_items },
          restaurant_id: restaurant.id // Ensure they belong to the correct restaurant
        }
      });

      if (menuItemDetails.length !== menu_items.length) {
        return handleResponse(res, 400, 'Some menu items do not belong to the specified restaurant.');
      }

      selectedMenuItems = menuItemDetails;
      totalCharge += menuItemDetails.reduce((sum, item) => sum + parseInt(item.item_price), 0);

      tokenCounter += 1;
    } else {
      totalCharge = table.cover_charges * num_of_people;
    }

    // Create Razorpay order
    const orderOptions = {
      amount: totalCharge * 100, // Amount in paise
      currency: "INR",
      receipt: `booking_receipt_${new Date().getTime()}`,
      payment_capture: 1,
    };

    const order = await razorpayInstance.orders.create(orderOptions);

    if (!order) {
      return handleResponse(res, 500, "Error creating Razorpay order");
    }

    // Prepare new booking data
    const newBookingData = {
      customer_name: customer_name,
      contact_no: contact_no,
      num_of_people: num_of_people,
      booking_time: booking_time,
      date: date,
      total_charge: totalCharge,
      instruction: instruction,
      status: 'pending',
      table: { connect: { id: table.id } },
      restaurant: { connect: { id: restaurant.id } },
      razorpay_order_id: order.id,
    };

    // If menu items are selected, add them to the booking
    if (selectedMenuItems.length > 0) {
      newBookingData.token_number = `token-${tokenCounter}`;
      newBookingData.menu_items = {
        connect: selectedMenuItems.map(item => ({ id: item.id }))
      };
    }

    // Create the booking record in the database
    const newBooking = await prisma.booking.create({
      data: newBookingData
    });

    return handleResponse(res, 201, 'Table booking initiated successfully. Proceed to payment.', newBooking);

  } catch (err) {
    console.error(err);
    return handleResponse(res, 500, 'Error in booking table');
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
          table: {
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
        },
      });
    } else {

      bookings = await prisma.booking.findMany({
        where: {
          restaurant_id: restaurant_id,
        },
        include: {
          table: {
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

/*
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
        const booking = await prisma.booking.findUnique({ where: { razorpay_order_id } });

        if (booking) {
          booking.status = 'confirmed';
          booking.payment_status = 'completed';
          booking.payement_id = razorpay_payment_id;
          await prisma.booking.update({
            where: { id: booking.id },
            data: booking
          });

          await prisma.table.update({
            where: { id: booking.table_id },
            data: { status: 'booked' }
          });

          return handleResponse(res, 200, "Payment verified and table booking confirmed");
        } else {
          return handleResponse(res, 404, "Booking not found for the provided orderId");
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
*/
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
        const booking = await prisma.booking.findUnique({ where: { razorpay_order_id } });

        if (booking) {
          booking.status = 'confirmed';
          booking.payment_status = 'completed';
          booking.payment_id = razorpay_payment_id;
          await prisma.booking.update({
            where: { id: booking.id },
            data: booking
          });

          await prisma.table.update({
            where: { id: booking.table_id },
            data: { status: 'booked' }
          });

          return handleResponse(res, 200, "Payment verified and table booking confirmed");
        } else {
          return handleResponse(res, 404, "Booking not found for the provided orderId");
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

