const fs = require('fs');
const parser = require('./parser');

const data = parser.ObjOfObjs;
const ourData = parser.ourObj;

const dataByNDC = {};
const ourDataByNDC = {};
const joinedDataByNDC = {};

// functions describing tests to run on data
checkNDCs = (obj) => {
  const dupes = {};
  let dupCount = 0;
  const ref = {};
  for (const key in obj) {
    if (ref[obj[key].NDC] === undefined) {
      ref[obj[key].NDC] = [key];
    } else {
      ref[obj[key].NDC].push(key);
      dupCount ++;
    }
  }
  console.log(`\t${dupCount} duplicates(s) found`)
  if (dupCount > 0) {
    for (const key in ref) {
      if (ref[key].length > 1) {
        let prop = 'NDC_'+key;
        dupes[prop] = ref[key].join(', ');
      }
    }
    return dupes
  }
}

organizeByNDC = (data) => {
  let organizedByNDC = {};
  for (const item in data) {
    organizedByNDC[data[item].NDC] = data[item];
  }
  return organizedByNDC
}

findMissingItems = (largerFile, smallerFile) => {
  let count = 0; missingItems = [];
  for (const ndc in largerFile) {
    if (smallerFile[ndc] === undefined) {
      count++;
      missingItems.push(ndc);
    } /*else {
      joinedDataByNDC[ndc] = { 1: largerFile[ndc], 2: smallerFile[ndc] };
    }*/
  }
  if (count > 0) {
    console.log(`\t${count} items found in larger file not present in smaller file`);
    return missingItems
  }
}

packSizeChecker = (largerFile, smallerFile) => {
  let differences = {};
  let count = 0;
  let sameCount = 0;
  let noData = 0;
  for (const ndc in largerFile) {
    if (smallerFile[ndc]) {
      if (smallerFile[ndc].packageSizeNCPDP == largerFile[ndc].GenericManufactureSizeAmount * largerFile[ndc]['Pkg Size Multiplier']) {
        sameCount++;
      } else if (smallerFile[ndc].packageSizeNCPDP === '') {
        noData++;
      } else {
        differences[ndc] = {'sizeDifference': Math.abs(smallerFile[ndc].packageSizeNCPDP - largerFile[ndc].GenericManufactureSizeAmount * largerFile[ndc]['Pkg Size Multiplier'])}
        count++;
      }
    }
  }
  console.log(`\t${count} package size discrepancies, ${sameCount} package size matches, ${noData} blank columns`);
  return differences
}

createSpreadsheetData = (data, name, list) => {
  let row = 0; name = name || 'outputFile';
  if (list) {
    list.forEach((ndc) => {
      let rows = '';
      for (const key in data[ndc]) {
        if (['NDC', 'SellDescription', 'GenericManufactureSizeAmount', 'Pkg Size Multiplier', 'GenericIndicator'].includes(key)) {
          if (row === 0) {
            rows += `${key}\t`;
          } else {
            rows += `${data[ndc][key]}\t`;
          }
        }
      }
      rows += '\n';
      if (row === 0) {
        fs.writeFileSync(`${name}.txt`, rows, (err) => {
          if (err) console.log(err); return;
        })
        console.log('New File Created!');
        row = 1;
      } else {
        fs.appendFile(`${name}.txt`, rows, (err) => {
          if (err) console.log(err);
        })
      }
    })
  } else {
    for (const ndc in data) {
      let rows = '';
      for (const key in data[ndc]) {
        if (['NDC', 'SellDescription', 'GenericManufactureSizeAmount', 'Pkg Size Multiplier', 'GenericIndicator'].includes(key)) {
          if (row === 0) {
            rows += `${key}\t`;
          } else {
            rows += `${data[ndc][key]}\t`;
          }
        }
      }
      rows += '\n'
      if (row === 0) {
        fs.writeFileSync(`${name}.txt`, rows, (err) => {
          if (err) console.log(err); return;
        })
        console.log('New File Created!');
        row = 1;
      } else {
        fs.appendFile(`${name}.txt`, rows, (err) => {
          if (err) console.log(err);
        })
      }
    }
  }
}

console.log('Test Output:');

// tests to be run
let duplicates = checkNDCs(data);
// organizeByNDC()
let missing = findMissingItems(organizeByNDC(data), organizeByNDC(ourData));

const differences = packSizeChecker(organizeByNDC(data), organizeByNDC(ourData))

// the makeFile function takes an object as the first argument and an array of NDC's as an optional second argument to create a file called outputFile.txt

// createSpreadsheetData(dataByNDC, 'missingDataFromMcKesson', inMcsNotOurs)





