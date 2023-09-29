const fn = require ('./functions')
const parser = require('./parser');

console.log('Parsing Raw Data......');
let mcData = parser.fileToObject('mckesson.tsv')
let ourData = parser.fileToObject('ndc_packageInfo_2.txt')
let abcData = parser.fileToObject('ABCCatalog.txt')
let packData = parser.fileToObject('package.txt')
let prodData = parser.fileToObject('product.txt')

// *********** organize raw data into objects with ndcs as keys ***********
let ourDataByNDC = fn.organizeByNDC(ourData);
let ourDataDescriptions = ourDataByNDC; // duplicate of above to use for comparing descriptions
let packDataByNDC = fn.organizeByNDC(packData);

// compare data found in mckesson and fda files to create custom descriptions and add to our data;
let newDescriptions = fn.getDescriptions(ourDataDescriptions, fn.organizeByNDC(mcData), fn.organizeByNDC(packData), fn.organizeByNDC(prodData))

fn.packSizeChecker(ourDataByNDC, fn.organizeByNDC(abcData));
fn.packSizeChecker(ourDataByNDC, fn.organizeByNDC(mcData));
fn.packSizeChecker(ourDataByNDC, packDataByNDC);
fn.packSizeChecker(ourDataByNDC, fn.organizeByNDC(prodData));

fn.packSizeChecker(packDataByNDC, fn.organizeByNDC(abcData));
fn.packSizeChecker(packDataByNDC, fn.organizeByNDC(mcData));
fn.packSizeChecker(packDataByNDC, fn.organizeByNDC(prodData));

fn.combineObjects(ourDataByNDC, fn.organizeByNDC(mcData));
fn.combineObjects(ourDataByNDC, fn.organizeByNDC(abcData));
fn.combineObjects(ourDataByNDC, packDataByNDC);

// createTxtFile creates a .txt file, takes an object as the first argument, a string as an optional second argument
fn.createTxtFile(packDataByNDC, 'recommended_additions')
fn.createTxtFile(ourDataByNDC, 'allDataAllInfo')
fn.createTxtFile(newDescriptions, 'ourDataMoreDescriptions')
