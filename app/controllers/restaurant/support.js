const { supportSchema } = require('../../vailidators/validaters');
const { handleResponse } = require('../../utils/helper');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendSupportConnectingMail } = require('../../utils/emailHandler');




exports.createSupport = async (req, res) => {
    try {

        const { issues } = req.body;
        const user_id = req.user.sub;
        const { restaurantId } = req.params;

        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId }
        });

        if (!restaurant) {
            return handleResponse(res, 404, "Restaurent is not exit with provided id");
        }

        const user = await prisma.user.findUnique({
            where: {
                id: user_id
            }
        })
        if (!user) {
            return handleResponse(res, 404, "User not found");
        }

        const data = await prisma.support.create({
            data: {
                issues,
                user_id: user_id,
                restaurant_id: restaurantId,
            },
        });

        await sendSupportConnectingMail(user.email);

        return handleResponse(res, 201, "Data added successfully, and email sent.", data);

    } catch (error) {
        console.error(error);
        return handleResponse(res, 500, "Error in contact and support", { error: error.message });
    }
};


exports.getSupportDetailsById = async (req, res) => {
    try {
        const { id } = req.params;
        const support = await prisma.support.findFirst({
            where: { id },
            include: {
                user: {
                    select: {
                        user_name: true,
                        email: true,
                        mobile_no: true,
                        createdAt: true
                    }
                }
            },
        });

        if (!support) {
            return handleResponse(res, 404, "Support details not found");
        }

        const formattedData = {
            id: support.id,
            issues: support.issues,
            restaurant_id: support.restaurant_id,
            user_id: support.user_id,
            ...support.user
        };

        return handleResponse(res, 200, "Support details fetched successfully", formattedData);

    } catch (error) {
        console.log(error);
        return handleResponse(res, 500, "Error in fetch details");
    }
};


exports.getSupportDetails = async (req, res) => {
    try {

        const { restaurant_id } = req.user;

        const supports = await prisma.support.findMany({
            where:{
                restaurant_id:restaurant_id
            },
            include: {
                user: {
                    select: {
                        user_name: true,
                        email: true,
                        mobile_no: true,
                        createdAt: true
                    }
                }
            },
        });

        if (!supports || supports.length === 0) {
            return handleResponse(res, 404, "Support details is empty");
        }


        const formattedData = supports.map((item) => ({
            id: item.id,
            issues: item.issues,
            restaurant_id: item.restaurant_id,
            user_id: item.user_id,
            ...item.user
        }));

        return handleResponse(res, 200, "Support details fetched successfully", formattedData);

    } catch (error) {
        console.log(error);
        return handleResponse(res, 500, "Error in fetch details");
    }
};


exports.deleteSupportDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await prisma.support.delete({
            where: { id: id }
        });

        return handleResponse(res, 200, "Support details deleted succesfully", data);

    } catch (error) {
        if (error.code === 'P2025') {
            return handleResponse(res, 404, `Support details not found!`);
        }
        console.log(error);
        return handleResponse(res, 500, "Error in delete details")

    }
}

exports.replyOfIssues = async (req, res) => {
    try {
        const { message } = req.body;
        const { role_type } = req.user;
        const { supportId } = req.params;

        if (!supportId || !message) {
            return handleResponse(res, 400, "supportId and message are required");
        }


        const supportExists = await prisma.support.findUnique({
            where: { id: supportId }
        });

        if (!supportExists) {
            return handleResponse(res, 404, "Support ticket not found");
        }


        const newReply = await prisma.support_message.create({
            data: {
                support_id: supportId,
                message,
                sender: role_type
            },
        });

        return handleResponse(res, 201, "Reply sent successfully", newReply);

    } catch (error) {
        console.error(error);
        return handleResponse(res, 500, "Error while replying to issue", { error: error.message });
    }
};


exports.getReplies = async (req, res) => {
    try {
        const { supportId } = req.params;

        const support = await prisma.support.findUnique({
            where: { id: supportId },
            include: {
                user: true,
                messages: true,
            }
        });

        if (!support) {
            return handleResponse(res, 404, "Support ticket not found");
        }

        const response = {
            issue: {
                id: support.id,
                issues: support.issues,
                restaurant_id: support.restaurant_id,
                user_id: support.user_id,
                user_name: support.user ? support.user.user_name : "Unknown User",
                createdAt: support.createdAt.toISOString(),
            },
            messages: support.messages.map(message => ({
                id: message.id,
                message: message.message,
                sender: message.sender === 'restaurant_admin' ? 'restaurant_admin' : 'user',
                sender_name: message.sender === 'restaurant_admin'
                    ? 'Admin'
                    : support.user ? support.user.user_name : "Unknown User",
                timestamp: message.createdAt.toISOString(),
            }))
        };


        return handleResponse(res, 200, "Replies fetched successfully", response);

    } catch (error) {
        console.error(error);
        return handleResponse(res, 500, "Error while fetching replies", { error: error.message });
    }
};

