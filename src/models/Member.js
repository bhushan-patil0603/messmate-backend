const { DataTypes, Model } = require('sequelize');
const sequelize            = require('../config/sequelize');

class Member extends Model {
  // ── Computed helpers ────────────────────────────────────────────────────────
  isLowToken() {
    return this.remaining_tokens <= 5;
  }

  daysUntilExpiry() {
    const today  = new Date();
    today.setHours(0, 0, 0, 0);
    const end    = new Date(this.end_date);
    end.setHours(0, 0, 0, 0);
    return Math.ceil((end - today) / 86400000);
  }

  isNearExpiry() {
    const days = this.daysUntilExpiry();
    return days >= 0 && days <= 5;
  }

  getWarnings() {
    const warnings = [];
    if (this.isLowToken())  warnings.push({ type: 'LOW_TOKEN',   message: `Only ${this.remaining_tokens} token(s) remaining` });
    if (this.isNearExpiry()) warnings.push({ type: 'NEAR_EXPIRY', message: `Membership expires in ${this.daysUntilExpiry()} day(s)` });
    return warnings;
  }
}

Member.init(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    id: {
      type:         DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey:   true,
      allowNull:    false,
    },
    member_uid: {
      // Human-readable unique ID: MBR-XXXX (assigned on approval)
      type:      DataTypes.STRING(20),
      allowNull: true,
      unique:    true,
    },
    name: {
      type:      DataTypes.STRING(100),
      allowNull: false,
      validate:  { notEmpty: true, len: [2, 100] },
    },

    // ── Subscription ──────────────────────────────────────────────────────────
    days: {
      type:      DataTypes.INTEGER,
      allowNull: false,
      validate:  { min: 1, max: 365 },
    },
    total_tokens: {
      // days × 2; set at registration, never changes
      type:      DataTypes.INTEGER,
      allowNull: false,
      validate:  { min: 2 },
    },
    remaining_tokens: {
      // decremented on each meal mark
      type:      DataTypes.INTEGER,
      allowNull: false,
      validate:  { min: 0 },
    },
    start_date: {
      type:      DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      // start_date + (days - 1)
      type:      DataTypes.DATEONLY,
      allowNull: false,
    },

    // ── Status ────────────────────────────────────────────────────────────────
    status: {
      type:         DataTypes.ENUM('PENDING', 'ACTIVE', 'DECLINED', 'EXPIRED'),
      allowNull:    false,
      defaultValue: 'PENDING',
    },

    // ── Daily meal flags (reset to false every night) ─────────────────────────
    lunch_used_today: {
      type:         DataTypes.BOOLEAN,
      allowNull:    false,
      defaultValue: false,
    },
    dinner_used_today: {
      type:         DataTypes.BOOLEAN,
      allowNull:    false,
      defaultValue: false,
    },

    // ── Login credential (set on approval) ────────────────────────────────────
    password_hash: {
      // Member logs in with member_uid + password
      type:      DataTypes.STRING(255),
      allowNull: true,
    },

    // ── Timestamps ────────────────────────────────────────────────────────────
    approved_at: {
      type:      DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName:  'Member',
    tableName:  'members',
    timestamps: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['member_uid'] },
      { fields: ['end_date'] },
    ],
  },
);

module.exports = Member;