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

let calculatedTable = {};
let checkSizes = () => {
  for (let i = 0; i < ndcList.length; i++) {
    let output = fn.determinePackageSize(ndcList[i], [ourData, abcData, mcData, packData]);
    calculatedTable[ndcList[i]] = {}
    let calcRow = calculatedTable[ndcList[i]];
    calcRow.NDC = ndcList[i];
    calcRow['calculatedSize'] = output[0];
    calcRow['confidence'] = output[1];
    if (i === 0) { // make sure column names are included in first row
      calcRow['packageSizeNCPDP'] = '';
      calcRow['ABCPackageSize'] = '';
      calcRow['McKessonPackageSize'] = '';
      calcRow['FDAPackageSize'] = '';
    }
    for (const col in output[2]) {
        calcRow[col] = output[2][col]
    }
  }
}

checkSizes()

fn.createTxtFile(calculatedTable, 'calculatedSizes');
fn.createTxtFile(newDescriptions, 'ourDataMoreDescriptions')