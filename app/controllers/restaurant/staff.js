const { PrismaClient } = require('@prisma/client');
const { handleResponse } = require('../../utils/helper');
const prisma = new PrismaClient();
const { staffSchema } = require('../../vailidators/validaters');


exports.addStaffMember = async (req, res) => {
    try {
        const { error } = staffSchema.validate(req.body);
        if (error) {
            return handleResponse(res, 400, error.details[0].message);
        }

        const { restaurant_id } = req.user;
        const { first_name, last_name, email, gender, mobile_no, address, designation, department, employment_type, joining_date, other_details } = req.body;

       
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurant_id }
        });

        if (!restaurant) {
            return handleResponse(res, 404, "Restaurant not found");
        }


        const existingStaffMember = await prisma.staff.findUnique({
            where: {
                email: email,
                restaurant_id: restaurant_id
            }
        });

        if (existingStaffMember) {
            return handleResponse(res, 404, "Staff is already exist in the restaurant");
        }


        const restaurantPrefix = restaurant.restaurant_name.slice(0, 3).toUpperCase(); 

        
        const lastEmployee = await prisma.staff.findFirst({
            where: { restaurant_id: restaurant_id },
            orderBy: { employee_id: 'desc' },
            select: { employee_id: true }
        });

      
        let newEmployeeNumber = 1;
        if (lastEmployee && lastEmployee.employee_id) {
            const lastNumber = parseInt(lastEmployee.employee_id.slice(3), 10);
            newEmployeeNumber = lastNumber + 1;
        }

     
        const newEmployeeId = `${restaurantPrefix}${newEmployeeNumber.toString().padStart(3, '0')}`;

        const profileImageUrl = (req.convertedFiles && req.convertedFiles.profile_image && req.convertedFiles.profile_image[0]);

        const newStaffMember = await prisma.staff.create({
            data: {
                employee_id: newEmployeeId,
                first_name,
                last_name,
                email,
                gender,
                mobile_no,
                address,
                designation,
                department,
                employment_type,
                joining_date,
                other_details,
                restaurant_id,
                profile_image: profileImageUrl
            }
        });

        return handleResponse(res, 201, "New Staff member registration successful", newStaffMember);

    } catch (error) {
        console.error(error);
        return handleResponse(res, 500, 'Error in register staff member');
    }
}

exports.getAllStaffMembers = async (req, res) => {
    try {
        const { restaurant_id } = req.user;
        const data = await prisma.staff.findMany({
            where: { restaurant_id: restaurant_id }
        })

        if (!data) {
            return handleResponse(res, 404, "Staff membes details are not found");
        }
        return handleResponse(res, 200, "Staff Members details fetched succefully", data)


    } catch (error) {
        console.error(error);
        return handleResponse(res, 500, 'Error in fetching staff member details');

    }
}

exports.getStaffMemberById = async (req, res) => {
    try {
        const { id } = req.params;
        const { restaurant_id } = req.user;
        const data = await prisma.staff.findUnique(
            {
                where: {
                    id: id,
                    restaurant_id: restaurant_id
                }
            }
        );
        if (!data) {
            return handleResponse(res, 404, "Staff members details not found");
        }

        return handleResponse(res, 200, "Staff member details fetched succesfully", data)

    } catch (error) {
        if (error.code === 'P2023') {
            return handleResponse(res, 400, `Please provide a valid id`);
        }
        console.error(error);
        return handleResponse(res, 500, 'Error in fetching staff member details');

    }
}

exports.deleteStaffMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { restaurant_id } = req.user;

        const staffMember = await prisma.staff.findUnique({
            where: {
                id: id,
                restaurant_id: restaurant_id
            }
        });

        if (!staffMember) {
            return handleResponse(res, 404, "Staff member not found");
        }

        await prisma.staff.delete({
            where: {
                id: id,
                restaurant_id: restaurant_id
            }
        });


        return handleResponse(res, 200, "Staff member's details deleted successfully");

    } catch (error) {

        if (error.code === 'P2023') {
            return handleResponse(res, 400, 'Please provide a valid staff member ID');
        }

        console.error(error);
        return handleResponse(res, 500, 'Error in deleting staff member details');
    }
};

exports.updateStaffMember = async (req, res) => {
    try {

        const { restaurant_id } = req.user;
        const { id } = req.params;
        const { first_name, last_name, email, gender, mobile_no, address, designation, department, employment_type, joining_date, other_details } = req.body;

        const existingStaffMember = await prisma.staff.findUnique({
            where: {
                id: id,
                restaurant_id: restaurant_id
            }
        });

        if (!existingStaffMember) {
            return handleResponse(res, 404, "Staff member not found");
        }



        const profileImageUrl = (req.convertedFiles && req.convertedFiles.profile_image && req.convertedFiles.profile_image[0]) || existingStaffMember.profile_image;

        const updateStaffMember = await prisma.staff.update({
            where: {
                id: id,
                restaurant_id: restaurant_id
            },
            data: {
                first_name: first_name || existingStaffMember.first_name,
                last_name: last_name || existingStaffMember.last_name,
                email: email || existingStaffMember.email,
                gender: gender || existingStaffMember.gender,
                mobile_no: mobile_no || existingStaffMember.mobile_no,
                address: address || existingStaffMember.address,
                designation: designation || existingStaffMember.designation,
                department: department || existingStaffMember.department,
                employment_type: employment_type || existingStaffMember.employment_type,
                joining_date: joining_date || existingStaffMember.joining_date,
                other_details: other_details || existingStaffMember.other_details,
                restaurant_id,
                profile_image: profileImageUrl

            }
        });
        return handleResponse(res, 200, "Staff member detials fetched successfully", updateStaffMember);

    } catch (error) {
        if (error.code === 'P2023') {
            return handleResponse(res, 400, 'Please provide a valid staff member ID');
        }

        console.error(error);
        return handleResponse(res, 500, 'Error in uopdating staff member details');

    }

}