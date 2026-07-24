// =============================================================
// VÉRIFICATION DE LA SESSION ET SÉCURITÉ ACCÈS
// =============================================================
const sessionData = JSON.parse(localStorage.getItem('chan_session'));

// 1. Si non connecté -> Retour au login
if (!sessionData) {
    window.location.href = 'login.html';
} 
// 2. Sécurité : Seul Odontologie ou TOUS (Direction/Maintenance) peut lire cette page
else if (sessionData.service !== 'Odontologie' && sessionData.service !== 'TOUS' && sessionData.service !== 'SUPERIEUR') {
    alert("Accès non autorisé pour ce service.");
    window.location.href = 'login.html';
}

// Données fictives dédiées exclusivement à l'Odontologie
const pannesOdonto = [
    { id: 'OD-101', date: '2026-03-01', type: 'Fauteuil Dentaire', technicien: 'P1', statut: 'Résolu' },
    { id: 'OD-102', date: '2026-03-02', type: 'Compresseur', technicien: 'P3', statut: 'En Cours' },
    { id: 'OD-103', date: '2026-03-03', type: 'Électrique', technicien: 'P2', statut: 'Résolu' },
    { id: 'OD-104', date: '2026-03-04', type: 'Plomberie', technicien: 'P4', statut: 'En Attente' },
    { id: 'OD-105', date: '2026-03-05', type: 'Fauteuil Dentaire', technicien: 'P1', statut: 'Résolu' }
];

document.addEventListener('DOMContentLoaded', () => {
    // Affichage des informations utilisateur
    const userDisplay = document.getElementById('user-display');
    if (userDisplay && sessionData) {
        userDisplay.textContent = `${sessionData.nom} (${sessionData.service})`;
    }

    // Gestion de la Déconnexion
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('chan_session');
            window.location.href = 'login.html';
        });
    }

    // Calculs et affichage
    chargerKPIs();
    afficherTableau();
    initialiserGraphique();
});

function chargerKPIs() {
    const total = pannesOdonto.length;
    const resolu = pannesOdonto.filter(p => p.statut === 'Résolu').length;
    const encours = pannesOdonto.filter(p => p.statut === 'En Cours').length;

    document.getElementById('kpi-total').textContent = total;
    document.getElementById('kpi-resolu').textContent = resolu;
    document.getElementById('kpi-encours').textContent = encours;
}

function afficherTableau() {
    const tbody = document.getElementById('table-odonto');
    tbody.innerHTML = '';

    pannesOdonto.forEach(item => {
        let badgeClass = 'badge-resolu';
        if (item.statut === 'En Cours') badgeClass = 'badge-encours';
        if (item.statut === 'En Attente') badgeClass = 'badge-attente';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.id}</strong></td>
            <td>${item.date}</td>
            <td>${item.type}</td>
            <td>${item.technicien}</td>
            <td><span class="badge ${badgeClass}">${item.statut}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function initialiserGraphique() {
    const compteurs = {};
    pannesOdonto.forEach(p => {
        compteurs[p.type] = (compteurs[p.type] || 0) + 1;
    });

    const ctx = document.getElementById('chartOdonto').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(compteurs),
            datasets: [{
                label: 'Pannes',
                data: Object.values(compteurs),
                backgroundColor: '#f59e0b',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}