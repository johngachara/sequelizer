const express = require('express');
const router = express.Router();
const Accessory = require('../../models/accesories'); // Ensure this path and filename are correct
const { validationResult, param } = require('express-validator');
const redisClient = require('../../redis/redis')
// Define the route to get an accessory by ID
exports.findOne = router.get('/:id', [
    param('id')
        .notEmpty().withMessage('Id is required')
        .isInt().withMessage('Id must be an integer')
], async (req, res) => {
    // Validate request parameters
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send({ errors: errors.array() });
    }

    try {
        // Parse the ID from request parameters
        const id = parseInt(req.params.id, 10);

        // Query the accessory by primary key
        const accessory = await Accessory.findByPk(id);

        // Handle case where accessory is not found
        if (!accessory) {
            return res.status(404).send('Item not found');
        }
        return res.status(200).send(accessory);
    } catch (err) {
        // Handle any server errors
        return res.status(500).send(err.message);
    }
});

exports.findAll = router.get('/', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const cacheKey = `accessories:page=${page}:limit=${limit}`;

    try {
        // Try to get data from Redis
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            return res.status(200).send(JSON.parse(cachedData));
        }

        // If not in cache, query the database
        const { count, rows } = await Accessory.findAndCountAll({
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        if (rows.length === 0) {
            return res.status(404).send('No items in database');
        }

        const totalPages = Math.ceil(count / limit);

        const response = {
            totalItems: count,
            totalPages: totalPages,
            currentPage: parseInt(page),
            items: rows,
        };

        // Cache the result for future requests (e.g., for 5 minutes)
        await redisClient.setEx(cacheKey, 300, JSON.stringify(response));

        return res.status(200).send(response);
    } catch (err) {
        return res.status(500).send(err.message);
    }
});