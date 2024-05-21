const db = require('../model/db');

const AssociationFichiers = require('../model/associationfichiers');

jest.mock('../model/db', () => ({

    query: jest.fn(),

    close: jest.fn()

}));

describe("Model Tests - AssociationFichiers", () => {

    beforeEach(() => {

        jest.clearAllMocks();

    });



    afterAll(async () => {

        await db.close();

    });



    test("create association fichiers successfully", async () => {

        const mockAssociation = { idCandidat: '123', idOffre: 456, fichier: "resume.pdf" };

        db.query.mockResolvedValueOnce(); // Simulating insert

        db.query.mockResolvedValueOnce([[{ idAssociation: 1, ...mockAssociation }], {}]); // Simulating fetch



        const result = await AssociationFichiers.create(mockAssociation);

        expect(result).toEqual({ idAssociation: 1, ...mockAssociation });

        expect(db.query).toHaveBeenCalledTimes(2);

    });



    test("read association fichiers successfully", async () => {

        const idAssociation = 1;

        const mockAssociation = { idAssociation, idCandidat: '123', idOffre: 456, fichier: "resume.pdf" };



        db.query.mockResolvedValueOnce([[mockAssociation], {}]);



        const result = await AssociationFichiers.read(idAssociation);

        expect(result).toEqual(mockAssociation);

        expect(db.query).toHaveBeenCalledTimes(1);

    });



    test("update association fichiers successfully", async () => {

        const idAssociation = 1;

        const updates = { idCandidat: '124', idOffre: 457, fichier: "cover_letter.pdf" };



        db.query.mockResolvedValueOnce([{}, {}]); // Simulating update

        db.query.mockResolvedValueOnce([[{ idAssociation, ...updates }], {}]); // Simulating fetch after update



        const result = await AssociationFichiers.update(idAssociation, updates);

        expect(result).toEqual({ idAssociation, ...updates });

        expect(db.query).toHaveBeenCalledTimes(2);

    });



    test("delete association fichiers successfully", async () => {

        const idAssociation = 1;

        db.query.mockResolvedValueOnce([{}, {}]); // Simulating delete



        await AssociationFichiers.delete(idAssociation);

        expect(db.query).toHaveBeenCalledTimes(1);

    });



    test("read all association fichiers successfully", async () => {

        const mockAssociations = [{ idAssociation: 1, idCandidat: '123', idOffre: 456, fichier: "resume.pdf" }];



        db.query.mockResolvedValueOnce([mockAssociations, {}]);



        const result = await AssociationFichiers.readall();

        expect(result).toEqual(mockAssociations);

        expect(db.query).toHaveBeenCalledTimes(1);

    });

});