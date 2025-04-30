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

    const { restaurant_name, owner_name, email, password, mobile, opening_time, closing_time, location, type } = req.body || {};

    const existingRestaurant = await prisma.restaurant.findUnique({
        where: {
            email: email
        }
    });


    if (existingRestaurant) {
        return handleResponse(res, 400, "Reastaurant is already registered");
    }

    if (!password) {
        return res.status(400).json({ message: "Password is required" });
    }



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

    const existingUser = await prisma.restaurant.findUnique({
        where: {
            email: email
        }
    });

    if (existingUser) {
        return handleResponse(res, 400, "Super is already registered");
    }
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
        const {
            restaurant_name,
            owner_name,
            email,
            type,
            location,
            wishlist,
            created_from,
            created_to
        } = req.query;

        let filters = {
            role_type: { not: 'super_admin' }
        };

        if (restaurant_name) {
            filters.restaurant_name = { contains: restaurant_name, mode: 'insensitive' };
        }

        if (owner_name) {
            filters.owner_name = { contains: owner_name, mode: 'insensitive' };
        }

        if (email) {
            filters.email = { contains: email, mode: 'insensitive' };
        }

        if (type) {
            filters.type = type;
        }

        if (location) {
            filters.location = { contains: location, mode: 'insensitive' };
        }

        if (wishlist !== undefined) {
            filters.wishlist = wishlist === 'true';
        }

        if (created_from || created_to) {
            filters.createdAt = {};
            if (created_from) {
                filters.createdAt.gte = new Date(created_from);
            }
            if (created_to) {
                filters.createdAt.lte = new Date(created_to);
            }
        }

        const data = await prisma.restaurant.findMany({
            where: filters,
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!data || data.length === 0) {
            return handleResponse(res, 404, "No restaurant found matching the criteria");
        }


        return handleResponse(res, 200, "Restaurant details fetched successfully!", data);
    } catch (error) {
        console.error(error);
        return handleResponse(res, 500, "Error fetching restaurant details", error.message);
    }
};


exports.updateRestaurant = async (req, res) => {
    // Check if user is a super_admin
    if (req.user && req.user.role_type !== 'super_admin') {
        return handleResponse(res, 403, 'Access Denied! Only super admin can update details');
    }

    const { restaurant_name, owner_name, email, password, mobile, opening_time, closing_time, location, type } = req.body || {};
    const { restaurantId } = req.params;

    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId }
        });

        if (!restaurant) {
            return handleResponse(res, 404, 'Restaurant not found!');
        }

        let hashedPassword;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        let imageUrls = restaurant.images || [];

        if (req.convertedFiles && req.convertedFiles.images && req.convertedFiles.images.length > 0) {
            imageUrls = [...req.convertedFiles.images];
        }

        const logoImageUrl = (req.convertedFiles && req.convertedFiles.logo && req.convertedFiles.logo[0]) || restaurant.logo;

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
            logo: logoImageUrl,
            images: imageUrls
        };

        const updatedRestaurant = await prisma.restaurant.update({
            where: { id: restaurantId },
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

        const restaurants = await prisma.restaurant.findUnique({ where: { id: restaurantId } });

        if (!restaurants) {
            return handleResponse(res, 404, "Restaurent not found");
        }

        restaurants.password = undefined;

        handleResponse(res, 200, "Restaurent  details retrieved successfully!", restaurants);
    } catch (error) {
        console.log(error)
        return handleResponse(res, 500, "Error in fetching  details", error.message);
    }
}


exports.addWishlist = async (req, res) => {
    const { restaurantId } = req.params;

    try {

        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
        });

        if (!restaurant) {
            return handleResponse(res, 404, 'Restaurant not found!');
        }


        const updatedRestaurant = await prisma.restaurant.update({
            where: { id: restaurantId },
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


exports.getWishlist = async (req, res) => {
    try {

        const data = await prisma.restaurant.findMany({
            where: {
                wishlist: true,
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


exports.getRestaurantFinanceReport = async (req, res) => {
    const { restaurant_id } = req.user;
    const { month, year, periodType } = req.query;  
    let start, end;

    const monthMap = {
        january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
        july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
    };

    if (year) {
        const y = parseInt(year);
        if (month) {
            let m = isNaN(month) ? monthMap[month.toLowerCase()] : parseInt(month) - 1;

            if (m === undefined || m < 0 || m > 11) {
                return handleResponse(res, 400, "Invalid month provided.");
            }

            start = new Date(Date.UTC(y, m, 1, 0, 0, 0));
            end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
        } else {
          
            start = new Date(Date.UTC(y, 0, 1, 0, 0, 0));
            end = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));
        }
    } else {
     
        const now = new Date();
        const y = now.getFullYear();
        start = new Date(Date.UTC(y, 0, 1, 0, 0, 0));
        end = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));
    }

    const dateFilter = { gte: start, lte: end };

    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurant_id },
            select: { restaurant_name: true }
        });

        if (!restaurant) {
            return handleResponse(res, 404, "Restaurant not found");
        }

        const [orders, stocks, salaries] = await Promise.all([
            prisma.order.findMany({
                where: {
                    restaurant_id,
                    createdAt: dateFilter
                },
                select: {
                    total_amount: true,
                    createdAt: true
                }
            }),
            prisma.stock.findMany({
                where: {
                    restaurant_id,
                    createdAt: dateFilter
                },
                select: {
                    total_price: true,
                    createdAt: true
                }
            }),
            prisma.staff_salary.findMany({
                where: {
                    restaurant_id,
                    payment_status: 'paid',
                    createdAt: dateFilter
                },
                select: {
                    total_pay_amount: true,
                    createdAt: true
                }
            }),
        ]);

        const groupByPeriod = (items, field) => {
            const map = {};
            items.forEach(item => {
                const date = new Date(item.createdAt);
                let key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; 
                map[key] = (map[key] || 0) + Number(item[field] || 0);
            });
            return map;
        };

        const revenueByPeriod = groupByPeriod(orders, 'total_amount');
        const stockByPeriod = groupByPeriod(stocks, 'total_price');
        const salaryByPeriod = groupByPeriod(salaries, 'total_pay_amount');

        let periods = [];
        let yearTotalRevenue = 0;
        let yearTotalStockCost = 0;
        let yearTotalSalaries = 0;
        let yearTotalProfit = 0;

     
        if (periodType === 'quarterly') {
            
            for (let i = 0; i < 4; i++) {
                const startMonth = i * 3; 
                const endMonth = startMonth + 2;  
                const periodKey = `${year}-Q${i + 1}`;
                periods.push(periodKey);
            }
        } else if (periodType === 'halfyearly') {
      
            periods.push(`${year}-H1`);
            periods.push(`${year}-H2`);
        } else if (periodType === 'yearly') {
      
            periods.push(`${year}`);
        } else if (month) {
           
            const monthKey = `${year}-${String(monthMap[month.toLowerCase()] + 1).padStart(2, '0')}`;
            periods = [monthKey];
        } else if (year) {
          
            for (let i = 0; i < 12; i++) {
                const monthKey = `${year}-${String(i + 1).padStart(2, '0')}`;
                periods.push(monthKey);
            }
        }

        const report = periods.map(period => {
            let revenue = 0, stock = 0, salary = 0, profit = 0;
            if (period.includes('Q')) {
             
                const quarter = parseInt(period.split('Q')[1]) - 1;
                const startMonth = quarter * 3;
                const endMonth = startMonth + 2;
                for (let m = startMonth; m <= endMonth; m++) {
                    const monthKey = `${year}-${String(m + 1).padStart(2, '0')}`;
                    revenue += revenueByPeriod[monthKey] || 0;
                    stock += stockByPeriod[monthKey] || 0;
                    salary += salaryByPeriod[monthKey] || 0;
                }
            } else if (period.includes('H')) {
              
                const half = period.split('-')[1]; 
                const halfIndex = parseInt(half.replace('H', ''), 10); 
                const startMonth = halfIndex === 1 ? 0 : 6;
                const endMonth = halfIndex === 1 ? 5 : 11;
                for (let m = startMonth; m <= endMonth; m++) {
                    const monthKey = `${year}-${String(m + 1).padStart(2, '0')}`;
                    revenue += revenueByPeriod[monthKey] || 0;
                    stock += stockByPeriod[monthKey] || 0;
                    salary += salaryByPeriod[monthKey] || 0;
                }
            } else if (period === `${year}`) {
          
                for (let m = 0; m < 12; m++) {
                    const monthKey = `${year}-${String(m + 1).padStart(2, '0')}`;
                    revenue += revenueByPeriod[monthKey] || 0;
                    stock += stockByPeriod[monthKey] || 0;
                    salary += salaryByPeriod[monthKey] || 0;
                }
            } else {
                
                revenue = revenueByPeriod[period] || 0;
                stock = stockByPeriod[period] || 0;
                salary = salaryByPeriod[period] || 0;
            }

            profit = revenue - (stock + salary);

            
            yearTotalRevenue += revenue;
            yearTotalStockCost += stock;
            yearTotalSalaries += salary;
            yearTotalProfit += profit;

            return {
                period,
                revenue: Number(revenue.toFixed(2)),
                stockCost: Number(stock.toFixed(2)),
                salaries: Number(salary.toFixed(2)),
                profit: Number(profit.toFixed(2))
            };
        });

      
        if (year && periodType !== 'yearly' && !month) {
            report.push({
                period: 'Total Year',
                revenue: Number(yearTotalRevenue.toFixed(2)),
                stockCost: Number(yearTotalStockCost.toFixed(2)),
                salaries: Number(yearTotalSalaries.toFixed(2)),
                profit: Number(yearTotalProfit.toFixed(2))
            });
        }

        return handleResponse(res, 200, "Finance report generated successfully!", {
            restaurantName: restaurant.restaurant_name,
            report,
        });

    } catch (error) {
        console.error("Error in finance report:", error);
        return handleResponse(res, 500, "Error generating restaurant finance report", error.message);
    }
};
