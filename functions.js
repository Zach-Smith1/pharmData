const fs = require('fs');
const parser = require('./parser');

// *********** functions describing tests to run on data ***********
// takes an object whose main keys are not NDCs and returns an array of duplicate NDCs
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

// takes an object whose main keys are not NDCs and returns an object organized by NDCs on the top-level
organizeByNDC = (data) => {
  let organizedByNDC = {};
  for (const item in data) {
    organizedByNDC[data[item].NDC] = data[item];
  }
  return organizedByNDC
}

// merges two NDC arrays and returns a single array with no duplicates
mergeNDCLists = (ndcList1, ndcList2) => {
  let listSet = new Set(ndcList1);
  let newListSet = new Set([...listSet, ...ndcList2])
  let mergedList = Array.from(newListSet)
  console.log(`\tMerged a ${ndcList1.length} NDC list and a ${ndcList2.length} NDC list into a ${mergedList.length} NDC list, ${(ndcList1.length + ndcList2.length) - mergedList.length} duplicates removed`)
  return Array.from(newListSet)
}

// checks for matching NDCs between two arrays and returns a single array of those matches
returnNDCOverlap = (ndcList1, ndcList2) => {
  let overlapList = ndcList1.filter((ndc) => ndcList2.includes(ndc));
  console.log(`\tFound ${overlapList.length} overlapping NDCs between the two arguments`)
  return overlapList
}

/* takes as arguments two data sets organized by NDCs and returns an array of the NDCs from the first argument
 that are not present in second argument */
findMissingItems = (firstSet, secondSet, product) => {
  // check if second argument is product.txt
  let slice = false;
  if (secondSet[Object.keys(secondSet)[0]].NDC.length === 9) {
    slice = true
  }
  let count = 0; missingItems = [];
  for (const ndc in firstSet) {
    if (slice === true) {
      if (secondSet[ndc.slice(0,9)] === undefined) {
        count++;
        missingItems.push(ndc);
      }
    } else {
      if (secondSet[ndc] === undefined) {
        count++;
        missingItems.push(ndc);
      }
    }
  }
  console.log(`\t${count} items found in first data set not present in the second`);
  return missingItems
}

/* This function takes an optional third argument which causes it to add a column to  one or both of the first two
 argument files displaying the difference in package size between the first two arguments*/
/* This function takes an optional fourth argument that will push to the input array all NDCs where no size
 discrepancies are found */
packSizeChecker = (largerFile, smallerFile, addColumnTo, sizeMatchArray) => {
  let differences = [];
  let count = 0;
  let sameCount = 0;
  let noData = 0;
  let newColName;
  let prod = false;
  for (const ndc in smallerFile) {
    let smallSize, largeSize, newColVal;
    if (Object.keys(smallerFile[ndc]).includes('GenericManufactureSizeAmount')) { // second argument is McKesson Data
      smallSize = smallerFile[ndc].GenericManufactureSizeAmount * smallerFile[ndc]['Pkg Size Multiplier'];
      newColName = 'McKessonPackageSize';
      newColVal = smallSize;
    } else if ((Object.keys(smallerFile[ndc]).includes('eaches'))) { // second argument is ABC Data
      smallSize = smallerFile[ndc].eaches * smallerFile[ndc].packageCount;
      newColName = 'ABCPackageSize';
      newColVal = smallSize;
    } else if ((Object.keys(smallerFile[ndc]).includes('packageSizeNCPDP'))) { // second argument is Our Data
      smallSize = smallerFile[ndc].packageSizeNCPDP
      prod = true
    } else { // second argument is package.txt
      smallSize = smallerFile[ndc].PACKAGEDESCRIPTION.split(' ')[0];
      newColName = 'PackageSizeDescription';
      newColVal = smallerFile[ndc].PACKAGEDESCRIPTION;
    }
    let shortndc;
    // if the second argument is Our Data (which means first argument is packageData from package.txt)
    if (prod === true) {
      // only use first 9 digits of the ndc since package.txt ndcs are missing the last 2 digits
      shortndc = ndc.slice(0, 9);
      if (largerFile[shortndc]) { // first argument is product.txt
        largeSize = largerFile[shortndc].ACTIVE_NUMERATOR_STRENGTH;
        newColName = 'ProprietaryAndGenericNames';
        newColVal = largerFile[shortndc].PROPRIETARYNAME + ' AKA: ' + largerFile[shortndc].NONPROPRIETARYNAME;
      }
    }
    // if the first argument has the same ndc as the second argument
    if (largerFile[ndc] || largerFile[shortndc]) {
      if (prod === false) {
        if (Object.keys(largerFile[ndc]).includes('eaches')) { // first argument is ABC Data
          largeSize = largerFile[ndc].eaches * largerFile[ndc].packageCount;
        } else if (Object.keys(largerFile[ndc]).includes('GenericManufactureSizeAmount')) { // first argument is McKesson Data
          largeSize = largerFile[ndc].GenericManufactureSizeAmount * largerFile[ndc]['Pkg Size Multiplier'];
        } else { // first argument is our Data
          largeSize = largerFile[ndc].packageSizeNCPDP
        }
      }
      // compare package sizes between the two data sets
      let difference = Math.abs(smallSize - largeSize);
      if (largeSize == smallSize) {
        // add NDC to matches array if provided
        if (sizeMatchArray) {
          sizeMatchArray.push(ndc)
        }
        sameCount++;
      } else if (smallSize * largeSize == 0) {
        noData++;
      } else {
        count++;
        differences.push(ndc);
      }
      if (addColumnTo === '1' || addColumnTo === 'both') {
        largerFile[ndc].packageSizeDiscrepancy = difference;
        largerFile[ndc][`${newColName}`] = newColVal;
      }
      if (addColumnTo === '2' || addColumnTo === 'both') {
        smallerFile[ndc].packageSizeDiscrepancy = difference;
        smallerFile[ndc][`${newColName}`] = newColVal;
      }
    }
  }
  // add new column name to first ndc of specified object to ensure later output files contain desired column names
  console.log(`\t${count} package size discrepancies, ${sameCount} package size matches, ${noData} blank columns`);
  if (addColumnTo) {
    if (addColumnTo === '1' || addColumnTo === 'both') {
      // if (!Object.keys(largerFile[Object.keys(largerFile)[0]]).includes('packageSizeDiscrepancy')) {
      largerFile[Object.keys(largerFile)[0]].packageSizeDiscrepancy = 0
      largerFile[Object.keys(largerFile)[0]][`${newColName}`] = 0
      // }
    }
    if (addColumnTo === '2' || addColumnTo === 'both') {
      // if (!Object.keys(smallerFile[Object.keys(smallerFile)[0]]).includes('packageSizeDiscrepancy')) {
      smallerFile[Object.keys(smallerFile)[0]].packageSizeDiscrepancy = 0
      smallerFile[Object.keys(smallerFile)[0]][`${newColName}`] = 0
      // }
    }
    console.log(`\t${newColName} column added to argument ${addColumnTo}`);
  }
  // console.log('running pack size checker.........', newColName)
  // console.log(largerFile[Object.keys(largerFile)[0]])
  return differences
}

/* Takes in an object whose keys are NDCs with objects as values which each have key value pairs pertaining
 to pharmaceutical data*/
/* Creates a text file readable by a spreadsheet application, enter a string as an optional second
 argument to name the output file, and an array of NDCs as an optional third argument to filter what to
 include in the output; a fourth argument checks for CLI input to only return known ndcs*/
/* Note: for third argument to work it must be a list of top-level keys e.g. if it is an array of NDCs the data
 must be organized by NDC*/
createSpreadsheetData = (data, name, list, CLI) => {
  // adds logic to output rows for drugs contained in the master ndc list
  if (CLI === 'ndc') {
    let ndcList = parser.parseOneColumn('allNDCs.txt');
    console.log('including only known NDCs...');
    if (list) {
      list = returnNDCOverlap(ndcList, list);
    } else {
      list = ndcList;
    }
  }
  let row = 0; name = name || 'outputFile';
  const relevantHeaders = ['NDC', 'SellDescription', 'descriptionCommon', 'productDescription', 'hyphenation', 'GenericManufactureSizeAmount', 'Pkg Size Multiplier', 'GenericIndicator', 'packageSizeDiscrepancy', 'isGeneric', 'packageSizeNCPDP', 'packageCount', 'eaches', 'packageMeasureNCPDP', 'PackageSizeDescription', 'ABCPackageSize', 'McKessonPackageSize', 'PACKAGEDESCRIPTION', 'ProprietaryAndGenericNames']
  if (list) {
    let cols = '';
    for (const colName of Object.keys(data[Object.keys(data)[0]])) {
      if (relevantHeaders.includes(colName)) {
        cols += `${colName}\t`;
      }
    }
    cols += '\n';
    fs.writeFileSync(`${name}.txt`, cols, (err) => {
      if (err) throw (err)
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
        fs.appendFileSync(`${name}.txt`, rows, (err) => {
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
          if (err) throw (err)
        })
        console.log('New File Created!');
        row = 1;
      } else {
        // added Sync to appendFile to prevent opening too many files at once
        fs.appendFileSync(`${name}.txt`, rows, (err) => {
          if (err) console.log(err);
        })
      }
    }
  }
}

module.exports = { checkNDCs, organizeByNDC, mergeNDCLists, returnNDCOverlap, findMissingItems, packSizeChecker, createSpreadsheetData };



