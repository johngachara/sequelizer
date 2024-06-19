const { Sequelize } = require('sequelize');
require('dotenv').config();
const sequelize = new Sequelize('accessories', process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: process.env.DB_USER,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    logging: (...msg) => console.log(msg),
});
try {
    sequelize.authenticate();
    console.log('Connection has been established successfully.');
} catch (error) {
    console.error('Unable to connect to the database:', error);
}
module.exports = sequelize;