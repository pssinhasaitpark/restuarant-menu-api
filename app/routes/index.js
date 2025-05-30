const reastaurantRoutes = require("./restaurant/reastaurant");
const tableRoutes = require("../routes/restaurant/table");
const bookingRoutes = require("../routes/restaurant/booking");
const menu_managementRoutes = require("../routes/restaurant/menu_management");
const supportRoutes = require("../routes/restaurant/support");
const staffRoutes = require("../routes/restaurant/staff");
const userRoutes = require("../routes/user/user");
const reviewRoutes = require("../routes/user/reviews");
const orderRoutes = require("../routes/restaurant/order");
const stockRoutes = require("../routes/restaurant/stock");
const salaryRoutes = require("../routes/restaurant/salary");
const socialMediaRoutes = require("../routes/restaurant/social_media")
const restaurantDetailsRoutes=require("../routes/restaurant/restaurant_details")

module.exports = (app) => {
    app.use("/api/restaurant", reastaurantRoutes);
    app.use("/api/tables", tableRoutes);
    app.use("/api/booking", bookingRoutes);
    app.use("/api/menuManagement", menu_managementRoutes);
    app.use("/api/support", supportRoutes);
    app.use("/api/staff", staffRoutes);
    app.use("/api/user", userRoutes);
    app.use("/api/review", reviewRoutes);
    app.use("/api/order", orderRoutes);
    app.use("/api/stock", stockRoutes);
    app.use("/api/salary", salaryRoutes);
    app.use("/api/socialMedia", socialMediaRoutes);
    app.use("/api/restaurantDetails", restaurantDetailsRoutes);

};
