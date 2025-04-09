const Joi = require("joi");



exports.restaurantAddSchema = Joi.object({
    restaurant_name: Joi.string().max(100).required()
        .messages({
            "string.empty": "Restaurant name cannot be empty.",
            "string.max": "Restaurant name cannot be longer than 100 characters."
        }),

    owner_name: Joi.string().max(50).optional()
        .messages({
            "string.max": "Owner name cannot be longer than 50 characters."
        }),

    email: Joi.string().email({ tlds: { allow: ["com", "net", "org"] } }).required()
        .messages({
            "string.email": "Please provide a valid email.",
            "string.empty": "Email cannot be empty."
        }),

    password: Joi.string().min(8).required()
        .messages({
            "string.min": "Password must be at least 8 characters long.",
            "string.empty": "Password cannot be empty."
        }),

    mobile: Joi.string().pattern(/^[0-9]{10,13}$/).required()
        .messages({
            "string.pattern.base": "Mobile number must be between 10 and 13 digits and contain only numbers."
        }),

    opening_time: Joi.string().required()
        .messages({
            "string.empty": "Opening time cannot be empty."
        }),
    closing_time: Joi.string().required()
        .messages({
            "string.empty": "Closing time cannot be empty."
        }),
    type: Joi.string().optional(),
    location: Joi.string().required()
        .messages({
            "string.empty": "location cannot be empty."
        })

});

exports.bookingSchema = Joi.object({
    customer_name: Joi.string().max(100).required()
        .messages({
            "string.empty": "Customer name cannot be empty.",
            "string.max": "Customer name cannot be longer than 100 characters."
        }),

    contact_no: Joi.string().pattern(/^[0-9]{10,13}$/).required()
        .messages({
            "string.pattern.base": "Contact number must be between 10 and 13 digits and contain only numbers.",
            "string.empty": "Contact number cannot be empty."
        }),

    table_number: Joi.string().required(),

    num_of_people: Joi.number().integer().positive().min(1).required()
        .messages({
            "number.base": "Number of people must be a valid number.",
            "number.integer": "Number of people must be an integer.",
            "number.positive": "Number of people must be a positive number.",
            "number.min": "Number of people must be at least 1.",
            "any.required": "Number of people is required."
        }),

    booking_time: Joi.string().required(),
    date: Joi.string().required(),
    instruction: Joi.string().optional(),

    // Adding menu_items as an optional array of strings (menu item IDs)
    menu_items: Joi.array().items(Joi.string().required()).optional()
        .messages({
            "array.base": "Menu items must be an array of valid item IDs.",
            "string.base": "Each menu item must be a string."
        }),
});


exports.categorySchema = Joi.object({
    name: Joi.string().required()
        .messages({
            "string.empty": "Category name cannot be empty."
        }),

    description: Joi.string().optional()
});


exports.menuItemSchema = Joi.array().items(
    Joi.object({
        item_name: Joi.string().required()
            .messages({
                "string.empty": "Item name cannot be empty."
            }),

        item_description: Joi.string().optional(),
        item_price: Joi.string().optional(),
        category_name: Joi.string().optional(),
        sub_category_name: Joi.string().optional()
    })
);

exports.tableSchema = Joi.object({
    table_number: Joi.string().required(),
    capacity: Joi.string().required()
});

exports.forgatePasswordSchema = Joi.object({
    email: Joi.string().required()
})

exports.resetSchema = Joi.object({
    newPassword: Joi.string().required(),
    confirmPassword: Joi.string().required()
})

exports.loginSchema = Joi.object({
    email: Joi.string().email().max(50).required(),
    password: Joi.string().min(8).required(),
});
