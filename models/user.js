const {  DataTypes } = require('sequelize');
const sequelize =require('../controllers/connection')
const user = sequelize.define('user', {
    id:{
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    firebase_uid: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
})
user.sync()
module.exports = user