const model = require("../model/utilisateur.js");
const bcrypt = require("bcryptjs");
const Utilisateur = require("../model/utilisateur");
const db = require("../model/db");

describe("Test d'inscription et de connexion", () => {

    const testUser = {
        firstname: "Test",
        lastname: "Test",
        email: "test@example.com",
        phone: "0734567890",
        password: "test"
    };

    afterAll(async () => {
        await db.close(); // Assurez-vous que la fermeture est complète avant de terminer les tests
    });

    test("Créer un compte", async () => {

        // Creating an account
        const {firstname, lastname, email, phone, password} = testUser;
        const hashedPassword = await bcrypt.hash(password, 10);

        await model.create({
            email,
            motDePasse: hashedPassword,
            nom: lastname,
            prenom: firstname,
            telephone: phone,
            dateCreation: new Date(),
            statutCompte: 'actif',
            typeCompte: 'candidat',
            idOrganisation: null
        });

        // Checking if account is created successfully
        const createdUser = await model.read(email);
        expect(createdUser).toBeTruthy();
    });

    test("Connexion", async () => {
        // Trying to log in
        const utilisateur = await Utilisateur.read(testUser.email);
        expect(utilisateur).toBeTruthy();

        const password = await bcrypt.compare(testUser.password, utilisateur.MotDePasse)
        expect(password).toBeTruthy();
    });

    test("Supprimer le compte", async () => {
        // Essayer de supprimer le compte
        await model.delete(testUser.email);

        const deletedUser = await model.read(testUser.email);
        expect(deletedUser).toBeFalsy();
    });

});