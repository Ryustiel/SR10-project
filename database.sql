-- Table Organisation
CREATE TABLE Organisation
(
    NumeroSiren           VARCHAR(255) PRIMARY KEY,
    Nom                   VARCHAR(255),
    Type                  VARCHAR(255),
    AdresseAdministrative VARCHAR(255),
    StatutOrganisation    VARCHAR(255),
    CONSTRAINT chk_statut_organisation CHECK (StatutOrganisation IN ('approuvée', 'en attente'))
);

-- Table Utilisateur
CREATE TABLE Utilisateur
(
    Email          VARCHAR(255) PRIMARY KEY,
    MotDePasse     VARCHAR(255),
    Nom            VARCHAR(255),
    Prenom         VARCHAR(255),
    Telephone      VARCHAR(10),
    DateCreation   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    StatutCompte   VARCHAR(255),
    TypeCompte     VARCHAR(255),
    IdOrganisation VARCHAR(255),
    CONSTRAINT chk_statut_compte CHECK (StatutCompte IN ('actif', 'inactif')),
    CONSTRAINT chk_type_compte CHECK (TypeCompte IN ('candidat', 'recruteur', 'administrateur', 'recruteur en attente',
                                                     'administrateur en attente')),
    FOREIGN KEY (IdOrganisation) REFERENCES Organisation (NumeroSiren) ON UPDATE CASCADE
);

-- Table FichePoste
CREATE TABLE FichePoste
(
    IdFiche                 INT AUTO_INCREMENT PRIMARY KEY,
    Intitule                VARCHAR(255),
    StatutPoste             VARCHAR(255),
    ResponsableHierarchique VARCHAR(255),
    TypeMetier              VARCHAR(255),
    LieuMission             VARCHAR(255),
    Rythme                  VARCHAR(255),
    Salaire                 INT,
    Description             VARCHAR(255),
    IdOrganisation          VARCHAR(255),
    FOREIGN KEY (IdOrganisation) REFERENCES Organisation (NumeroSiren) ON UPDATE CASCADE
);

-- Table OffreEmploi
CREATE TABLE OffreEmploi
(
    IdOffre      INT AUTO_INCREMENT PRIMARY KEY,
    Etat         VARCHAR(255),
    DateValidite TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ListePieces  VARCHAR(255),
    NombrePieces DECIMAL(10, 0),
    IdFiche      INT,
    IdRecruteur  VARCHAR(255),
    CONSTRAINT chk_etat CHECK (Etat IN ('publié', 'non publié', 'expiré')),
    FOREIGN KEY (IdFiche) REFERENCES FichePoste (IdFiche) ON UPDATE CASCADE,
    FOREIGN KEY (IdRecruteur) REFERENCES Utilisateur (Email) ON UPDATE CASCADE
);

-- Table Candidature
CREATE TABLE Candidature
(
    DateCandidature TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    IdCandidat      VARCHAR(255),
    IdOffre         INT,
    PRIMARY KEY (IdCandidat, IdOffre),
    FOREIGN KEY (IdCandidat) REFERENCES Utilisateur (Email) ON UPDATE CASCADE,
    FOREIGN KEY (IdOffre) REFERENCES OffreEmploi (IdOffre) ON UPDATE CASCADE
);

-- Table AssociationFichiers
CREATE TABLE AssociationFichiers
(
    IdCandidat VARCHAR(255),
    IdOffre    INT,
    Fichier    VARCHAR(255),
    NomOriginal VARCHAR(255),
    PRIMARY KEY (IdCandidat, IdOffre, Fichier),
    FOREIGN KEY (IdCandidat, IdOffre) REFERENCES Candidature (IdCandidat, IdOffre) ON UPDATE CASCADE
);

-- Table HistoriqueDemandes
CREATE TABLE HistoriqueDemandes
(
    IdHistorique        INT AUTO_INCREMENT PRIMARY KEY,
    NumeroSiren         VARCHAR(255),
    Action              VARCHAR(255),
    TypeDemande         VARCHAR(255),
    DateAction          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UserId              VARCHAR(255),
    AdministrateurEmail VARCHAR(255),
    FOREIGN KEY (NumeroSiren) REFERENCES Organisation (NumeroSiren) ON UPDATE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Utilisateur (Email) ON UPDATE CASCADE,
    FOREIGN KEY (AdministrateurEmail) REFERENCES Utilisateur (Email) ON UPDATE CASCADE,
    CONSTRAINT chk_action CHECK (Action IN ('approuvée', 'refusée', 'en attente')),
    CONSTRAINT chk_typedemande CHECK (TypeDemande IN (
                                                      'nouveau_recruteur_nouvelle_organisation',
                                                      'nouveau_recruteur_organisation_existante',
                                                      'recruteur_ajout_nouvelle_organisation',
                                                      'recruteur_changement_organisation_existante'))
);

-- Insertion dans Organisation
INSERT INTO Organisation (NumeroSiren, Nom, Type, AdresseAdministrative, StatutOrganisation)
VALUES ('123456789', 'Tech Solutions', 'Technologie', '123 Boulevard de l''Innovation, 75000 Paris', 'approuvée'),
       ('987654321', 'Eco Ventures', 'Environnement', '987 Avenue du Progrès, 33000 Bordeaux', 'en attente');

-- Insertion dans Utilisateur
INSERT INTO Utilisateur (Email, MotDePasse, Nom, Prenom, Telephone, DateCreation, StatutCompte, TypeCompte,
                         IdOrganisation)
VALUES ('jane.doe@example.com', 'password123', 'Doe', 'Jane', '0123456789', '2023-03-29 08:00:00', 'actif', 'recruteur',
        '123456789'),
       ('john.smith@example.com', 'password123', 'Smith', 'John', '0987654321', '2023-03-29 09:00:00', 'actif',
        'candidat', NULL);

-- Insertion dans FichePoste
INSERT INTO FichePoste (Intitule, StatutPoste, ResponsableHierarchique, TypeMetier, LieuMission, Rythme, Salaire,
                        Description, IdOrganisation)
VALUES ('Développeur Full Stack', 'Ouvert', 'M. Dupont', 'Informatique', '123 Boulevard de l''Innovation, 75000 Paris',
        'Plein temps', '45000€ annuel', 'Recherche développeur Full Stack expérimenté.', '123456789');

-- Insertion dans OffreEmploi
INSERT INTO OffreEmploi (Etat, DateValidite, ListePieces, NombrePieces, IdFiche, IdRecruteur)
VALUES ('publié', '2023-09-29 00:00:00', 'CV, Lettre de motivation', 2, 1, 'jane.doe@example.com');

-- Insertion dans Candidature
INSERT INTO Candidature (DateCandidature, IdCandidat, IdOffre)
VALUES ('2023-04-05 10:00:00', 'john.smith@example.com', 1);

-- Insertion dans AssociationFichiers
INSERT INTO AssociationFichiers (IdCandidat, IdOffre, Fichier)
VALUES ('john.smith@example.com', 1, 'http://exemple.com/cv/johnsmith.pdf'),
       ('john.smith@example.com', 1, 'http://exemple.com/lettre/johnsmith.pdf');
