const fn = require ('./functions')
const parser = require('./parser');

let mcData = parser.fileToObject('mckesson.tsv')
let ourData = parser.fileToObject('ndc_packageInfo_2.txt')
let abcData = parser.fileToObject('ABCCatalog.txt')
let packData = parser.fileToObject('package.txt')
// let prodData = parser.fileToObject('product.txt')

let ndc1 = 83490020760;
let ndc2 = '00002143611';
let ndc3 = '00006022128';
let ndc4 = '78206-176-01';
let ndc5 = '91204015701'; // ndc doesn't exist
let ndc6 = '912345040157010'; // ndc can't exist

let ans1 = 240;
let ans2 = 1;
let ans3 = 100;
let ans4 = 30;
let ans5 = null;
let ans6 = null;

const check = (ndc, num) => {
  let ans = fn.determinePackageSize(ndc, [abcData, mcData, ourData, packData]);
  let call = ans === num ? 'Correct' : `Incorrect, should be ${num}`;
  console.log(`${ans === num}  For NDC ${ndc} calculated package size ${ans} is ${call}`);
}

check(ndc1, ans1)
check(ndc2, ans2)
check(ndc3, ans3)
check(ndc4, ans4)
check(ndc5, ans5)
check(ndc6, ans6)

/* Edge Cases to Consider
78670-130-02 = 2 syringes of .3ml each
78206011101 = 1 CANISTER in 1 CARTON (78206-111-01)  / 120 AEROSOL in 1 CANISTER
76282-679-42 = 1 CANISTER in 1 CARTON (76282-679-42)  / 200 INHALANT in 1 CANISTER
*/

// creates output file of calculated sizes
// let output = {};
// let checkAll = () => {
// for (let i = 0; i < ndcList.length; i ++) {
//   output[ndcList[i]] = {}
//   output[ndcList[i]].NDC = ndcList[i];
//   output[ndcList[i]]['calculatedSize']= fn.determinePackageSize(ndcList[i], [abcData, mcData, ourData, packData]);
// }
// }

// checkAll()
// fn.createTxtFile(output, 'officialNumbers');
