const {db,firebase} = require("../../firebase/firebase");
const moment = require("moment");
const receiptsRef = db.collection('receipts');


// Helper functions
const getTimestampFromDate = (date) => firebase.firestore.Timestamp.fromDate(new Date(date));

// adminDashboard.js
exports.adminDashboard = async (req, res) => {
    try {
        const currentDate = moment();
        const startDate = moment().subtract(30, 'days').startOf('day');

        // Total Sales
        const receiptsSnapshot = await receiptsRef.get();
        const totalSales = receiptsSnapshot.docs.reduce((sum, doc) =>
            sum + (doc.data().selling_price * doc.data().quantity), 0);

        // Top Selling Products
        const productsMap = new Map();
        receiptsSnapshot.forEach(doc => {
            const data = doc.data();
            const current = productsMap.get(data.product_name) || 0;
            productsMap.set(data.product_name, current + data.quantity);
        });

        const topProducts = Array.from(productsMap.entries())
            .map(([product_name, total_quantity]) => ({ product_name, total_quantity }))
            .sort((a, b) => b.total_quantity - a.total_quantity)
            .slice(0, 5);

        // Customer Analysis
        const customerMap = new Map();
        receiptsSnapshot.forEach(doc => {
            const data = doc.data();
            const customer = data.customer.toLowerCase();
            const current = customerMap.get(customer) || {
                total_transactions: 0,
                total_spend: 0
            };
            customerMap.set(customer, {
                total_transactions: current.total_transactions + 1,
                total_spend: current.total_spend + (data.selling_price * data.quantity)
            });
        });

        const customerAnalysis = Array.from(customerMap.entries())
            .map(([customer, stats]) => ({
                customer_lower: customer,
                ...stats
            }))
            .sort((a, b) => b.total_spend - a.total_spend)
            .slice(0, 10);

        // Daily Sales Trend
        const dailySalesMap = new Map();
        receiptsSnapshot.forEach(doc => {
            const data = doc.data();
            const date = moment(data.createdAt.toDate()).format('YYYY-MM-DD');
            const current = dailySalesMap.get(date) || 0;
            dailySalesMap.set(date, current + (data.selling_price * data.quantity));
        });

        const dailySales = Array.from(dailySalesMap.entries())
            .map(([date, total_sales]) => ({ date, total_sales }))
            .filter(item =>
                moment(item.date).isBetween(startDate, currentDate, undefined, '[]')
            )
            .sort((a, b) => moment(a.date).diff(moment(b.date)));

        // Average Transaction Value
        const avgTransactionValue = totalSales / receiptsSnapshot.size || 0;

        // Monthly Sales
        const monthlySalesMap = new Map();
        receiptsSnapshot.forEach(doc => {
            const data = doc.data();
            const month = moment(data.createdAt.toDate()).format('YYYY-MM');
            const current = monthlySalesMap.get(month) || 0;
            monthlySalesMap.set(month, current + (data.selling_price * data.quantity));
        });

        const monthlySales = Array.from(monthlySalesMap.entries())
            .map(([month, total_sales]) => ({ month, total_sales }))
            .sort((a, b) => moment(a.month).diff(moment(b.month)))
            .slice(-12);

        const data = {
            total_sales: totalSales,
            top_products: topProducts,
            customer_analysis: customerAnalysis,
            daily_sales_trend: dailySales,
            avg_transaction_value: avgTransactionValue,
            monthly_sales: monthlySales
        };

        res.json(data);
    } catch (error) {
        console.error('Error in admin dashboard:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack
        });
    }
};