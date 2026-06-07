const { DataTypes, Model } = require('sequelize');
const sequelize            = require('../config/sequelize');

class MealLog extends Model {}

MealLog.init(
  {
    id: {
      type:         DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey:   true,
      allowNull:    false,
    },
    member_id: {
      type:      DataTypes.UUID,
      allowNull: false,
      references: { model: 'members', key: 'id' },
      onDelete:  'CASCADE',
    },
    meal_type: {
      type:      DataTypes.ENUM('LUNCH', 'DINNER'),
      allowNull: false,
    },
    date: {
      // Date the meal was consumed (YYYY-MM-DD)
      type:      DataTypes.DATEONLY,
      allowNull: false,
    },
    marked_at: {
      // Exact timestamp when owner clicked the button
      type:         DataTypes.DATE,
      allowNull:    false,
      defaultValue: DataTypes.NOW,
    },
    tokens_after: {
      // Remaining token balance AFTER this deduction
      type:      DataTypes.INTEGER,
      allowNull: false,
      validate:  { min: 0 },
    },
  },
  {
    sequelize,
    modelName:  'MealLog',
    tableName:  'meal_logs',
    timestamps: true,
    indexes: [
      { fields: ['member_id'] },
      { fields: ['date'] },
      { fields: ['member_id', 'date', 'meal_type'], unique: true }, // prevent double-marking at DB level
    ],
  },
);

module.exports = MealLog;