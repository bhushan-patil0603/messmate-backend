const sequelize = require('../config/sequelize');
const Admin     = require('./Admin');
const Member    = require('./Member');
const MealLog   = require('./MealLog');
const ResetLog  = require('./ResetLog');

// ── Associations ─────────────────────────────────────────────────────────────

// One Member has many MealLogs
Member.hasMany(MealLog, {
  foreignKey: 'member_id',
  as:         'mealLogs',
  onDelete:   'CASCADE',
});

// Each MealLog belongs to one Member
MealLog.belongsTo(Member, {
  foreignKey: 'member_id',
  as:         'member',
});

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  sequelize,
  Admin,
  Member,
  MealLog,
  ResetLog,
};