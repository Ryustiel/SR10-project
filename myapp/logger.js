const {createLogger, format, transports} = require('winston');

// Vérifier si 'debug' est présent dans les arguments de ligne de commande
const isDebugEnabled = process.argv.includes('debug');

const logger = createLogger({
    // Si 'debug' est passé, définir le niveau sur 'debug', sinon 'silent' pour ne rien logger
    level: isDebugEnabled ? 'debug' : 'silent',
    format: format.combine(
        format.timestamp(),
        format.printf(info => `${info.timestamp} [${info.level}]: ${info.message}`)
    ),
    transports: [
        new transports.Console()
    ]
});

module.exports = logger;
