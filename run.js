const fn = require ('./functions')
const parser = require('./parser');

// // *********** raw data to be parsed ***********
let mcData = parser.parseRawData('mckesson.tsv')
let ourData = parser.parseRawData('ndc_packageInfo_2.txt')
let abcData = parser.parseRawData('ABCCatalog.txt')
let ndclist = parser.parseOneColumn('allNDCs.txt')
let packData = parser.parseRawData('package.txt')
let prodData = parser.parseRawData('product.txt')

console.log('Test Output:');
// // *********** tests to be run ***********

let inABCNotOurs = fn.findMissingItems(fn.organizeByNDC(abcData), fn.organizeByNDC(ourData));
let inMCKesNotOurs = fn.findMissingItems(fn.organizeByNDC(mcData), fn.organizeByNDC(ourData));
let ABCMcKessonSizeMatches = [];
let mcKesABCDifferences = fn.packSizeChecker(fn.organizeByNDC(abcData), fn.organizeByNDC(mcData), '', ABCMcKessonSizeMatches);

let ourDataOrganized = fn.organizeByNDC(ourData)
  // next three lines work to add package size differences to our data
fn.packSizeChecker(ourDataOrganized, fn.organizeByNDC(abcData), '1');
fn.packSizeChecker(ourDataOrganized, fn.organizeByNDC(mcData), '1');
fn.packSizeChecker(ourDataOrganized, fn.organizeByNDC(packData), '1');

let allMissing = fn.mergeNDCLists(inABCNotOurs, inMCKesNotOurs);
let missingAndAgree = fn.returnNDCOverlap(ABCMcKessonSizeMatches, allMissing);

// next line checks for CLI input to determine which ndcs to include in output files
const cliInput = process.argv[2];

// ******** use the createSpreadsheetData function to create files that can be read by excel, numbers, etc. ********
/* createSpreadsheetData takes an object as the first argument, a string as an optional second argument
 to name the output .txt file, and an array of NDC's as an optional third argument to filter what to include in the file*/

// fn.createSpreadsheetData(fn.organizeByNDC(abcData), 'matchesMissing', missingAndAgree, cliInput)
// fn.createSpreadsheetData(fn.organizeByNDC(ourData), 'unreconcilableDifs', mcKesABCDifferences, cliInput)

fn.createSpreadsheetData(ourDataOrganized, 'ourDataWithMorePackageSizeColumns', ndclist, cliInput)
fn.createSpreadsheetData(ourDataOrganized, 'matchingPackageSizeData', ABCMcKessonSizeMatches, cliInput)

