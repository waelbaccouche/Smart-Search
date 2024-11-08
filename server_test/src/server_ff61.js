"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var pandas_js_1 = require("pandas-js");
var Papa = require("papaparse");
var fs = require("fs");
var path_1 = require("path");
// Définir les données des caractéristiques (noms uniquement)
var featureNames = [
    'S_elong_100',
    'Comp_22_100',
    'Density'
];
// Chemin vers le fichier CSV
var csvFile = 'C:\\Users\\waelb\\OneDrive\\Bureau\\myproject\\my-typescript-project\\src\\Data_clean.csv';
// Lire le fichier CSV
var csvData;
try {
    csvData = fs.readFileSync(csvFile, 'utf8');
}
catch (error) {
    console.error('Error reading the CSV file:', error);
    process.exit(1);
}
// Fonctions de traitement
function fitFeature(row, f_name, f_cond, f_val) {
    var checked = 1;
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
function nbFeature(row, l_f_name, l_f_cond, l_f_val) {
    return l_f_name.reduce(function (sum, f_name, i) {
        return sum + fitFeature(row, f_name, l_f_cond[i], l_f_val[i]);
    }, 0);
}
function computeMatchingScore(data, features) {
    return data.map(function (row) { return nbFeature(row, features.name, features.cond, features.val); });
}
var app = (0, express_1.default)();
var port = 3000;
// Middleware pour parser le JSON
app.use(express_1.default.json());
// Servir les fichiers statiques du frontend
app.use(express_1.default.static(path_1.default.join(__dirname, '..', 'frontend')));
// Endpoint pour obtenir les caractéristiques (noms uniquement)
app.get('/api/features', function (req, res) {
    var features = featureNames.map(function (name) { return ({ name: name }); });
    res.json(features);
});
// Endpoint pour obtenir les expériences (acceptant POST)
app.post('/api/experiments', function (req, res) {
    var userFeatures = req.body.features;
    if (!userFeatures || !Array.isArray(userFeatures)) {
        return res.status(400).send('Invalid features data');
    }
    // Vérifier que toutes les caractéristiques sont fournies
    var providedFeatureNames = userFeatures.map(function (f) { return f.name; });
    var missingFeatures = featureNames.filter(function (name) { return !providedFeatureNames.includes(name); });
    if (missingFeatures.length > 0) {
        return res.status(400).json({ error: "Missing features: ".concat(missingFeatures.join(', ')) });
    }
    Papa.parse(csvData, {
        header: true,
        complete: function (results) {
            if (results.errors.length > 0) {
                console.error('Parsing errors:', results.errors);
                res.status(500).send('Error parsing CSV data');
                return;
            }
            var df_exp_data = new pandas_js_1.DataFrame(results.data);
            var transformedFeatures = {
                name: userFeatures.map(function (feature) { return feature.name; }),
                cond: userFeatures.map(function (feature) { return feature.cond; }),
                val: userFeatures.map(function (feature) { return feature.val; })
            };
            var scores = computeMatchingScore(results.data, transformedFeatures);
            var dataWithScores = results.data.map(function (row, index) {
                return __assign(__assign({}, row), { matching_score: scores[index] });
            });
            dataWithScores.sort(function (a, b) { return (b.matching_score || 0) - (a.matching_score || 0); });
            var limitedResults = dataWithScores.slice(0, 8);
            res.json(limitedResults);
        }
    });
});
// Route par défaut pour servir index.html
app.get('/', function (req, res) {
    res.sendFile(path_1.default.join(__dirname, '..', 'frontend', 'index.html'));
});
// Démarrer le serveur
app.listen(port, function () {
    console.log("Server running on http://localhost:".concat(port));
});
