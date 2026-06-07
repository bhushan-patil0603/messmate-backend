'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const saltRounds  = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
    const passwordHash = await bcrypt.hash('Admin@123', saltRounds);

    await queryInterface.bulkInsert('admins', [
      {
        id:            '00000000-0000-0000-0000-000000000001', // fixed UUID for seed
        name:          'Mess Admin',
        email:         'admin@messmate.com',
        password_hash: passwordHash,
        role:          'ADMIN',
        is_active:     true,
        created_at:    new Date(),
        updated_at:    new Date(),
      },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('admins', {
      email: 'admin@messmate.com',
    }, {});
  },
};