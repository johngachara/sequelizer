const {  DataTypes } = require('sequelize');
const sequelize =require('../controllers/sequelizerControllers/connection')
const complete = sequelize.define('complete', {
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
complete.sync()
module.exports = complete;