const { handleResponse } = require('../../utils/helper');
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();


exports.createSocialMedia = async (req, res) => {
    try {
        const { whatsapp, facebook, instagram, youtube } = req.body || {};

        const existingSocialMedia = await prisma.social_media.findFirst();

        if (existingSocialMedia) {
            return handleResponse(res, 400, "Social media links already exist. Use update instead.");
        }

        const socialMedia = await prisma.social_media.create({
            data: {
                whatsapp,
                facebook,
                instagram,
                youtube
            }
        });

        return handleResponse(res, 201, "Social media links created successfully!", {
            id: socialMedia.id,
            whatsapp: socialMedia.whatsapp,
            facebook: socialMedia.facebook,
            instagram: socialMedia.instagram,
            youtube: socialMedia.youtube
        });

    } catch (error) {
        console.error("❌ Error:", error);
        return handleResponse(res, 500, "An error occurred while creating social media links.");
    }
};


exports.updateSocialMedia = async (req, res) => {
    try {
        const { id } = req.params;
        const { whatsapp, facebook, instagram, youtube } = req.body || {};

        const socialMedia = await prisma.social_media.findUnique({
            where: {
                id: id,
            },
        });

        if (!socialMedia) {
            return handleResponse(res, 404, "Social media record not found.");
        }

        const updatedSocialMedia = await prisma.social_media.update({
            where: { id: id },
            data: {
                whatsapp: whatsapp || socialMedia.whatsapp,
                facebook: facebook || socialMedia.facebook,
                instagram: instagram || socialMedia.instagram,
                youtube: youtube || socialMedia.youtube,
            },
        });


        return handleResponse(res, 200, "Social media links updated successfully!", {
            whatsapp: updatedSocialMedia.whatsapp,
            facebook: updatedSocialMedia.facebook,
            instagram: updatedSocialMedia.instagram,
            youtube: updatedSocialMedia.youtube
        });

    } catch (error) {
        console.error("❌ Error:", error);
        return handleResponse(res, 500, "An error occurred while updating social media links.");
    }
};


exports.getSocialMedia = async (req, res) => {
    try {
        const socialMedia = await prisma.social_media.findFirst({
            select: {
                id: true,
                whatsapp: true,
                facebook: true,
                instagram: true,
                youtube: true
            }
        });

        if (!socialMedia) {
            return handleResponse(res, 404, "No social media links found.");
        }

        return handleResponse(res, 200, "Social media links retrieved successfully!", socialMedia);
    } catch (error) {
        console.error("❌ Error:", error);
        return handleResponse(res, 500, "An error occurred while fetching social media links.");
    }
};


exports.deleteSocialMedia = async (req, res) => {
    const { id } = req.params;

    try {

        const socialMedia = await prisma.social_media.delete({ where: { id: id } })
        if (!socialMedia) {
            return handleResponse(res, 404, "No social media links found to delete.");
        }

        return handleResponse(res, 200, "Social media links deleted successfully!", socialMedia);
    } catch (error) {
        if (error.code === 'P2025') {
            return handleResponse(res, 404, 'Social media data not found with provided id.');
        }
        console.error(error);
        return handleResponse(res, 500, "An error occurred while deleting social media links.");
    }
};
