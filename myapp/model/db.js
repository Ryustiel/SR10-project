const mysql = require('mysql2');
const pool = mysql.createPool({
    host: 'mysql-1f21b90f-jackjack26350-856e.k.aivencloud.com',
    user: 'avnadmin',
    password: 'AVNS_jKnlU0b_gi5SzBXW1Cn',
    database: 'defaultdb',
    port: 23346,
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
