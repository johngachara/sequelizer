const express = require('express');
const router = express.Router();
const Accessory = require('../models/accesories'); // Ensure this path and filename are correct
const { validationResult, param ,body} = require('express-validator');

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
        res.status(200).send('Item successfully updated');

    }catch (err){
        return res.status(500).send(err.message);
    }
})

module.exports = router