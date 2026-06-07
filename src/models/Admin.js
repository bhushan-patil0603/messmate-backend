const { DataTypes, Model } = require('sequelize');
const sequelize            = require('../config/sequelize');

class Admin extends Model {}

Admin.init(
  {
    id: {
      type:          DataTypes.UUID,
      defaultValue:  DataTypes.UUIDV4,
      primaryKey:    true,
      allowNull:     false,
    },
    name: {
      type:      DataTypes.STRING(100),
      allowNull: false,
      validate:  { notEmpty: true, len: [2, 100] },
    },
    email: {
      type:      DataTypes.STRING(150),
      allowNull: false,
      unique:    true,
      validate:  { isEmail: true },
    },
    password_hash: {
      type:      DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type:         DataTypes.ENUM('ADMIN'),
      allowNull:    false,
      defaultValue: 'ADMIN',
    },
    is_active: {
      type:         DataTypes.BOOLEAN,
      allowNull:    false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName:  'Admin',
    tableName:  'admins',
    timestamps: true,
  },
);

module.exports = Admin;