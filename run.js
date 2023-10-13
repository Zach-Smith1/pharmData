const fn = require ('./functions')
const parser = require('./parser');

console.log('Parsing Raw Data......');
let mcData = parser.fileToObject('mckesson.tsv')
let ourData = parser.fileToObject('ndc_packageInfo_2.txt')
let abcData = parser.fileToObject('ABCCatalog.txt')
let packData = parser.fileToObject('package.txt')
let prodData = parser.fileToObject('product.txt')
let ndcList = parser.parseOneColumn('allNDCs.txt')

let newDescriptions = fn.getDescriptions({...ourData}, mcData, packData, prodData)

// fn.packSizeChecker(ourData, abcData);
// fn.packSizeChecker(ourData, mcData);
// fn.packSizeChecker(ourData, packData);
// fn.packSizeChecker(ourData, prodData);

// fn.packSizeChecker(packData, abcData);
// fn.packSizeChecker(packData, mcData);
// fn.packSizeChecker(packData, prodData);

// fn.combineObjects(ourData, mcData);
// fn.combineObjects(ourData, abcData);
// fn.combineObjects(ourData, packData);

let calculatedTable = {};
let checkSizes = () => {
  for (let i = 0; i < ndcList.length; i++) {
    let output = fn.determinePackageSize(ndcList[i], [abcData, mcData, ourData, packData]);
    calculatedTable[ndcList[i]] = {}
    let calcRow = calculatedTable[ndcList[i]];
    calcRow.NDC = ndcList[i];
    calcRow['calculatedSize'] = output[0];
    calcRow['confidence'] = output[1];
  }
}

checkSizes()

fn.createTxtFile(calculatedTable, 'calculatedSizes');
fn.createTxtFile(newDescriptions, 'ourDataMoreDescriptions')
// fn.createTxtFile(packData, 'recommended_additions')
// fn.createTxtFile(ourData, 'allDataAllInfo')