const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelizeConfig = {
    host: process.env.DB_HOST,
    dialect: process.env.DB_USER,
    dialectOptions: {
        ssl: { rejectUnauthorized: false },
        // Disable prepared statement caching
        cache: false
    },
    logging: (...msg) => console.log(msg),
    // Add caching prevention configurations
    define: {
        // Disable model-level caching
        cache: false,
        timestamps: true,
        freezeTableName: true
    },
    // Disable query caching
    cache: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    // Force clean queries
    benchmark: false,
    sync: { force: false },
    // Add query defaults
    query: {
        raw: true,
        nest: true,
        cache: false
    }
};

const sequelize = new Sequelize(
    'accessories',
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    sequelizeConfig
);

// Add global hook to prevent caching for all queries
sequelize.addHook('beforeFind', (options) => {
    options.cache = false;
    options.raw = true;
    // Add timestamp to make each query unique
    options.timestamp = Date.now();
});

// Connection test
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

// Test connection on initialization
testConnection();

module.exports = sequelize;