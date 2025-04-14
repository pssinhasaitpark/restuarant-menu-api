const { handleResponse } = require('../../utils/helper');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


exports.addReviews = async (req, res) => {
    try {
        const { stars, comment } = req.body;
        const { restaurant_id } = req.user;
        const { id } = req.params;

        const parsedStars = parseFloat(stars);

        if (isNaN(parsedStars) || parsedStars < 0 || parsedStars > 5) {
            return handleResponse(res, 400, "Rating must be between 0 and 5");
        }

        const user = await prisma.user.findUnique({
            where: {
                id: restaurant_id,
            }
        });

        if (!user) {
            return handleResponse(res, 404, "User not found");
        }

        const review = await prisma.review.create({
            data: {
                stars: parsedStars,
                comment,
                user_name: user.user_name,
                user_id: restaurant_id,
                restaurant_id: id
            }
        });

        return handleResponse(res, 201, "Review added successfully", review);
    } catch (error) {
        console.log(error);
        return handleResponse(res, 500, "Error in posting review");
    }
};

exports.getReviewsDetails = async (req, res) => {
    try {
        let reviews;
        const { role_type, restaurant_id } = req.user;

        if (role_type === 'super_admin') {
            reviews = await prisma.review.findMany({
                include: {
                    restaurant: {
                        select: {
                            restaurant_name: true
                        }
                    }
                }
            });
        } else if (role_type === 'restaurant_admin') {

            reviews = await prisma.review.findMany({
                where: {
                    restaurant_id: restaurant_id
                }
            });
        }

        if (!reviews || reviews.length === 0) {
            return handleResponse(res, 404, 'No Reviews found.');
        }

        return handleResponse(res, 200, 'Reviews details fetched successfully.', reviews);

    } catch (error) {
        console.log(error);
        return handleResponse(res, 500, 'Error in fetching review details');
    }
}

exports.deleteReviewDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const existReview = await prisma.review.findUnique({
            where: {
                id: id
            }
        });

        if (!existReview) {
            return handleResponse(res, 404, "Review details not found");

        }
        const data = await prisma.review.delete({
            where: {
                id: id
            }
        });

        return handleResponse(res, 200, "Review detail deleted successfully", data)

    } catch (error) {
        if (error.code === 'P2023') {
            return handleResponse(res, 404, "Review not found!");
        }
        console.log(error)
        return handleResponse(res, 500, "Error on deleting review details");
    }

}

exports.updateReviewDetials = async (req, res) => {
    try {
        const { stars, comment } = req.body;
        const { id } = req.params;

        const parsedStars = parseFloat(stars);

        if (isNaN(parsedStars) || parsedStars < 0 || parsedStars > 5) {
            return handleResponse(res, 400, "Rating must be between 0 and 5");
        }

        const existingReview = await prisma.review.findUnique({
            where: {
                id: id,
            }
        });

        if (!existingReview) {
            return handleResponse(res, 404, "Review details not found");
        }

        const review = await prisma.review.update({
            where: { id: id },
            data: {
                stars: parsedStars || existingReview.stars,
                comment: comment || existingReview.comment,
            }
        });

        return handleResponse(res, 201, "Review detials updated successfully", review);
    } catch (error) {
        if (error.code === 'P2023') {
            return handleResponse(res, 404, "Review not found!");
        }
        console.log(error);
        return handleResponse(res, 500, "Error in updating review");
    }
}
