const express = require('express');
const router = express.Router();
const Accessory = require('../../models/accesories'); // Ensure this path and filename are correct
const { validationResult, param ,body} = require('express-validator');
const {MeiliSearch} = require("meilisearch");
const redisClient = require('../../redis/redis')
const client = new MeiliSearch({
    host: process.env.MEILISEARCH_URL,
    apiKey : process.env.API_KEY
});
(async () => {
    try {
        await client.index('Accessories').updateFilterableAttributes(['id']);
    } catch (error) {
        console.error('Error updating filterable attributes:', error);
    }
})();
router.put('/:id',[
    param('id').notEmpty().withMessage('Id is required')
        .isInt().withMessage('Id is of invalid type'),
    body('product_name').notEmpty().withMessage('Product name is required').isString().withMessage('Product name must be a string'),
    body('quantity').notEmpty().withMessage('Quantity is required').isInt().withMessage('Quantity must be an integer'),
    body('price').notEmpty().withMessage('Price is required').isInt({ min: 0 }).withMessage('Price must be a positive integer'),
],async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send({errors: errors.array()});
    }
    try {
        const id = parseInt(req.params.id);
        const { product_name, quantity, price } = req.body;
        // Query the accessory by primary key
        const accessory = await Accessory.findByPk(id);

        // Handle case where accessory is not found
        if (!accessory) {
            return res.status(404).send('Item not found');
        }
      accessory.product_name = product_name;
       accessory.quantity = quantity;
         accessory.price = price;
        await accessory.save();

        const checkID = await client.index('Accessories').search('', {
            filter: `id = ${id}`
        })
        if (checkID.hits.length === 0) {
            res.status(400).json({error: 'Document with the specified ID not found'});
        }
        const updateProduct = await client.index('Accessories').updateDocuments([{
            id:id,
            product_name:accessory.product_name,
            quantity : accessory.quantity,
            price : accessory.price,

        }])
        // Invalidate the cache for this specific accessory and the list
        await redisClient.del(`accessory:${id}`);
        await redisClient.del('accessories:list');
        res.status(200).send({'Item successfully updated':updateProduct});

    }catch (err){
        return res.status(500).send(err.message);
    }
})

module.exports = router