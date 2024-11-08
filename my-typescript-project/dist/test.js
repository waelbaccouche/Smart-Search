"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const pandas_js_1 = require("pandas-js");
const Papa = __importStar(require("papaparse"));
const fs = __importStar(require("fs"));
// Fonction pour obtenir les fonctionnalités saisies
function getEnteredFeatures() {
    const df_features = new pandas_js_1.DataFrame([]); // Création d'un DataFrame vide
    return df_features;
}
// Définition des données de fonctionnalités
const featuresData = [
    { name: 'S_elong_100', cond: '>=', val: 2.8 },
    { name: 'Comp_22_100', cond: '=', val: 35 },
    { name: 'Density', cond: '<', val: 10 }
];
// Création du DataFrame à partir des données avec spécification des colonnes
const features = new pandas_js_1.DataFrame(featuresData);
// Affichage du DataFrame créé à partir des données d'exemple
console.log('Manual entering for dev testings:');
console.log(features.toString());
// Fonction pour lire les expériences existantes
function readExistingExp() {
    const df_exp_data = new pandas_js_1.DataFrame(); // Crée un DataFrame vide
    return df_exp_data;
}
// Utilisation de la fonction pour obtenir les données d'expériences existantes
const data = readExistingExp();
/* --------------------------------------------------------------------------------------------------------------------- */
// Read the CSV file
const csvFile = 'C:\\Users\\waelb\\OneDrive\\Bureau\\myproject\\my-typescript-project\\src\\Data_clean.csv';
// Read the CSV file as a string
const csvData = fs.readFileSync(csvFile, 'utf8');
Papa.parse(csvData, {
    header: true,
    complete: (results) => {
        if (results.errors.length > 0) {
            console.error('Parsing errors:', results.errors);
        }
        else {
            const df_exp_data = new pandas_js_1.DataFrame(results.data);
            console.log('Parsed CSV data:');
            const rowCount = results.data.length;
            const colCount = results.data.length;
            console.log(`Number of rows: ${rowCount}`);
            console.log(`Number of columns: ${colCount}`);
            //           const firstFewRows = results.data.slice(0, 1);
            //          console.log(firstFewRows); // show the first row with column names
            /* --------------------------------------------------------------------------------------------------------------------- */
            // Define fitFeature function
            function fitFeature(row, f_name, f_cond, f_val) {
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
            // Define nbFeature function
            function nbFeature(row, l_f_name, l_f_cond, l_f_val) {
                return l_f_name.reduce((sum, f_name, i) => {
                    return sum + fitFeature(row, f_name, l_f_cond[i], l_f_val[i]);
                }, 0);
            }
            // Define computeMatchingScore function
            function computeMatchingScore(data, features) {
                return data.map(row => nbFeature(row, features.name, features.cond, features.val));
            }
            /* --------------------------------------------------------------------------------------------------------------------- */
            // Transform featuresData to the expected format
            const transformedFeatures = {
                name: featuresData.map(feature => feature.name),
                cond: featuresData.map(feature => feature.cond),
                val: featuresData.map(feature => feature.val)
            };
            console.log('transformedFeatures:', transformedFeatures);
            // Compute matching scores and add to data
            const scores = computeMatchingScore(results.data, transformedFeatures);
            console.log('Matching scores:', scores);
            /* --------------------------------------------------------------------------------------------------------------------- */
            // Add matching scores to the data
            const dataWithScores = results.data.map((row, index) => {
                return { ...row, matching_score: scores[index] };
            });
            // Sort the data by matching score in descending order
            dataWithScores.sort((a, b) => (b.matching_score || 0) - (a.matching_score || 0));
            // Limit the number of results (e.g., top 8 results)
            const limitedResults = dataWithScores.slice(0, 8);
            console.log('Top matching experiments:', limitedResults);
        }
    }
});
