const {  DataTypes } = require('sequelize');
const sequelize =require('../controllers/sequelizerControllers/connection')
const saved = sequelize.define('sell', {
    id:{
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    product_name:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    selling_price:{
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    quantity:{
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    customer:{
        type: DataTypes.STRING,
        allowNull: false,
    }
})
saved.sync()
module.exports = saved;