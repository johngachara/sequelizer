const Receipt = require('../../models/receipts');
const { Op, fn, col, literal } = require('sequelize');
const moment = require('moment');

exports.adminDashboard = async (req, res) => {
    try {
        const currentDate = moment();
        const startDate = moment().subtract(30, 'days').startOf('day');

        // Total Sales
        const totalSales = await Receipt.sum('selling_price');

        // Top Selling Products
        const topProducts = await Receipt.findAll({
            attributes: [
                'product_name',
                [fn('SUM', col('quantity')), 'total_quantity']
            ],
            group: ['product_name'],
            order: [[fn('SUM', col('quantity')), 'DESC']],
            limit: 5
        });


        // Customer Analysis (case-insensitive)
        const customerAnalysis = await Receipt.findAll({
            attributes: [
                [fn('LOWER', col('customer')), 'customer_lower'],
                [fn('COUNT', col('id')), 'total_transactions'],
                [fn('SUM', col('selling_price')), 'total_spend']
            ],
            group: [fn('LOWER', col('customer'))],
            order: [[fn('SUM', col('selling_price')), 'DESC']],
            limit: 10
        });

        // Daily Sales Trend
        const dailySales = await Receipt.findAll({
            attributes: [
                [fn('DATE', col('createdAt')), 'date'],
                [fn('SUM', col('selling_price')), 'total_sales']
            ],
            where: {
                createdAt: {
                    [Op.between]: [startDate.toDate(), currentDate.toDate()]
                }
            },
            group: [fn('DATE', col('createdAt'))],
            order: [[fn('DATE', col('createdAt')), 'ASC']]
        });

        // Average Transaction Value
        const avgTransactionValue = await Receipt.findOne({
            attributes: [
                [fn('AVG', col('selling_price')), 'avg_value']
            ]
        });

        // Monthly Sales
        const monthlySales = await Receipt.findAll({
            attributes: [
                [fn('DATE_TRUNC', 'month', col('createdAt')), 'month'],
                [fn('SUM', col('selling_price')), 'total_sales']
            ],
            group: [fn('DATE_TRUNC', 'month', col('createdAt'))],
            order: [[fn('DATE_TRUNC', 'month', col('createdAt')), 'ASC']],
            limit: 12 // Last 12 months
        });

        const data = {
            total_sales: totalSales || 0,
            top_products: topProducts,
            customer_analysis: customerAnalysis,
            daily_sales_trend: dailySales,
            avg_transaction_value: avgTransactionValue ? avgTransactionValue.get('avg_value') : 0,
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