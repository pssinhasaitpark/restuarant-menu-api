const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { stockSchema } = require('../../vailidators/validaters');
const { handleResponse } = require('../../utils/helper');



exports.createStock = async (req, res) => {
    try {
        const { error } = stockSchema.validate(req.body);
        if (error) {
            return handleResponse(res, 400, error.details[0].message);
        }

        const { item_name, category_name, quantity, unit, supplier_name, price_per_unit } = req.body;
        const { restaurant_id } = req.user;

        const existingStock = await prisma.stock.findFirst({
            where: { item_name: item_name }
        })

        if (existingStock) {
            return handleResponse(res, 400, "This item is already exist");
        }

        const newStock = await prisma.stock.create({
            data: {
                item_name,
                category_name,
                quantity,
                unit,
                supplier_name,
                price_per_unit,
                total_price: price_per_unit * quantity,
                restaurant_id: restaurant_id,
            },
        });

        return handleResponse(res, 201, 'Stock item created successfully.', newStock);
    } catch (error) {
        return handleResponse(res, 500, 'Error creating stock item.', error.message);
    }
};


exports.getStockDetails = async (req, res) => {
    const { restaurant_id } = req.user;


    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurant_id }
        });
        if (!restaurant) {
            return handleResponse(res, 404, "Restaurent not found")
        }


        const stockItems = await prisma.stock.findMany({
            where: { restaurant_id },
        });

        if (!stockItems) {
            return handleResponse(res, 404, "stock item is empty", stockItems);
        }
        return handleResponse(res, 200, 'Stock items fetched successfully.', stockItems);
    } catch (error) {
        return handleResponse(res, 500, 'Error fetching stock items.', error.message);
    }
};


exports.updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { restaurant_id } = req.user;
        const existingStock = await prisma.stock.findUnique({
            where: {
                id: id,
                restaurant_id: restaurant_id
            }
        })

        if (!existingStock) {
            return handleResponse(res, 404, "Stock item not found")
        }

        const { item_name, category_name, quantity, unit, supplier_name, price_per_unit } = req.body;



        const updatedStock = await prisma.stock.update({
            where: {
                id: id,
                restaurant_id: restaurant_id
            },
            data: {
                item_name: item_name || existingStock.item_name,
                category_name: category_name || existingStock.category_name,
                quantity: quantity || existingStock.quantity,
                unit: unit || existingStock.unit,
                supplier_name: supplier_name || existingStock.supplier_name,
                price_per_unit: price_per_unit || existingStock.price_per_unit,
                total_price: price_per_unit * quantity,
            },
        });

        return handleResponse(res, 200, 'Stock item updated successfully.', updatedStock);
    } catch (error) {

        console.log(error);
        return handleResponse(res, 500, "Error in updating stock items")
    }
};


exports.deleteStock = async (req, res) => {

    try {
        const { id } = req.params;
        const { restaurant_id } = req.user;

        const data = await prisma.stock.delete({
            where: {
                id: id,
                restaurant_id: restaurant_id
            }
        });

        return handleResponse(res, 200, "Stock item deleted succesfully", data);

    } catch (error) {
        if (error.code === 'P2025') {
            return handleResponse(res, 404, `Stock iterm not found!`);
        }
        console.log(error);
        return handleResponse(res, 500, "Error in delete stock items")
    }
};


exports.getStockItemById = async (req, res) => {
    try {
        const { id } = req.params;
        const { restaurant_id } = req.user;

        const data = await prisma.stock.findUnique({
            where: {
                id: id,
                restaurant_id: restaurant_id
            }
        });

        if (!data) {
            return handleResponse(res, 404, "Stock item is not present")
        }

        return handleResponse(res, 200, "Stock item fetched  succesfully");

    } catch (error) {
        console.log(error);
        return handleResponse(res, 500, "Error in fetching stock items")
    }
}