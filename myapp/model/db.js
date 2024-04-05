const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    user: 'webadmin',
    password: 'admin',
    database: 'web',
    port: 5432,
});
module.exports = pool;
