const express = require('express');
const router = express.Router();
const { validationResult, param } = require('express-validator');
const { db } = require('../../firebase/firebase');

// Collection reference
const accessoriesRef = db.collection('accessories');

// Find one accessory by ID
exports.findOne = router.get('/:id', [
    param('id')
        .notEmpty().withMessage('Id is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send({ errors: errors.array() });
    }

    try {
        const id = req.params.id;
        const doc = await accessoriesRef.doc(id).get();

        if (!doc.exists) {
            return res.status(404).send('Item not found');
        }

        return res.status(200).send({
            id: doc.id,
            ...doc.data()
        });
    } catch (err) {
        return res.status(500).send(err.message);
    }
});

// Find all accessories with pagination
exports.findAll = router.get('/', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
        // Get total count (note: this counts all documents, which might be expensive for large collections)
        const snapshot = await accessoriesRef.count().get();
        const count = snapshot.data().count;

        // Get paginated results
        let query = accessoriesRef
            .orderBy('product_name') // You can change the ordering field
            .limit(parseInt(limit))
            .offset(parseInt(offset));

        const querySnapshot = await query.get();

        if (querySnapshot.empty) {
            return res.status(404).send('No items in database');
        }

        const items = [];
        querySnapshot.forEach(doc => {
            items.push({
                id: doc.id,
                ...doc.data()
            });
        });

        const totalPages = Math.ceil(count / limit);
        const response = {
            totalItems: count,
            totalPages: totalPages,
            currentPage: parseInt(page),
            items: items,
        };

        return res.status(200).send(response);
    } catch (err) {
        return res.status(500).send(err.message);
    }
});