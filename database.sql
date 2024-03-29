-- Table Organisation
CREATE TABLE Organisation (
                              NumeroSiren VARCHAR PRIMARY KEY,
                              Nom VARCHAR,
                              Type VARCHAR,
                              AdresseAdministrative VARCHAR,
                              StatutOrganisation VARCHAR CHECK (StatutOrganisation IN ('approuvée', 'en attente'))
);

-- Table Utilisateur
CREATE TABLE Utilisateur (
                             Email VARCHAR PRIMARY KEY,
                             MotDePasse VARCHAR,
                             Nom VARCHAR,
                             Prenom VARCHAR,
                             Telephone NUMERIC(10),
                             DateCreation TIMESTAMP,
                             StatutCompte VARCHAR CHECK (StatutCompte IN ('actif', 'inactif')),
                             TypeCompte VARCHAR CHECK (TypeCompte IN ('candidat', 'recruteur', 'administrateur', 'recruteur en attente', 'administrateur en attente')),
                             IdOrganisation VARCHAR REFERENCES Organisation(NumeroSiren)
);

-- Table DemandeAjoutOrganisation
CREATE TABLE DemandeAjoutOrganisation (
                                          IdDemandeAjout SERIAL PRIMARY KEY,
                                          IdDemandeur VARCHAR REFERENCES Utilisateur(Email),
                                          IdOrganisation VARCHAR REFERENCES Organisation(NumeroSiren)
);

-- Table FichePoste
CREATE TABLE FichePoste (
                            IdFiche SERIAL PRIMARY KEY,
                            Intitule VARCHAR,
                            StatutPoste VARCHAR,
                            ResponsableHiérarchique VARCHAR,
                            TypeMetier VARCHAR,
                            LieuMission VARCHAR,
                            Rythme VARCHAR,
                            Salaire VARCHAR,
                            Description VARCHAR,
                            IdOrganisation VARCHAR REFERENCES Organisation(NumeroSiren)
);

-- Table OffreEmploi
CREATE TABLE OffreEmploi (
                             IdOffre SERIAL PRIMARY KEY,
                             Etat VARCHAR CHECK (Etat IN ('publié', 'non publié', 'expiré')),
                             DateValidite TIMESTAMP,
                             ListePieces VARCHAR,
                             NombrePieces NUMERIC,
                             IdFiche INTEGER REFERENCES FichePoste(IdFiche),
                             IdRecruteur VARCHAR REFERENCES Utilisateur(Email)
);

-- Table Candidature
CREATE TABLE Candidature (
                             IdCandidature SERIAL PRIMARY KEY,
                             DateCandidature TIMESTAMP,
                             IdCandidat VARCHAR REFERENCES Utilisateur(Email),
                             IdOffre INTEGER REFERENCES OffreEmploi(IdOffre)
);

-- Table AssociationFichiers
CREATE TABLE AssociationFichiers (
                                     IdAssociation SERIAL PRIMARY KEY,
                                     IdCandidature INTEGER REFERENCES Candidature(IdCandidature),
                                     Fichier VARCHAR
);

-- Insertion dans Organisation
INSERT INTO Organisation (NumeroSiren, Nom, Type, AdresseAdministrative, StatutOrganisation) VALUES
                                                                                                 ('123456789', 'Tech Solutions', 'Technologie', '123 Boulevard de l''Innovation, 75000 Paris', 'approuvée'),
                                                                                                 ('987654321', 'Eco Ventures', 'Environnement', '987 Avenue du Progrès, 33000 Bordeaux', 'en attente');

-- Insertion dans Utilisateur
INSERT INTO Utilisateur (Email, MotDePasse, Nom, Prenom, Telephone, DateCreation, StatutCompte, TypeCompte, IdOrganisation) VALUES
                                                                                                                                ('jane.doe@example.com', 'password123', 'Doe', 'Jane', '0123456789', '2023-03-29 08:00:00', 'actif', 'recruteur', '123456789'),
                                                                                                                                ('john.smith@example.com', 'password123', 'Smith', 'John', '0987654321', '2023-03-29 09:00:00', 'actif', 'candidat', NULL);

-- Insertion dans DemandeAjoutOrganisation
INSERT INTO DemandeAjoutOrganisation (IdDemandeur, IdOrganisation) VALUES
    ('jane.doe@example.com', '987654321');

-- Insertion dans FichePoste
INSERT INTO FichePoste (Intitule, StatutPoste, ResponsableHiérarchique, TypeMetier, LieuMission, Rythme, Salaire, Description, IdOrganisation) VALUES
    ('Développeur Full Stack', 'Ouvert', 'M. Dupont', 'Informatique', '123 Boulevard de l''Innovation, 75000 Paris', 'Plein temps', '45000€ annuel', 'Recherche développeur Full Stack expérimenté.', '123456789');

-- Insertion dans OffreEmploi
INSERT INTO OffreEmploi (Etat, DateValidite, ListePieces, NombrePieces, IdFiche, IdRecruteur) VALUES
    ('publié', '2023-09-29 00:00:00', 'CV, Lettre de motivation', 2, 1, 'jane.doe@example.com');

-- Insertion dans Candidature
INSERT INTO Candidature (DateCandidature, IdCandidat, IdOffre) VALUES
    ('2023-04-05 10:00:00', 'john.smith@example.com', 1);

-- Insertion dans AssociationFichiers
INSERT INTO AssociationFichiers (IdCandidature, Fichier) VALUES
                                                             (1, 'http://exemple.com/cv/johnsmith.pdf'),
                                                             (1, 'http://exemple.com/lettre/johnsmith.pdf');
