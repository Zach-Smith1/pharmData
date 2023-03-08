const fs = require('fs');

// *********** functions describing tests to run on data ***********
// takes a JSON object whose main keys are not NDCs and returns an array of duplicate NDCs
checkNDCs = (data) => {
  const dupes = [];
  let dupCount = 0;
  const ref = {};
  for (const key in data) {
    if (ref[data[key].NDC] === undefined) {
      ref[data[key].NDC] = 1;
    } else {
      dupes.push(data[key].NDC);
      dupCount ++;
    }
  }
  console.log(`\t${dupCount} duplicates(s) found`)
  return dupes
}

// takes a JSON object whose main keys are not NDCs and returns an object organized by NDCs on the top-level
organizeByNDC = (data) => {
  let organizedByNDC = {};
  for (const item in data) {
    organizedByNDC[data[item].NDC] = data[item];
  }
  return organizedByNDC
}

// takes as arguments two files organized by NDCs and returns an array of the NDCs from the first (larger) file not present in the smaller file
findMissingItems = (largerFile, smallerFile) => {
  let count = 0; missingItems = [];
  for (const ndc in largerFile) {
    if (smallerFile[ndc] === undefined) {
      count++;
      missingItems.push(ndc);
    }
  }
  console.log(`\t${count} items found in larger file not present in smaller file`);
  return missingItems
}

// in its current form this function takes an optional third argument which causes it to alter one or both of the first two argument files
packSizeChecker = (largerFile, smallerFile, addColumnTo) => {
  let differences = [];
  let count = 0;
  let sameCount = 0;
  let noData = 0;
  for (const ndc in smallerFile) {
    if (largerFile[ndc]) {
      if (smallerFile[ndc].packageSizeNCPDP == largerFile[ndc].GenericManufactureSizeAmount * largerFile[ndc]['Pkg Size Multiplier']) {
        sameCount++;
      } else if (smallerFile[ndc].packageSizeNCPDP === '') {
        noData++;
      } else {
        let difference = Math.abs(smallerFile[ndc].packageSizeNCPDP - largerFile[ndc].GenericManufactureSizeAmount * largerFile[ndc]['Pkg Size Multiplier'])
        if (addColumnTo === '1') {
          largerFile[ndc].packageSizeDiscrepancy = difference;
        }
        if (addColumnTo === '2') {
          smallerFile[ndc].packageSizeDiscrepancy = difference;
        }
        if (addColumnTo === 'both') {
          largerFile[ndc].packageSizeDiscrepancy = difference;
          smallerFile[ndc].packageSizeDiscrepancy = difference;
        }
        count++;
        differences.push(ndc);
      }
    }
  }
  // add new column name to first ndc of specified object to ensure later output files contain desired column names
  console.log(`\t${count} package size discrepancies, ${sameCount} package size matches, ${noData} blank columns`);
  if (addColumnTo) {
    if (addColumnTo === '1') {
      if (!Object.keys(largerFile[Object.keys(largerFile)[0]]).includes('packageSizeDiscrepancy')) {
        largerFile[Object.keys(largerFile)[0]].packageSizeDiscrepancy = 0
      }
    } else if (addColumnTo === '2') {
      if (!Object.keys(smallerFile[Object.keys(smallerFile)[0]]).includes('packageSizeDiscrepancy')) {
        smallerFile[Object.keys(smallerFile)[0]].packageSizeDiscrepancy = 0
      }
    } else {
      largerFile[Object.keys(largerFile)[0]].packageSizeDiscrepancy = 0
      smallerFile[Object.keys(smallerFile)[0]].packageSizeDiscrepancy = 0
    }
    console.log(`\tSize discrepancy column added to argument ${addColumnTo}`);
  }
  return differences
}

// takes in a JSON object and creates a text file readable by a spreadsheet application, enter a string as an optional second argument to name the output file, and an array of NDCs as an optional third argument to filter what to include in the output
// Note: for third argument to work it must be a list of top-level keys e.g. if it is an array of NDCs the data must be organized by NDC
createSpreadsheetData = (data, name, list) => {
  let row = 0; name = name || 'outputFile';
  const relevantHeaders = ['NDC', 'SellDescription', 'descriptionCommon', 'productDescription', 'hyphenation', 'GenericManufactureSizeAmount', 'Pkg Size Multiplier', 'GenericIndicator', 'packageSizeDiscrepancy', 'isGeneric', 'packageSizeNCPDP', 'packageCount', 'eaches', 'packageMeasureNCPDP']
  if (list) {
    let cols = '';
    for (const colName of Object.keys(data[Object.keys(data)[0]])) {
      if (relevantHeaders.includes(colName)) {
      cols += `${colName}\t`;
     }
    }
    cols += '\n';
    fs.writeFileSync(`${name}.txt`, cols, (err) => {
     if (err) throw(err)
    })
    console.log('New File Created!');
    list.forEach((ndc) => {
      let rows = '';
      for (const key in data[ndc]) {
        if (relevantHeaders.includes(key)) {
          rows += `${data[ndc][key]}\t`;
        }
      }
      rows += '\n';
      if (rows !== '\n') {
        fs.appendFile(`${name}.txt`, rows, (err) => {
          if (err) console.log(err);
        })
      }
    })
  } else {
    for (const ndc in data) {
      let rows = '';
      for (const key in data[ndc]) {
        if (relevantHeaders.includes(key)) {
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
          if (err) throw(err)
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

module.exports = { checkNDCs, organizeByNDC, findMissingItems, packSizeChecker, createSpreadsheetData };



