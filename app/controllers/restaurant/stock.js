const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { stockSchema } = require('../../vailidators/validaters');
const { handleResponse } = require('../../utils/helper');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;


exports.createStock = async (req, res) => {
    try {
        const { restaurant_id } = req.user;

        if (req.convertedFiles && req.convertedFiles['stock-csv']) {
            const csvFilePath = req.files['stock-csv'][0].path;
            const results = [];

         
            fs.createReadStream(csvFilePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    try {
                        const insertPromises = results.map(async (row) => {
                            const validation = stockSchema.validate(row);
                            if (validation.error) {
                                throw new Error(`Validation failed for item ${row.item_name}: ${validation.error.details[0].message}`);
                            }

                         
                            const existingStock = await prisma.stock.findFirst({
                                where: { item_name: row.item_name }
                            });

                            if (existingStock) {
                                throw new Error(`Item '${row.item_name}' already exists.`);
                            }

                            return prisma.stock.create({
                                data: {
                                    item_name: row.item_name,
                                    category_name: row.category_name,
                                    quantity: parseFloat(row.quantity),
                                    unit: row.unit,
                                    supplier_name: row.supplier_name,
                                    price_per_unit: parseFloat(row.price_per_unit),
                                    total_price: parseFloat(row.price_per_unit) * parseFloat(row.quantity),
                                    restaurant_id: restaurant_id,
                                },
                            });
                        });

                        const createdItems = await Promise.all(insertPromises);
                        return handleResponse(res, 201, 'Stock items created successfully.', createdItems);
                    } catch (err) {
                        return handleResponse(res, 400, 'CSV processing failed.', err.message);
                    }
                });
        } else {
            
            const { error } = stockSchema.validate(req.body);
            if (error) {
                return handleResponse(res, 400, error.details[0].message);
            }

            const { item_name, category_name, quantity, unit, supplier_name, price_per_unit } = req.body;

            const existingStock = await prisma.stock.findFirst({
                where: { item_name: item_name }
            });

            if (existingStock) {
                return handleResponse(res, 400, "This item already exists");
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
                    restaurant_id,
                },
            });

            return handleResponse(res, 201, 'Stock item created successfully.', newStock);
        }
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

exports.exportStockToCSV = async (req, res) => {
    try {
      const { restaurant_id } = req.user;
  
      if (!restaurant_id) {
        return handleResponse(res, 400, "Restaurant ID is required");
      }
  
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurant_id }
      });
  
      if (!restaurant) {
        return handleResponse(res, 404, "Restaurant not found");
      }
  
      const stocks = await prisma.stock.findMany({
        where: { restaurant_id },
        orderBy: { createdAt: 'desc' }
      });
  
      if (!stocks || stocks.length === 0) {
        return handleResponse(res, 404, "No stock data found for this restaurant.");
      }
  
      const records = stocks.map(stock => ({
        item_name: stock.item_name,
        category_name: stock.category_name,
        quantity: stock.quantity,
        unit: stock.unit,
        supplier_name: stock.supplier_name,
        price_per_unit: stock.price_per_unit,
        total_price: stock.total_price,
        createdAt: stock.createdAt
      }));
  
      const directoryPath = path.join(__dirname, '..', '..', 'uploads', 'csv_files');
  
      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }
  
      const fileName = `stock_restaurant_${restaurant.restaurant_name.replace(/\s+/g, '_')}.csv`;
      const csvFilePath = path.join(directoryPath, fileName);
  
      const csvWriter = createCsvWriter({
        path: csvFilePath,
        header: [
          { id: 'item_name', title: 'Item Name' },
          { id: 'category_name', title: 'Category' },
          { id: 'quantity', title: 'Quantity' },
          { id: 'unit', title: 'Unit' },
          { id: 'supplier_name', title: 'Supplier' },
          { id: 'price_per_unit', title: 'Price Per Unit' },
          { id: 'total_price', title: 'Total Price' },
          { id: 'createdAt', title: 'Created At' }
        ]
      });
  
      await csvWriter.writeRecords(records);
  
      res.download(csvFilePath, fileName, (err) => {
        if (err) {
          console.error("Error downloading stock CSV file", err);
          return handleResponse(res, 500, "Error downloading the stock CSV file");
        }
      });
  
    } catch (error) {
      console.error("Error exporting stock to CSV:", error);
      return handleResponse(res, 500, "Something went wrong while exporting stock data");
    }
};