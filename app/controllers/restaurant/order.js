const { handleResponse } = require('../../utils/helper');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


exports.placeOrder = async (req, res) => {
  try {
    const { customer_name, email, menu_items, token_number } = req.body;
    const restaurant_id = req.query.id;

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
      return total + (detail.item_price * item.quantity);
    }, 0);

    if (token_number) {
      const existingOrder = await prisma.order.findUnique({
        where: { token_number },
        include: { menu_items: true }
      });

      if (!existingOrder) {
        return handleResponse(res, 404, "Order with given token not found");
      }

      const updatedOrder = await prisma.order.update({
        where: { token_number },
        data: {
          total_amount: existingOrder.total_amount + totalCharge,
          menu_items: {
            connect: validMenuItems.map(item => ({
              id: item.id
            }))
          },
        },
        include: { menu_items: true },
      });

      const quantityMap = new Map();
      validMenuItems.forEach(item => {
        quantityMap.set(item.id, item.quantity);
      });

      const updatedMenuItemsDetailed = updatedOrder.menu_items.map(item => ({
        id: item.id,
        name: item.item_name,
        price: item.item_price,
        quantity: quantityMap.get(item.id) || 1
      }));

      const updatedResponse = {
        ...updatedOrder,
        menu_items: updatedMenuItemsDetailed
      };

      return handleResponse(res, 200, "Menu items added to existing order", updatedResponse);
    }

    const lastOrder = await prisma.order.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { token_number: true }
    });

    let newTokenNumber;
    if (lastOrder && lastOrder.token_number && lastOrder.token_number.startsWith("token_")) {
      const lastTokenParts = lastOrder.token_number.split('_');
      const lastTokenNumber = parseInt(lastTokenParts[1], 10);

      newTokenNumber = !isNaN(lastTokenNumber)
        ? `token-${lastTokenNumber + 1}`
        : 'token-1';
    } else {
      newTokenNumber = 'token-1';
    }

    const newOrder = await prisma.order.create({
      data: {
        customer_name,
        email,
        token_number: newTokenNumber,
        status: "preparing",
        total_amount: totalCharge,
        restaurant_id,
        menu_items: {
          connect: validMenuItems.map(item => ({
            id: item.id
          }))
        }
      },
      include: { menu_items: true },
    });

    const quantityMap = new Map();
    validMenuItems.forEach(item => {
      quantityMap.set(item.id, item.quantity);
    });

    const detailedMenuItems = newOrder.menu_items.map(item => ({
      id: item.id,
      name: item.item_name,
      price: item.item_price,
      quantity: quantityMap.get(item.id)
    }));

    const finalResponse = {
      ...newOrder,
      menu_items: detailedMenuItems
    };

    return handleResponse(res, 200, "Order processed successfully", finalResponse);

  } catch (error) {
    console.error("Error while placing order:", error);
    return handleResponse(res, 500, "Something went wrong while placing order");
  }
};
