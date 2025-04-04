const { menuItemSchema } = require('../../vailidators/validaters');
const { handleResponse } = require('../../utils/helper');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const QRCode = require('qrcode');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');




exports.addMenuItems = async (req, res) => {
    const { error } = menuItemSchema.validate(req.body);
    if (error) {
        return handleResponse(res, 400, error.details[0].message);
    }

    const { item_name, item_description, item_price, category_name, sub_category_name } = req.body;
    const restaurantId = req.user.restaurant_id;

    let imageUrls = [];

    if (req.convertedFiles && req.convertedFiles.images) {
        imageUrls = [...imageUrls, ...req.convertedFiles.images];
    }

    try {
        let category = await prisma.category.findFirst({
            where: {
                category_name: category_name,
                restaurant_id: restaurantId
            }
        });

        if (!category) {
            category = await prisma.category.create({
                data: {
                    category_name: category_name,
                    restaurant_id: restaurantId
                }
            });
        }

        let subCategory = await prisma.sub_category.findFirst({
            where: {
                sub_category_name: sub_category_name,
                category_id: category.id
            }
        });

        if (!subCategory) {
            subCategory = await prisma.sub_category.create({
                data: {
                    sub_category_name: sub_category_name, 
                    category_id: category.id
                }
            });
        }

        const existingItem = await prisma.menu_items.findFirst({
            where: {
                item_name: item_name,
                restaurant_id: restaurantId,
                sub_category_id: subCategory.id
            }
        });

        if (existingItem) {
            return handleResponse(res, 400, 'Item with this name already exists.');
        }

        const newItem = await prisma.menu_items.create({
            data: {
                item_name,
                item_description,
                item_price,
                images: imageUrls,
                sub_category_id: subCategory.id, 
                restaurant_id: restaurantId
            }
        });

        let restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId }
        });

        let qrCodeUrl = restaurant.qr_code_url;
      
        

        if (!qrCodeUrl) {
            // const menuUrl = `http://yourdomain.com/menu/${restaurantId}`;
             const menuUrl = `  https://www.swiggy.com/city/indore/fine-dining-restaurants-dineout`;


            const qrCodeDataUrl = await QRCode.toDataURL(menuUrl);

            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage();
            const { width, height } = page.getSize();

            const qrImageBytes = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
            const qrImage = await pdfDoc.embedPng(qrImageBytes);
            const qrDims = qrImage.scale(3.0);

            page.drawImage(qrImage, {
                x: width / 2 - qrDims.width / 2,
                y: height / 2 - qrDims.height / 2,
                width: qrDims.width,
                height: qrDims.height
            });

            const pdfBytes = await pdfDoc.save();
            const pdfPath = path.join(__dirname, 'qr_pdfs', `menu_${restaurantId}_qr_code.pdf`);            

            if (!fs.existsSync(path.dirname(pdfPath))) {
                fs.mkdirSync(path.dirname(pdfPath));
            }

            fs.writeFileSync(pdfPath, pdfBytes);

         
            qrCodeUrl = pdfPath;
            await prisma.restaurant.update({
                where: { id: restaurantId },
                data: { qr_code_url: qrCodeUrl }
            });
        }

        return handleResponse(res, 201, 'Menu Item created successfully and QR code generated.', newItem);
    } catch (err) {
        console.error(err);
        return handleResponse(res, 500, 'Error in creating Menu Item');
    }
};


exports.getAllCategories = async (req, res) => {
    const restaurantId = req.user.restaurant_id;

    try {
    
        const categories = await prisma.category.findMany({
            where: {
                restaurant_id: restaurantId
            },
            include: {
                sub_category: {
                    include:{
                        menu_items:true
                    }
                } 
            }
        });

        if (!categories || categories.length === 0) {
            return handleResponse(res, 404, 'No categories found.');
        }

        return handleResponse(res, 200, 'Categories fetched successfully.', categories);
    } catch (error) {
        console.error(error);
        return handleResponse(res, 500, 'Internal Server Error');
    }
};

exports.deleteCategory = async (req, res) => {
    const { category_id } = req.params;  
    const restaurantId = req.user.restaurant_id;

    try {

        const category = await prisma.category.findFirst({
            where: {
                id: category_id,
                restaurant_id: restaurantId
            }
        });

        if (!category) {
            return handleResponse(res, 404, 'Category not found.');
        }

       
        await prisma.category.delete({
            where: {
                id: category_id
            }
        });

        return handleResponse(res, 200, 'Category and its related sub-categories and menu items deleted successfully.',category);
    } catch (err) {
        console.error(err);
        return handleResponse(res, 500, 'Error in deleting category.');
    }
};

exports.deleteSubCategory = async (req, res) => {
    const { sub_category_id } = req.params;  
    const restaurantId = req.user.restaurant_id;

    try {
   
        const subCategory = await prisma.sub_category.findFirst({
            where: {
                id: sub_category_id,
                category: {
                    restaurant_id: restaurantId
                }
            }
        });

        if (!subCategory) {
            return handleResponse(res, 404, 'Sub-category not found.');
        }


        await prisma.sub_category.delete({
            where: {
                id: sub_category_id
            }
        });

        return handleResponse(res, 200, 'Sub-category and its related menu items deleted successfully.',subCategory);
    } catch (err) {
        console.error(err);
        return handleResponse(res, 500, 'Error in deleting sub-category.');
    }
};

exports.deleteMenuItems = async (req, res) => {
    const { menu_item_id } = req.params;  
    const restaurantId = req.user.restaurant_id;
    try {
      
        const menuItem = await prisma.menu_items.findFirst({
            where: {
                id: menu_item_id,
                restaurant_id: restaurantId
            }
        });

        if (!menuItem) {
            return handleResponse(res, 404, 'Menu item not found.');
        }

        await prisma.menu_items.delete({
            where: {
                id: menu_item_id
            }
        });

        return handleResponse(res, 200, 'Menu item deleted successfully.',menuItem);
    } catch (err) {
        console.error(err);
        return handleResponse(res, 500, 'Error in deleting menu item.');
    }
};

exports.updateCategory = async (req, res) => {
    const { category_id } = req.params;  
    const { category_name } = req.body;
    const restaurantId = req.user.restaurant_id;

    try {
        // Check if the category exists
        const category = await prisma.category.findFirst({
            where: {
                id: category_id,
                restaurant_id: restaurantId
            }
        });

        if (!category) {
            return handleResponse(res, 404, 'Category not found.');
        }

        // Check if the new category name is unique within the restaurant
        const existingCategory = await prisma.category.findFirst({
            where: {
                category_name: category_name,
                restaurant_id: restaurantId
            }
        });

        if (existingCategory && existingCategory.id !== category_id) {
            return handleResponse(res, 400, 'Category name already exists.');
        }

        // Update the category name
        const updatedCategory = await prisma.category.update({
            where: {
                id: category_id
            },
            data: {
                category_name: category_name
            }
        });

        return handleResponse(res, 200, 'Category updated successfully.', updatedCategory);
    } catch (err) {
        console.error(err);
        return handleResponse(res, 500, 'Error in updating category.');
    }
};

exports.updateSubCategory = async (req, res) => {
    const { sub_category_id } = req.params;  
    const { sub_category_name } = req.body;
    const restaurantId = req.user.restaurant_id;

    try {

        const subCategory = await prisma.sub_category.findFirst({
            where: {
                id: sub_category_id,
                category: {
                    restaurant_id: restaurantId
                }
            }
        });

        if (!subCategory) {
            return handleResponse(res, 404, 'Sub-category not found.');
        }

  
        const existingSubCategory = await prisma.sub_category.findFirst({
            where: {
                sub_category_name: sub_category_name,
                category_id: subCategory.category_id
            }
        });

        if (existingSubCategory && existingSubCategory.id !== sub_category_id) {
            return handleResponse(res, 400, 'Sub-category name already exists in the same category.');
        }

   
        const updatedSubCategory = await prisma.sub_category.update({
            where: {
                id: sub_category_id
            },
            data: {
                sub_category_name: sub_category_name
            }
        });

        return handleResponse(res, 200, 'Sub-category updated successfully.', updatedSubCategory);
    } catch (err) {
        console.error(err);
        return handleResponse(res, 500, 'Error in updating sub-category.');
    }
};

exports.updateMenuItem = async (req, res) => {
    const { menu_item_id } = req.params;  
    const { item_name, item_description, item_price, images, sub_category_id } = req.body;
    const restaurantId = req.user.restaurant_id;

    try {
        const menuItem = await prisma.menu_items.findFirst({
            where: {
                id: menu_item_id,
                restaurant_id: restaurantId
            }
        });

        if (!menuItem) {
            return handleResponse(res, 404, 'Menu item not found.');
        }

        const existingItem = await prisma.menu_items.findFirst({
            where: {
                item_name: item_name,
                sub_category_id: sub_category_id,
                restaurant_id: restaurantId
            }
        });

        if (existingItem && existingItem.id !== menu_item_id) {
            return handleResponse(res, 400, 'Menu item with this name already exists in the selected sub-category.');
        }

        const updatedMenuItem = await prisma.menu_items.update({
            where: {
                id: menu_item_id
            },
            data: {
                item_name,
                item_description,
                item_price,
                images,
                sub_category_id
            }
        });

        return handleResponse(res, 200, 'Menu item updated successfully.', updatedMenuItem);
    } catch (err) {
        console.error(err);
        return handleResponse(res, 500, 'Error in updating menu item.');
    }
};
