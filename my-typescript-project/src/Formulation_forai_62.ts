import { DataFrame } from 'pandas-js';
import * as Papa from 'papaparse';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as kmeans from 'ml-kmeans';

type DataRow = { [key: string]: any };

// Function to get entered features
function getEnteredFeatures(): DataFrame {
    const df_features = new DataFrame([]); // Create an empty DataFrame
    return df_features;
}

// Define feature data
const featuresData: DataRow[] = [
    { name: 'S_elong_100', cond: '>=', val: 2.8 },
    { name: 'Comp_22_100', cond: '=', val: 35 },
    { name: 'Density', cond: '<', val: 10 }
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

            // Uncomment below to show the first 5 rows with column names
            // const firstFewRows = results.data.slice(0, 5);
            // console.log(firstFewRows);

            // Transform featuresData to the expected format
            const transformedFeatures = {
                name: featuresData.map(feature => feature.name),
                cond: featuresData.map(feature => feature.cond),
                val: featuresData.map(feature => feature.val)
            };

            // Compute matching scores and add to data
            const scores = computeMatchingScore(results.data, transformedFeatures);
            console.log('Matching scores:', scores);

            // Add matching scores to the data
            const dataWithScores: DataRow[] = results.data.map((row: DataRow, index: number) => {
                return { ...row, matching_score: scores[index] };
            });

            // Sort the data by matching score in descending order
            dataWithScores.sort((a, b) => (b.matching_score || 0) - (a.matching_score || 0));

            // Limit the number of results (e.g., top 8 results)
            const limitedResults = dataWithScores.slice(0, 1);

            console.log('Top matching experiments:', limitedResults);


        }
    }
});

/* --------------------------------------------------------------------------------------------------------------------- */
// Function to compute the position value between 0 and 1
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

// Function to compute the matching score for each feature
function computeMatchingScore(data: DataRow[], features: { name: string[], cond: string[], val: number[] }): number[] {
    const { name, cond, val } = features;

    // Map through each row in the data
    return data.map(row => nbFeature(data, row, name, cond, val));
}



/* --------------------------------------------------------------------------------------------------------------------- */