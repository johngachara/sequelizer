var express = require('express');
var router = express.Router();
const Accessory = require('../models/accesories'); // Ensure this path and filename are correct
const { body, validationResult } = require('express-validator');
require('dotenv').config();
const { MeiliSearch } = require('meilisearch');
const client = new MeiliSearch({
    host: process.env.MEILISEARCH_URL,
    apiKey :process.env.API_KEY
});
(async () => {
    try {
        await client.index('Accessories').updateFilterableAttributes(['id']);
    } catch (error) {
        console.error('Error updating filterable attributes:', error);
    }
})();
router.post('/',
    [
        body('product_name').notEmpty().withMessage('Product name is required').isString().withMessage('Product name must be a string'),
        body('quantity').notEmpty().withMessage('Quantity is required').isInt({min:0}).withMessage('Quantity must be an integer'),
        body('price').notEmpty().withMessage('Price is required').isInt().withMessage('Price must be a positive integer'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send({ errors: errors.array() });
        }
        try {
            const { product_name, quantity, price } = req.body;
            const accessoryExists = await Accessory.findOne({ where: { product_name: product_name } });

            if (accessoryExists) {
                return res.status(400).send("Item already exists");
            }

            const data = await Accessory.create({
                product_name,
                quantity,
                price
            });
            const checkData = await client.index('Accessories').search('', {
                filter: `id = ${data.id}`,
            });

            if (checkData.hits.length > 0) {
                return res.status(409).json({ error: 'Document with the same ID already exists' });
            }


            // Add the document to the index
            const response = await client.index('Accessories').addDocuments([
                {
                    id: data.id,
                    product_name: data.product_name,
                    quantity: data.quantity,
                    price: data.price,
                },
            ]);



            res.status(201).send({'Item successfully Created': response});
        } catch (error) {
            return res.status(500).send(error.message); // 500 for server error
        }
    }
);

module.exports = router;