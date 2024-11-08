import express from 'express';
import { DataFrame } from 'pandas-js';
import * as Papa from 'papaparse';
import * as fs from 'fs';
import path from 'path';

// Définir le type pour les lignes de données
type DataRow = { [key: string]: any };

// Définir les noms des caractéristiques (sans conditions et valeurs)
const featureNames: string[] = [
    'S_elong_100',
    'Comp_22_100',
    'Density'
];

// Chemin vers le fichier CSV

const csvFile = 'C:\\Users\\waelb\\OneDrive\\Bureau\\script TypeScript\\my-typescript-project\\src\\Data_clean.csv';

// Fonction pour enlever le BOM si présent
const stripBom = (str: string) => str.replace(/^\uFEFF/, '');

// Lire le fichier CSV en enlevant le BOM
let csvData: string;
try {
    csvData = stripBom(fs.readFileSync(csvFile, 'utf8'));
} catch (error) {
    console.error('Error reading the CSV file:', error);
    process.exit(1);
}

// Fonctions de traitement
function fitFeature(row: any, f_name: string, f_cond: string, f_val: number): number {
    let checked = 1;
    switch (f_cond) {
        case "=":
            if (row[f_name] != f_val) {
                checked = 0;
            }
            break;
        case "<":
            if (row[f_name] >= f_val) {
                checked = 0;
            }
            break;
        case "<=":
            if (row[f_name] > f_val) {
                checked = 0;
            }
            break;
        case ">":
            if (row[f_name] <= f_val) {
                checked = 0;
            }
            break;
        case ">=":
            if (row[f_name] < f_val) {
                checked = 0;
            }
            break;
    }
    return checked;
}

function nbFeature(row: any, l_f_name: string[], l_f_cond: string[], l_f_val: number[]): number {
    return l_f_name.reduce((sum, f_name, i) => {
        return sum + fitFeature(row, f_name, l_f_cond[i], l_f_val[i]);
    }, 0);
}

function computeMatchingScore(data: any[], features: { name: string[], cond: string[], val: number[] }): number[] {
    return data.map(row => nbFeature(row, features.name, features.cond, features.val));
}

const app = express();
const port = 3000;

// Middleware pour parser le JSON
app.use(express.json());

// Servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Endpoint pour obtenir les caractéristiques (noms uniquement)
app.get('/api/features', (req, res) => {
    const features = featureNames.map(name => ({ name }));
    res.json(features);
});

// Endpoint pour obtenir les expériences (acceptant POST)
app.post('/api/experiments', (req, res) => {
    const userFeatures = req.body.features;

    if (!userFeatures || !Array.isArray(userFeatures)) {
        return res.status(400).send('Invalid features data');
    }

    // Vérifier que toutes les caractéristiques sont fournies
    const providedFeatureNames = userFeatures.map(f => f.name);
    const missingFeatures = featureNames.filter(name => !providedFeatureNames.includes(name));
    if (missingFeatures.length > 0) {
        return res.status(400).json({ error: `Missing features: ${missingFeatures.join(', ')}` });
    }

    Papa.parse<DataRow>(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            if (results.errors.length > 0) {
                console.error('Parsing errors:', results.errors);
                res.status(500).send('Error parsing CSV data');
                return;
            }

            // Log des en-têtes et de la première ligne
            console.log('CSV Headers:', results.meta.fields);
            console.log('First Row:', results.data[0]);

            const df_exp_data = new DataFrame(results.data);
            const transformedFeatures = {
                name: userFeatures.map(feature => feature.name),
                cond: userFeatures.map(feature => feature.cond),
                val: userFeatures.map(feature => feature.val)
            };

            const scores = computeMatchingScore(results.data, transformedFeatures);

            const dataWithScores: DataRow[] = results.data.map((row: DataRow, index: number) => {
                return { ...row, matching_score: scores[index] };
            });

            dataWithScores.sort((a, b) => (b.matching_score || 0) - (a.matching_score || 0));

            const limitedResults = dataWithScores.slice(0, 8);

            res.json(limitedResults);
        }
    });
});

// Route par défaut pour servir index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
