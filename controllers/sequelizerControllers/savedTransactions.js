const express = require('express');
const router = express.Router();
const savedTransactions = require('../../models/saved');
router.get('/', async (req,res)=>{
    try{
        const data = await savedTransactions.findAll();
        if(!data.length > 0){
            return res.status(404).send('No items in database');
        }
        return res.status(200).send(data);

    }catch(err){
        return res.status(500).send(err.message);
    }
})
module.exports = router;