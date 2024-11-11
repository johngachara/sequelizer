const {param, body, validationResult} = require("express-validator");
const {db,firebase} = require("../../firebase/firebase");
const {MeiliSearch} = require("meilisearch");
const accessoriesRef = db.collection('accessories');
// Initialize MeiliSearch
const client = new MeiliSearch({
    host: process.env.MEILISEARCH_URL,
    apiKey: process.env.API_KEY
});
const express = require('express');
const router = express.Router();
router.post('/:id', [
    param('id').notEmpty().withMessage('Product ID is required')
        .isInt().withMessage('Invalid ID format'),
    body('product_name').notEmpty().withMessage('Product name is required')
        .isString().withMessage('Product name must be a string'),
    body('quantity').notEmpty().withMessage('Quantity is required')
        .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('selling_price').notEmpty().withMessage('Price is required')
        .isInt({ min: 1 }).withMessage('Price must be a positive integer'),
    body('customer').notEmpty().withMessage('Customer name is required')
        .isString().withMessage('Customer name must be a string'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { product_name, quantity, selling_price, customer } = req.body;
        const id = req.params.id;

        const docRef = accessoriesRef.doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).send('Item not found');
        }

        const accessory = doc.data();
        if (accessory.quantity < quantity) {
            return res.status(400).send('Cannot sell product, insufficient quantity');
        }

        // Update accessory quantity
        await docRef.update({
            quantity: accessory.quantity - quantity,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Create completed sale record
        await db.collection('completed_sales').add({
            product_name,
            quantity,
            selling_price,
            customer,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Create receipt
        await db.collection('receipts').add({
            product_name,
            quantity,
            selling_price,
            customer,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update MeiliSearch
        const updateProduct = await client.index('Accessories_New').updateDocuments([{
            id: parseInt(id),
            product_name: accessory.product_name,
            quantity: accessory.quantity - quantity,
            price: accessory.price
        }]);

        res.status(201).send({'Item successfully sold': updateProduct});
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});
module.exports = router