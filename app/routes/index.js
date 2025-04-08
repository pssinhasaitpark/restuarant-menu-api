const reastaurantRoutes = require("./restaurant/reastaurant");
const tableRoutes = require("../routes/restaurant/table");
const bookingRoutes=require("../routes/restaurant/booking");
const menu_managementRoutes=require("../routes/restaurant/menu_management")
const supportRoutes=require("../routes/restaurant/support")


module.exports = (app) => {
    app.use("/api/restaurant", reastaurantRoutes);
    app.use("/api/tables", tableRoutes);
    app.use("/api/booking",bookingRoutes);
    app.use("/api/menu_management",menu_managementRoutes);
    app.use("/api/support",supportRoutes)

};
