const { handleResponse } = require("../../utils/helper");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();


 exports.addRestaurantDetails = async (req, res) => {
    try {
        const { restaurant_id } = req.user;
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurant_id }
        });

        if (!restaurant) {
            return handleResponse(res, 400, "Restaurant not found");
        }

        let { about_us, privacy_policy, services_name, terms_and_conditions, removeImages } = req.body;

        if (typeof removeImages === 'string') {
            try {
              removeImages = JSON.parse(removeImages);
            } catch (error) {
              return handleResponse(res, 400, "Invalid format for removeImages");
            }
          }
          
        if (typeof services_name === 'string') {
            try {
                services_name = JSON.parse(services_name);
            } catch (error) {
                return handleResponse(res, 400, "Invalid format for services_name");
            }
        }

        let imageUrls = [];

        if (req.convertedFiles && req.convertedFiles.gallery_images) {
            imageUrls = [...imageUrls, ...req.convertedFiles.gallery_images];
        }

        const existingDetails = await prisma.restaurant_details.findFirst({
            where: {
                restaurant_id: restaurant_id
            }
        });

        
        if (existingDetails) {
          
            if (removeImages && Array.isArray(removeImages)) {

                imageUrls = [
                    ...new Set([
                        ...existingDetails.gallery_images.filter(img => !removeImages.includes(img)),
                        ...imageUrls
                    ])
                ];
                
            } else {
                imageUrls = [...new Set([...existingDetails.gallery_images, ...imageUrls])];
            }

            const updatedData = await prisma.restaurant_details.update({
                where: { id: existingDetails.id },
                data: {
                    about_us,
                    privacy_policy,
                    terms_and_conditions,
                    services_name,
                    gallery_images: imageUrls,
                }
            });

            return handleResponse(res, 200, "Restaurant details updated successfully", updatedData);
        } else {
            const data = await prisma.restaurant_details.create({
                data: {
                    about_us,
                    privacy_policy,
                    terms_and_conditions,
                    services_name,
                    gallery_images: imageUrls,
                    restaurant_id: restaurant_id
                }
            });

            return handleResponse(res, 201, "Restaurant details added successfully", data);
        }

    } catch (error) {
        console.log(error);
        return handleResponse(res, 500, "Error in adding/updating restaurant details");
    }
}; 
 


exports.getRestaurentDetails = async (req, res) => {
    try {
        const { restaurant_id } = req.user;

        const details = await prisma.restaurant_details.findMany({
            where: {
                restaurant_id: restaurant_id
            },
            include: {
                restaurant: {
                    select: {
                        restaurant_name: true,
                        owner_name: true,
                        mobile: true,
                        opening_time: true,
                        closing_time: true,
                        location: true,
                        logo: true
                    }
                }
            }
        });

        if (details.length == 0) {
            return handleResponse(res, 404, "Restaurant details is empty");
        }
        return handleResponse(res, 200, "Restaurant details fetched successfully", details);

    } catch (error) {
        console.log(error);
        return handleResponse(res, 500, "Error in fetching restaurant details");

    }
}


exports.getRestaurentDetailsById = async (req, res) => {
    try {
        const { restaurant_id } = req.user;
        const { id } = req.params;

        const details = await prisma.restaurant_details.findFirst({
            where: {
                restaurant_id: restaurant_id
            },
            include: {
                restaurant: {
                    select: {
                        restaurant_name: true,
                        owner_name: true,
                        mobile: true,
                        opening_time: true,
                        closing_time: true,
                        location: true,
                        logo: true
                    }
                }
            }
        });


        if (!details) {
            return handleResponse(res, 404, "Restaurant details not found with the provided id");
        }

        return handleResponse(res, 200, "Restaurant details fetched successfully", details);

    } catch (error) {
        console.log(error);
        return handleResponse(res, 500, "Error in fetching restaurant details");
    }
};


exports.deleteRestaurentDetailsById = async (req, res) => {
    try {

        const { restaurant_id } = req.user;
        const { id } = req.params

        const details = await prisma.restaurant_details.findUnique({
            where: {
                id: id,
                restaurant_id: restaurant_id
            }
        });

        if (!details) {
            return handleResponse(res, 404, "Restaurant details is not found with provided id");
        }

        const deletedDetails = await prisma.restaurant_details.delete({
            where: {
                id: id,
                restaurant_id: restaurant_id
            }
        })
        return handleResponse(res, 200, "Restaurant details deleted successfully", deletedDetails);

    } catch (error) {
        console.log(error);
        return handleResponse(res, 500, "Error on deleting restaurant details");

    }
}


