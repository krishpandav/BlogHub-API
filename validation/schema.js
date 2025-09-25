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
    password: joi.string().required().min(4),
    fullname: joi.string().required().trim().max(100)
});

exports.userLoginSchema = joi.object({
    username: joi.string().required().trim().max(30).min(3),
    password: joi.string().required().min(4),
});

exports.userInfoUpdateSchema = joi.object({
    fullname: joi.string().required().trim().allow(''),
    email: joi.string().email().required(),
    bio: joi.string().required().allow('').max(500),
    image: joi.string().required().allow('').optional()
});

exports.blogCreateSchema = joi.object({
    title: joi.string().required().max(200).trim(),
    content: joi.string().required(),
    category: joi.string().required(),
    tags: joi.array().items(joi.string()).required(),
    image: joi.string().required().allow(''),
    summary: joi.string().required().allow('', null),
    status: joi.string().valid('draft', 'published', 'blocked').required()
});

exports.getAllBlogsSchema = joi.object({
    page: joi.number().integer().required(),
    limit: joi.number().integer().optional(),
    sortBy: joi.string().optional().allow(null),
    sortOrder: joi.string().optional().allow(null),
    searchtext: joi.string().optional().allow(null),
});

exports.updateBlogSchema = joi.object({
    id: joi.string().required(),
    title: joi.string().required().max(200).trim(),
    content: joi.string().required(),
    category: joi.string().required(),
    tags: joi.array().items(joi.string()).required(),
    summary: joi.string().required().allow('', null),
    image: joi.string().required().allow(''),
    status: joi.string().valid('draft', 'published', 'blocked').required()
});