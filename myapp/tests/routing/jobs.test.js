const app = require('../../app');
const request = require('supertest');

// TEST DES URLS DE TEST
describe('Test urls from the test router', () => {
    let agent;

    beforeAll(() => {
        agent = request.agent(app);
    });

    afterAll(() => {
        agent = null;
    });

    it('should grant access to mock-recruteur', async () => {
        const res = await agent.get('/test/mock-recruteur');
        expect(res.statusCode).toBe(200);
    });

    it('should grant access to mock-recruteur', async () => {
        const res = await agent.get('/test/mock-candidat');
        expect(res.statusCode).toBe(200);
    });

    it('should grand access to reset-session', async () => {
        const res = await agent.get('/test/reset-session');
        expect(res.statusCode).toBe(200);
    });
});

// TESTS DE LOGIN (ET DE DROITS D'ACCES)
describe('Testing Route access', () => {
    let agent;

    beforeAll(() => {
        agent = request.agent(app);
    });

    afterAll(() => {
        agent = null;
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

    it('candidates should have receive a 500 error code denying illegal access', async () => {
        await agent.get('/test/mock-candidat');
        const res = await agent.get('/jobs/add_job');
        expect(res.statusCode).toBe(403);
    });

    it('registered recruitors should have access to this page', async () => {
        await agent.get('/test/mock-recruteur');
        const res = await agent.get('/jobs/add_job');
        expect(res.statusCode).toBe(200);
    });
});
