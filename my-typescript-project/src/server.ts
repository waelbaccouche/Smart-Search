import express from 'express';
import { DataFrame } from 'pandas-js';
import * as Papa from 'papaparse';
import * as fs from 'fs';

// Définir le type pour les lignes de données
type DataRow = { [key: string]: any };

// Fonction pour obtenir les caractéristiques définies
function getEnteredFeatures(): DataFrame {
    const df_features = new DataFrame([]); // Créer un DataFrame vide
    return df_features;
}

// Définir les données des caractéristiques
const featuresData: DataRow[] = [
    { name: 'S_elong_100', cond: '>=', val: 2.8 },
    { name: 'Comp_22_100', cond: '=', val: 35 },
    { name: 'Density', cond: '<', val: 10 }
];

// Créer un DataFrame à partir des données des caractéristiques
const features = new DataFrame(featuresData);

// Fonction pour lire les expériences existantes
function readExistingExp(): DataFrame {
    const df_exp_data = new DataFrame(); // Créer un DataFrame vide
    return df_exp_data;
}

// Lire le fichier CSV
const csvFile = 'C:\\Users\\waelb\\OneDrive\\Bureau\\myproject\\my-typescript-project\\src\\Data_clean.csv';

let csvData: string;
try {
    csvData = fs.readFileSync(csvFile, 'utf8');
} catch (error) {
    console.error('Error reading the CSV file:', error);
    process.exit(1);
}

const app = express();
const port = 3000;

app.use(express.json());

app.get('/api/features', (req, res) => {
    res.json(featuresData);
});

app.get('/api/experiments', (req, res) => {
    Papa.parse<DataRow>(csvData, {
        header: true,
        complete: (results) => {
            if (results.errors.length > 0) {
                console.error('Parsing errors:', results.errors);
                res.status(500).send('Error parsing CSV data');
                return;
            }
            
            const df_exp_data = new DataFrame(results.data);
            const transformedFeatures = {
                name: featuresData.map(feature => feature.name),
                cond: featuresData.map(feature => feature.cond),
                val: featuresData.map(feature => feature.val)
            };

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

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
