const Organisation = require('../model/organisation');

/**
 * Valide les champs pour une nouvelle organisation.
 */
async function validateNewOrganisation(fields) {
    const { newOrganisationSiren, newOrganisationName, newOrganisationType, newOrganisationAddress } = fields;
    let errorMessage = null;

    if (!newOrganisationSiren || !newOrganisationName || !newOrganisationType || !newOrganisationAddress) {
        errorMessage = "Tous les champs pour la nouvelle organisation doivent être remplis.";
    } else if (!/^\d{9}$/.test(newOrganisationSiren)) {
        errorMessage = "Le SIREN doit être un numéro à 9 chiffres.";
    } else {
        const organisationExists = await Organisation.read(newOrganisationSiren);
        if (organisationExists) {
            errorMessage = "L'organisation avec ce SIREN existe déjà.";
        }
    }

    return errorMessage;
}

module.exports = {
    validateNewOrganisation,
};