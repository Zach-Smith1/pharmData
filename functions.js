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
  // let overlapList = ndcList1.filter((ndc) => ndcList2.includes(ndc)); // wrote code below to track progress of this slow process
  let count = 0;
  let overlapList = [];
  ndcList1.forEach((ndc) => {
    if (ndcList2.includes(ndc)) {
      overlapList.push(ndc);
    }
    count ++;
    if (count % 5000 === 0) {
      process.stdout.write('...');
  }
  })
  console.log(`\tFound ${overlapList.length} overlapping NDCs between the two lists`)
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

// this function serves to combine drug data objects organized by NDC together. Ex: if bigObj = ourdata & smallObj = mckesson => adds ndcs and relevant values from mckesson missing from ourdata to ourdata)
combineObjects = (bigObj, smallObj) => {
  let bigObjectKeys = Object.keys(bigObj[Object.keys(bigObj)[0]]);
  let newColArray = Object.keys(smallObj[Object.keys(smallObj)[0]]);
  let newColName, dataSet;
  newColArray.includes('GenericName')
  if (newColArray.includes('GenericManufactureSizeAmount')) {
    dataSet = 'mck';
  } else if (newColArray.includes('eaches')) {
    dataSet = 'abc';
  } else {
    dataSet = 'pack'
  }
  for (key in smallObj) {
    if (bigObj[key] === undefined) {
      bigObj[key] = {};
      bigObjectKeys.forEach((k) => {
        bigObj[key][k] = 'N/A';
      })
      bigObj[key].NDC = key;
    }
    if (dataSet === 'abc') {
      bigObj[key].ABCPackageSize = smallObj[key].eaches * smallObj[key].packageCount;
      bigObj[key].ABCDescription = smallObj[key].productDescription;
    } else if (dataSet === 'mck') {
      bigObj[key].McKessonPackageSize = smallObj[key].GenericManufactureSizeAmount * smallObj[key]['Pkg Size Multiplier'];
      bigObj[key].MckessonDescription = smallObj[key].SellDescription;
    } else {
      bigObj[key].PACKAGEDESCRIPTION = smallObj[key].PACKAGEDESCRIPTION;
      /* next line will work only if packSizeChecker has been run on the package.txt & product.txt
       objects together with a new column added to package.txt object */
      bigObj[key].FDADrugName = smallObj[key].FDADrugName;
    }

  }
}

parseFDADescription = (description) => {
  let des = description.split(' ');
  des = des.filter(i => i !== "");
  let coefficient = des[0];
  let total = 0;
  let slash = des.indexOf('/');
  while (slash !== -1) {
    coefficient *= des[slash + 1];
    des.splice(slash, 1);
    slash = des.indexOf('/');
  }
  let add = des.indexOf('*');
  if (add === -1) return coefficient
  while (add !== -1) {
    let num = des[add + 1];
    if (num != 1) total += coefficient * num;
    des.splice(add, 1);
    add = des.indexOf('*');
  }
  return total
}

/* This function takes an optional third argument which causes it to add a column to  one or both of the first two
 argument files displaying the difference in package size between the first two arguments*/
/* This function takes an optional fourth argument that will push to the input array all NDCs where no size
 discrepancies are found */
packSizeChecker = (largerFile, smallerFile, addColumnTo, sizeMatchArray, prod) => {
  let differences = [];
  let count = 0;
  let sameCount = 0;
  let noData = 0;
  let newColName, dataSet, shortndc, newColName2, newColName3;
  // create placeholder value for when smaller file dataset doesn't have ndc from larger set
  let newColVal, smallSize, largeSize, newColVal2, newColVal3;
  // determine which dataset we're looking at to name new columns accordingly
  let newColArray = Object.keys(smallerFile[Object.keys(smallerFile)[0]]);
  if (prod) {
    // only use first 9 digits of the ndc since product.txt ndcs are missing the last 2 digits
    if (newColArray.includes('PROPRIETARYNAME')) { // second argument is product.txt
      newColName = 'FDADrugName'; //PROPRIETARYNAME
      newColName2 = 'FDANumeratorStrength'; // ACTIVE_NUMERATOR_STRENGTH
      newColName3 = 'FDAUnit' // ACTIVE_INGRED_UNIT
      dataSet = 'prod'
    }
  } else if (newColArray.includes('GenericManufactureSizeAmount')) {
    newColName = 'McKessonPackageSize';
    newColName2 = 'MckessonDescription'; // SellDescription
    dataSet = 'mck';
  } else if (newColArray.includes('eaches')) {
    newColName = 'ABCPackageSize';
    newColName2 = 'ABCDescription'; // productDescription
    dataSet = 'abc';
  } else if ((newColArray.includes('packageSizeNCPDP'))) {
    dataSet = 'ours';
  } else {
    newColName = 'FDAPackageSize';
    newColName2 = 'PACKAGEDESCRIPTION';
    dataSet = 'pack'
  }

  for (const ndc in largerFile) {
    // set default package sizes to 0 to help with making placeholder values for packageSizeDiscrepancy column
    newColVal = newColVal2 = newColVal3 ='N/A';
    smallSize = 0;
    largeSize = 0;
    shortndc = ndc.slice(0,9);
    if (smallerFile[ndc] || (prod && smallerFile[shortndc])) {
      if (dataSet === 'prod') { // second argument is product.txt
        smallSize = 0; // this unit doesn't agree with any of the other data sets so is set to 0 for comparisons
        newColVal = smallerFile[shortndc].PROPRIETARYNAME;
        newColVal2 = smallerFile[shortndc].ACTIVE_NUMERATOR_STRENGTH;
        newColVal3 = smallerFile[shortndc].ACTIVE_INGRED_UNIT;
        /* + ' AKA: ' + smallerFile[shortndc].NONPROPRIETARYNAME*/
      } else if (dataSet === 'mck') { // second argument is McKesson Data
        smallSize = smallerFile[ndc].GenericManufactureSizeAmount * smallerFile[ndc]['Pkg Size Multiplier'];
        newColVal = smallSize;
        newColVal2 = smallerFile[ndc].SellDescription
      } else if (dataSet === 'abc') { // second argument is ABC Data
        smallSize = smallerFile[ndc].eaches * smallerFile[ndc].packageCount;
        newColVal = smallSize;
        newColVal2 = smallerFile[ndc].productDescription;
      } else if (dataSet === 'ours') { // second argument is Our Data
        smallSize = smallerFile[ndc].packageSizeNCPDP
      } else { // second argument is package.txt
        smallSize = parseFDADescription(smallerFile[ndc].PACKAGEDESCRIPTION);
        newColVal = smallSize;
        newColVal2 = smallerFile[ndc].PACKAGEDESCRIPTION;
      }

      if (Object.keys(largerFile[ndc]).includes('eaches')) { // first argument is ABC Data
        largeSize = largerFile[ndc].eaches * largerFile[ndc].packageCount;
      } else if (Object.keys(largerFile[ndc]).includes('GenericManufactureSizeAmount')) { // first argument is McKesson Data
        largeSize = largerFile[ndc].GenericManufactureSizeAmount * largerFile[ndc]['Pkg Size Multiplier'];
      } else if ((Object.keys(largerFile[ndc]).includes('packageSizeNCPDP'))) { // first argument is our Data
        largeSize = largerFile[ndc].packageSizeNCPDP
      } else {
        // first argument is pack data
        largeSize = parseFDADescription(largerFile[ndc].PACKAGEDESCRIPTION)
      }

    }
    // compare package sizes between the two data sets
    let difference = Math.abs(Number(smallSize) - Number(largeSize));
    if (smallSize == 0 || largeSize == 0 || isNaN(difference)) {
      difference = 'N/A'
    }
    if (largeSize == smallSize) {
      // add NDC to matches array if provided
      if (sizeMatchArray) {
        sizeMatchArray.push(ndc)
      }
      sameCount++;
    } else if (smallSize * largeSize == 0 || isNaN(smallSize * largeSize)) {
      noData++;
    } else {
      count++;
      differences.push(ndc);
    }
    if (addColumnTo === '1' || addColumnTo === 'both') {
      // testing: if (ndc == 2803101) console.log(smallSize, largeSize, dataSet, difference,largerFile[ndc].packageSizeDiscrepancy)
      if (largerFile[ndc].packageSizeDiscrepancy === undefined) {
        if (difference === 0 || difference === 'N/A') {
          largerFile[ndc].packageSizeDiscrepancy = 'Match';
          largerFile[ndc].last = difference;
        } else {
          largerFile[ndc].packageSizeDiscrepancy = 'Needs Correction';
          largerFile[ndc].last = difference;
        }
      } else {
        if (largerFile[ndc].packageSizeDiscrepancy === 'Match') {
          if (difference !== 0 && difference !== 'N/A') {
            largerFile[ndc].packageSizeDiscrepancy = 'Inconclusive';
          }
        } else if (largerFile[ndc].packageSizeDiscrepancy === 'Needs Correction') {
          if (largerFile[ndc].last !== difference && difference !== 'N/A') {
            largerFile[ndc].packageSizeDiscrepancy = 'Inconclusive';
          }
        }
      }
      largerFile[ndc][`${newColName}`] = newColVal;
      if (newColName2 !== undefined) {
        largerFile[ndc][`${newColName2}`] = newColVal2;
      }
      if (newColName3 !== undefined) {
        largerFile[ndc][`${newColName3}`] = newColVal3;
      }
    }
    if (addColumnTo === '2' || addColumnTo === 'both') {
      if (smallerFile[ndc].packageSizeDiscrepancy === undefined) {
        if (difference === 0 || difference === 'N/A') {
          smallerFile[ndc].packageSizeDiscrepancy = 'Match';
          smallerFile[ndc].last = difference;
        } else {
          smallerFile[ndc].packageSizeDiscrepancy = 'Needs Correction';
          smallerFile[ndc].last = difference;
        }
      } else {
        if (smallerFile[ndc].packageSizeDiscrepancy === 'Match') {
          if (difference !== 0 && difference !== 'N/A') {
            smallerFile[ndc].packageSizeDiscrepancy = 'Inconclusive';
          }
        } else if (smallerFile[ndc].packageSizeDiscrepancy === 'Needs Correction') {
          if (smallerFile[ndc].last !== difference && difference !== 'N/A') {
            smallerFile[ndc].packageSizeDiscrepancy = 'Inconclusive';
          }
        }
      }
      smallerFile[ndc][`${newColName}`] = newColVal;
      if (newColName2 !== undefined) {
        smallerFile[ndc][`${newColName2}`] = newColVal2;
      }
      if (newColName3 !== undefined) {
        smallerFile[ndc][`${newColName3}`] = newColVal3;
      }
    }
  }
  // add new column name to first ndc of specified object to ensure later output files contain desired column names
  console.log(`\t${count} package size discrepancies, ${sameCount} package size matches, ${noData} blank columns`);
  // if (addColumnTo) {
  //   if (addColumnTo === '1' || addColumnTo === 'both') {
  //     // if (!Object.keys(largerFile[Object.keys(largerFile)[0]]).includes('packageSizeDiscrepancy')) {
  //     largerFile[Object.keys(largerFile)[0]].packageSizeDiscrepancy = 0
  //     largerFile[Object.keys(largerFile)[0]][`${newColName}`] = 0
  //     // }
  //   }
  //   if (addColumnTo === '2' || addColumnTo === 'both') {
  //     // if (!Object.keys(smallerFile[Object.keys(smallerFile)[0]]).includes('packageSizeDiscrepancy')) {
  //     smallerFile[Object.keys(smallerFile)[0]].packageSizeDiscrepancy = 0
  //     smallerFile[Object.keys(smallerFile)[0]][`${newColName}`] = 0
  //     // }
  //   }
  console.log(`\t${newColName} column added to argument ${addColumnTo}`);
  // }
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
  let count = 0;
  let check = false;
  if (CLI === undefined) {
    let ndcList = parser.parseOneColumn('allNDCs.txt');
    console.log('Including only known NDCs...');
    if (list) {
      process.stdout.write('Compiling list of overlapping ndcs...')
      list = returnNDCOverlap(ndcList, list);
    } else {
      list = ndcList;
    }
  } else if (CLI === 'all') {
    console.log('Including all NDCs...\nThis file will be signifcantly larger');
  } else {
    console.log('Command Line Input not recognized, did you mean "node run all"?')
    check = true;
  }
  if (check === true) {
    return
  }
  let row = 0; name = name || 'outputFile';
  const relevantHeaders = ['NDC', 'SellDescription', 'descriptionCommon', 'productDescription', 'hyphenation', 'GenericManufactureSizeAmount', 'Pkg Size Multiplier', 'GenericIndicator', 'packageSizeDiscrepancy', 'isGeneric', 'packageSizeNCPDP', 'packageCount', 'eaches', 'packageMeasureNCPDP', 'PackageSizeDescription', 'ABCPackageSize', 'McKessonPackageSize', 'FDAPackageSize', 'PACKAGEDESCRIPTION', 'FDADrugName', 'MckessonDescription', 'FDANumeratorStrength', 'FDAUnit', 'ABCDescription', 'mcGenDescription', 'fdaGenDescription', 'newDescription']
  if (list) {
    let cols = '';
    for (const colName of Object.keys(data[Object.keys(data)[0]])) {
      if (relevantHeaders.includes(colName)) {
        if (colName === 'packageSizeNCPDP') {
          cols += `currentPackageSize\t`;
        } else if (colName === 'packageMeasureNCPDP') {
          cols += `currentPackageMeasure\t`;
        } else if (colName === 'descriptionCommon') {
          cols += `currentDescription\t`;
        } else if (colName === 'hyphenation') {
          cols += `currentHyphenation\t`;
        } else if (colName === 'isGeneric') {
          cols += `currentIsGeneric\t`;
        } else if (colName === 'PACKAGEDESCRIPTION') {
          cols += `FDAPackageDescription\t`
        } else {
          cols += `${colName}\t`;
        }
      }
    }
    cols += '\n';
    fs.writeFileSync(`${name}.txt`, cols, (err) => {
      if (err) throw (err)
    })
    process.stdout.write(`Building new file ${name}.txt ...`);
    list.forEach((ndc) => {
      let rows = '';
      if (data[ndc]) {
        for (const key in data[ndc]) {
          if (relevantHeaders.includes(key)) {
            rows += `${data[ndc][key]}\t`;
          }
        }
      } else {
        rows += `${ndc}\t*** No Data Found for this NDC ***\t`
      }
      rows += '\n';
      if (rows !== '\n') {
        fs.appendFileSync(`${name}.txt`, rows, (err) => {
          if (err) console.log(err);
        })
        count ++;
        if (count % 10000 === 0) {
          process.stdout.write("...");
        }
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
        process.stdout.write(`Building new file ${name}.txt ...`);
        row = 1;
      } else {
        // added Sync to appendFile to prevent opening too many files at once
        fs.appendFileSync(`${name}.txt`, rows, (err) => {
          if (err) console.log(err);
        })
        count ++;
        if (count % 10000 === 0) {
          process.stdout.write("...");
        }
      }
    }
  }
  console.log(' Done!')
}

getDescriptions = (ours, mck, pack, prod, both) => {
  let out = {};
  let mcGenDescription, fdaGenDescription;
  for (const ndc in ours) {
    out[ndc] = {
      NDC: ndc,
      descriptionCommon: ours[ndc].descriptionCommon
    };
    mcGenDescription = '';
    fdaGenDescription = '';
    let short = ndc.slice(0, 9);
    if (mck[ndc]) {
      if (mck[ndc].GenericName) {
        mcGenDescription += mck[ndc].GenericName + ' '
      }
      if (mck[ndc].DoseStrengthDescriptionName) {
        mcGenDescription += mck[ndc].DoseStrengthDescriptionName + ' '
      }
      if (mck[ndc].GenericManufactureSizeAmount) {
        mcGenDescription += mck[ndc].GenericManufactureSizeAmount + ' '
      }
      if (mck[ndc].ManufactureUnitCode) {
        mcGenDescription += mck[ndc].ManufactureUnitCode
      }
    }
    if (prod[short] && pack[ndc]) {
      if (prod[short].PROPRIETARYNAME) {
        fdaGenDescription += prod[short].PROPRIETARYNAME + ' '
      } else {
        fdaGenDescription += prod[short].NONPROPRIETARYNAME + ' '
      }
      if (pack[ndc].PACKAGEDESCRIPTION) {
        // removes uneccessary ndc data from description
        fdaGenDescription += pack[ndc].PACKAGEDESCRIPTION.replace(/\(.*?\)/g, "") + ' '
      }
      if (prod[short].ACTIVE_NUMERATOR_STRENGTH) {
        fdaGenDescription += prod[short].ACTIVE_NUMERATOR_STRENGTH + ' '
      }
      if (prod[short].ACTIVE_INGRED_UNIT) {
        fdaGenDescription += prod[short].ACTIVE_INGRED_UNIT
      }
    }
    // if 'both' is passed as 5th argument we create seperate columns for mckesson and fda data sources
    if (both === 'both') {
      if (mcGenDescription === '') { mcGenDescription = 'No McKesson Data Available' }
      if (fdaGenDescription === '') { fdaGenDescription = 'No FDA Data Available' }
      out[ndc]['mcGenDescription'] = mcGenDescription;
      out[ndc]['fdaGenDescription'] = fdaGenDescription;
      // otherwise we create one new description column, preferentially using fda data
    } else {
      if (fdaGenDescription !== '') {
        out[ndc]['newDescription'] = fdaGenDescription;
      } else if (mcGenDescription !== '') {
        out[ndc]['newDescription'] = mcGenDescription;
      } else {
        out[ndc]['newDescription'] = 'No New Description';
      }
    }
  }
  return out
}

module.exports = { checkNDCs, organizeByNDC, mergeNDCLists, returnNDCOverlap, findMissingItems, packSizeChecker, createSpreadsheetData, combineObjects, getDescriptions };



