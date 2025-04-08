const { supportSchema } = require('../../vailidators/validaters');
const { handleResponse } = require('../../utils/helper');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendSupportConnectingMail } = require('../../utils/emailHandler'); 

exports.createSupport = async (req, res) => {
    try {
        const { name, email, phone_no, subject, issues } = req.body;

        // Create the support request in the database
        const data = await prisma.support.create({
            data: {
                name,
                email,
                phone_no,
                subject,
                issues,
            },
        });

        // Send the thank you email to the user
        await sendSupportConnectingMail(email); // Send email after creating the support record

        // Return the response to the client
        return handleResponse(res, 201, "Data added successfully, and email sent.", data);

    } catch (error) {
        console.error(error);
        return handleResponse(res, 500, "Error in contact and support", { error: error.message });
    }
};

exports.getSupportDetailsById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await prisma.support.findFirst({
            where: { id: id }
        });

        if (!data) {
            return handleResponse(res, 404, "Support details not found");
        }
        return handleResponse(res, 200, "Support details fetched succesfully", data);

    } catch (error) {
        console.log(error);
        return handleResponse(res, 500, "Error in fetch details")

    }
}


exports.getSupportDetails = async (req, res) => {
    try {
        const data = await prisma.support.findMany();
        return handleResponse(res, 200, "Support details fetched succesfully", data);

    } catch (error) {
        console.log(error);
        return handleResponse(res, 500, "Error in fetch details")

    }
}


exports.deleteSupportDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await prisma.support.delete({
            where: { id: id }
        });

        return handleResponse(res, 200, "Support details deleted succesfully", data);

    } catch (err) {
        if (err.code === 'P2025') {
            return handleResponse(res, 404, `Support details not found!`);
        }
        console.log(error);
        return handleResponse(res, 500, "Error in delete details")

    }
}
