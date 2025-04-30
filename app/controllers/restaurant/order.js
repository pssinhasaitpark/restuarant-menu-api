const { handleResponse } = require('../../utils/helper');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');




exports.placeOrder = async (req, res) => {
  try {
    const { customer_name, email, menu_items, token_number } = req.body;
    const restaurant_id = req.query.id;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurant_id },
      select: { id: true, restaurant_name: true }
    });

    if (!restaurant) {
      return handleResponse(res, 404, "Restaurant does not exist");
    }

    if (!restaurant.restaurant_name || restaurant.restaurant_name.length < 3) {
      return handleResponse(res, 500, "Invalid restaurant name for token generation");
    }

    if (!menu_items || !Array.isArray(menu_items) || menu_items.length === 0) {
      return handleResponse(res, 400, "Menu items are required");
    }

    const validMenuItems = menu_items.map(item => ({
      id: item.id,
      quantity: item.quantity
    }));

    const menuItemIds = validMenuItems.map(item => item.id);

    const menuItemsFromDB = await prisma.menu_items.findMany({
      where: { id: { in: menuItemIds } }
    });

    if (menuItemsFromDB.length !== validMenuItems.length) {
      return handleResponse(res, 400, "One or more menu items are invalid");
    }

    const menuItemMap = new Map();
    menuItemsFromDB.forEach(item => menuItemMap.set(item.id, item));

    const totalCharge = validMenuItems.reduce((total, item) => {
      const detail = menuItemMap.get(item.id);
      return total + (parseFloat(detail.item_price) * item.quantity);
    }, 0);

    if (token_number) {
      const existingOrder = await prisma.order.findUnique({
        where: { token_number },
        include: { order_menu_items: { include: { menu_item: true } } }
      });

      if (!existingOrder) {
        return handleResponse(res, 404, "Order with given token not found");
      }

      const updatedOrder = await prisma.order.update({
        where: { token_number },
        data: {
          total_amount: existingOrder.total_amount + totalCharge,
          order_menu_items: {
            create: validMenuItems.map(item => ({
              menu_item_id: item.id,
              quantity: item.quantity
            }))
          }
        },
        include: { order_menu_items: { include: { menu_item: true } } },
      });

      return handleResponse(res, 200, "Menu items added to existing order", updatedOrder);
    }

    const getNextTokenNumber = async (restaurant) => {
      const prefix = restaurant.restaurant_name.slice(0, 3).toUpperCase();

      const lastOrder = await prisma.order.findFirst({
        where: {
          restaurant_id: restaurant.id,
          token_number: { startsWith: prefix }
        },
        orderBy: { createdAt: 'desc' },
        select: { token_number: true }
      });

      if (lastOrder && lastOrder.token_number) {
        const lastTokenNumber = parseInt(lastOrder.token_number.slice(3), 10);
        const nextToken = !isNaN(lastTokenNumber) ? lastTokenNumber + 1 : 1;
        return `${prefix}${String(nextToken).padStart(3, "0")}`;
      } else {
        return `${prefix}001`;
      }
    };

    const getNextOrderId = async () => {
      const lastOrderWithCustomId = await prisma.order.findFirst({
        where: { restaurant_id },
        orderBy: { createdAt: 'desc' },
        select: { order_id: true }
      });

      if (lastOrderWithCustomId && lastOrderWithCustomId.order_id) {
        const lastNumber = parseInt(lastOrderWithCustomId.order_id.replace("Order", ""));
        const nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
        return `Order${String(nextNumber).padStart(3, "0")}`;
      } else {
        return "Order001";
      }
    };

    const createOrderWithRetry = async (maxRetries = 3) => {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const newTokenNumber = await getNextTokenNumber(restaurant);
          const newCustomOrderId = await getNextOrderId();

          const newOrder = await prisma.order.create({
            data: {
              customer_name,
              email,
              token_number: newTokenNumber,
              order_id: newCustomOrderId,
              status: "preparing",
              total_amount: totalCharge,
              restaurant_id,
              order_menu_items: {
                create: validMenuItems.map(item => ({
                  menu_item_id: item.id,
                  quantity: item.quantity
                }))
              }
            },
            include: { order_menu_items: { include: { menu_item: true } } }
          });

          return newOrder;

        } catch (error) {
          if (error.code === 'P2002' && error.meta?.target?.includes('token_number')) {
            continue;
          } else {
            throw error;
          }
        }
      }

      throw new Error("Failed to generate a unique token number after multiple attempts");
    };

    const newOrder = await createOrderWithRetry();

    const formattedOrder = {
      ...newOrder,
      order_menu_items: newOrder.order_menu_items.map(item => ({
        id: item.menu_item.id,
        name: item.menu_item.item_name,
        price: parseFloat(item.menu_item.item_price),
        quantity: item.quantity
      }))
    };

    return handleResponse(res, 200, "Order processed successfully", formattedOrder);

  } catch (error) {
    console.error("Error while placing order:", error);
    return handleResponse(res, 500, "Something went wrong while placing order");
  }
};



exports.getAllOrders = async (req, res) => {
  try {
    const { restaurant_id } = req.user;
    const orders = await prisma.order.findMany({
      where: {
        restaurant_id: restaurant_id
      },
      orderBy: { createdAt: 'desc' },
      include: {
        order_menu_items: {
          include: {
            menu_item: true,
          },
        },
        restaurant: true
      }
    });



    if (orders.length == 0) {
      return handleResponse(res, 404, "Order details are empty")
    }

    const formattedOrders = orders.map(order => ({
      order_id: order.order_id,
      token_number: order.token_number,
      customer_name: order.customer_name,
      email: order.email,
      status: order.status,
      total_amount: order.total_amount,
      createdAt: order.createdAt,
      restaurant: {
        id: order.restaurant?.id,
        name: order.restaurant?.restaurant_name,
        email: order.restaurant?.email,
        location: order.restaurant?.location,
        mobile: order.restaurant?.mobile,
        logo: order.restaurant?.logo

      },
      items: order.order_menu_items.map(omi => ({
        id: omi.menu_item.id,
        name: omi.menu_item.item_name,
        price: parseFloat(omi.menu_item.item_price),
        quantity: omi.quantity
      }))
    }));

    return handleResponse(res, 200, "All orders fetched successfully", formattedOrders);

  } catch (error) {
    console.error("Error fetching orders:", error);
    return handleResponse(res, 500, "Something went wrong while fetching orders");
  }
};

 
exports.exportOrdersToCSV = async (req, res) => {
  try {

    const { restaurant_id } = req.user;

    if (!restaurant_id) {
      return handleResponse(res, 400, "Restaurant ID is required");
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurant_id }
    });

    const orders = await prisma.order.findMany({
      where: {
        restaurant_id: restaurant_id,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        order_menu_items: {
          include: {
            menu_item: true,
          },
        },
        restaurant: true
      }
    });

    if (!orders || orders.length === 0) {
      return handleResponse(res, 404, `No orders found for restaurant with ID ${restaurant_id}`);
    }

    const records = orders.map(order => ({
      order_id: order.order_id,
      token_number: order.token_number,
      customer_name: order.customer_name,
      email: order.email,
      status: order.status,
      total_amount: order.total_amount,
      createdAt: order.createdAt,
      restaurant_name: order.restaurant.restaurant_name,
      restaurant_email: order.restaurant.email,
      restaurant_location: order.restaurant.location,
      restaurant_mobile: order.restaurant.mobile,
      items: order.order_menu_items.map(omi => `${omi.menu_item.item_name} (x${omi.quantity}) - $${omi.menu_item.item_price}`).join('; ')
    }));

    const directoryPath = path.join(__dirname, '..', '..', 'uploads', 'csv_files');

    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    const csvFilePath = path.join(directoryPath, `orders_restaurant_${restaurant.restaurant_name}.csv`);

    const csvWriter = createCsvWriter({
      path: csvFilePath,
      header: [
        { id: 'order_id', title: 'Order ID' },
        { id: 'token_number', title: 'Token Number' },
        { id: 'customer_name', title: 'Customer Name' },
        { id: 'email', title: 'Email' },
        { id: 'status', title: 'Status' },
        { id: 'total_amount', title: 'Total Amount' },
        { id: 'createdAt', title: 'Created At' },
        { id: 'restaurant_name', title: 'Restaurant Name' },
        { id: 'restaurant_email', title: 'Restaurant Email' },
        { id: 'restaurant_location', title: 'Restaurant Location' },
        { id: 'restaurant_mobile', title: 'Restaurant Mobile' },
        { id: 'items', title: 'Ordered Items' }
      ]
    });

    await csvWriter.writeRecords(records);

    res.download(csvFilePath, `orders_restaurant_${restaurant.restaurant_name}.csv`, (err) => {
      if (err) {
        console.error("Error downloading file", err);
        return handleResponse(res, 500, "Error while downloading the CSV file");
      }
    });

  } catch (error) {
    console.error("Error exporting orders to CSV:", error);
    return handleResponse(res, 500, "Something went wrong while exporting orders");
  }
};








