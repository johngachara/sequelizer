const {db} = require("../../firebase/firebase");
const receiptsRef = db.collection('receipts');
module.exports = async (req, res) => {
    try {
        const receipt = require('../../models/receipts');
        const batch = db.batch();

        // Get all receipts from SQL database
        const receipts = await receipt.findAll();
        console.log(receipts.length)

        // Process receipts in batches of 500 (Firestore batch limit)
        const batchSize = 500;
        const batches = [];

        for (let i = 0; i < receipts.length; i += batchSize) {
            const currentBatch = receipts.slice(i, i + batchSize);
            const batchPromises = currentBatch.map(receipt => {
                const docRef = receiptsRef.doc();
                const data = {
                    product_name: receipt.product_name,
                    selling_price: receipt.selling_price,
                    quantity: receipt.quantity,
                    customer: receipt.customer,
                    createdAt: getTimestampFromDate(receipt.createdAt),
                    updatedAt: getTimestampFromDate(receipt.updatedAt)
                };
                return receiptsRef.doc(docRef.id).set(data);
            });
            batches.push(Promise.all(batchPromises));
        }

        await Promise.all(batches);

        res.json({
            message: `Successfully migrated ${receipts.length} receipts to Firestore`
        });
    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({
            message: 'Error during migration',
            error: error.message
        });
    }
};