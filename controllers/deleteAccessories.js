const express = require('express');
const router = express.Router();
const Accessory = require('../models/accesories'); // Ensure this path and filename are correct
const { validationResult, param } = require('express-validator');
exports.deleteAccessory = router.delete('/:id',[
    param('id').notEmpty().withMessage('Id is required')
        .isInt().withMessage('Invalid id format')
],async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send({ errors: errors.array() });
    }
    try{
        const id = parseInt(req.params.id);
        const accessory = await Accessory.findByPk(id);

        // Handle case where accessory is not found
        if (!accessory) {
            return res.status(404).send('Item not found');
        }
        await Accessory.destroy({where:{
            id: id
            }})
        res.status(200).send('Item successfully deleted');
    }catch(err){
        return res.status(500).send(err.message)
    }
})

exports.deleteAll = router.delete('/',async (req,res)=>{
    try {
        await Accessory.destroy({truncate:true})
        res.status(200).send('Database Cleared');
    }catch(err){
        return res.status(500).send(err.message);
    }
})