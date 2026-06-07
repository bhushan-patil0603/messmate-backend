'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('members', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey:   true,
        allowNull:    false,
      },
      member_uid: {
        type:      Sequelize.STRING(20),
        allowNull: true,
        unique:    true,
      },
      name: {
        type:      Sequelize.STRING(100),
        allowNull: false,
      },
      days: {
        type:      Sequelize.INTEGER,
        allowNull: false,
      },
      total_tokens: {
        type:      Sequelize.INTEGER,
        allowNull: false,
      },
      remaining_tokens: {
        type:      Sequelize.INTEGER,
        allowNull: false,
      },
      start_date: {
        type:      Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type:      Sequelize.DATEONLY,
        allowNull: false,
      },
      status: {
        type:         Sequelize.ENUM('PENDING', 'ACTIVE', 'DECLINED', 'EXPIRED'),
        allowNull:    false,
        defaultValue: 'PENDING',
      },
      lunch_used_today: {
        type:         Sequelize.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
      },
      dinner_used_today: {
        type:         Sequelize.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
      },
      password_hash: {
        type:      Sequelize.STRING(255),
        allowNull: true,
      },
      approved_at: {
        type:      Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // Indexes for fast queries
    await queryInterface.addIndex('members', ['status']);
    await queryInterface.addIndex('members', ['member_uid']);
    await queryInterface.addIndex('members', ['end_date']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('members');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_members_status";',
    );
  },
};