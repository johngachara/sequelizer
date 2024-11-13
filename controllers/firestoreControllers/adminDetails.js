const {db} = require("../../firebase/firebase");
const receiptsRef = db.collection('receipts');
const accessoriesRef = db.collection('accessories');
exports.detailedSales = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        const salesQuery = await receiptsRef
            .orderBy('createdAt', 'desc')
            .get();

        const sales = salesQuery.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        }));

        const results = {
            results: sales.slice(startIndex, startIndex + limit)
        };

        if (startIndex + limit < sales.length) {
            results.next = {
                page: page + 1,
                limit
            };
        }

        if (startIndex > 0) {
            results.previous = {
                page: page - 1,
                limit
            };
        }

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.detailedProducts = async (req, res) => {
    try {
        const salesQuery = await receiptsRef.get();

        const productsMap = new Map();
        salesQuery.forEach(doc => {
            const data = doc.data();
            const current = productsMap.get(data.product_name) || 0;
            productsMap.set(data.product_name, current + data.quantity);
        });

        const products = Array.from(productsMap.entries())
            .map(([product_name, total_quantity]) => ({
                product_name,
                total_quantity
            }))
            .sort((a, b) => b.total_quantity - a.total_quantity);

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.detailedCustomers = async (req, res) => {
    try {
        const salesQuery = await receiptsRef.get();

        const customersMap = new Map();
        salesQuery.forEach(doc => {
            const data = doc.data();
            const current = customersMap.get(data.customer) || {
                total_transactions: 0,
                total_spend: 0
            };
            customersMap.set(data.customer, {
                total_transactions: current.total_transactions + 1,
                total_spend: current.total_spend + (data.selling_price * data.quantity)
            });
        });

        const customers = Array.from(customersMap.entries())
            .map(([customer, stats]) => ({
                customer,
                ...stats
            }))
            .sort((a, b) => b.total_spend - a.total_spend);

        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.detailedLowStock = async (req, res) => {
    try {
        const threshold = parseInt(req.query.threshold) || 3;

        const lowStockQuery = await accessoriesRef
            .where('quantity', '<=', threshold)
            .orderBy('quantity', 'asc')
            .get();

        const lowStock = lowStockQuery.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json(lowStock);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};