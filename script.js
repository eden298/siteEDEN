// =============================================================
// VÉRIFICATION DE LA SESSION ET SÉCURITÉ ACCÈS (index.html)
// =============================================================
const sessionData = JSON.parse(localStorage.getItem('chan_session'));

// Table de correspondance des pages
const pagesParService = {
    'TOUS': 'index.html',
    'SUPERIEUR': 'superieur.html',
    'Odontologie': 'odonto.html',
    'Urgences': 'urgences.html',
    'Maternité': 'maternite.html',
    'Pédiatrie': 'pediatrie.html',
    'Bloc Opératoire': 'bloc.html'
};

// 1. Si pas de session -> retour au login
if (!sessionData) {
    window.location.href = 'login.html';
} 
// 2. Si c'est un Major de service (ex: Odontologie) qui essaie de taper l'URL index.html direct -> redirection
// NB: On laisse passer 'TOUS' (Maintenance) ET 'SUPERIEUR' (Direction Supérieure)
else if (sessionData.service !== 'TOUS' && sessionData.service !== 'SUPERIEUR') {
    const pageMajor = pagesParService[sessionData.service];
    if (pageMajor) {
        window.location.href = pageMajor;
    }
}

// =============================================================
// BASE DE DONNÉES SIMULÉE (145 LOGS)
// =============================================================
const servicesList = ['Maternité', 'Odontologie', 'Pédiatrie', 'Urgences', 'Bloc Opératoire'];
const pannesParService = {
    'Maternité': ['Climatisation', 'Électrique', 'Plomberie', 'Médical/Biomed'],
    'Odontologie': ['Fauteuil Dentaire', 'Électrique', 'Compressur', 'Plomberie'],
    'Pédiatrie': ['Couveuse', 'Électrique', 'Climatisation', 'Plomberie'],
    'Urgences': ['Moniteur ECG', 'Électrique', 'Fluides Médicaux', 'Plomberie'],
    'Bloc Opératoire': ['Scialytique', 'Table d\'Opération', 'Respirateur', 'Électrique']
};
const techniciens = ['P1', 'P2', 'P3', 'P4', 'P5'];

const couleuresPannes = {
    'Électrique': '#0284c7', 'Plomberie': '#06b6d4', 'Climatisation': '#10b981',
    'Médical/Biomed': '#ef4444', 'Fauteuil Dentaire': '#f59e0b', 'Compressur': '#8b5cf6',
    'Couveuse': '#ec4899', 'Moniteur ECG': '#6366f1', 'Fluides Médicaux': '#14b8a6',
    'Scialytique': '#84cc16', 'Table d\'Opération': '#d97706', 'Respirateur': '#dc2626'
};

const couleuresStatuts = {
    'Résolu': '#22c55e', 'En Cours': '#f97316', 'En Attente': '#2563eb', 'Pas Résolu': '#ef4444'
};

const dataset = [];
let seed = 1001;

for (let i = 1; i <= 374; i++) {
    const service = servicesList[i % servicesList.length];
    const pannesPossibles = pannesParService[service];
    const typePanne = pannesPossibles[i % pannesPossibles.length];
    const technicien = techniciens[i % techniciens.length];
    
    let statut = 'Résolu';
    if (i % 7 === 0) statut = 'En Cours';
    else if (i % 11 === 0) statut = 'En Attente';
    else if (i % 19 === 0) statut = 'Pas Résolu';

    const moisInt = (i % 6) + 1;
    const jourInt = ((i * 3) % 28) + 1;
    const dateSignalement = `2026-${String(moisInt).padStart(2, '0')}-${String(jourInt).padStart(2, '0')}`;
    const cout = (Math.floor((i * 37) % 85) + 15) * 1000;

    dataset.push({
        id: `INT-${seed++}`,
        date: dateSignalement,
        service: service,
        typePanne: typePanne,
        technicien: technicien,
        statut: statut,
        cout: cout
    });
}

// Instances Chart.js
let chartGlobalInstance = null;
let chartDetailBarInstance = null;
let chartDetailPieInstance = null;
let chartEvolutionInstance = null;
let chartCoutTechnicienInstance = null;

// Éléments DOM
let inputDateDebut, inputDateFin, selectService, selectStatut, selectPanne, btnReset, btnExport;

const optionsAxesNets = {
    ticks: {
        color: '#1e293b',
        font: { size: 11, weight: '600', family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto' },
        maxRotation: 45, minRotation: 0
    },
    grid: { color: '#e2e8f0', lineWidth: 1 }
};

// INITIALISATION
document.addEventListener('DOMContentLoaded', () => {
    // Affichage des infos du cadre connecté
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

    inputDateDebut = document.getElementById('date-debut');
    inputDateFin = document.getElementById('date-fin');
    selectService = document.getElementById('select-service');
    selectStatut = document.getElementById('select-statut');
    selectPanne = document.getElementById('select-panne');
    btnReset = document.getElementById('btn-reset');
    btnExport = document.getElementById('btn-export');

    // VERROUILLAGE ET FILTRAGE PAR SERVICE
    // Seuls les Majors ont leur menu verrouillé. TOUS et SUPERIEUR ont accès à tout !
    if (sessionData && sessionData.service !== 'TOUS' && sessionData.service !== 'SUPERIEUR') {
        if (selectService) {
            selectService.value = sessionData.service;
            selectService.disabled = true; // Bloque le filtre pour le Major du service
        }
    }

    remplirOptionsPannes();
    initialiserChartGlobal();
    actualiserAfficheComplet();

    // Event Listeners
    inputDateDebut.addEventListener('change', actualiserAfficheComplet);
    inputDateFin.addEventListener('change', actualiserAfficheComplet);
    selectService.addEventListener('change', () => {
        remplirOptionsPannes();
        actualiserAfficheComplet();
    });
    selectStatut.addEventListener('change', actualiserAfficheComplet);
    selectPanne.addEventListener('change', actualiserAfficheComplet);

    btnReset.addEventListener('click', () => {
        inputDateDebut.value = '';
        inputDateFin.value = '';
        if (sessionData.service === 'TOUS' || sessionData.service === 'SUPERIEUR') {
            selectService.value = 'TOUS';
        }
        selectStatut.value = 'TOUS';
        remplirOptionsPannes();
        actualiserAfficheComplet();
    });

    btnExport.addEventListener('click', exporterCSV);
});

function remplirOptionsPannes() {
    const serviceSelectionne = selectService.value;
    const panneCourante = selectPanne.value;
    let pannesDispo = new Set();

    dataset.forEach(item => {
        if (serviceSelectionne === 'TOUS' || serviceSelectionne === 'SUPERIEUR' || item.service === serviceSelectionne) {
            pannesDispo.add(item.typePanne);
        }
    });

    selectPanne.innerHTML = '<option value="TOUS">Tous les types</option>';
    pannesDispo.forEach(panne => {
        const opt = document.createElement('option');
        opt.value = panne;
        opt.textContent = panne;
        selectPanne.appendChild(opt);
    });

    selectPanne.value = pannesDispo.has(panneCourante) ? panneCourante : 'TOUS';
}

function obtenirDonneesFiltrees() {
    const dDebut = inputDateDebut.value;
    const dFin = inputDateFin.value;
    const sService = selectService.value;
    const sStatut = selectStatut.value;
    const sPanne = selectPanne.value;

    return dataset.filter(item => {
        const mDateDebut = !dDebut || item.date >= dDebut;
        const mDateFin = !dFin || item.date <= dFin;
        // Permet de charger toutes les données quand 'TOUS' ou 'SUPERIEUR' est sélectionné
        const mService = (sService === 'TOUS' || sService === 'SUPERIEUR' || item.service === sService);
        const mStatut = (sStatut === 'TOUS' || item.statut === sStatut);
        const mPanne = (sPanne === 'TOUS' || item.typePanne === sPanne);
        return mDateDebut && mDateFin && mService && mStatut && mPanne;
    });
}

function actualiserAfficheComplet() {
    const donneesFiltrees = obtenirDonneesFiltrees();
    
    mettreAJourKPIs(donneesFiltrees);
    mettreAJourChartDetailBar(donneesFiltrees);
    mettreAJourChartDetailPie(donneesFiltrees);
    mettreAJourChartEvolutionEtPrediction(donneesFiltrees);
    mettreAJourChartCoutTechnicien(donneesFiltrees);
    mettreAJourTableau(donneesFiltrees);
}

function mettreAJourKPIs(data) {
    const total = data.length;
    const resolus = data.filter(d => d.statut === 'Résolu').length;
    const taux = total > 0 ? ((resolus / total) * 100).toFixed(1) : 0;
    const depensesTotales = data.reduce((acc, curr) => acc + curr.cout, 0);

    document.getElementById('kpi-total').textContent = total;
    document.getElementById('kpi-taux').textContent = `${taux}%`;
    document.getElementById('kpi-depenses').textContent = `${depensesTotales.toLocaleString('fr-FR')} FCFA`;
}

// 1. Vue Globale
function initialiserChartGlobal() {
    const compteursParService = {};
    servicesList.forEach(s => compteursParService[s] = 0);
    dataset.forEach(item => {
        compteursParService[item.service] = (compteursParService[item.service] || 0) + 1;
    });

    const ctx = document.getElementById('chartGlobal').getContext('2d');
    chartGlobalInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(compteursParService),
            datasets: [{
                label: 'Nombre d\'interventions',
                data: Object.values(compteursParService),
                backgroundColor: '#004b8d',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: 2,
            plugins: { legend: { display: false } },
            scales: { x: optionsAxesNets, y: { ...optionsAxesNets, beginAtZero: true } }
        }
    });
}

// 2. Types de pannes
function mettreAJourChartDetailBar(data) {
    const pannesCompte = {};
    data.forEach(item => { pannesCompte[item.typePanne] = (pannesCompte[item.typePanne] || 0) + 1; });

    const labels = Object.keys(pannesCompte);
    const values = Object.values(pannesCompte);
    const colors = labels.map(l => couleuresPannes[l] || '#0284c7');

    const ctx = document.getElementById('chartDetailBar').getContext('2d');
    if (chartDetailBarInstance) chartDetailBarInstance.destroy();

    chartDetailBarInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ label: 'Nombre de pannes', data: values, backgroundColor: colors, borderRadius: 4 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: 2,
            plugins: { legend: { display: false } },
            scales: { x: optionsAxesNets, y: { ...optionsAxesNets, beginAtZero: true, ticks: { ...optionsAxesNets.ticks, stepSize: 1 } } }
        }
    });
}

// 3. ÉVOLUTION TEMPORELLE + PROJECTION À 30 JOURS (Régression Linéaire)
function mettreAJourChartEvolutionEtPrediction(data) {
    const occurencesParDate = {};
    data.forEach(item => {
        occurencesParDate[item.date] = (occurencesParDate[item.date] || 0) + 1;
    });

    const datesTriees = Object.keys(occurencesParDate).sort();
    const valeursReelles = datesTriees.map(d => occurencesParDate[d]);
    const n = datesTriees.length;

    let labelsComplets = [...datesTriees];
    let reellesData = [...valeursReelles];
    let tendanceData = [];
    let predictionVal30j = "--";

    if (n > 1) {
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += valeursReelles[i];
            sumXY += i * valeursReelles[i];
            sumXX += i * i;
        }

        const pente_a = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const ordonnee_b = (sumY - pente_a * sumX) / n;

        // Calcul tendance historique
        tendanceData = datesTriees.map((_, i) => parseFloat((pente_a * i + ordonnee_b).toFixed(2)));

        // Génération de la projection à +30 jours
        const derniereDateStr = datesTriees[datesTriees.length - 1];
        const derniereDate = new Date(derniereDateStr);

        for (let step = 1; step <= 30; step++) {
            const dateProjetee = new Date(derniereDate);
            dateProjetee.setDate(derniereDate.getDate() + step);
            const dateIso = dateProjetee.toISOString().split('T')[0];

            labelsComplets.push(dateIso);
            reellesData.push(null); // Pas de données réelles pour le futur
            
            const valPred = Math.max(0, pente_a * (n - 1 + step) + ordonnee_b);
            tendanceData.push(parseFloat(valPred.toFixed(2)));
        }

        // Estimation cumulée sur les 30 prochains jours
        const total30jProjetes = tendanceData.slice(n).reduce((acc, curr) => acc + curr, 0);
        predictionVal30j = `~${Math.round(total30jProjetes)} pannes`;
    } else {
        tendanceData = valeursReelles;
    }

    document.getElementById('kpi-projection').textContent = predictionVal30j;

    const ctx = document.getElementById('chartEvolution').getContext('2d');
    if (chartEvolutionInstance) chartEvolutionInstance.destroy();

    chartEvolutionInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labelsComplets,
            datasets: [
                {
                    label: 'Interventions Réelles',
                    data: reellesData,
                    borderColor: '#0284c7',
                    backgroundColor: 'rgba(2, 132, 199, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3
                },
                {
                    label: 'Courbe de Tendance & Projection (+30j)',
                    data: tendanceData,
                    borderColor: '#8b5cf6',
                    borderDash: [5, 5],
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: 2,
            plugins: {
                legend: { display: true, position: 'top', labels: { color: '#1e293b', font: { weight: '600' } } }
            },
            scales: {
                x: { ...optionsAxesNets, ticks: { ...optionsAxesNets.ticks, maxRotation: 45 } },
                y: { ...optionsAxesNets, beginAtZero: true }
            }
        }
    });
}

// 4. ANALYSE DES COÛTS PAR TECHNICIEN
function mettreAJourChartCoutTechnicien(data) {
    const coutsParTech = {};
    techniciens.forEach(t => coutsParTech[t] = 0);

    data.forEach(item => {
        coutsParTech[item.technicien] = (coutsParTech[item.technicien] || 0) + item.cout;
    });

    const ctx = document.getElementById('chartCoutTechnicien').getContext('2d');
    if (chartCoutTechnicienInstance) chartCoutTechnicienInstance.destroy();

    chartCoutTechnicienInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(coutsParTech),
            datasets: [{
                label: 'Coût total (FCFA)',
                data: Object.values(coutsParTech),
                backgroundColor: '#f59e0b',
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y', // Histogramme horizontal
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: 2,
            plugins: { legend: { display: false } },
            scales: {
                x: { ...optionsAxesNets, beginAtZero: true },
                y: optionsAxesNets
            }
        }
    });
}

// 5. Statuts (Doughnut)
function mettreAJourChartDetailPie(data) {
    const statutsCompte = {};
    data.forEach(item => { statutsCompte[item.statut] = (statutsCompte[item.statut] || 0) + 1; });

    const labels = Object.keys(statutsCompte);
    const values = Object.values(statutsCompte);
    const colors = labels.map(l => couleuresStatuts[l] || '#94a3b8');

    const ctx = document.getElementById('chartDetailPie').getContext('2d');
    if (chartDetailPieInstance) chartDetailPieInstance.destroy();

    chartDetailPieInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#ffffff' }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: 2,
            plugins: { legend: { position: 'bottom', labels: { color: '#1e293b', font: { size: 12, weight: '600' } } } }
        }
    });
}

// Tableau
function mettreAJourTableau(data) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color: #94a3b8;">Aucune intervention enregistrée pour cette plage.</td></tr>`;
        return;
    }

    data.slice(0, 15).forEach(item => {
        const tr = document.createElement('tr');
        let badgeClass = 'badge-resolu';
        if (item.statut === 'En Cours') badgeClass = 'badge-encours';
        if (item.statut === 'En Attente') badgeClass = 'badge-attente';
        if (item.statut === 'Pas Résolu') badgeClass = 'badge-pasresolu';

        tr.innerHTML = `
            <td><strong>${item.id}</strong></td>
            <td>${item.date}</td>
            <td>${item.service}</td>
            <td>${item.typePanne}</td>
            <td>${item.technicien}</td>
            <td><span class="badge ${badgeClass}">${item.statut}</span></td>
            <td>${item.cout.toLocaleString('fr-FR')} FCFA</td>
        `;
        tbody.appendChild(tr);
    });
}

// Export CSV
function exporterCSV() {
    const data = obtenirDonneesFiltrees();
    let csv = 'ID;Date Signalement;Service;Type Panne;Technicien;Statut;Cout (FCFA)\n';

    data.forEach(row => {
        csv += `${row.id};${row.date};${row.service};${row.typePanne};${row.technicien};${row.statut};${row.cout}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'interventions_CH_Abass_Ndao.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}