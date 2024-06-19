const {  DataTypes } = require('sequelize');
const sequelize =require('../controllers/connection')
const receipt = sequelize.define('receipt', {
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
receipt.sync()
module.exports = receipt;