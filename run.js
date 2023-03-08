const fn = require ('./functions')
const parser = require('./parser');

// checking runtime
const time = new Date();

// // *********** raw data to be parsed ***********
let mcData = parser.parseRawData('mckesson.tsv')
let ourData = parser.parseRawData('ndc_packageInfo_2.txt')

console.log('Test Output:');
// // *********** tests to be run ***********

let duplicates = fn.checkNDCs(mcData);
let missing = fn.findMissingItems(fn.organizeByNDC(mcData), fn.organizeByNDC(ourData));

let differences = fn.packSizeChecker(organizeByNDC(mcData), fn.organizeByNDC(ourData), '2')

let abc = parser.parseRawData('ABCCatalog.txt')
let ndclist = parser.parseOneColumn('allNDCs.txt')

// // ******** use the createSpreadsheetData function to create files that can be read by excel, numbers, etc. ********
// /* createSpreadsheetData takes an object as the first argument, a string as an optional second argument
//  to name the output .txt file, and an array of NDC's as an optional third argument to filter what to include in the file*/

fn.createSpreadsheetData(fn.organizeByNDC(mcData), 'missingDataFromMcKesson', missing)
fn.createSpreadsheetData(fn.organizeByNDC(mcData), 'mcKessonDuplicates', duplicates)
fn.createSpreadsheetData(fn.organizeByNDC(ourData), 'packageSizeDifferences', differences)
fn.createSpreadsheetData(fn.organizeByNDC(abc), 'abcOfNdcs', ndclist)

console.log(`Runtime: ${time.getMilliseconds()} milliseconds`)