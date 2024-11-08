import express from 'express';
import { DataFrame } from 'pandas-js';
import * as Papa from 'papaparse';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as kmeans from 'ml-kmeans';

type DataRow = { [key: string]: any };

// Définir les données des caractéristiques
const featuresData: DataRow[] = [
    { name: 'S_elong_100', cond: '>=', val: 2.8 },
    { name: 'Comp_22_100', cond: '=', val: 35 },
    { name: 'Density', cond: '<', val: 10 }
];

// Fonction pour lire le fichier CSV
const csvFile = 'C:\\Users\\waelb\\OneDrive\\Bureau\\myproject\\my-typescript-project\\src\\Data_clean.csv';

let csvData: string;
try {
    csvData = fs.readFileSync(csvFile, 'utf8');
} catch (error) {
    console.error('Error reading the CSV file:', error);
    process.exit(1);
}

// Fonctions de traitement
function positionValeur(serie: number[], val: number): number {
    const s = _.sortBy(serie);
    try {
        const index = _.findIndex(s, v => v >= val);
        return index / (s.length - 1);
    } catch {
        return Math.max(...s);
    }
}

function matchingScore(series: number[], val: number, target: number): number {
    const pv = positionValeur(series, val);
    const pc = positionValeur(series, target);
    const M = Math.max(pc, 1 - pc);
    return (M - Math.abs(pc - pv)) / M;
}

function fitFeature(series: number[], row: DataRow, f_name: string, f_cond: string, f_val: number): number {
    if (row[f_name] === 99999.0) {
        return 0;
    }
    let fit: number;
    switch (f_cond) {
        case "=":
            fit = matchingScore(series, row[f_name], f_val);
            break;
        case "<":
            fit = row[f_name] < f_val ? 1 : matchingScore(series, row[f_name], f_val);
            break;
        case "<=":
            fit = row[f_name] <= f_val ? 1 : matchingScore(series, row[f_name], f_val);
            break;
        case ">":
            fit = row[f_name] > f_val ? 1 : matchingScore(series, row[f_name], f_val);
            break;
        case ">=":
            fit = row[f_name] >= f_val ? 1 : matchingScore(series, row[f_name], f_val);
            break;
        default:
            fit = 0;
    }
    return fit;
}

function nbFeature(data: DataRow[], row: DataRow, l_f_name: string[], l_f_cond: string[], l_f_val: number[]): number {
    return _.round(
        _.sum(l_f_name.map((name, i) => fitFeature(
            data.map(item => item[name]), 
            row, 
            name, 
            l_f_cond[i], 
            l_f_val[i]
        ))) *
        100 /
        l_f_name.length,
        1
    );
}

function computeMatchingScore(data: DataRow[], features: { name: string[], cond: string[], val: number[] }): number[] {
    const { name, cond, val } = features;
    return data.map(row => nbFeature(data, row, name, cond, val));
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

            const transformedFeatures = {
                name: featuresData.map(feature => feature.name),
                cond: featuresData.map(feature => feature.cond),
                val: featuresData.map(feature => feature.val)
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

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
