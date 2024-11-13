
// Delete accessory
const express = require('express');
const router = express.Router();
const {db} = require('../../firebase/firebase')
const accessoriesRef = db.collection('accessories');
const {param, validationResult} = require("express-validator");
const {MeiliSearch} = require("meilisearch");
const client = new MeiliSearch({
    host: process.env.MEILISEARCH_URL,
    apiKey: process.env.API_KEY
});

exports.deleteOneAccessory = router.delete('/:id', [
    param('id').notEmpty().withMessage('Id is required')
        .isInt().withMessage('Invalid id format')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send({ errors: errors.array() });
    }

    try {
        const id = req.params.id;
        const docRef = accessoriesRef.doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).send('Item not found');
        }

        await docRef.delete();

        // Delete from MeiliSearch
        const deleteResult = await client.index('Accessories_New').deleteDocument(parseInt(id));

        res.status(200).send({'Item successfully deleted': deleteResult});
    } catch (err) {
        console.error(err);
        return res.status(500).send(err.message);
    }
});

// Delete all accessories
exports.deleteAllAccessories = router.delete('/', async (req, res) => {
    try {
        // Delete all documents in batches
        const snapshot = await accessoriesRef.get();
        const batch = db.batch();

        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        // Reset counter
        await db.collection('counters').doc('accessories').set({ current: 0 });

        // Delete all from MeiliSearch
        const response = await client.index('Accessories_New').deleteAllDocuments();

        res.status(200).send({'Database Cleared': response});
    } catch (err) {
        console.error(err);
        return res.status(500).send(err.message);
    }
});
