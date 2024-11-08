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
// Function to get the entered features (not changed)
function getEnteredFeatures() {
    const df_features = new pandas_js_1.DataFrame([]); // Create an empty DataFrame
    return df_features;
}
// Define the featuresData with conditions (not changed)
const featuresData = [
    { name: 'S_elong_100', cond: '>=', val: 2.8 },
    { name: 'Comp_22_100', cond: '=', val: 35 },
    { name: 'Density', cond: '<', val: 10 }
];
// Create a DataFrame from featuresData (not changed)
const features = new pandas_js_1.DataFrame(featuresData);
// Print the DataFrame created from featuresData (not changed)
console.log('Manual entering for dev testings:');
console.log(features.toString());
// Function to read existing experiments (not changed)
function readExistingExp() {
    const df_exp_data = new pandas_js_1.DataFrame(); // Create an empty DataFrame
    return df_exp_data;
}
// Use the function to get the data of existing experiments (not changed)
const data = readExistingExp();
// Read the CSV file path
const csvFile = 'C:\\Users\\waelb\\OneDrive\\Bureau\\myproject\\my-typescript-project\\src\\Data_clean.csv';
// Read the CSV file content as a string
const csvData = fs.readFileSync(csvFile, 'utf8');
// Parse the CSV data using PapaParse
Papa.parse(csvData, {
    header: true,
    complete: (results) => {
        if (results.errors.length > 0) {
            console.error('Parsing errors:', results.errors);
        }
        else {
            // Create a DataFrame from the parsed CSV data
            const df_exp_data = new pandas_js_1.DataFrame(results.data);
            console.log('Parsed CSV data:');
            const rowCount = results.data.length;
            const colCount = results.data[0] ? Object.keys(results.data[0]).length : 0; // Number of columns
            console.log(`Number of rows: ${rowCount}`);
            console.log(`Number of columns: ${colCount}`);
            // Define function to check if a row meets all feature conditions
            function checkAllFeatures(row) {
                let matchScore = 0;
                featuresData.forEach(feature => {
                    const { name, cond, val } = feature;
                    switch (cond) {
                        case '>=':
                            if (row[name] >= val) {
                                matchScore++;
                            }
                            break;
                        case '=':
                            if (row[name] === val) {
                                matchScore++;
                            }
                            break;
                        case '<':
                            if (row[name] < val) {
                                matchScore++;
                            }
                            break;
                        case '<=':
                            if (row[name] <= val) {
                                matchScore++;
                            }
                            break;
                        case '>':
                            if (row[name] > val) {
                                matchScore++;
                            }
                            break;
                        default:
                            break;
                    }
                });
                return matchScore;
            }
            // Compute matching scores and add to data
            const matchingScores = results.data.map((row) => ({
                ...row,
                matching_score: checkAllFeatures(row)
            }));
            // Sort the data by matching score in descending order
            matchingScores.sort((a, b) => b.matching_score - a.matching_score);
            // Limit the number of results (e.g., top 8 results)
            const topMatchingExperiments = matchingScores.slice(0, 8);
            console.log('Top matching experiments:', topMatchingExperiments);
        }
    }
});
