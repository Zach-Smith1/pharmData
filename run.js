const fn = require ('./functions')
const parser = require('./parser');

console.log('Parsing Raw Data......');
let mcData = parser.fileToObject('mckesson.tsv')
let ourData = parser.fileToObject('ndc_packageInfo_2.txt')
let abcData = parser.fileToObject('ABCCatalog.txt')
let packData = parser.fileToObject('package.txt')
let prodData = parser.fileToObject('product.txt')
let ourDataDescriptions = ourData; // duplicate of above to use for comparing descriptions

// compare data found in mckesson and fda files to create custom descriptions and add to our data;
let newDescriptions = fn.getDescriptions(ourDataDescriptions, mcData, packData, prodData)

fn.packSizeChecker(ourData, abcData);
fn.packSizeChecker(ourData, mcData);
fn.packSizeChecker(ourData, packData);
fn.packSizeChecker(ourData, prodData);

fn.packSizeChecker(packData, abcData);
fn.packSizeChecker(packData, mcData);
fn.packSizeChecker(packData, prodData);

fn.combineObjects(ourData, mcData);
fn.combineObjects(ourData, abcData);
fn.combineObjects(ourData, packData);

// createTxtFile creates a .txt file, takes an object as the first argument, a string as an optional second argument
fn.createTxtFile(packData, 'recommended_additions')
fn.createTxtFile(ourData, 'allDataAllInfo')
fn.createTxtFile(newDescriptions, 'ourDataMoreDescriptions')
