'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('meal_logs', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey:   true,
        allowNull:    false,
      },
      member_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'members', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'CASCADE',
      },
      meal_type: {
        type:      Sequelize.ENUM('LUNCH', 'DINNER'),
        allowNull: false,
      },
      date: {
        type:      Sequelize.DATEONLY,
        allowNull: false,
      },
      marked_at: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      tokens_after: {
        type:      Sequelize.INTEGER,
        allowNull: false,
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

    await queryInterface.addIndex('meal_logs', ['member_id']);
    await queryInterface.addIndex('meal_logs', ['date']);
    // Unique constraint: one meal type per member per day (DB-level guard)
    await queryInterface.addIndex('meal_logs', ['member_id', 'date', 'meal_type'], {
      unique: true,
      name:   'unique_member_meal_per_day',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('meal_logs');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_meal_logs_meal_type";',
    );
  },
};