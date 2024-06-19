var express = require('express');
var router = express.Router();
const Accessory = require('../models/accesories'); // Ensure this path and filename are correct
const saveDB = require('../models/saved');
const completeDB = require('../models/complete');
const receipt = require('../models/receipts');
const { body, validationResult, param } = require('express-validator');

exports.save = router.post('/:id', [
    param('id').notEmpty().withMessage('Product ID is required').isInt().withMessage('Invalid ID format'),
    body('product_name').notEmpty().withMessage('Product name is required').isString().withMessage('Product name must be a string'),
    body('quantity').notEmpty().withMessage('Quantity is required').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('selling_price').notEmpty().withMessage('Price is required').isInt({ min: 1 }).withMessage('Price must be a positive integer'),
    body('customer').notEmpty().withMessage('Customer name is required').isString().withMessage('Customer name must be a string'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { product_name, quantity, selling_price, customer } = req.body;
        const id = parseInt(req.params.id);

        const accessory = await Accessory.findByPk(id);
        if (!accessory) {
            return res.status(404).send('Item not found');
        }

        if (accessory.quantity < quantity) {
            return res.status(400).send('Cannot sell product, insufficient quantity');
        }

        accessory.quantity -= quantity;
        await accessory.save();

        await saveDB.create({
            product_name: accessory.product_name,
            quantity,
            selling_price,
            customer
        });

        res.status(201).send('Item successfully saved');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});
exports.complete = router.get('/:id', [
    param('id').notEmpty().withMessage('Product ID is required').isInt().withMessage('Invalid ID format'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const transaction_id = parseInt(req.params.id);
        const transaction = await saveDB.findByPk(transaction_id);

        if (!transaction) {
            return res.status(404).send('Transaction not found');
        }

        await completeDB.create({
            product_name: transaction.product_name,
            quantity: transaction.quantity,
            selling_price: transaction.selling_price,
            customer: transaction.customer
        });

        await receipt.create({
            product_name: transaction.product_name,
            quantity: transaction.quantity,
            selling_price: transaction.selling_price,
            customer: transaction.customer
        });

        await saveDB.destroy({ where: { id: transaction_id } });

        res.status(200).send('Order successfully completed');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});
