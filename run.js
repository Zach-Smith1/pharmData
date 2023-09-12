const fn = require ('./functions')
const parser = require('./parser');

// *********** raw data to be parsed ***********
let mcData = parser.parseRawData('mckesson.tsv')
let ourData = parser.parseRawData('ndc_packageInfo_2.txt')
let abcData = parser.parseRawData('ABCCatalog.txt')
let ndclist = parser.parseOneColumn('allNDCs.txt')
let packData = parser.parseRawData('package.txt')
let prodData = parser.parseRawData('product.txt')

console.log('Test Output:');
// *********** tests to be run ***********
let ourDataByNDC = fn.organizeByNDC(ourData);
let ourDataDescriptions = ourDataByNDC; // duplicate of above to use for comparing descriptions
let packDataByNDC = fn.organizeByNDC(packData);

let inABCNotOurs = fn.findMissingItems(fn.organizeByNDC(abcData), ourDataByNDC);
let inMCKesNotOurs = fn.findMissingItems(fn.organizeByNDC(mcData), ourDataByNDC);
let inPackageNotOurs = fn.findMissingItems(packDataByNDC, ourDataByNDC);
let inOursNotProduct = fn.findMissingItems(ourDataByNDC, fn.organizeByNDC(prodData)); /* arguments must be in this order because prodData has only 9 digit ndcs*/
let ABCMcKessonSizeMatches = [];
let mcKesABCDifferences = fn.packSizeChecker(fn.organizeByNDC(abcData), fn.organizeByNDC(mcData), '', ABCMcKessonSizeMatches);

// compare data found in mckesson and fda files to create custom descriptions and add to our data;
let newDescriptions = fn.getDescriptions(ourDataDescriptions, fn.organizeByNDC(mcData), fn.organizeByNDC(packData), fn.organizeByNDC(prodData))

// next 4 lines work to add package size differences and extra columns to our data
fn.packSizeChecker(ourDataByNDC, fn.organizeByNDC(abcData), '1');
fn.packSizeChecker(ourDataByNDC, fn.organizeByNDC(mcData), '1');
fn.packSizeChecker(ourDataByNDC, packDataByNDC, '1');
fn.packSizeChecker(ourDataByNDC, fn.organizeByNDC(prodData), '1', null, 'prod'); /* arguments must be in this order because prodData has only 9 digit ndcs*/

// next 3 lines work to add package size differences and extra columns to package data
fn.packSizeChecker(packDataByNDC, fn.organizeByNDC(abcData), '1');
fn.packSizeChecker(packDataByNDC, fn.organizeByNDC(mcData), '1');
fn.packSizeChecker(packDataByNDC, fn.organizeByNDC(prodData), '1', null, 'prod');

let mostMissing = fn.mergeNDCLists(inABCNotOurs, inMCKesNotOurs);
let allMissing = fn.mergeNDCLists(mostMissing, inPackageNotOurs);

/* let missingAndAgree = fn.returnNDCOverlap(ABCMcKessonSizeMatches, allMissing);  omit this line since we are using allMissing instead */

// make a master object with all info possible
fn.combineObjects(ourDataByNDC, fn.organizeByNDC(mcData));
fn.combineObjects(ourDataByNDC, fn.organizeByNDC(abcData));
fn.combineObjects(ourDataByNDC, packDataByNDC);

// next line checks for CLI input to determine which ndcs to include in output files
const cliInput = process.argv[2];

// ******** use the createSpreadsheetData function to create files that can be read by excel, numbers, etc. ********
/* createSpreadsheetData takes an object as the first argument, a string as an optional second argument
 to name the output .txt file, and an array of NDC's as an optional third argument to filter what to include in the file*/

fn.createSpreadsheetData(packDataByNDC, 'recommended_additions', null, cliInput)
fn.createSpreadsheetData(ourDataByNDC, 'allDataAllInfo', null, cliInput)
fn.createSpreadsheetData(newDescriptions, 'ourDataMoreDescriptions', null, cliInput)
