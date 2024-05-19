const Utilisateur = require('../model/utilisateur');
const Organisation = require('../model/organisation');

/**
 * Récupère les détails de l'utilisateur et les organisations approuvées.
 */
async function getUserDetailsAndOrgs(email) {
    const userDetails = await Utilisateur.read(email);
    const organisations = await Organisation.readApproved();
    if (!userDetails) {
        throw new Error("Détails de l'utilisateur non trouvés.");
    }
    return { userDetails, organisations };
}

/**
 * Gère une nouvelle demande de changement d'organisation.
 */
async function handleNewOrganisationRequest(email, newOrganisationFields) {
    const newOrganisation = {
        numeroSiren: newOrganisationFields.newOrganisationSiren,
        nom: newOrganisationFields.newOrganisationName,
        type: newOrganisationFields.newOrganisationType,
        adresseAdministrative: newOrganisationFields.newOrganisationAddress,
        statutOrganisation: 'en attente'
    };

    await Organisation.create(newOrganisation);
    await Utilisateur.updateTypeCompteWithOrganisation(email, 'recruteur en attente', newOrganisation.numeroSiren);
}

/**
 * Gère une demande de changement d'organisation existante.
 */
async function handleExistingOrganisationRequest(email, existingOrganisationId) {
    await Utilisateur.updateTypeCompteWithOrganisation(email, 'recruteur en attente', existingOrganisationId);
}

module.exports = {
    getUserDetailsAndOrgs,
    handleNewOrganisationRequest,
    handleExistingOrganisationRequest
};