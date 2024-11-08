import { DataFrame } from 'pandas-js';
import * as Papa from 'papaparse';
import * as fs from 'fs';
import * as _ from 'lodash';


type DataRow = { [key: string]: any };


// Define feature data
const featuresData: DataRow[] = [
    { name: 'S_elong_100', cond: '>=', val: 2.5, mandatory:1 },
    { name: 'Comp_22_100', cond: '=', val: 35, mandatory:0 },
    { name: 'Density', cond: '<', val: 10, mandatory:1 }
];

// Create a DataFrame from the feature data with specified columns
const features = new DataFrame(featuresData);

// Display the DataFrame created from example data
console.log('Manual entering for dev testing:');
console.log(features.toString());

// Function to read existing experiments
function readExistingExp(): DataFrame {
    const df_exp_data = new DataFrame(); // Create an empty DataFrame
    return df_exp_data;
}

// Use the function to get existing experiment data
const data = readExistingExp();


/* --------------------------------------------------------------------------------------------------------------------- */


const csvFile = 'C:\\Users\\waelb\\OneDrive\\Bureau\\myproject\\my-typescript-project\\src\\Data_clean.csv';

// Read the CSV file as a string
let csvData: string;
try {
    csvData = fs.readFileSync(csvFile, 'utf8');
} catch (error) {
    console.error('Error reading the CSV file:', error);
    process.exit(1);
}

Papa.parse<DataRow>(csvData, {
    header: true,
    complete: (results) => {
        if (results.errors.length > 0) {
            console.error('Parsing errors:', results.errors);
        } else {
            const df_exp_data = new DataFrame(results.data);
            console.log('Parsed CSV data:');
            
            const rowCount = results.data.length;
            const colCount = results.data.length > 0 ? Object.keys(results.data[0]).length : 0;

            console.log(`Number of rows: ${rowCount}`);
            console.log(`Number of columns: ${colCount}`);
            
            //const firstFewRows = results.data.slice(0, 3);
            //console.log(firstFewRows); // Show the first rows with column names
        
        
        /* --------------------------------------------------------------------------------------------------------------------- */



// Add this to your existing code
const mandatoryFeatures = featuresData.filter((row) => row.mandatory === 1);
const nonMandatoryFeatures = featuresData.filter((row) => row.mandatory === 0);


// Transform featuresData to the expected format
const transformedFeatures = {
    name: featuresData.map(feature => feature.name),
    cond: featuresData.map(feature => feature.cond),
    val: featuresData.map(feature => feature.val)
};


const transformedMandatoryFeatures = {
    name: mandatoryFeatures.map(feature => feature.name),
    cond: mandatoryFeatures.map(feature => feature.cond),
    val: mandatoryFeatures.map(feature => feature.val),
    mandatory: mandatoryFeatures.map(feature => feature.mandatory)
};

const transformedNonMandatoryFeatures = {
    name: nonMandatoryFeatures.map(feature => feature.name),
    cond: nonMandatoryFeatures.map(feature => feature.cond),
    val: nonMandatoryFeatures.map(feature => feature.val),
    mandatory: nonMandatoryFeatures.map(feature => feature.mandatory)
};

// Compute matching scores and add to data
const matching_score = computeMatchingScore(results.data, transformedMandatoryFeatures);
console.log('Matching scores 1:', matching_score);

// Compute matching scores and add to data
const matching_score2 = computeMatchingScore(results.data, transformedNonMandatoryFeatures);
console.log('Matching scores 2:', matching_score2);

// Add matching scores to the data
const dataWithScores: DataRow[] = results.data.map((row: DataRow, index: number) => {
    return { ...row, matching_score1: matching_score[index], matching_score2: matching_score2[index] };
});

// Sort data by matching scores
dataWithScores.sort((a, b) => {
    if (a.matching_score < b.matching_score) return 1;
    if (a.matching_score > b.matching_score) return -1;
    if (a.matching_score2 < b.matching_score2) return 1;
    if (a.matching_score2 > b.matching_score2) return -1;
    return 0;
  });

  
// Limit the number of results (e.g., top 8 results)
const limitedResults = dataWithScores.slice(0, 3);

console.log('Top matching experiments:', limitedResults);
  
        }}});

/* --------------------------------------------------------------------------------------------------------------------- */

// Function to get the matching score between 0 and 1
function matchingScore(serie: number[], val: number, target: number): number {
    const filteredSerie = serie.filter(s => s < 9999);
    const minDist = Math.min(...filteredSerie.map(s => Math.abs(s - target)));
    const maxDist = Math.max(...filteredSerie.map(s => Math.abs(s - target)));
    return 1 - (Math.abs(val - target) - minDist) / (maxDist - minDist);
}


// Function to fit feature based on condition
function fitFeature(serie: number[], row: DataRow, f_name: string, f_cond: string, f_val: number): number {
    if (row[f_name] >= 99999.0) {
        return 0;
    }
    let fit: number;
    switch (f_cond) {
        case "=":
            fit = matchingScore(serie, row[f_name], f_val);
            break;
        case "<":
            fit = row[f_name] < f_val ? 1 : matchingScore(serie.filter(s => s >= f_val), row[f_name], f_val);
            break;
        case "<=":
            fit = row[f_name] <= f_val ? 1 : matchingScore(serie.filter(s => s > f_val), row[f_name], f_val);
            break;
        case ">":
            fit = row[f_name] > f_val ? 1 : matchingScore(serie.filter(s => s <= f_val), row[f_name], f_val);
            break;
        case ">=":
            fit = row[f_name] >= f_val ? 1 : matchingScore(serie.filter(s => s < f_val), row[f_name], f_val);
            break;
        default:
            fit = 0;
    }
    return fit;
}


// Function to compute scores for each feature and convert it to a score between 0 and 100
function nbFeature(data: DataRow[], row: DataRow, l_f_name: string[], l_f_cond: string[], l_f_val: number[]): number {
    const totalFit = l_f_name.reduce((sum, f_name, i) => {
        return sum + fitFeature(
            data.map(d => d[f_name]),
            row,
            f_name,
            l_f_cond[i],
            l_f_val[i]
        );
    }, 0);
    return _.round((totalFit * 100) / l_f_name.length, 1);
}


// Function to compute matching scores for all rows in the dataset
function computeMatchingScore(data: DataRow[], features: { name: string[], cond: string[], val: number[] }): number[] {
    return data.map(row => nbFeature(data, row, features.name, features.cond, features.val));
}