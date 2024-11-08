// app.js

document.addEventListener('DOMContentLoaded', () => {
    const featuresTableBody = document.querySelector('#features-table tbody');
    const experimentsTableBody = document.querySelector('#experiments-table tbody');
    const featuresForm = document.getElementById('features-form');

    // Fonction pour charger les caractéristiques
    async function loadFeatures() {
        try {
            const response = await fetch('/api/features');
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des caractéristiques');
            }
            const features = await response.json();
            featuresTableBody.innerHTML = '';
            features.forEach(feature => {
                const row = document.createElement('tr');

                // Création de la cellule pour le nom
                const nameCell = document.createElement('td');
                nameCell.textContent = feature.name;
                row.appendChild(nameCell);

                // Création de la cellule pour la condition (dropdown)
                const condCell = document.createElement('td');
                const select = document.createElement('select');
                select.name = `${feature.name}-cond`;
                const conditions = ['=', '<', '<=', '>', '>='];
                conditions.forEach(cond => {
                    const option = document.createElement('option');
                    option.value = cond;
                    option.textContent = cond;
                    select.appendChild(option);
                });
                condCell.appendChild(select);
                row.appendChild(condCell);

                // Création de la cellule pour la valeur (input)
                const valCell = document.createElement('td');
                const input = document.createElement('input');
                input.type = 'number';
                input.name = `${feature.name}-val`;
                input.value = feature.val;
                input.step = 'any';
                valCell.appendChild(input);
                row.appendChild(valCell);

                featuresTableBody.appendChild(row);
            });
        } catch (error) {
            console.error(error);
            alert('Impossible de charger les caractéristiques.');
        }
    }

    // Fonction pour charger les expériences
    async function loadExperiments(featuresData) {
        try {
            const response = await fetch('/api/experiments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ features: featuresData })
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des expériences');
            }

            const experiments = await response.json();
            experimentsTableBody.innerHTML = '';
            experiments.forEach(exp => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${exp.S_elong_100}</td>
                    <td>${exp.Comp_22_100}</td>
                    <td>${exp.Density}</td>
                    <td>${exp.matching_score}</td>
                `;
                experimentsTableBody.appendChild(row);
            });
        } catch (error) {
            console.error(error);
            alert('Impossible de charger les expériences.');
        }
    }

    // Gestionnaire de soumission du formulaire
    featuresForm.addEventListener('submit', (event) => {
        event.preventDefault();

        // Récupérer les données du formulaire
        const formData = new FormData(featuresForm);
        const features = [];

        for (let [key, value] of formData.entries()) {
            const [featureName, field] = key.split('-');
            if (!features[featureName]) {
                features[featureName] = { name: featureName };
            }
            if (field === 'cond') {
                features[featureName].cond = value;
            }
            if (field === 'val') {
                features[featureName].val = parseFloat(value);
            }
        }

        // Convertir l'objet en tableau
        const featuresArray = Object.values(features);

        // Envoyer les données au backend pour charger les expériences
        loadExperiments(featuresArray);
    });

    // Charger les caractéristiques au chargement de la page
    loadFeatures();
});
