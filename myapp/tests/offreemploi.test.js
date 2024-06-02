const db = require("../model/db");
const OffreEmploi = require("../model/offreemploi");
const Candidature = require("../model/candidature");

jest.mock('../model/db', () => ({
    query: jest.fn(),
    close: jest.fn()
}));

jest.mock('../model/candidature', () => ({
    deleteByOffre: jest.fn()
}));

describe("Model Tests - OffreEmploi", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await db.close();
    });

    test("create offre emploi successfully", async () => {
        const mockOffre = {
            etat: "Ouvert",
            dateValidite: new Date(),
            listePieces: "CV, Lettre de motivation",
            nombrePieces: 2,
            idFiche: 1,
            idRecruteur: 'recruteur@example.com'
        };

        db.query.mockResolvedValueOnce();
        db.query.mockResolvedValueOnce([[{ IdOffre: 1, ...mockOffre }], {}]);

        const result = await OffreEmploi.create(mockOffre);

        expect(result).toEqual({ IdOffre: 1, ...mockOffre });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("read offre emploi successfully", async () => {
        const id = 1;
        const mockOffre = { IdOffre: id, etat: "Ouvert" };

        db.query.mockResolvedValueOnce([[mockOffre], {}]);

        const result = await OffreEmploi.read(id);

        expect(result).toEqual(mockOffre);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("update offre emploi successfully with all fields", async () => {
        const id = 1;
        const fields = {
            Etat: "Ouvert",
            ListePieces: "CV, Lettre de motivation",
            NombrePieces: 2,
            IdFiche: 1,
            IdRecruteur: 'recruteur@example.com',
            DateValidite: new Date()
        };

        db.query.mockResolvedValueOnce();
        db.query.mockResolvedValueOnce([[{ IdOffre: id, ...fields }], {}]);

        const result = await OffreEmploi.update(id, fields);

        expect(result).toEqual({ IdOffre: id, ...fields });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("update offre emploi successfully with subset of fields", async () => {
        const id = 1;
        const fields = {
            Etat: "Ouvert",
            NombrePieces: 2
        };

        db.query.mockResolvedValueOnce();
        db.query.mockResolvedValueOnce([[{ IdOffre: id, ...fields }], {}]);

        const result = await OffreEmploi.update(id, fields);

        expect(result).toEqual({ IdOffre: id, ...fields });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("update offre emploi fails with no fields", async () => {
        const id = 1;
        const fields = {};

        await expect(OffreEmploi.update(id, fields)).rejects.toThrow('No fields to update');
        expect(db.query).not.toHaveBeenCalled();
    });

    test("update offre emploi successfully with DateValidite", async () => {
        const id = 1;
        const fields = {
            DateValidite: new Date()
        };

        db.query.mockResolvedValueOnce();
        db.query.mockResolvedValueOnce([[{ IdOffre: id, ...fields }], {}]);

        const result = await OffreEmploi.update(id, fields);

        expect(result).toEqual({ IdOffre: id, ...fields });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("delete offre emploi successfully", async () => {
        const id = 1;

        db.query.mockResolvedValueOnce([{}, {}]);

        await OffreEmploi.delete(id);

        expect(Candidature.deleteByOffre).toHaveBeenCalledWith(id);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("read all offres emploi successfully", async () => {
        const mockOffres = [{ IdOffre: 1, Etat: "Ouvert" }];

        db.query.mockResolvedValueOnce([mockOffres, {}]);

        const result = await OffreEmploi.readall();

        expect(result).toEqual(mockOffres);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("get offer name successfully", async () => {
        const idOffre = 1;
        const mockNom = { Intitule: "Software Engineer" };

        db.query.mockResolvedValueOnce([[mockNom], {}]);

        const result = await OffreEmploi.getNom(idOffre);

        expect(result).toBe(mockNom.Intitule);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("return 'OFFRE INCONNUE' if offer name not found", async () => {
        const idOffre = 1;

        db.query.mockResolvedValueOnce([[], {}]);

        const result = await OffreEmploi.getNom(idOffre);

        expect(result).toBe("OFFRE INCONNUE");
        expect(db.query).toHaveBeenCalledWith(expect.any(String), [idOffre]);
    });

    test("list recruiter's offers successfully", async () => {
        const idRecruteur = 'recruteur@example.com';
        const mockOffres = [{ IdOffre: 1, Intitule: "Developer", DateValidite: new Date(), Etat: "Ouvert" }];

        db.query.mockResolvedValueOnce([mockOffres, {}]);

        const result = await OffreEmploi.listRecruitorsOffers(idRecruteur);

        expect(result).toEqual(mockOffres);
        expect(db.query).toHaveBeenCalledWith(expect.any(String), [idRecruteur]);
    });

    test("candidate view offer successfully", async () => {
        const idOffre = 1;
        const mockOffer = {
            IdOffre: idOffre,
            Intitule: "Software Engineer",
            Description: "Job description",
            StatutPoste: "Open",
            ResponsableHierarchique: "John Doe",
            TypeMetier: "Engineering",
            LieuMission: "Paris",
            Rythme: "Full-time",
            Salaire: 60000,
            DateValidite: new Date(),
            ListePieces: "CV, Cover Letter",
            NombrePieces: 2,
            organisationNom: "Tech Corp",
            idOrganisation: "123456789"
        };

        db.query.mockResolvedValueOnce([[mockOffer], {}]);

        const result = await OffreEmploi.candidateViewOffer(idOffre);

        expect(result).toEqual(mockOffer);
        expect(db.query).toHaveBeenCalledWith(expect.any(String), [idOffre]);
    });

    test("publish offre successfully", async () => {
        const idOffre = 1;

        db.query.mockResolvedValueOnce();

        await OffreEmploi.publier(idOffre);

        expect(db.query).toHaveBeenCalledWith(expect.any(String), [idOffre]);
    });

    test("unpublish offre successfully", async () => {
        const idOffre = 1;

        db.query.mockResolvedValueOnce();

        await OffreEmploi.depublier(idOffre);

        expect(db.query).toHaveBeenCalledWith(expect.any(String), [idOffre]);
    });

    test("check if user is legitimate successfully", async () => {
        const idOffre = 1;
        const idRecruteur = 'recruteur@example.com';
        const mockCount = { 'COUNT(*)': 1 };

        db.query.mockResolvedValueOnce([[mockCount], {}]);

        const result = await OffreEmploi.isUserLegitimate(idOffre, idRecruteur);

        expect(result).toBe(true);
        expect(db.query).toHaveBeenCalledWith(expect.any(String), [idOffre, idRecruteur]);
    });

    test("browse offers with sorting by salaire", async () => {
        const search = "Engineer";
        const sort = "";
        const typeMetier = "";
        const minSalaire = 50000;
        const maxSalaire = 100000;
        const limit = 10;
        const offset = 0;
        const excludeOrganisationId = "123456789";
        const userRole = "recruteur";
        const mockOffers = [{
            IdOffre: 1,
            Intitule: "Software Engineer",
            Salaire: 60000
        }];
        const mockTotal = { totalOffres: 1 };

        db.query.mockResolvedValueOnce([mockOffers, {}]);
        db.query.mockResolvedValueOnce([[mockTotal], {}]);

        const result = await OffreEmploi.browseOffers(search, sort, typeMetier, minSalaire, maxSalaire, limit, offset, excludeOrganisationId, userRole);

        expect(result).toEqual({ offres: mockOffers, totalOffres: mockTotal.totalOffres });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("browse offers with sorting by salaire", async () => {
        const search = "Engineer";
        const sort = "salaire";
        const typeMetier = "";
        const minSalaire = 50000;
        const maxSalaire = 100000;
        const limit = 10;
        const offset = 0;
        const excludeOrganisationId = "123456789";
        const userRole = "recruteur";
        const mockOffers = [{
            IdOffre: 1,
            Intitule: "Software Engineer",
            Salaire: 60000
        }];
        const mockTotal = { totalOffres: 1 };

        db.query.mockResolvedValueOnce([mockOffers, {}]);
        db.query.mockResolvedValueOnce([[mockTotal], {}]);

        const result = await OffreEmploi.browseOffers(search, sort, typeMetier, minSalaire, maxSalaire, limit, offset, excludeOrganisationId, userRole);

        expect(result).toEqual({ offres: mockOffers, totalOffres: mockTotal.totalOffres });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("browse offers with sorting by lieu", async () => {
        const search = "Engineer";
        const sort = "lieu";
        const typeMetier = "";
        const minSalaire = 50000;
        const maxSalaire = 100000;
        const limit = 10;
        const offset = 0;
        const excludeOrganisationId = "123456789";
        const userRole = "candidat";
        const mockOffers = [{
            IdOffre: 1,
            Intitule: "Software Engineer",
            Salaire: 60000
        }];
        const mockTotal = { totalOffres: 1 };

        db.query.mockResolvedValueOnce([mockOffers, {}]);
        db.query.mockResolvedValueOnce([[mockTotal], {}]);

        const result = await OffreEmploi.browseOffers(search, sort, typeMetier, minSalaire, maxSalaire, limit, offset, excludeOrganisationId, userRole);

        expect(result).toEqual({ offres: mockOffers, totalOffres: mockTotal.totalOffres });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("browse offers with filter by typeMetier", async () => {
        const search = "Engineer";
        const sort = "date";
        const typeMetier = "Engineering";
        const minSalaire = 50000;
        const maxSalaire = 100000;
        const limit = 10;
        const offset = 0;
        const excludeOrganisationId = "123456789";
        const userRole = "recruteur";
        const mockOffers = [{
            IdOffre: 1,
            Intitule: "Software Engineer",
            Salaire: 60000
        }];
        const mockTotal = { totalOffres: 1 };

        db.query.mockResolvedValueOnce([mockOffers, {}]);
        db.query.mockResolvedValueOnce([[mockTotal], {}]);

        const result = await OffreEmploi.browseOffers(search, sort, typeMetier, minSalaire, maxSalaire, limit, offset, excludeOrganisationId, userRole);

        expect(result).toEqual({ offres: mockOffers, totalOffres: mockTotal.totalOffres });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("browse offers with filter by userRole not 'candidat'", async () => {
        const search = "Engineer";
        const sort = "date";
        const typeMetier = "";
        const minSalaire = 50000;
        const maxSalaire = 100000;
        const limit = 10;
        const offset = 0;
        const excludeOrganisationId = "123456789";
        const userRole = "recruteur";
        const mockOffers = [{
            IdOffre: 1,
            Intitule: "Software Engineer",
            Salaire: 60000
        }];
        const mockTotal = { totalOffres: 1 };

        db.query.mockResolvedValueOnce([mockOffers, {}]);
        db.query.mockResolvedValueOnce([[mockTotal], {}]);

        const result = await OffreEmploi.browseOffers(search, sort, typeMetier, minSalaire, maxSalaire, limit, offset, excludeOrganisationId, userRole);

        expect(result).toEqual({ offres: mockOffers, totalOffres: mockTotal.totalOffres });
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("get types metier successfully", async () => {
        const mockTypesMetier = ["Engineering", "Marketing"];

        db.query.mockResolvedValueOnce([mockTypesMetier.map(type => ({ TypeMetier: type })), {}]);

        const result = await OffreEmploi.getTypesMetier();

        expect(result).toEqual(mockTypesMetier);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("read offre emploi with fiche poste and organisation successfully", async () => {
        const idOffre = 1;
        const mockOffer = {
            IdOffre: idOffre,
            Etat: "Ouvert",
            DateValidite: new Date(),
            ListePieces: "CV, Lettre de motivation",
            NombrePieces: 2,
            Intitule: "Software Engineer",
            Description: "Job description",
            StatutPoste: "Open",
            ResponsableHierarchique: "John Doe",
            TypeMetier: "Engineering",
            LieuMission: "Paris",
            Rythme: "Full-time",
            Salaire: 60000,
            OrganisationNom: "Tech Corp",
            IdOrganisation: "123456789"
        };

        db.query.mockResolvedValueOnce([[mockOffer], {}]);

        const result = await OffreEmploi.readWithFichePosteAndOrganisation(idOffre);

        expect(result).toEqual(mockOffer);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test("count offers by fiche successfully", async () => {
        const idFiche = 1;
        const mockCount = 5;

        db.query.mockResolvedValueOnce([[{ count: mockCount }], {}]);

        const result = await OffreEmploi.countByFiche(idFiche);

        expect(result).toBe(mockCount);
        expect(db.query).toHaveBeenCalledWith(expect.any(String), [idFiche]);
    });

    test("delete offers by fiche successfully", async () => {
        const idFiche = 1;
        const mockOffers = [{ IdOffre: 1 }];

        db.query.mockResolvedValueOnce([mockOffers, {}]);
        db.query.mockResolvedValueOnce([{}, {}]);

        await OffreEmploi.deleteByFiche(idFiche);

        expect(Candidature.deleteByOffre).toHaveBeenCalledTimes(mockOffers.length);
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    test("list offers for organisation successfully", async () => {
        const idOrganisation = "123456789";
        const search = "Engineer";
        const limit = 10;
        const offset = 0;
        const mockOffers = [{
            IdOffre: 1,
            Intitule: "Software Engineer",
            DateValidite: new Date(),
            Etat: "Ouvert"
        }];

        db.query.mockResolvedValueOnce([mockOffers, {}]);

        const result = await OffreEmploi.listOffersForOrganisation(idOrganisation, search, limit, offset);

        expect(result).toEqual(mockOffers);
        expect(db.query).toHaveBeenCalledWith(expect.any(String), [idOrganisation, `%${search}%`, limit, offset]);
    });

    test("count offers for organisation successfully", async () => {
        const idOrganisation = "123456789";
        const search = "Engineer";
        const mockTotalOffers = { totalOffers: 10 };

        db.query.mockResolvedValueOnce([[mockTotalOffers], {}]);

        const result = await OffreEmploi.countOffersForOrganisation(idOrganisation, search);

        expect(result).toBe(mockTotalOffers.totalOffers);
        expect(db.query).toHaveBeenCalledWith(expect.any(String), [idOrganisation, `%${search}%`]);
    });

    test("check if user is in organisation successfully", async () => {
        const idOffre = 1;
        const userEmail = "user@example.com";
        const mockCount = { 'COUNT(*)': 1 };

        db.query.mockResolvedValueOnce([[mockCount], {}]);

        const result = await OffreEmploi.isUserInOrganisation(idOffre, userEmail);

        expect(result).toBe(true);
        expect(db.query).toHaveBeenCalledWith(expect.any(String), [idOffre, userEmail]);
    });

    test("get latest offers successfully without excludeOrganisationId", async () => {
        const idCandidat = 'candidat@example.com';
        const mockOffers = [{
            Intitule: "Software Engineer",
            LieuMission: "Paris",
            Salaire: 60000,
            DateValidite: new Date()
        }];

        db.query.mockResolvedValueOnce([mockOffers, {}]);

        const result = await OffreEmploi.getLatestOffers(idCandidat);

        expect(result).toEqual(mockOffers);
        expect(db.query).toHaveBeenCalledWith(expect.any(String), [idCandidat]);
    });

    test("get latest offers successfully with excludeOrganisationId", async () => {
        const idCandidat = 'candidat@example.com';
        const excludeOrganisationId = '123456789';
        const mockOffers = [{
            Intitule: "Software Engineer",
            LieuMission: "Paris",
            Salaire: 60000,
            DateValidite: new Date()
        }];

        db.query.mockResolvedValueOnce([mockOffers, {}]);

        const result = await OffreEmploi.getLatestOffers(idCandidat, excludeOrganisationId);

        expect(result).toEqual(mockOffers);
        expect(db.query).toHaveBeenCalledWith(expect.any(String), [idCandidat, excludeOrganisationId]);
    });

});
