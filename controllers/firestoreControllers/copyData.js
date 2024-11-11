const express = require('express');
const router = express.Router();
const Accessories = require('../../models/accesories');
const { MeiliSearch } = require('meilisearch');
const admin = require('firebase-admin');
const db = admin.firestore();
const accessoriesRef = db.collection('accessories');

// Initialize Meilisearch client
const client = new MeiliSearch({
    host: process.env.MEILISEARCH_URL,
    apiKey: process.env.API_KEY
});
// Get Meilisearch index
const index = client.index('Accessories_New');

// Route to sync data
router.post('/', async (req, res) => {
    try {
        // Fetch all data from Sequelize model
        const accessories = await Accessories.findAll({
            raw: true // Get plain objects instead of Sequelize instances
        });

        // Prepare batch writes for Firestore
        const batch = db.batch();

        // Process each accessory
        const meilisearchDocs = [];

        for (const accessory of accessories) {
            // Prepare document for Firestore
            const docRef = accessoriesRef.doc(accessory.id.toString());
            batch.set(docRef, {
                product_name: accessory.product_name,
                quantity: accessory.quantity,
                price: accessory.price,
                updated_at: admin.firestore.FieldValue.serverTimestamp()
            });

            // Prepare document for Meilisearch
            meilisearchDocs.push({
                id: accessory.id.toString(),
                product_name: accessory.product_name,
                quantity: accessory.quantity,
                price: accessory.price
            });
        }

        // Execute Firestore batch write
        await batch.commit();

        // Add documents to Meilisearch
        await index.addDocuments(meilisearchDocs);

        res.status(200).json({
            success: true,
            message: 'Data successfully synced to Firestore and Meilisearch',
            count: accessories.length
        });

    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({
            success: false,
            message: 'Error syncing data',
            error: error.message
        });
    }
});
module.exports = router;