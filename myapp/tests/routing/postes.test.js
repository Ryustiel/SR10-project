const request = require('supertest');
const app = require('../../app'); // Ensure the path to your app is correct

// Mock the database models
jest.mock('../../model/ficheposte');
jest.mock('../../model/offreemploi');
jest.mock('../../logger');

const FichePoste = require('../../model/ficheposte');
const OffreEmploi = require('../../model/offreemploi');
const logger = require('../../logger');

describe('POST /add_offer BAD REQUESTS', () => {
    let agent;

    beforeAll(async () => {
        agent = request.agent(app);
        await agent.get('/test/mock-recruteur'); // Authenticate as a recruiter
    });

    afterAll(async () => {
        await agent.get('/test/reset-session'); // Clear the session after tests
        agent = null;
    });

    it('should return validation errors with invalid inputs', async () => {
        const res = await agent.post('/jobs/add_offer')
            .send({
                dateValidité: 'invalid-date',
                listePieces: '',
                nombrePieces: 'not-an-integer',
                idFiche: ''
            });

        expect(res.statusCode).toBe(302);
        expect(res.header.location).toBe('/jobs/add_offer');
        expect(FichePoste.isUserLegitimate).not.toHaveBeenCalled();
        expect(OffreEmploi.create).not.toHaveBeenCalled();
    });

    it('should not add an offer if the user is not legitimate', async () => {
        FichePoste.isUserLegitimate.mockResolvedValue(false);

        const res = await agent.post('/jobs/add_offer')
            .send({
                dateValidité: "2030-12-12",
                listePieces: 'Some required documents',
                nombrePieces: 2,
                idFiche: '123'
            });

        expect(res.statusCode).toBe(302);
        expect(res.header.location).toBe('/jobs/add_offer');
        expect(FichePoste.isUserLegitimate).toHaveBeenCalledWith('123', '123456789');
        expect(OffreEmploi.create).not.toHaveBeenCalled();
    });
});

describe('POST /add_offer LEGIT REQUEST', () => {
    let agent;

    beforeAll(async () => {
        agent = request.agent(app);
        await agent.get('/test/mock-recruteur'); // Authenticate as a recruiter
    });

    afterAll(async () => {
        await agent.get('/test/reset-session'); // Clear the session after tests
        agent = null;
    });

    it('should add an offer successfully with valid inputs', async () => {
        FichePoste.isUserLegitimate.mockResolvedValue(true);
        OffreEmploi.create.mockResolvedValue({});

        const res = await agent.post('/jobs/add_offer')
            .send({
                dateValidité: "2030-12-12", // Future date
                listePieces: 'Some required documents',
                nombrePieces: 2,
                idFiche: '123'
            });

        expect(res.statusCode).toBe(302);
        expect(res.header.location).toBe('/jobs/add_offer');
        expect(FichePoste.isUserLegitimate).toHaveBeenCalledWith('123', '123456789');
        expect(OffreEmploi.create).toHaveBeenCalled();
    });
});