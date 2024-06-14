const app = require('../../app');
const request = require('supertest');

// TEST DES URLS DE TEST
describe('Test urls from the test router', () => {
    let agent;

    beforeAll(() => {
        agent = request.agent(app);
    });

    it('should grand access to reset-session', async () => {
        const res = await agent.get('/test/reset-session');
        expect(res.statusCode).toBe(200);
    });

    it('should grant access to mock-recruteur', async () => {
        const res = await agent.get('/test/mock-recruteur');
        expect(res.statusCode).toBe(200);
    });
});

// TESTS DE LOGIN (ET DE DROITS D'ACCES)
describe('ACCESSING WEBPAGES', () => {
    let agent;

    beforeAll(() => {
        agent = request.agent(app);
    });

    it('unregistered users should not be redirected from the login page', async () => {
        const res = await agent.get('/login');
        expect(res.statusCode).toBe(200);
    });

    it('unregistered users should be redirected to the login page', async () => {
        const res = await agent.get('/jobs/add_job');
        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toBe('/login');
    });

    it('registered recruitors should have access to this page', async () => {
        await agent.get('/test/mock-recruteur');
        const res = await agent.get('/jobs/add_job');
        expect(res.statusCode).toBe(200);
    });
});
