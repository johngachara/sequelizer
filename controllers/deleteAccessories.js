const express = require('express');
const router = express.Router();
const Accessory = require('../models/accesories'); // Ensure this path and filename are correct
const { validationResult, param } = require('express-validator');
const { MeiliSearch } = require('meilisearch');
const client = new MeiliSearch({
    host: process.env.MEILISEARCH_URL,
    apiKey: process.env.API_KEY
});
(async () => {
    try {
        await client.index('Accessories').updateFilterableAttributes(['id']);
    } catch (error) {
        console.error('Error updating filterable attributes:', error);
    }
})();
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
        const searchResult = await client.index('Accessories').search('', {
            filter: `id = ${id}`
        });

        if (searchResult.hits.length === 0) {
            return res.status(404).json({ error: 'Document with the specified ID not found' });
        }

        // Delete the document
        const deleteResult = await client.index('Accessories').deleteDocument(id);
        await Accessory.destroy({where:{
            id: id
            }})
        res.status(200).send({'Item successfully deleted':deleteResult});
    }catch(err){
        return res.status(500).send(err.message)
    }
})

exports.deleteAll = router.delete('/',async (req,res)=>{
    try {
        await Accessory.destroy({truncate:true})
        const response = await client.index('Accessories').deleteAllDocuments()
        res.status(200).send({'Database Cleared':response});
    }catch(err){
        return res.status(500).send(err.message);
    }
})