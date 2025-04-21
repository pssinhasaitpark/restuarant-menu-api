const { menuItemSchema } = require('../../vailidators/validaters');
const { handleResponse } = require('../../utils/helper');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib'); 
const sharp = require('sharp');
const axios = require('axios');

exports.addMenuItems = async (req, res) => {
    const { category_name, items } = req.body;

    const restaurantId = req.user.restaurant_id;
    let restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { id: true, restaurant_name: true, qr_code_url: true, logo: true }
    });
    
    if(!restaurant){
        return handleResponse(res,404,"Restaurent is not exist");
    }

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

        let createdMenuItems = [];
        let imageIndex = 0;

        for (const menuItem of items) {
            const { item_name, item_description, item_price, images } = menuItem;

            const existingItem = await prisma.menu_items.findFirst({
                where: {
                    item_name: item_name,
                    restaurant_id: restaurantId,
                    category_id: category.id
                }
            });

            if (existingItem) {
                return handleResponse(res, 400, `Item with the name "${item_name}" already exists in this category.`);
            }

            let itemImages = images && images.length > 0 ? images : [];

            while (itemImages.length < 1 && imageIndex < imageUrls.length) {
                itemImages.push(imageUrls[imageIndex]);
                imageIndex++;
            }

            const newMenuItem = await prisma.menu_items.create({
                data: {
                    item_name,
                    item_description,
                    item_price,
                    images: itemImages || [],
                    category_id: category.id,
                    restaurant_id: restaurantId
                }
            });

            createdMenuItems.push(newMenuItem);
        }

      
        
        let qrCodeUrl = restaurant.qr_code_url;

        if (!qrCodeUrl) {
            const menuUrl = `${process.env.MENUURL}${restaurantId}`;
            try {
                const BASE_PATH = path.join(__dirname, "../../uploads");
                const PDF_PATH = path.join(BASE_PATH, 'qr_pdfs');

                if (!fs.existsSync(BASE_PATH)) {
                    fs.mkdirSync(BASE_PATH, { recursive: true });
                }

                if (!fs.existsSync(PDF_PATH)) {
                    fs.mkdirSync(PDF_PATH, { recursive: true });
                }

                const qrTempPath = path.join(__dirname, `qr_temp_${restaurant.id}.png`);
                await QRCode.toFile(qrTempPath, menuUrl, {
                    errorCorrectionLevel: 'H',
                    margin: 1,
                    width:500,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });

                if (restaurant.logo) {
                    const response = await axios({
                        method: 'get',
                        url: restaurant.logo,
                        responseType: 'arraybuffer'
                    });

                    const logoTempPath = path.join(__dirname, `logo_${restaurant.id}.png`);
                    await sharp(response.data)
                        .toFormat('png')
                        .toFile(logoTempPath);

                    const qrImageMetadata = await sharp(qrTempPath).metadata();
                    const qrWidth = qrImageMetadata.width;
                    const qrHeight = qrImageMetadata.height;

                    const logoSize = Math.round(qrWidth * 0.3);
                    const logoX = Math.round((qrWidth - logoSize) / 2);
                    const logoY = Math.round((qrHeight - logoSize) / 2);

                    const resizedLogoPath = path.join(__dirname, `logo_resized_${restaurant.id}.png`);
                    await sharp(logoTempPath)
                        .resize(logoSize, logoSize)
                        .toFile(resizedLogoPath);

                    const whiteSquarePath = path.join(__dirname, `white_square_${restaurant.id}.png`);
                    await sharp({
                        create: {
                            width: logoSize,
                            height: logoSize,
                            channels: 4,
                            background: { r: 255, g: 255, b: 255, alpha: 1 }
                        }
                    })
                        .png()
                        .toFile(whiteSquarePath);

                    const finalQrPath = path.join(__dirname, `final_qr_${restaurant.id}.png`);
                    await sharp(qrTempPath)
                        .composite([
                            {
                                input: whiteSquarePath,
                                top: logoY,
                                left: logoX
                            },
                            {
                                input: resizedLogoPath,
                                top: logoY,
                                left: logoX
                            }
                        ])
                        .toFile(finalQrPath);

            
                        try {
                      
                            const pdfDoc = await PDFDocument.create();
                            const page = pdfDoc.addPage([500, 500]);  

                            const { width, height } = page.getSize();


                        
                            
                            const font = await pdfDoc.embedStandardFont('Helvetica');  
                            const text = restaurant.restaurant_name;
                            const textSize = 50;  
                            const textWidth = font.widthOfTextAtSize(text, textSize);
                            const textX = width / 2 - textWidth / 2;
                            
                           
                            const textY = height / 2 + 200;  
                        
                            
                            page.drawText(text, {
                                x: textX,
                                y: textY,
                                font,
                                size: textSize,  
                                color: rgb(0, 0, 0),  
                                maxWidth: width - 20
                            });
                        
                          
                            const finalQrBuffer = fs.readFileSync(finalQrPath);
                            const finalQrImage = await pdfDoc.embedPng(finalQrBuffer);
                            const qrDims = finalQrImage.scale(1.0);
                        
                            const qrX = width / 2 - qrDims.width / 2;
                            const qrY = height / 2 - qrDims.height / 2;
                        
                            page.drawImage(finalQrImage, {
                                x: qrX,
                                y: qrY,
                                width: qrDims.width,
                                height: qrDims.height
                            });
                        
                          
                            const pdfBytes = await pdfDoc.save();
                            const pdfFileName = `menu_${restaurant.restaurant_name}_qr_code.pdf`;
                            const pdfFilePath = path.join(PDF_PATH, pdfFileName);
                            fs.writeFileSync(pdfFilePath, pdfBytes);
                        
                            qrCodeUrl = `${process.env.IMAGEURL}pdf/${pdfFileName}`;
                        
                            await prisma.restaurant.update({
                                where: { id: restaurantId },
                                data: { qr_code_url: qrCodeUrl }
                            });
                        
                            
                            fs.unlinkSync(qrTempPath);
                            fs.unlinkSync(logoTempPath);
                            fs.unlinkSync(resizedLogoPath);
                            fs.unlinkSync(whiteSquarePath);
                            fs.unlinkSync(finalQrPath);
                        
                        } catch (err) {
                            console.error("Error creating QR code with logo:", err);
                        }
                        
                }
            } catch (err) {
                console.error("Error creating QR code with logo:", err);
            }
        }

        return handleResponse(res, 201, 'Menu Items created successfully', createdMenuItems);
    } catch (err) {
        console.error(err);
        return handleResponse(res, 500, 'Error in creating Menu Items');
    }
};



exports.getAllCategories = async (req, res) => {
    
    const restaurantId = req.query.id || req.user.restaurant_id;

    try {

        const categories = await prisma.category.findMany({
            where: {
                restaurant_id: restaurantId
            },
            include: {
                menu_items: true
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
    const { categoryId } = req.params;
    const restaurantId = req.user.restaurant_id;

    try {

        const category = await prisma.category.findFirst({
            where: {
                id: categoryId,
                restaurant_id: restaurantId
            }
        });

        if (!category) {
            return handleResponse(res, 404, 'Category not found.');
        }


        await prisma.category.delete({
            where: {
                id: categoryId
            }
        });

        return handleResponse(res, 200, 'Category and its related sub-categories and menu items deleted successfully.', category);
    } catch (err) {
        console.error(err);
        return handleResponse(res, 500, 'Error in deleting category.');
    }
};


exports.deleteMenuItems = async (req, res) => {
    const { menuItemId } = req.params;
    const restaurantId = req.user.restaurant_id;
    try {

        const menuItem = await prisma.menu_items.findFirst({
            where: {
                id: menuItemId,
                restaurant_id: restaurantId
            }
        });

        if (!menuItem) {
            return handleResponse(res, 404, 'Menu item not found.');
        }

        await prisma.menu_items.delete({
            where: {
                id: menuItemId
            }
        });

        return handleResponse(res, 200, 'Menu item deleted successfully.', menuItem);
    } catch (err) {
        console.error(err);
        return handleResponse(res, 500, 'Error in deleting menu item.');
    }
};


exports.updateCategory = async (req, res) => {
    const { categoryId } = req.params;
    const { category_name } = req.body;
    const restaurantId = req.user.restaurant_id;

    try {
        // Check if the category exists
        const category = await prisma.category.findFirst({
            where: {
                id: categoryId,
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
                id: categoryId
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


exports.updateMenuItem = async (req, res) => {
    const { menuItemId } = req.params;
    const { category_name, items } = req.body;

    const restaurantId = req.user.restaurant_id;

    try {
        const menuItem = await prisma.menu_items.findFirst({
            where: {
                id: menuItemId,
                restaurant_id: restaurantId
            }
        });

        if (!menuItem) {
            return handleResponse(res, 404, 'Menu item not found.');
        }

        const category = await prisma.category.findFirst({
            where: {
                category_name: category_name,
                restaurant_id: restaurantId
            }
        });

        if (!category) {
            return handleResponse(res, 404, 'Category does not exist for this restaurant.');
        }

        for (let item of items) {
            const { item_name, item_price, item_description } = item;

            const existingItem = await prisma.menu_items.findFirst({
                where: {
                    item_name: item_name,
                    category_id: category.id,
                    restaurant_id: restaurantId
                }
            });

            if (existingItem && existingItem.id !== menuItemId) {
                return handleResponse(res, 400, 'Menu item with this name already exists in the selected category.');
            }

            let imageUrls = [];

            if (req.convertedFiles && req.convertedFiles.images) {
                imageUrls = [...req.convertedFiles.images];
            } else {
                imageUrls = menuItem.images || [];
            }

            const updatedMenuItem = await prisma.menu_items.update({
                where: {
                    id: menuItemId
                },
                data: {
                    item_name: item_name,
                    item_description: item_description || null,
                    item_price: item_price,
                    images: imageUrls,
                    category_id: category.id,
                }
            });

            return handleResponse(res, 200, 'Menu item updated successfully.', updatedMenuItem);
        }
    } catch (err) {
        console.error(err);
        return handleResponse(res, 500, 'Error in updating menu item.');
    }
};


exports.getMenuItemById = async (req, res) => {
    const { menuItemId } = req.params;

    if (!menuItemId) {
        return handleResponse(res, 400, 'Menu item ID is required');
    }

    try {
        const menuItem = await prisma.menu_items.findUnique({
            where: {
                id: menuItemId
            },
            select: {
                id: true,
                item_name: true,
                item_description: true,
                item_price: true,
                type: true,
                category: {
                    select: {
                        id: true,
                        category_name: true
                    }
                },
                restaurant: {
                    select: {
                        id: true,
                        restaurant_name: true
                    }
                }
            }
        });

        if (!menuItem) {
            return handleResponse(res, 404, 'Menu item not found');
        }

        return handleResponse(res, 200, 'Menu item fetched successfully', menuItem);
    } catch (error) {
        console.error(error);
        return handleResponse(res, 500, 'Error fetching menu item');
    }
};


exports.getQrCode = async (req, res) => {
    try {

        const restaurantId = req.query.id || req.user.restaurant_id;

        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
            select: { qr_code_url: true }
        });

        if (!restaurant || !restaurant.qr_code_url) {
            return handleResponse(res, 404, 'QR Code not found for this restaurant.');
        }

        return handleResponse(res, 200, 'QR Code fetched successfully', {
            qr_code_url: restaurant.qr_code_url
        });

    } catch (err) {


        console.error('Error fetching QR Code URL:', err);
        return handleResponse(res, 500, 'Error fetching QR Code URL');
    }
};



