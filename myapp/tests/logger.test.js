const path = require('path');
const loggerPath = path.resolve(__dirname, '../logger'); // Remplacer par le chemin correct
const winston = require('winston');

describe('Logger Behavior', () => {
    beforeEach(() => {
        jest.resetModules();  // réinitialise les modules entre les tests
        jest.clearAllMocks();  // Nettoie les mocks entre les tests
    });

    it('should set the log level to debug if debug argument is present', () => {
        process.argv.push('debug'); // Ajouter l'argument 'debug'

        // Recharger le module logger
        const loggerWithDebug = require(loggerPath);

        expect(loggerWithDebug.level).toBe('debug');

        // Supprimer l'argument 'debug' pour ne pas affecter les autres tests
        process.argv.pop();
    });

    it('should set the log level to silent if debug argument is not present', () => {
        // Recharger le module logger sans l'argument 'debug'
        const loggerWithoutDebug = require(loggerPath);

        expect(loggerWithoutDebug.level).toBe('silent');
    });

    it('should log messages at the correct level', () => {
        const logSpy = jest.spyOn(winston.transports.Console.prototype, 'log').mockImplementation(() => {});

        process.argv.push('debug');
        const loggerWithDebug = require(loggerPath);

        loggerWithDebug.debug('Debug message');

        expect(logSpy).toHaveBeenCalled();

        const loggedArgs = logSpy.mock.calls[0][0];
        expect(loggedArgs.level).toBe('debug');
        expect(loggedArgs.message).toBe('Debug message');

        process.argv.pop();
        logSpy.mockRestore();
    });
});