const mysql = require('mysql2');

jest.mock('mysql2', () => {
    const mockPool = {
        query: jest.fn(),
        end: jest.fn(),
        getConnection: jest.fn(),
        promise: () => ({
            query: jest.fn()
        })
    };
    return {
        createPool: () => mockPool
    };
});

const realLog = console.error;
const realExit = process.exit;

describe('database operations', () => {
    beforeEach(() => {
        console.error = jest.fn();
        process.exit = jest.fn();
    });

    afterEach(() => {
        console.error = realLog;
        process.exit = realExit;
    });

    test('handles database connection errors gracefully', () => {
        require('mysql2').createPool().getConnection.mockImplementation(cb => cb(new Error('Connection failed')));

        jest.isolateModules(() => {
            require('../model/db'); // Assuming db.js is in the model directory
        });

        expect(console.error).toHaveBeenCalledWith("Impossible de se connecter à la base de données:", expect.any(Error));
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    test('closes the database connection correctly', () => {
        const db = require('../model/db');
        db.close();
        expect(require('mysql2').createPool().end).toHaveBeenCalled();
    });
});
