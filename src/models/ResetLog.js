const { DataTypes, Model } = require('sequelize');
const sequelize            = require('../config/sequelize');

class ResetLog extends Model {}

ResetLog.init(
  {
    id: {
      type:         DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey:   true,
      allowNull:    false,
    },
    triggered_by: {
      type:      DataTypes.ENUM('MANUAL', 'SCHEDULER'),
      allowNull: false,
    },
    reset_at: {
      type:         DataTypes.DATE,
      allowNull:    false,
      defaultValue: DataTypes.NOW,
    },
    members_affected: {
      // Count of active members whose flags were reset
      type:      DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    notes: {
      type:      DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName:  'ResetLog',
    tableName:  'reset_logs',
    timestamps: true,
  },
);

module.exports = ResetLog;