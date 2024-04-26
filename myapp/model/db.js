const mysql = require('mysql2');
const pool = mysql.createPool({
    host: 'tuxa.sme.utc',
    user: 'sr10p034',
    password: 'qXI7eRiIn78q',
    database: 'sr10p034',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

module.exports = {
    query: (...params) => promisePool.query(...params),
    close: () => pool.end()
};

pool.getConnection((err, connection) => {
    if (err) {
        console.error("Impossible de se connecter à la base de données:", err);
        process.exit(1); // Arrêter l'application
    }
    if (connection) connection.release();
});
