const {  DataTypes } = require('sequelize');
const sequelize =require('../controllers/connection')
const user = sequelize.define('user', {
    id:{
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    password:{
        type: DataTypes.STRING,
        allowNull: false,
    }
})
user.sync()
module.exports = user