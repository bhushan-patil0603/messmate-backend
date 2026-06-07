require('dotenv').config();

const baseConfig = {
  username: process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || null,
  database: process.env.DB_NAME     || 'messmate_db',
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT, 10) || 5432,
  dialect:  'postgres',
  logging:  false,
  pool: {
    max:     5,
    min:     0,
    acquire: 30000,
    idle:    10000,
  },
  define: {
    underscored:   true,   // snake_case column names in DB
    freezeTableName: false,
    timestamps:    true,
    createdAt:    'created_at',
    updatedAt:    'updated_at',
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
};

module.exports = {
  development: { ...baseConfig, logging: console.log },
  test:        { ...baseConfig, database: `${baseConfig.database}_test` },
  production:  {
    ...baseConfig,
    // dialectOptions: {
    //   ssl: { require: true, rejectUnauthorized: false },
    // },
  },
};