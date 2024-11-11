const express = require('express');
const router = express.Router();
const { body, validationResult, param } = require('express-validator');
const { MeiliSearch } = require('meilisearch');
require('dotenv').config();


const {db,firebase} = require('../../firebase/firebase')
const accessoriesRef = db.collection('accessories');

// Initialize MeiliSearch
const client = new MeiliSearch({
    host: process.env.MEILISEARCH_URL,
    apiKey: process.env.API_KEY
});

// Create new accessory
router.post('/', [
    body('product_name').notEmpty().withMessage('Product name is required')
        .isString().withMessage('Product name must be a string'),
    body('quantity').notEmpty().withMessage('Quantity is required')
        .isInt({min:0}).withMessage('Quantity must be an integer'),
    body('price').notEmpty().withMessage('Price is required')
        .isInt().withMessage('Price must be a positive integer'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send({ errors: errors.array() });
    }

    try {
        const { product_name, quantity, price } = req.body;

        // Check if product already exists
        const snapshot = await accessoriesRef.where('product_name', '==', product_name).get();
        if (!snapshot.empty) {
            return res.status(400).send("Item already exists");
        }

        // Get the next ID (simulating auto-increment)
        const counterDoc = await db.collection('counters').doc('accessories').get();
        let nextId = 1;
        if (counterDoc.exists) {
            nextId = counterDoc.data().current + 1;
        }
        await db.collection('counters').doc('accessories').set({ current: nextId });

        // Create new accessory document
        const docRef = await accessoriesRef.doc(nextId.toString());
        const data = {
            id: nextId,
            product_name,
            quantity,
            price,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await docRef.set(data);

        // Add to MeiliSearch
        const response = await client.index('Accessories_New').addDocuments([{
            id: nextId,
            product_name,
            quantity,
            price
        }]);

        res.status(201).send({'Item successfully Created': response});
    } catch (error) {
        console.error(error);
        return res.status(500).send(error.message);
    }
});
module.exports = router