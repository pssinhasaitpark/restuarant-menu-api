const { restaurantAddSchema, loginSchema } = require('../../vailidators/validaters');
const { handleResponse } = require('../../utils/helper');
const { jwtAuthentication } = require("../../middlewares");
const bcrypt = require("bcrypt");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();



exports.addRestaurant = async (req, res) => {
    const { error } = restaurantAddSchema.validate(req.body);
    if (error) {
        return handleResponse(res, 400, error.details[0].message);
    }

    const { restaurant_name, owner_name, email, password, mobile, opening_time, closing_time, location, type } = req.body;


    if (type && !['veg', 'non_veg'].includes(type)) {
        return handleResponse(res, 400, 'Invalid type. Valid types are "veg" and "non_veg".');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let imageUrls = [];

    if (req.convertedFiles && req.convertedFiles.images) {
        imageUrls = [...imageUrls, ...req.convertedFiles.images];
    }

    const logoImageUrl = (req.convertedFiles && req.convertedFiles.logo && req.convertedFiles.logo[0]);

    try {
        const newRestaurant = await prisma.restaurant.create({
            data: {
                restaurant_name,
                owner_name,
                email,
                password: hashedPassword,
                mobile,
                opening_time,
                closing_time,
                location,
                type: type || 'veg',
                logo: logoImageUrl,
                images: imageUrls
            }
        });

        return handleResponse(res, 201, 'Restaurant added successfully!', newRestaurant);
    } catch (err) {
        console.error(err);
        return handleResponse(res, 500, 'Something went wrong while adding the restaurant');
    }
};

exports.superAdminRegister = async (req, res) => {
    const { email, password, mobile } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);


    try {
        const newRestaurant = await prisma.restaurant.create({
            data: {
                email,
                password: hashedPassword,
                mobile,
                role_type: 'super_admin'
            }
        });

        return handleResponse(res, 201, 'Super-Admin registered successfully!', newRestaurant);
    } catch (err) {
        console.error(err);
        return handleResponse(res, 500, 'Something went wrong on creating super-admin');
    }
};

exports.login = async (req, res, next) => {
    const { error } = loginSchema.validate(req.body);

    if (error) return handleResponse(res, 400, error.details[0].message);

    const { email, password } = req.body;

    try {
        const user = await prisma.restaurant.findUnique({
            where: { email }
        });

        if (!user) {
            return handleResponse(res, 400, 'Invalid username or password.');
        }


        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return handleResponse(res, 400, 'Invalid username or password.');
        }

        const accessToken = await jwtAuthentication.signAccessToken(user.id, user.role_type);
        const encryptedToken = jwtAuthentication.encryptToken(accessToken);

        req.user = {
            id: user.id,
            role_type: user.role_type,
            encryptedToken: encryptedToken
        };

        next();
    } catch (error) {
        return handleResponse(res, 500, 'An unexpected error occurred during login.', error.message);
    }
};

exports.getAllRestaurent = async (req, res) => {
    try {

        const data = await prisma.restaurant.findMany({
            where: {
                role_type: { not: 'super_admin' }
            }
        });

        if (!data || data.length === 0) {
            return handleResponse(res, 404, "No restaurant found in the database");
        }

        return handleResponse(res, 200, "Restaurant details fetched successfully!", data);
    } catch (error) {
        return handleResponse(res, 500, "Error fetching restaurant details", error.message);
    }
};

exports.updateRestaurant = async (req, res) => {



    const { restaurant_name, owner_name, email, password, mobile, opening_time, closing_time, location, type } = req.body;
    const { restaurant_id } = req.params;

    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurant_id }
        });

        if (!restaurant) {
            return handleResponse(res, 404, 'Restaurant not found!');
        }

        let hashedPassword;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        let imageUrls = [];

        if (req.convertedFiles && req.convertedFiles.images) {
            imageUrls = [...imageUrls, ...req.convertedFiles.images];
        }

     const logoImageUrl = (req.convertedFiles && req.convertedFiles.logo && req.convertedFiles.logo[0]);


        const updatedData = {
            restaurant_name: restaurant_name || restaurant.restaurant_name,
            owner_name: owner_name || restaurant.owner_name,
            email: email || restaurant.email,
            password: hashedPassword || restaurant.password,
            mobile: mobile || restaurant.mobile,
            opening_time: opening_time || restaurant.opening_time,
            closing_time: closing_time || restaurant.closing_time,
            location: location || restaurant.location,
            type: type || restaurant.type,
            logo:logoImageUrl ||restaurant.logo,
            images: imageUrls
        };

        const updatedRestaurant = await prisma.restaurant.update({
            where: { id: restaurant_id },
            data: updatedData
        });

        return handleResponse(res, 200, 'Restaurant updated successfully!', updatedRestaurant);
    } catch (err) {
        console.error(err);
        return handleResponse(res, 500, 'Something went wrong while updating the restaurant');
    }
};

exports.deleteRestaurant = async (req, res) => {
    try {
        const { id } = req.params;

        const data = await prisma.restaurant.delete({
            where: { id: id }
        });

        return handleResponse(res, 200, 'Restaurant deleted successfully!', data);

    } catch (err) {
        if (err.code === 'P2025') {
            return handleResponse(res, 404, `Restaurant not found!`);
        }

        console.error(err);
        return handleResponse(res, 500, 'Something went wrong while deleting the restaurant');
    }
};

exports.getRestaurantCustomers = async (req, res) => {
    const { restaurant_id, role_type } = req.user;

    try {
        let bookings;


        if (role_type === 'super_admin') {
            bookings = await prisma.booking.findMany({
                select: {
                    customer_name: true,
                    contact_no: true,
                    num_of_people: true,
                    booking_time: true,
                    total_charge: true,
                }
            });
        } else {
            bookings = await prisma.booking.findMany({
                where: {
                    restaurant_id: restaurant_id,
                },
                select: {
                    customer_name: true,
                    contact_no: true,
                    num_of_people: true,
                    booking_time: true,
                    total_charge: true,
                }
            });
        }


        if (!bookings || bookings.length === 0) {
            return handleResponse(res, 404, "No customer bookings found");
        }

        return handleResponse(res, 200, "Customer details fetched successfully!", bookings);
    } catch (error) {
        console.error(error);
        return handleResponse(res, 500, "Error fetching customer details", error.message);
    }
};

exports.getRestaurentById = async (req, res) => {
    try {

        const { id } = req.params;
        const data = await prisma.restaurant.findMany({
            where: {
                id: id

            }
        });

        if (!data || data.length === 0) {
            return handleResponse(res, 404, "No restaurant found in the database");
        }

        return handleResponse(res, 200, "Restaurant details fetched successfully!", data);
    } catch (error) {
        return handleResponse(res, 500, "Error fetching restaurant details", error.message);
    }
};

exports.me = async (req, res) => {
    try {

        const restaurantId = req.user.restaurant_id;
        if (!req.user || !req.user.restaurant_id) {
            return handleResponse(res, 401, "Unauthorized user");
        }

        const user = await prisma.restaurant.findUnique({ where: { id: restaurantId } });

        if (!user) {
            return handleResponse(res, 404, "User not found");
        }

        user.password = undefined;

        handleResponse(res, 200, "Restaurent User details retrieved successfully!", user);
    } catch (error) {
        console.log(error)
        return handleResponse(res, 500, "Error in fetching  details", error.message);
    }
}

exports.addWishlist = async (req, res) => {
    const { restaurant_id } = req.params;

    try {

        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurant_id },
        });

        if (!restaurant) {
            return handleResponse(res, 404, 'Restaurant not found!');
        }


        const updatedRestaurant = await prisma.restaurant.update({
            where: { id: restaurant_id },
            data: {
                wishlist: !restaurant.wishlist,
            },
        });

        return handleResponse(
            res,
            200,
            updatedRestaurant.wishlist ? 'Restaurant added to wishlist!' : 'Restaurant removed from wishlist!',
            updatedRestaurant
        );
    } catch (err) {
        console.error(err);
        return handleResponse(res, 500, 'Something went wrong while toggling the wishlist status');
    }
};


exports.getWishlist=async(req,res)=>{
    try {

        const data = await prisma.restaurant.findMany({
            where: {
                wishlist:true,
                role_type: { not: 'super_admin' },
            }
        });

        if (!data || data.length === 0) {
            return handleResponse(res, 404, " Wishlist is empty");
        }

        return handleResponse(res, 200, "WishList restaurent fetched successfully!", data);
    } catch (error) {
        return handleResponse(res, 500, "Error fetching WishList restaurant details", error.message);
    }
}