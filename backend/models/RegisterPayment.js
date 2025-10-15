const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // your Sequelize instance

const RegisterPayment = sequelize.define('RegisterPayment', {
    pid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true, // AUTO_INCREMENT
        allowNull: false,
    },
    paymentMethodId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    amount: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    fname: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    lname: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    responce: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
    },
    payment_mode: {
        type: DataTypes.STRING,
        defaultValue: 'auto',
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
    }
}, {
    tableName: 'register_payments',
    timestamps: true, // using existing created_at & updated_at
    createdAt: 'created_at',        // map Sequelize's createdAt to created_at
    updatedAt: 'updated_at' 
});



module.exports = RegisterPayment;
