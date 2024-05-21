const db = require('../model/db');
const Candidature = require('../model/candidature');

jest.mock('../model/db', () => ({

    query: jest.fn(),

    close: jest.fn()

}));


describe("Model Tests - Candidature", () => {

    beforeEach(() => {

        jest.clearAllMocks();

    });



    afterAll(async () => {

        await db.close();

    });



    test("create candidature successfully", async () => {

        const mockCandidature = { idCandidat: '123', idOffre: 456, dateCandidature: new Date() };



        db.query.mockResolvedValueOnce(); // Simulating insert

        db.query.mockResolvedValueOnce([[{ idCandidat: '123', idOffre: 456, ...mockCandidature }], {}]); // Simulating fetch



        const result = await Candidature.create(mockCandidature);

        expect(result).toEqual({ idCandidat: '123', idOffre: 456, ...mockCandidature });

        expect(db.query).toHaveBeenCalledTimes(2);

    });



    test("read candidature successfully", async () => {

        const idCandidat = '123';

        const idOffre = 456;

        const mockCandidature = { idCandidat, idOffre, dateCandidature: new Date() };



        db.query.mockResolvedValueOnce([[mockCandidature], {}]);



        const result = await Candidature.read(idCandidat, idOffre);

        expect(result).toEqual(mockCandidature);

        expect(db.query).toHaveBeenCalledTimes(1);

    });



    test("update candidature successfully", async () => {

        const idCandidat = '123';

        const idOffre = 456;

        const updates = { dateCandidature: new Date() };



        db.query.mockResolvedValueOnce([{}, {}]); // Simulating update

        db.query.mockResolvedValueOnce([[{ idCandidat, idOffre, ...updates }], {}]); // Simulating fetch after update



        const result = await Candidature.update(idCandidat, idOffre, updates);

        expect(result).toEqual({ idCandidat, idOffre, ...updates });

        expect(db.query).toHaveBeenCalledTimes(2);

    });



    test("delete candidature successfully", async () => {

        const idCandidat = '123';

        const idOffre = 456;



        db.query.mockResolvedValueOnce([{}, {}]); // Simulating delete



        await Candidature.delete(idCandidat, idOffre);

        expect(db.query).toHaveBeenCalledTimes(1);

    });



    test("read all candidatures successfully", async () => {

        const mockCandidatures = [{ idCandidat: '123', idOffre: 456, dateCandidature: new Date() }];



        db.query.mockResolvedValueOnce([mockCandidatures, {}]);



        const result = await Candidature.readall();

        expect(result).toEqual(mockCandidatures);

        expect(db.query).toHaveBeenCalledTimes(1);

    });



    test("check if candidate successfully", async () => {

        const idCandidat = '123';

        const idOffre = 456;



        db.query.mockResolvedValueOnce([[{'COUNT(*)': 1}], {}]); // Simulating count



        const result = await Candidature.isCandidate(idCandidat, idOffre);

        expect(result).toBe(true);

        expect(db.query).toHaveBeenCalledTimes(1);

    });



    test("get applications for recruteur successfully", async () => {

        const idRecruteur = '789';

        const mockApplications = [

            {

                IdOffre: 456,

                IdCandidat: '123',

                Intitule: 'Software Engineer',

                DateCandidature: new Date()

            }

        ];



        db.query.mockResolvedValueOnce([mockApplications, {}]);



        const result = await Candidature.getApplicationsRecruteur(idRecruteur);

        expect(result).toEqual(mockApplications);

        expect(db.query).toHaveBeenCalledTimes(1);

    });



    test("get applications for candidate successfully", async () => {

        const idCandidat = '123';

        const mockApplications = [

            {

                IdOffre: 456,

                Intitule: 'Software Engineer',

                DateCandidature: new Date()

            }

        ];



        db.query.mockResolvedValueOnce([mockApplications, {}]);



        const result = await Candidature.getApplicationsCandidat(idCandidat);

        expect(result).toEqual(mockApplications);

        expect(db.query).toHaveBeenCalledTimes(1);

    });

});