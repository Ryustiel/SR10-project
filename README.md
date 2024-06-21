# Site Internet de Recrutement

## Etudiants :
- Raphael Nguyen
- Raphael Chauvier

## Sommaire
1. [Structure du GIT](#structure-du-git)
   1. [Structure du Répertoire Principal](#structure-du-répertoire-principal)
   2. [Fichiers Directement dans le Répertoire Principal](#fichiers-directement-dans-le-répertoire-principal)
   3. [Répertoire "Projet"](#répertoire-projet)
   4. [Contenu du Répertoire "Projet"](#contenu-du-répertoire-projet)
   5. [Répertoire "routes"](#répertoire-routes)
   6. [Détail des Fichiers dans "routes"](#détail-des-fichiers-dans-routes)
2. [Choix de Programmation](#choix-de-programmation)
   1. [Nommage](#nommage)
   2. [Authentification](#authentification)
   3. [Boucle d’Inscription](#boucle-dinscription)
   4. [Procédure de Connexion](#procédure-de-connexion)
   5. [Middleware de Connexion](#middleware-de-connexion)
   6. [Gestion des Niveaux d’Accès](#gestion-des-niveaux-daccès)
3. [Templating](#templating)
   1. [Regroupement par Fonction](#regroupement-par-fonction)
   2. [Éléments d’Interface Communs](#éléments-dinterface-communs)
4. [Systèmes Supplémentaires](#systèmes-supplémentaires)
   1. [URLs d’action et Permissions](#urls-daction-et-permissions)
   2. [Téléchargement de Fichier, Création d’un PDF, et Génération d’un Fichier ZIP pour le Dossier du Candidat](#téléchargement-de-fichier-création-dun-pdf-et-génération-dun-fichier-zip-pour-le-dossier-du-candidat)
5. [Esthétique](#esthétique)
   1. [Intégration de Tailwind CSS](#intégration-de-tailwind-css)
   2. [Utilisation de Bootstrap pour les Modals](#utilisation-de-bootstrap-pour-les-modals)
6. [Mise en place de l'hébergement sur Azure et CI/CD avec GitHub Actions et Docker](#mise-en-place-de-lhébergement-sur-azure-et-cicd-avec-github-actions-et-docker)
   1. [Hébergement sur Azure](#hébergement-sur-azure)
   2. [CI/CD avec GitHub Actions](#cicd-avec-github-actions)

## Structure du GIT

### Structure du Répertoire Principal

#### Fichiers Directement dans le Répertoire Principal
- `carte-site.pdf` : La carte du site.
- `MCD.png` : Diagramme conceptuel de données sous forme d'image.
- `mcd.pu` : Fichier source PlantUML contenant le modèle conceptuel de données.
- `mld.txt` : Fichier texte décrivant le modèle logique de données.
- `use-case.pdf` : Diagramme des cas d'utilisation.
- `[U] SR10 Sécurité.pdf` : Document PDF sur la sécurité.
- `[U] SR10 Tests.pdf` : Document PDF sur les tests.
- `database.sql` : Modélisation MySQL de la base de données.
- `README.md` : Fichier readme.

### Répertoire "Projet"
#### Contenu du Répertoire "Projet"
- `app.js` : Fichier principal de l'application.
- `bin/` : Répertoire contenant des scripts binaires.
- `coverage/` : Répertoire généré par des outils de couverture de code.
- `logger.js` : Fichier gérant les logs de l'application.
- `middleware/` : Répertoire contenant des middlewares pour l'application.
- `model/` : Répertoire contenant des modèles de données.
- `node_modules/` : Répertoire où sont installées les dépendances Node.js.
- `package-lock.json` : Fichier de verrouillage des dépendances pour npm.
- `package.json` : Fichier de configuration des dépendances pour npm.
- `postcss.config.js` : Configuration pour PostCSS.
- `public/` : Répertoire contenant des ressources publiques comme des fichiers CSS ou des images.
- `routes/` : Répertoire contenant les définitions des routes de l'application.
- `tailwind.config.js` : Configuration pour Tailwind CSS.
- `tests/` : Répertoire contenant les tests JEST.
- `uploads/` : Répertoire où sont stockés les fichiers uploadés par les utilisateurs.
- `views/` : Répertoire contenant les vues ejs de l'application.

### Répertoire "routes"
#### Détail des Fichiers dans "routes"
- `applications.js` : Routes et logique liées à la gestion des candidatures (to apply en anglais).
- `dashboard.js` : Routes et logique liées au tableau de bord.
- `index.js` : Route principale de l'application, importe les autres routeurs.
- `jobs.js` : Routes et logique liées aux offres d'emploi.
- `login.js` : Routes et logique liées à l'authentification et à la connexion.
- `organizations.js` : Routes et logique liées aux organisations.
- `register.js` : Route et logique liées à l'inscription des utilisateurs.
- `testrouter.js` : Routes de test, utilisées pour des expérimentations et des tests spécifiques. (voir le PDF sur les tests pour plus d’informations)
- `users.js` : Routes et logique liées aux utilisateurs.

## Choix de Programmation
### Nommage
Nous avons souhaité programmer notre site internet en anglais, de manière à nous habituer aux conventions internationales. Cependant, nous avons rapidement remarqué que le nommage purement anglais allait mener à des conflits avec les considérations suivantes : 

- Le site internet devait être de préférence en français.
- Le modèle UML et de base de données qui étaient initialement demandés en français.

Pour concilier ces aspects, nous avons implémenté le code qui se réfère directement avec la base de donnée qui respect notre UML en français, ainsi que celui qui touche directement à l’affichage (variables d’unpacking ejs…).

En d’autres termes, nous avons implémenté la partie fonctionnelle du site internet en anglais, puis les éléments liés aux pages non modulaires, comme par exemple des à afficher dans le champ d’une page du même nom, sont en français pour mieux s’y retrouver.

### Authentification
#### Boucle d’Inscription
L’inscription se fait grâce à la page `/register`, qui fait partie des deux seules qui sont accessibles sans être connecté avec `/login`.

Le formulaire d’inscription est équipé d’une couche de vérification gérée par le module `express-validator`, qui est connecté à un système de notification d’erreur. Nous nous assurons ainsi côté serveur que les données envoyées par la requête sont dans le bon format.

Une fois des données correctes saisies, une séquence de vérification est faite pour s’assurer que l’email ne correspond pas déjà à un utilisateur existant. Si ce n’est pas le cas, le compte est créé et l’utilisateur est connecté. C’est à cette étape là que l’envoi de mail peut avoir lieu.

Le mot de passe utilisateur est encrypté dans la base de données à l’aide du module `bcrypt`.

#### Procédure de Connexion
La connexion est gérée par la page `/login`. Lorsque les bonnes informations sont saisies, l’utilisateur

La page de connexion actuelle comporte également un lien vers la page d’inscription et un bouton (temporaire, pour des raisons de simplicité de test) qui permet de se connecter instantanément avec un compte “test”.

L’action de se connecter peuple les données de session de l’utilisateur avec des informations sur : 
- Son identifiant
- Son statut (candidat, recruteur, administrateur)
- Son numéro SIREN si il s’agit d’un recruteur lié à une organisation

Ces informations seront utilisées par la suite par les middlewares de connexion.

### Middleware de Connexion
Lorsqu’un utilisateur tente de se connecter depuis une page quelconque, il est renvoyé à la page de connexion. Un système de `secure` et de `nonSecurePaths` (renseignés dans `app.js`) permet de déterminer quelles pages redirigent automatiquement vers l’url de login. (Ces fonctionnalités sont identiques à celles présentées en cours)

De plus, un système de mémorisation d’url via l’attribut de session `returnTo` permet de revenir à la page depuis laquelle l’utilisateur a été redirigé vers le formulaire de connexion. Ainsi, si l’utilisateur perd sa session et est prompté de se reconnecter, le serveur le renvoie à la dernière page sur laquelle il se trouvait avant d’être redirigé. Cette fonctionnalité est gérée directement dans les middlewares de connexion (`isLoggedIn`, `requireRecruitorStatus`, …) (enregistrement de l’url actuelle avant redirection) et dans le middleware `readReturnTo` qui effectue les opérations nécessaires sur cette variable avant de la rendre accessible sur les pages qui peuvent effectuer une redirection (pour l’instant uniquement `/login`).

### Gestion des Niveaux d’Accès
Finalement, les niveaux d’accès sont gérés par une famille de middlewares.
Ces middlewares sont placés sur les routes qui ont besoin de niveaux d’accès spécifiques. Cela ne gère que les droits d’accès qui dépendent exclusivement des informations de session de l’utilisateur. Pour les droits plus spécifiques, qui nécessitent un accès à la base de données et la lecture des données de requêtes POST, comme par exemple la fonctionnalité de suppression de candidature sur l’url `/cancel-application`, les vérifications sont effectuées au sein du code de la route car elles sont très spécifiques.

Voici la liste des middlewares généraux qui gèrent les droits d’accès des routes : 

- `isLoggedIn` est la redirection par défaut lorsqu’une nouvelle page est créée, elle renvoie l’utilisateur au formulaire de login dès qu’il n’est pas connecté.
- `requireRecruitorStatus` refuse l’accès à l’utilisateur si il n’est pas recruteur. Cette fonctionnalité était prévue initialement pour gérer le cas où un recruteur ne s’est pas encore vu approuver d’organisation. Cependant, nous avons eu un changement de conception et tous les recruteurs sont désormais nécessairement affiliés à une organisation. Ce droit d’accès est toujours conservé dans le code pour augmenter la flexibilité de notre application, au cas où un changement dans la gestion des organisations serait à faire. De plus, nous avons également une version simplifiée de ce middleware, qui fait la même chose mais ne gère pas les messages d’erreur : `isRecruitor`.
- `requireAffiliation` refuse l’accès à l’utilisateur si il n’est pas un recruteur affilié. Dans notre application, tous les recruteurs sont affiliés. Nous conservons ce middleware pour les raisons mentionnées précédemment.
- `isAdmin` refuse l’accès à l’utilisateur si il n’est pas administrateur.

## Templating
Dans ce projet, l'utilisation du templating avec EJS (Embedded JavaScript) est structurée de manière à rendre les vues modulaires et réutilisables. Voici comment les différents éléments sont organisés :

### Regroupement par Fonction
Le répertoire "views" est organisé de manière à refléter la structure et la logique fonctionnelle de l'application. Les sous-dossiers trient les vues selon le routeur qui les gère (gestion des offres d’emploi, gestion des utilisateurs, etc.). Cela permet une gestion efficace et une maintenance simplifiée des différentes parties de l'application.

D’autres fichiers qui servent de composants sont placés à la racine du répertoire views : 

- Répertoires "listings" et "forms" : Ces répertoires contiennent des modèles de pages destinés à afficher des listes itératives ou des formulaires respectivement. Les fichiers dans ces répertoires sont nommés d'après les fonctionnalités spécifiques qu'ils supportent, comme la gestion des offres d'emploi, des demandes d'application, etc.
- Composants Globaux : Les fichiers qui ne sont pas placés dans un sous-répertoire spécifique ("listings" ou "forms") sont souvent des composants réutilisables ou des mises en page générales. Ils sont inclus dans différentes vues pour promouvoir la réutilisation du code et maintenir une cohérence visuelle à travers l'application.

### Éléments d’Interface Communs
Ces composants globaux peuvent dépendre de plusieurs fonctionnalités additionnelles :
- **Navbar (`navbar.ejs`)** : Contient le code HTML pour la barre de navigation principale de l'application. Il est inclus dans toutes les pages pour assurer une navigation cohérente.
- **Notifications (`message.ejs`)** : Utilisé pour afficher des messages à l'utilisateur, qu'il s'agisse de notifications ou parfois d'erreurs. Ce fichier permet de standardiser l'affichage des messages à travers l'application.
- **Erreurs (`error.ejs`)** : Page standard pour afficher les détails des erreurs rencontrées dans l'application. Elle est conçue pour rendre les messages d'erreur compréhensibles pour les utilisateurs et pour le débogage.
- **Heads et Métadonnées (`head.ejs`)** : Contient les balises `<head>` HTML et les métadonnées communes à toutes les pages.
- **Variables Locales** : Les variables locales sont gérées à l'aide d'un middleware nommé `readMessage`. Ce middleware récupère les messages stockés dans la session de l'utilisateur et les passe à chaque vue via `res.locals`. Cela permet d'afficher dynamiquement des messages de notification ou d'erreur sur les pages où ils sont nécessaires, sans avoir à les passer explicitement à chaque rendu de vue.

### Logique Générale
L'approche générale de l'organisation des fichiers dans le répertoire "views" vise à rendre le code maintenable et évolutif. Chaque fichier est placé dans un répertoire correspondant à sa fonctionnalité principale, ce qui facilite la navigation et la recherche de code. Les composants réutilisables sont séparés des vues spécifiques pour encourager la modularité et permettre une gestion efficace des mises à jour et des ajouts de fonctionnalités.

## Systèmes Supplémentaires
### URLs d’action et Permissions
Nous utilisons généralement une authentification encodée avec bcrypt, des variables de session, et des vérifications additionnelles intégrées aux routes et à des requêtes spécifiques à la base de données pour vérifier des données utilisateur.

Nous avons particulièrement implémenté des prototypes de boucles de sécurité pour les différentes pages. Nous pensons que le niveau de sécurité actuel est suffisant, mais nous savons que nous aurions pu simplifier ou généraliser certaines des boucles de sécurité que nous avons mis en place pour certaines pages spécifiques.

Les directives du cours en matière de sécurité ont été respectées (bonne conception de database, pas d’exécution d’insertion sql depuis la bdd – sécurisation, …) et nous ont permis de nous concentrer directement sur les autres domaines de sécurité. Nous les détaillons dans cette section.

Le détail de ces implémentations est expliqué dans le PDF sur la Sécurité, dans le cadre de l’attaque par violation de droits d’accès.

## Téléchargement de Fichier, Création d’un PDF, et Génération d’un Fichier ZIP pour le Dossier du Candidat
Dans notre projet, nous avons mis en place une fonctionnalité très pratique pour gérer les candidatures. Cette fonctionnalité permet de télécharger les fichiers, de créer un PDF regroupant toutes les informations importantes, et de générer un fichier ZIP contenant l'ensemble du dossier de candidature. Voici comment cela fonctionne :

### Route pour Télécharger le Dossier de Candidature d'un Candidat

**Endpoint:** POST `/download-candidate-folder`

**Description:**
- Cette route permet aux recruteurs de télécharger le dossier complet d'un candidat pour une offre d'emploi spécifique.
- Seuls les recruteurs authentifiés et membres de l'organisation liée à l'offre peuvent utiliser cette fonctionnalité.

**Validations:**
- `idCandidat`: L'identifiant du candidat, requis.
- `idOffre`: L'identifiant de l'offre d'emploi, requis.

**Fonctionnalités:**
1. **Vérification des Permissions:**
    - La route commence par vérifier que l'utilisateur a bien le droit d'accéder à cette information. On s'assure qu'il est recruteur et membre de l'organisation associée à l'offre d'emploi.

2. **Récupération des Informations:**
    - On récupère toutes les informations nécessaires comme les détails du candidat, de l'offre d'emploi, la candidature, et les fichiers associés.

3. **Création du PDF:**
    - Un fichier PDF est créé. Ce fichier contient toutes les informations importantes comme le nom du candidat, son email, son téléphone, la date de candidature, les détails de l'offre, etc.

4. **Génération du Fichier ZIP:**
    - On crée un fichier ZIP qui contient le PDF généré ainsi que toutes les pièces jointes liées à la candidature.

5. **Téléchargement:**
    - Une fois que le fichier ZIP est prêt, il est proposé au téléchargement pour le recruteur.

**Exemple d'utilisation dans la route:**

```javascript
router.post('/download-candidate-folder', isLoggedIn, requireRecruitorStatus, [
    body('idCandidat').notEmpty().withMessage('ID du candidat requis'),
    body('idOffre').notEmpty().withMessage("ID de l'offre requis")
], async function (req, res, next) {
    // Code de validation et récupération des erreurs...

    try {
        const { idCandidat, idOffre } = req.body;

        // Vérification des permissions...

        // Récupération des informations nécessaires...

        // Création du fichier ZIP
        const zipFilePath = path.join(__dirname, '..', 'uploads', `dossier-${idCandidat}-${idOffre}.zip`);
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        output.on('close', function () {
            res.download(zipFilePath);
        });

        archive.on('error', function (err) {
            throw err;
        });

        // Création du PDF
        const doc = new PDFDocument();
        const pdfPath = path.join(__dirname, '..', 'uploads', `dossier-${idCandidat}-${idOffre}.pdf`);
        const pdfStream = fs.createWriteStream(pdfPath);

        doc.pipe(pdfStream);
        doc.fontSize(25).text(`Dossier de Candidature pour ${offre.Intitule}`, { align: 'center' });
        doc.fontSize(16).text(`Nom: ${user.Prenom} ${user.Nom}`);
        // Ajout de plus de champs personnalisés...
        doc.end();

        pdfStream.on('finish', async () => {
            archive.file(pdfPath, { name: 'Dossier.pdf' });

            for (const fichier of fichiers) {
                const filePath = path.join(__dirname, '..', 'uploads', fichier.Fichier);
                archive.file(filePath, { name: fichier.NomOriginal });
            }

            await archive.finalize();
        });

    } catch (error) {
        // Gestion des erreurs
        next(error);
    }
});
```

### Modules Utilisés
- **Création PDF:** On utilise `PDFKit` pour générer un PDF contenant toutes les informations du candidat et de l'offre.
- **Compression:** On utilise `archiver` pour créer un fichier ZIP avec le PDF et toutes les pièces jointes.

Cette fonctionnalité permet ainsi de regrouper toutes les informations et fichiers de candidature en un seul fichier ZIP, ce qui facilite grandement le travail des recruteurs.

## Esthétique
Pour améliorer l'esthétique et l'ergonomie de notre application web construite avec Express et Node.js, nous avons intégré Tailwind CSS (en général) ainsi que Bootstrap pour certaines fonctionnalités spécifiques, comme les modals. Voici comment nous avons procédé.

### Intégration de Tailwind CSS
#### Installation et Configuration
Nous avons commencé par installer Tailwind CSS en tant que module npm. Voici la configuration dans le fichier `postcss.config.js` :

```javascript
module.exports = {
    plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
    ]
};
```

Ensuite, nous avons configuré Tailwind dans le fichier `tailwind.config.js` pour qu'il prenne en charge les fichiers EJS utilisés dans le projet :

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: 'tw-',
  content: ["./views/**/*.ejs", "./views/*.ejs"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

#### Utilisation de Tailwind dans le CSS
Nous avons défini les bases de Tailwind dans notre fichier `tailwind.css` avec les directives suivantes :

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Nous avons également ajouté des styles personnalisés pour les scrollbars et pour assurer un rendu cohérent du texte (éviter un décalage trop prononcé de la navbar quand une page avec scrollbar était sélectionnée par exemple).

#### Compilation et Utilisation
La commande suivante dans `package.json` compile le fichier `tailwind.css` en `style.css`, le rendant indépendant :

```json
"tailwind:css": "postcss public/styles/tailwind.css -o public/styles/style.css"
```

Cette feuille de style compilée est ensuite utilisée dans nos fichiers EJS pour appliquer les styles Tailwind, par exemple :

```html
<body class="tw-bg-gray-100 tw-font-sans tw-leading-normal tw-tracking-normal">
```

Les classes Tailwind avec le préfixe `tw-` garantissent qu'elles n'entrent pas en conflit avec d'autres bibliothèques CSS, cela a été configuré dans le `tailwind.config.js`.

### Utilisation de Bootstrap pour les Modals
Pour les fonctionnalités modales, nous avons choisi d'utiliser Bootstrap car il offre une gestion robuste et réactive des modals, ce qui simplifie l'implémentation et l'interaction avec les utilisateurs.

#### Intégration des Modals Bootstrap
Les modals sont définis dans des fichiers EJS avec la structure suivante, en utilisant à la fois des classes Tailwind pour la personnalisation esthétique et des classes Bootstrap pour le comportement :

```html
<div class="modal fade" id="<%= modalId %>" tabindex="-1" aria-labelledby="<%= modalLabelId %>" aria-hidden="true">
    <div class="modal-dialog tw-w-auto tw-mx-auto">
        <div class="modal-content tw-bg-white tw-rounded-lg tw-shadow-lg">
            <div class="modal-header tw-bg-gray-100 tw-border-b tw-border-gray-200 tw-p-4 tw-rounded-t-lg tw-flex tw-items-center tw-justify-between">
                <h5 class="modal-title tw-text-lg tw-font-semibold" id="<%= modalLabelId %>"><%= modalTitle %></h5>
                <button type="button" class="tw-text-gray-400 hover:tw-text-gray-600 focus:tw-outline-none" data-bs-dismiss="modal" aria-label="Close">
                    <svg class="tw-w-6 tw-h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="modal-body tw-p-4">
                <%- include(modalBody, { organisations: defaultOrganisations, user: defaultUser, offre: defaultOffre, isCandidate: defaultIsCandidate, fiche: defaultFiche, candidature: defaultCandidature, fichiers: defaultFichiers }) %>
            </div>
        </div>
    </div>
</div>
```

## Mise en place de l'hébergement sur Azure et CI/CD avec GitHub Actions et Docker
Pour assurer un déploiement continu et fiable de notre application, nous avons mis en place une infrastructure d'hébergement sur Azure couplée à une intégration continue (CI) et un déploiement continu (CD) en utilisant GitHub Actions et Docker. Voici comment nous avons structuré ce processus.

### Hébergement sur Azure
Notre application est hébergée sur Azure App Service, un service de plateforme en tant que service (PaaS) qui permet de déployer facilement des applications web. L'application est accessible via l'URL `https://sr10project.azurewebsites.net/`. Azure App Service offre une infrastructure scalable et sécurisée pour notre application Node.js.

### CI/CD avec GitHub Actions
Pour automatiser le processus de déploiement à chaque push dans la branche principale (`main`), nous avons configuré un workflow GitHub Actions. Ce workflow est déclenché par des événements de push et s'exécute uniquement si les tests unitaires passent. Voici une explication détaillée de notre workflow :

#### Déclenchement du Workflow
Le workflow se déclenche à chaque push sur la branche `main` ainsi que manuellement via `workflow_dispatch`.

#### Job de Build
Le job `build` s'exécute sur un environnement Ubuntu.

##### Checkout du Code
Nous utilisons l'action `actions/checkout@v4` pour récupérer le code source depuis le dépôt GitHub :
```yaml
- name: Checkout code
  uses: actions/checkout@v4
```

##### Configuration de Node.js
Nous configurons la version de Node.js à utiliser via l'action `actions/setup-node@v4` :
```yaml
- name: Set up Node.js version
  uses: actions/setup-node@v4
  with:
    node-version: '20.x'
```

##### Création du Répertoire de Téléchargements
Nous nous assurons que le répertoire des uploads existe :
```yaml
- name: Ensure uploads directory exists
  run: mkdir -p myapp/uploads
```

##### Installation des Dépendances
Nous installons les dépendances nécessaires à notre application en utilisant `npm install` :
```yaml
- name: Install dependencies
  working-directory: myapp
  run: npm install
```

##### Build et Tests
Nous construisons l'application (si nécessaire) et exécutons les tests avec Jest :
```yaml
- name: Build and test
  working-directory: myapp
  run: |
    npm run build --if-present
    npm test
```

##### Zippage et Téléchargement de l'Artifact
Nous préparons l'application pour le déploiement en créant un fichier zip et en téléchargeant l'artifact via `actions/upload-artifact@v4` :
```yaml
- name: Zip artifact for deployment
  run: zip -r release.zip myapp

- name: Upload artifact for deployment job
  uses: actions/upload-artifact@v4
  with:
    name: node-app
    path: release.zip
```

#### Job de Déploiement
Le job `deploy` dépend du job `build` et s'exécute également sur un environnement Ubuntu.

##### Téléchargement et Décompression de l'Artifact
Nous récupérons l'artifact du job de build et le décompressons via `actions/download-artifact@v4` :
```yaml
- name: Download artifact from build job
  uses: actions/download-artifact@v4
  with:
    name: node-app

- name: Unzip artifact for deployment
  run: unzip release.zip
```

##### Installation des Dépendances sur Azure
Nous installons les dépendances de production sur Azure App Service :
```yaml
- name: Install dependencies on Azure
  working-directory: myapp
  run: npm install --omit=dev
```

##### Déploiement sur Azure App Service
Nous utilisons l'action `azure/webapps-deploy@v2` pour déployer l'application sur Azure App Service :
```yaml
- name: Deploy to Azure Web App
  id: deploy-to-webapp
  uses: azure/webapps-deploy@v2
  with:
    app-name: 'sr10project'
    slot-name: 'Production'
    publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE_22659E805627417681AE8A0612E17EB7 }}
    package: myapp
```

L’application est ainsi déployée et accessible en ligne. Si un déploiement échoue, nous sommes notifiés, et le site reste disponible et sur la dernière version fonctionnelle jusqu’à ce qu’un nouveau déploiement réussi ait lieu.
