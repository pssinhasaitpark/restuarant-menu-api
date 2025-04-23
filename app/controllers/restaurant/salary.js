const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { handleResponse } = require('../../utils/helper');
const { staffSalarySchema } = require('../../vailidators/validaters');


exports.createStaffSalary = async (req, res) => {
    const { staffId } = req.params;
    const restaurant_id = req.user?.restaurant_id;

    const { error } = staffSalarySchema.validate(req.body);
    if (error) {
        return handleResponse(res, 400, error.details[0].message);
    }
    
    const {
        base_salary,
        bonus,
        health_insurance,
        absence_days,
        month,
        year,
        payment_date
    } = req.body;

    if (!restaurant_id) {
        return handleResponse(res, 400, "Provide a restaurant id");
    }

    if (!base_salary || !bonus || !month || !year || absence_days == null || health_insurance == null) {
        return handleResponse(res, 400, "All required salary fields must be provided");
    }

    const monthMap = {
        January: 1,
        February: 2,
        March: 3,
        April: 4,
        May: 5,
        June: 6,
        July: 7,
        August: 8,
        September: 9,
        October: 10,
        November: 11,
        December: 12
    };

    const monthNumber = monthMap[month];
    if (!monthNumber) {
        return handleResponse(res, 400, "Invalid month provided");
    }

    try {
        const daysInMonth = new Date(year, monthNumber, 0).getDate();

        const per_day_rate = parseFloat((base_salary / daysInMonth).toFixed(2));
        const gross_salary = parseFloat((base_salary + bonus).toFixed(2));
        const total_deduction = parseFloat(((absence_days * per_day_rate) + health_insurance).toFixed(2));
        const total_pay_amount = parseFloat((gross_salary - total_deduction).toFixed(2));

        const staff = await prisma.staff.findUnique({
            where: { id: staffId }
        });

        if (!staff) {
            return handleResponse(res, 404, "Staff not found");
        }

        const newSalary = await prisma.staff_salary.create({
            data: {
                employee_id: staff.employee_id,
                base_salary,
                bonus,
                per_day_rate,
                gross_salary,
                health_insurance,
                absence_days,
                total_deduction,
                total_pay_amount,
                payment_status: "paid",
                payment_date: payment_date ? new Date(payment_date) : null,
                month,
                year,
                staff: {
                    connect: { id: staffId }
                },
                restaurant: {
                    connect: { id: restaurant_id }
                }
            }
        });
        

        return handleResponse(res, 201, "Salary record created", newSalary);
    } catch (error) {
        console.error("Salary Creation Error:", error);
        return handleResponse(res, 500, "Internal Server Error");
    }
};


exports.getStaffSalaryById = async (req, res) => {
    const { staffId } = req.params;

    try {
        const staff = await prisma.staff.findUnique({
            where: { id: staffId },
            include: {
                staff_salary: true,
                restaurant: {
                    select: {
                        id: true,
                        restaurant_name: true,
                        email: true,
                        mobile: true,
                        location: true,
                        logo: true
                    }
                }
            },
        });

        if (!staff) {
            return handleResponse(res, 404, "Staff not found");
        }

        return handleResponse(res, 200, "Staff salary details retrieved successfully", {
            staff: {
                id: staff.id,
                first_name: staff.first_name,
                last_name: staff.last_name,
                email: staff.email,
                designation: staff.designation,
                department: staff.department,
            },
            restaurant_details: staff.restaurant
                ? {
                    id: staff.restaurant.id,
                    restaurant_name: staff.restaurant.restaurant_name,
                    owner_name: staff.restaurant.owner_name,
                    email: staff.restaurant.email,
                    mobile: staff.restaurant.mobile,
                    location: staff.restaurant.location,
                    opening_time: staff.restaurant.opening_time,
                    closing_time: staff.restaurant.closing_time,
                    logo: staff.restaurant.logo,
                    type: staff.restaurant.type,
                }
                : null,
            salary_details: staff.staff_salary,
        });
    } catch (error) {
        console.error("Error fetching staff salary details:", error);
        return handleResponse(res, 500, "Internal Server Error");
    }
};

