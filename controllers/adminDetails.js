const Receipts = require('../models/receipts');
const Accessories = require('../models/accesories');
const { Op, literal} = require('sequelize');
const {fn, col} = require("./connection");

// Detailed Sales Controller
exports.detailedSales = async (req, res) => {
    try {
        const sales = await Receipts.findAll({
            attributes: ['product_name', 'selling_price', 'quantity', 'customer', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

        // Implement pagination here (similar to Django's StandardResultsSetPagination)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const results = {};
        if (endIndex < sales.length) {
            results.next = {
                page: page + 1,
                limit: limit
            };
        }
        if (startIndex > 0) {
            results.previous = {
                page: page - 1,
                limit: limit
            };
        }
        results.results = sales.slice(startIndex, endIndex);

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Detailed Products Controller
exports.detailedProducts = async (req, res) => {
    try {
        const products = await Receipts.findAll({
            attributes: [
                'product_name',
                [fn('SUM', col('quantity')), 'total_quantity']
            ],
            group: ['product_name'],
            order: [[fn('SUM', col('quantity')), 'DESC']]
        });

        // Implement pagination here (similar to above)

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Detailed Customers Controller
exports.detailedCustomers = async (req, res) => {
    try {
        const customers = await Receipts.findAll({
            attributes: [
                'customer',
                [fn('COUNT', col('id')), 'total_transactions'],
                [fn('SUM', literal('selling_price * quantity')), 'total_spend']
            ],
            group: ['customer'],
            order: [[fn('SUM', literal('selling_price * quantity')), 'DESC']]
        });

        // Implement pagination here (similar to above)

        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Detailed Low Stock Controller
exports.detailedLowStock = async (req, res) => {
    try {
        const threshold = parseInt(req.query.threshold) || 3;
        const lowStock = await Accessories.findAll({
            where: {
                quantity: {
                    [Op.lte]: threshold
                }
            },
            order: [['quantity', 'ASC']]
        });

        // Implement pagination here (similar to above)

        res.json(lowStock);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};