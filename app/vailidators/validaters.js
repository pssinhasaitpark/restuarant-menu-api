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
  
    // Updated table_number to expect an array of strings
    table_number: Joi.array().items(Joi.string().required()).required()
      .messages({
        "array.base": "Table number must be an array of strings.",
        "string.base": "Each table number must be a string.",
        "any.required": "Table number is required."
      }),
  
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
    capacity: Joi.string().required(),
    status: Joi.string().required()
    
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


exports.staffSchema = Joi.object({
    first_name: Joi.string().max(50).required()
        .messages({
            "string.empty": "First name cannot be empty.",
            "string.max": "First name cannot be longer than 50 characters."
        }),

    last_name: Joi.string().max(50).required()
        .messages({
            "string.empty": "Last name cannot be empty.",
            "string.max": "Last name cannot be longer than 50 characters."
        }),

    email: Joi.string().email().max(100).required()
        .messages({
            "string.email": "Please provide a valid email.",
            "string.empty": "Email cannot be empty.",
            "string.max": "Email cannot be longer than 100 characters."
        }),

    gender: Joi.string().valid('male', 'female', 'other').optional()
        .messages({
            "string.valid": "Gender must be one of the following values: 'male', 'female', 'other'."
        }),

    mobile_no: Joi.string().pattern(/^[0-9]{10,13}$/).required()
        .messages({
            "string.pattern.base": "Mobile number must be between 10 and 13 digits and contain only numbers.",
            "string.empty": "Mobile number cannot be empty."
        }),

    address: Joi.string().max(255).optional().allow('')
        .messages({
            "string.max": "Address cannot be longer than 255 characters.",
            "string.empty": "Address cannot be empty when provided."
        }),

    designation: Joi.string().max(100).required()
        .messages({
            "string.empty": "Designation cannot be empty.",
            "string.max": "Designation cannot be longer than 100 characters."
        }),

    department: Joi.string().max(100).required()
        .messages({
            "string.empty": "Department cannot be empty.",
            "string.max": "Department cannot be longer than 100 characters."
        }),

    employment_type: Joi.string().valid('part-time', 'full-time', 'temporary', 'shift').required()
        .messages({
            "string.valid": "Employment type must be one of the following values: 'part-time', 'full-time', 'temporary', 'shift'.",
            "string.empty": "Employment type cannot be empty."
        }),

    joining_date: Joi.string().required()
        .messages({
            "date.base": "Joining date must be a valid date.",
            "string.empty": "Joining date cannot be empty."
        }),

    other_details: Joi.string().optional().allow('')
        .messages({
            "string.empty": "Other details cannot be empty when provided."
        })
});


exports.stockSchema = Joi.object({
    item_name: Joi.string().required().messages({
      'string.base': 'Item name must be a string.',
      'string.empty': 'Item name cannot be empty.',
      'any.required': 'Item name is required.'
    }),
  
    category_name: Joi.string().required().messages({
      'string.base': 'Category name must be a string.',
      'string.empty': 'Category name cannot be empty.',
      'any.required': 'Category name is required.'
    }),
  
    quantity: Joi.number().integer().min(0).required().messages({
      'number.base': 'Quantity must be a number.',
      'number.integer': 'Quantity must be an integer.',
      'number.min': 'Quantity cannot be less than 0.',
      'any.required': 'Quantity is required.'
    }),
  
    unit: Joi.string().required().messages({
      'string.base': 'Unit must be a string.',
      'string.empty': 'Unit cannot be empty.',
      'any.required': 'Unit is required.'
    }),
  
    supplier_name: Joi.string().required().messages({
      'string.base': 'Supplier name must be a string.',
      'string.empty': 'Supplier name cannot be empty.',
      'any.required': 'Supplier name is required.'
    }),
  
    price_per_unit: Joi.number().positive().required().messages({
      'number.base': 'Price per unit must be a number.',
      'number.positive': 'Price per unit must be a positive number.',
      'any.required': 'Price per unit is required.'
    }),
  
    total_price: Joi.number().positive().optional().messages({
      'number.base': 'Total price must be a number.',
      'number.positive': 'Total price must be a positive number.',
      'any.required': 'Total price is required.'
    }),
  
  });
  
exports.staffSalarySchema = Joi.object({

    base_salary: Joi.number().required()
        .messages({
            "number.base": "Base salary must be a number.",
            "any.required": "Base salary is required."
        }),

    bonus: Joi.number().required()
        .messages({
            "number.base": "Bonus must be a number.",
            "any.required": "Bonus is required."
        }),

    health_insurance: Joi.number().required()
        .messages({
            "number.base": "Health insurance must be a number.",
            "any.required": "Health insurance is required."
        }),

    absence_days: Joi.number().required()
        .messages({
            "number.base": "Absence days must be a number.",
            "any.required": "Absence days are required."
        }),

    payment_date: Joi.date().optional()
        .messages({
            "date.base": "Payment date must be a valid date."
        }),

    month: Joi.string().required()
        .messages({
            "string.empty": "Month is required."
        }),

    year: Joi.number().integer().required()
        .messages({
            "number.base": "Year must be a number.",
            "any.required": "Year is required."
        })
});