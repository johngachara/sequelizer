const express = require('express');
const router = express.Router();
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
        // Fetch all documents from Firestore
        const snapshot = await accessoriesRef.get();

        // Prepare documents for Meilisearch
        const meilisearchDocs = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            meilisearchDocs.push({
                id: doc.id,
                product_name: data.product_name,
                quantity: data.quantity,
                price: data.price
            });
        });

        // Add documents to Meilisearch
        await index.addDocuments(meilisearchDocs);

        res.status(200).json({
            success: true,
            message: 'Data successfully synced to Meilisearch',
            count: meilisearchDocs.length
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