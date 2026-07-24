// Liste des utilisateurs autorisés
const databaseUsers = [
    { id: 'DIR', password: 'dir123', nom: 'M. le Directeur', service: 'TOUS' },
    { id: 'MAINT', password: 'maint123', nom: 'Responsable Maintenance', service: 'TOUS' },
    { id: 'SUP', password: 'sup1234', nom: 'Direction Supérieure', service: 'SUPERIEUR' },
    { id: 'CAD-ODONTO', password: 'odonto123', nom: 'Major Odontologie', service: 'Odontologie' },
    { id: 'CAD-URG', password: 'urg123', nom: 'Major Urgences', service: 'Urgences' },
    { id: 'CAD-MAT', password: 'mat123', nom: 'Major Maternité', service: 'Maternité' },
    { id: 'CAD-PED', password: 'ped123', nom: 'Major Pédiatrie', service: 'Pédiatrie' },
    { id: 'CAD-BLOC', password: 'bloc123', nom: 'Major Bloc Opératoire', service: 'Bloc Opératoire' }
];

// Table de correspondance pour la redirection
const pagesParService = {
    'TOUS': 'index.html',
    'SUPERIEUR': 'superieur.html',
    'Odontologie': 'odonto.html',
    'Urgences': 'urgences.html',
    'Maternité': 'maternite.html',
    'Pédiatrie': 'pediatrie.html',
    'Bloc Opératoire': 'bloc.html'
};

// Fonction de validation
function traiterConnexion(idSaisi, passwordSaisi) {
    if (!idSaisi || !passwordSaisi) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    // Recherche de l'utilisateur (nettoyage des espaces et majuscules automatiques pour l'ID)
    const idPropre = idSaisi.trim().toUpperCase();
    const passPropre = passwordSaisi.trim();

    const user = databaseUsers.find(u => u.id === idPropre && u.password === passPropre);

    if (user) {
        // Enregistrement de la session
        localStorage.setItem('chan_session', JSON.stringify(user));

        // Redirection vers la page correspondante
        const destination = pagesParService[user.service] || 'index.html';
        window.location.href = destination;
    } else {
        alert("ID personnel ou mot de passe incorrect.");
    }
}

// Écouteur d'événement sur le formulaire de connexion
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // Empêche le rechargement de la page HTML
            
            const inputId = document.querySelector('#id, #username, input[type="text"]');
            const inputPass = document.querySelector('#password, input[type="password"]');

            if (inputId && inputPass) {
                traiterConnexion(inputId.value, inputPass.value);
            }
        });
    }
});