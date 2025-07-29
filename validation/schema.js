const joi = require('joi');

exports.validate = (data, schema) => {
    const { error, value } = schema.validate(data);
    if (error) {
        return error.details[0].message;
    }
    return false; // No error
}

exports.userRegistrationSchema = joi.object({
    username: joi.string().required().trim().max(30).min(3),
    email: joi.string().email().required().trim(),
    password: joi.string().required().min(6),
    fullName: joi.string().required().trim().max(100)
});

exports.userLoginSchema = joi.object({
    username: joi.string().required().trim().max(30).min(3),
    password: joi.string().required().min(6),
});