const { PrismaClient } = require('@prisma/client');
const { handleResponse } = require('../../utils/helper');
const prisma = new PrismaClient();
const { jwtAuthentication } = require("../../middlewares");
const { sendOtp } = require('../../utils/emailHandler');

exports.registerUser = async (req, res) => {
    try {
        const { user_name, email, mobile_no } = req.body;

        const existingUser = await prisma.user.findUnique({
            where: {
                mobile_no: mobile_no
            }

        });

        if (existingUser) {
            return handleResponse(res, 400, "User is already register")
        }

        const newUser = await prisma.user.create({
            data: {
                user_name,
                email,
                mobile_no
            }
        })
        return handleResponse(res, 201, "User Register Successfully...", newUser)

    } catch (err) {
        console.error(err);
        return handleResponse(res, 500, 'Something went wrong while register user');
    }

}

exports.loginUser = async (req, res) => {

    try {
        const { email } = req.body;

        if (!email) return handleResponse(res, 400, "Mobile no is required");

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) return handleResponse(res, 404, "User not found");

        // const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const otp="1234"

        const expiry = new Date(Date.now() + 5 * 60 * 1000);

        await prisma.user.update({
            where: { email },
            data: {
                otp,
                otp_expiry: expiry
            }
        });

        await sendOtp(email, otp)


        return handleResponse(res, 200, "OTP sent successfully.......................");
    } catch (err) {
        console.error(err);
        return handleResponse(res, 500, "Internal server error");
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return handleResponse(res, 400, "Email and OTP are required");
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || user.otp !== otp) {
            return handleResponse(res, 400, "Invalid OTP");
        }

        if (new Date(user.otp_expiry) < new Date()) {
            return handleResponse(res, 400, "OTP has expired");
        }


        await prisma.user.update({
            where: { email },
            data: {
                otp: null,
                otp_expiry: null
            }
        });

        const token = await jwtAuthentication.signAccessToken(user.id, user.role_type);
        const encryptedToken = jwtAuthentication.encryptToken(token);

        return handleResponse(res, 200, "OTP verified", {
            encryptedToken,
            role_type: user.role_type
        });
    } catch (err) {
        console.error(err);
        return handleResponse(res, 500, "Internal server error");
    }
};


// exports.getUserById = async (req, res) => {
//     try {
//         const user_id = req.user.sub; 

//         const user = await prisma.user.findUnique({
//             where: {
//                 id: user_id
//             },
//             include: {
//                 booking: {
//                     include: {
//                         restaurant: {
//                             select: {
//                                 restaurant_name: true,
//                                 location: true,
//                                 images:true

//                             }
//                         },
//                         menu_items: {
//                             select: {
//                                 item_name: true,
//                                 item_description: true,
//                                 item_price: true,
//                                 images:true
//                             }
//                         }
//                     }
//                 },
//                 review:true
//             }
//         });

//         if (!user) {
//             return handleResponse(res, 404, "User not found");
//         }

//         return handleResponse(res, 200, "User details fetched successfully", user);

//     } catch (error) {
//         console.error("Error in getUserById:", error);

//         if (error.code === 'P2023') {
//             return handleResponse(res, 400, "Please provide a valid user ID");
//         }

//         return handleResponse(res, 500, "Error in fetching user details");
//     }
// };




exports.getUserById = async (req, res) => {
    try {
        const user_id = req.user.sub; 
        const user = await prisma.user.findUnique({
            where: {
                id: user_id
            },
            include: {
                booking: {
                    include: {
                        restaurant: {
                            select: {
                                restaurant_name: true,
                                location: true,
                                images: true
                            }
                        },
                        tables: true,
                       
                    },
                    
                },
                order_menu_items: {
                    select: {
                        quantity: true,
                        menu_item: {
                            select: {
                                item_name: true,
                                item_price: true
                            }
                        }
                    }
                },
                review: true,
            
            }
        });
        

        if (!user) {
            return handleResponse(res, 404, "User not found");
        }

        return handleResponse(res, 200, "User details fetched successfully", user);

    } catch (error) {
        console.error("Error in getUserById:", error);

        if (error.code === 'P2023') {
            return handleResponse(res, 400, "Please provide a valid user ID");
        }

        return handleResponse(res, 500, "Error in fetching user details");
    }
};


exports.getAllUser = async (req, res) => {
    try {
        const user = await prisma.user.findMany({
            select: {
                id: true,
                user_name: true,
                email: true,
                mobile_no: true
            }
        })

        if (!user) {
            return handleResponse(res, 404, "User details not found...");
        }

        return handleResponse(res, 200, "User details fetched successfullly....", user)

    } catch (err) {
        console.error(err);
        return handleResponse(res, 500, "Error in fetching user details....");
    }

}



exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;


        const user = await prisma.user.findUnique({
            where: {
                id: id
            }
        });

        if (!user) {
            return handleResponse(res, 404, "User not found");
        }

        await prisma.user.delete({
            where: {
                id: id
            }
        });


        return handleResponse(res, 200, "User details deleted successfully", user);

    } catch (error) {

        if (error.code === 'P2023') {
            return handleResponse(res, 400, 'Please provide a valid User ID');
        }

        console.error(error);
        return handleResponse(res, 500, 'Error in deleting User details');
    }
};


