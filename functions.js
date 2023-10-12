const fs = require('fs');
const parser = require('./parser');

// this function serves to combine drug data objects organized by NDC together
// Ex: if bigObj = ourdata & smallObj = mckesson => adds ndcs and relevant values from mckesson missing from ourdata to ourdata)
combineObjects = (bigObj, smallObj) => {
  let bigObjectKeys = Object.keys(bigObj[Object.keys(bigObj)[0]]);
  let newColArray = Object.keys(smallObj[Object.keys(smallObj)[0]]);
  let secondArg;
  newColArray.includes('GenericName')
  if (newColArray.includes('GenericManufactureSizeAmount')) {
    secondArg = 'mck';
  } else if (newColArray.includes('eaches')) {
    secondArg = 'abc';
  } else {
    secondArg = 'pack'
  }
  for (key in smallObj) {
    if (bigObj[key] === undefined) {
      bigObj[key] = {};
      bigObjectKeys.forEach((k) => {
        bigObj[key][k] = 'N/A';
      })
      bigObj[key].NDC = key;
    }
    if (secondArg === 'abc') {
      bigObj[key].ABCPackageSize = smallObj[key].eaches * smallObj[key].packageCount;
      bigObj[key].ABCDescription = smallObj[key].productDescription;
    } else if (secondArg === 'mck') {
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

// Adds a column of data from second argument to the first argument adds or alters packageSizeDiscrepancy column to first argument
packSizeChecker = (largerFile, smallerFile) => {
  let prod = false;
  let newColName, firstArg, secondArg, shortndc, newColName2, newColName3;
  // create placeholder value for when smaller file secondArg doesn't have ndc from larger set
  let newColVal, smallSize, largeSize, newColVal2, newColVal3;
  // determine which secondArg/ dataset we're looking at to name new columns accordingly
  let newColArray = Object.keys(smallerFile[Object.keys(smallerFile)[0]]);
  if (newColArray.includes('PROPRIETARYNAME')) { // second argument is product.txt
    newColName = 'FDADrugName'; //PROPRIETARYNAME
    newColName2 = 'FDANumeratorStrength'; // ACTIVE_NUMERATOR_STRENGTH
    newColName3 = 'FDAUnit'; // ACTIVE_INGRED_UNIT
    secondArg = 'prod';
    prod = true;
  } else if (newColArray.includes('GenericManufactureSizeAmount')) {
    newColName = 'McKessonPackageSize';
    newColName2 = 'MckessonDescription'; // SellDescription
    secondArg = 'mck';
  } else if (newColArray.includes('eaches')) {
    newColName = 'ABCPackageSize';
    newColName2 = 'ABCDescription'; // productDescription
    secondArg = 'abc';
  } else if ((newColArray.includes('packageSizeNCPDP'))) {
    secondArg = 'ours';
  } else {
    newColName = 'FDAPackageSize';
    newColName2 = 'PACKAGEDESCRIPTION';
    secondArg = 'pack'
  }

  let ndc = 76329301305 // random ndc that exists in all source files
  if (Object.keys(largerFile[ndc]).includes('eaches')) {
    largeSize = largerFile[ndc].eaches * largerFile[ndc].packageCount;
    firstArg = 'ABC Data';
  } else if (Object.keys(largerFile[ndc]).includes('GenericManufactureSizeAmount')) {
    largeSize = largerFile[ndc].GenericManufactureSizeAmount * largerFile[ndc]['Pkg Size Multiplier'];
    firstArg = 'McKesson Data';
  } else if ((Object.keys(largerFile[ndc]).includes('packageSizeNCPDP'))) {
    largeSize = largerFile[ndc].packageSizeNCPDP
    firstArg = 'Our Data';
  } else {
    largeSize = parseFDADescription(largerFile[ndc].PACKAGEDESCRIPTION);
    firstArg = 'FDA Package Data';
  }

  for (const ndc in largerFile) {
    newColVal = newColVal2 = newColVal3 ='N/A';
    smallSize = 0;
    largeSize = 0;
    shortndc = ndc.slice(0,9);
    if (smallerFile[ndc] || (prod && smallerFile[shortndc])) {
      if (secondArg === 'prod') {
        smallSize = 0;
        newColVal = smallerFile[shortndc].PROPRIETARYNAME;
        newColVal2 = smallerFile[shortndc].ACTIVE_NUMERATOR_STRENGTH;
        newColVal3 = smallerFile[shortndc].ACTIVE_INGRED_UNIT;
      } else if (secondArg === 'mck') {
        smallSize = smallerFile[ndc].GenericManufactureSizeAmount * smallerFile[ndc]['Pkg Size Multiplier'];
        newColVal = smallSize;
        newColVal2 = smallerFile[ndc].SellDescription
      } else if (secondArg === 'abc') {
        smallSize = smallerFile[ndc].eaches * smallerFile[ndc].packageCount;
        newColVal = smallSize;
        newColVal2 = smallerFile[ndc].productDescription;
      } else if (secondArg === 'ours') {
        smallSize = smallerFile[ndc].packageSizeNCPDP
      } else {
        smallSize = parseFDADescription(smallerFile[ndc].PACKAGEDESCRIPTION);
        newColVal = smallSize;
        newColVal2 = smallerFile[ndc].PACKAGEDESCRIPTION;
      }

      if (firstArg === 'ABC Data') {
        largeSize = largerFile[ndc].eaches * largerFile[ndc].packageCount;
      } else if (firstArg === 'McKesson Data') {
        largeSize = largerFile[ndc].GenericManufactureSizeAmount * largerFile[ndc]['Pkg Size Multiplier'];
      } else if (firstArg === 'Our Data') {
        largeSize = largerFile[ndc].packageSizeNCPDP
      } else {
        largeSize = parseFDADescription(largerFile[ndc].PACKAGEDESCRIPTION);
      }

    }

    let difference = Math.abs(Number(smallSize) - Number(largeSize));
    if (smallSize == 0 || largeSize == 0 || isNaN(difference)) {
      difference = 'N/A'
    }

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
  console.log(`${newColName} column added to ${firstArg}`);
}

createTxtFile = (data, name) => {
  let list = parser.parseOneColumn('allNDCs.txt');
  name = name || 'outputFile';
  const relevantHeaders = ['NDC', 'SellDescription', 'descriptionCommon', 'productDescription', 'hyphenation', 'GenericManufactureSizeAmount', 'Pkg Size Multiplier', 'GenericIndicator', 'packageSizeDiscrepancy', 'isGeneric', 'packageSizeNCPDP', 'packageCount', 'eaches', 'packageMeasureNCPDP', 'PackageSizeDescription', 'ABCPackageSize', 'McKessonPackageSize', 'FDAPackageSize', 'PACKAGEDESCRIPTION', 'FDADrugName', 'MckessonDescription', 'FDANumeratorStrength', 'FDAUnit', 'ABCDescription', 'mcGenDescription', 'fdaGenDescription', 'newDescription', 'calculatedSize']
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
  let folderPath = './outputFiles'
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`Directory "${folderPath}" has been created.`);
  }
  fs.writeFileSync(`${folderPath}/${name}.txt`, cols, (err) => {
    if (err) throw (err)
  })
  process.stdout.write(`Building new file ${name}.txt ...`);
  let progress = 0;
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
      fs.appendFileSync(`${folderPath}/${name}.txt`, rows, (err) => {
        if (err) console.log(err);
      })
      progress ++;
      if (progress % 10000 === 0) {
        process.stdout.write("...");
      }
    }
  })
  process.stdout.write('\n')
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

determinePackageSize = (ndc, dataSets) => {
  let source = 'unknown';
  let sizes = [];
  ndc = convertNdc(ndc);
  if (typeof ndc !== 'string') console.log(ndc)
  dataSets.forEach((obj) => {
    if (!obj[ndc]) {
      return
    }
    let objCols = Object.keys(obj[ndc]);
    if (objCols.includes('PROPRIETARYNAME')) { // second argument is product.txt
      source = 'prod';
    } else if (objCols.includes('GenericManufactureSizeAmount')) {
      source = 'mck';
    } else if (objCols.includes('eaches')) {
      source = 'abc';
    } else if ((objCols.includes('packageSizeNCPDP'))) {
      source = 'ours';
    } else if ((objCols.includes('PACKAGEDESCRIPTION'))) {
      source = 'pack'
    }
    // console.log(source)
    if (source === 'abc') {
      size = obj[ndc].eaches * obj[ndc].packageCount;
    } else if (source === 'mck') {
      size = obj[ndc].GenericManufactureSizeAmount * obj[ndc]['Pkg Size Multiplier'];
    } else if (source === 'ours') {
      size = obj[ndc].packageSizeNCPDP
    } else if (source === 'pack') {
      size = parseFDADescription(obj[ndc].PACKAGEDESCRIPTION);
    } else {
      size = 0
    }

    sizes.push(Number(size));
  })
  // console.log('sizes = ', sizes)
  //
  if (sizes.length === 1 && sizes[0] !== 0) return sizes[0]
  // if all different return null
  const sizeSet = new Set(sizes);
  if (sizeSet.size === sizes.length && sizes.length > 2) {
    // console.log('ALL SIZES DIFFERENT')
    return null
  }
  // if all same return number
  if (sizeSet.size === 1) {
    // console.log('ALL SIZES SAME', sizes[0])
    return sizes[0] == 0 ? null : sizes[0]
  }
  // if most same return number
  let choices = sizes.sort((a, b) => a - b);
  // console.log('choices = ', choices)
  while (choices[0] == 0) {
    choices.shift();
  }
  for (let i = 1; i < choices.length; i++) {
    if (i >= Math.floor(choices.length / 2)) {
      if (choices[i] === choices[0]) {
        // console.log('MOST SIZES SAME')
        // console.log('LOWER number correct', sizes, ndc)
        return choices[i]
      } else {
        // if lower number doesn't take up half of array return highest number
        // console.log('HIGHER number correct', sizes, ndc)
        return choices.pop()
      }
    }
  }

  return null
}

module.exports = { packSizeChecker, createTxtFile, combineObjects, getDescriptions, determinePackageSize };