const { tableSchema } = require('../../vailidators/validaters');
const { handleResponse } = require('../../utils/helper');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


exports.addTable = async (req, res) => {

    if (!Array.isArray(req.body.tables) || req.body.tables.length === 0) {
        return handleResponse(res, 400, 'Invalid request. No tables provided.');
    }

    const createdTables = [];

    for (let table of req.body.tables) {
        const { error } = tableSchema.validate(table);
        if (error) {
            return handleResponse(res, 400, error.details[0].message);
        }

        const { table_number, capacity } = table;
        const restaurantId = req.user.restaurant_id;

        const parsedCapacity = parseInt(capacity, 10);
        if (isNaN(parsedCapacity)) {
            return handleResponse(res, 400, 'Invalid capacity value for table ' + table_number);
        }

        const existingTable = await prisma.table.findFirst({
            where: {
                table_number: table_number,
                restaurant_id: restaurantId
            }
        });

        if (existingTable) {
            return handleResponse(res, 400, 'Table with number ' + table_number + ' already exists.');
        }

        const cover_charge = 10;

        try {
            // Create the table
            const newTable = await prisma.table.create({
                data: {
                    table_number,
                    capacity: parsedCapacity,
                    cover_charges: cover_charge,
                    status: 'free',
                    restaurant_id: restaurantId
                }
            });

            // Push the created table data to the createdTables array
            createdTables.push(newTable);

        } catch (err) {
            console.error(err);
            return handleResponse(res, 500, 'Error in creating table');
        }
    }

    return handleResponse(res, 201, 'Tables created successfully.', createdTables);
};

exports.availableTables = async (req, res) => {

    const restaurantId = req.query.id || req.user.restaurant_id;

    try {
        const availableTables = await prisma.table.findMany({
            where: {
                status: 'free',
                restaurant_id: restaurantId
            }
        });

        if (!availableTables || availableTables.length === 0) {
            return handleResponse(res, 404, 'No available tables found.');
        }
        return handleResponse(res, 200, 'Available tables fetched successfully.', availableTables);
    } catch (error) {
        console.error(error);
        return handleResponse(res, 500, 'Internal Server Error');
    }
};

exports.getTableId = async (req, res) => {
    
    const restaurantId = req.user.restaurant_id;
    try {
        const { id } = req.params;
        const table = await prisma.table.findUnique({
            where: {
                id: id,
                restaurant_id: restaurantId
            }
        });

        if (!table) {
            return handleResponse(res, 404, 'Table not found.');
        }
        return handleResponse(res, 200, 'Table fetched successfully.', table);
    } catch (error) {
        console.error(error);
        return handleResponse(res, 500, 'Internal Server Error');
    }
};

exports.getAllTableDetails = async (req, res) => {
    const { role_type, restaurant_id } = req.user;

    try {
        let tables;

        if (role_type === 'super_admin') {
            tables = await prisma.table.findMany();
        } else {
            tables = await prisma.table.findMany({
                where: {
                    restaurant_id: restaurant_id
                }
            });
        }

        if (!tables || tables.length === 0) {
            return handleResponse(res, 404, 'No tables found.');
        }

        return handleResponse(res, 200, 'Tables fetched successfully.', tables);
    } catch (error) {
        console.error(error);
        return handleResponse(res, 500, 'Internal Server Error');
    }
};

exports.deleteTable = async (req, res) => {
    try {

        const { role_type, restaurant_id } = req.user;
        
        const { id } = req.params;

        const existingTable = await prisma.table.findFirst({
            where: {
                id: id
            }
        });

        if (!existingTable) {
            return handleResponse(res, 404, "Table not found");
        }


        if (role_type === 'super_admin') {
            await prisma.table.delete({
                where: {
                    id: id
                }
            });
        } else {

            await prisma.table.delete({
                where: {
                    id: id,
                    restaurant_id: restaurant_id
                }
            });
        }

        return handleResponse(res, 200, "Table deleted successfully", existingTable);

    } catch (err) {
        if (err.code === 'P2025') {
            return handleResponse(res, 404, "Restaurant not found!");
        }
        console.error(err);
        return handleResponse(res, 500, 'Something went wrong while deleting the table');
    }
};


