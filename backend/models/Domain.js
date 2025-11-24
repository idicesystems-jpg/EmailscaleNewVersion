const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // your Sequelize instance

const Domain = sequelize.define('Domain', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    fname: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lname: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    user_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    domain: {
        type: DataTypes.STRING,
        allowNull: true
    },
    order_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    expiry_date: {
        type: DataTypes.STRING,
        allowNull: true
    },
    is_auto_renewable: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    dns_records: {
        type: DataTypes.STRING,
        allowNull: true
    },
    domainID: {
        type: DataTypes.STRING,
        allowNull: true
    },
    orderID: {
        type: DataTypes.STRING,
        allowNull: true
    },
    transactionID: {
        type: DataTypes.STRING,
        allowNull: true
    },
    chargedAmount: {
        type: DataTypes.STRING,
        allowNull: true
    },
    registered: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    domain_type: {
        type: DataTypes.STRING(20),
        defaultValue: 'manual'
    },
    registered_info: {
        type: DataTypes.TEXT('long'),
        allowNull: true
    },
    request_info: {
        type: DataTypes.TEXT('long'),
        allowNull: true
    },
    purchase_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    domain_emails: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: '0000-00-00 00:00:00'
    }
}, {
    tableName: 'domains',
    timestamps: false,
    createdAt: 'created_at', 
    updatedAt: 'updated_at'
});

module.exports = Domain;
