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

// Update accessory
router.put('/:id', [
    param('id').notEmpty().withMessage('Id is required')
        .isInt().withMessage('Id is of invalid type'),
    body('product_name').notEmpty().withMessage('Product name is required')
        .isString().withMessage('Product name must be a string'),
    body('quantity').notEmpty().withMessage('Quantity is required')
        .isInt().withMessage('Quantity must be an integer'),
    body('price').notEmpty().withMessage('Price is required')
        .isInt({ min: 0 }).withMessage('Price must be a positive integer'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send({errors: errors.array()});
    }

    try {
        const id = req.params.id;
        const { product_name, quantity, price } = req.body;

        const docRef = accessoriesRef.doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).send('Item not found');
        }

        await docRef.update({
            product_name,
            quantity,
            price,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update in MeiliSearch
        const updateProduct = await client.index('Accessories_New').updateDocuments([{
            id: parseInt(id),
            product_name,
            quantity,
            price
        }]);

        res.status(200).send({'Item successfully updated': updateProduct});
    } catch (err) {
        console.error(err);
        return res.status(500).send(err.message);
    }
});
module.exports = router