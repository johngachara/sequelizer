const {  DataTypes } = require('sequelize');
const sequelize =require('../controllers/connection')
const accesories = sequelize.define('accesories', {
    id:{
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    product_name:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    quantity:{
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    price:{
        type: DataTypes.INTEGER,
        allowNull: false,
    }
})
accesories.sync()
module.exports = accesories;