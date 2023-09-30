const fs = require('fs');

// This function takes as an argument a file name (string) and returns an object keyed by column headers
fileToObject = (file) => {
  const dataString = fs.readFileSync(`allDataFiles/${file}`, "utf8");
  let allRows = dataString.split('\n');
  let headerRow = 0;
  while (allRows[headerRow].split('\t').length < 2) {
    headerRow++
  }
  const columnNames = allRows[headerRow].split('\t');
  allRows = allRows.slice(headerRow + 1);
  let ndcCol = 0;
  while (columnNames[ndcCol].slice(0, 3).toLowerCase() !== 'ndc') {
    ndcCol++;
    // account for edge case naming discrepancy in product.txt
    if (ndcCol > 3) {
      ndcCol = 1;
      break
    }
  }
  const finalObject = {};

  // iterate through the rows and add them to the new object only if the item has an NDC
  allRows.forEach((row) => {
    let rowArr = row.split('\t');
    let rowObj = {};
    if (rowArr[ndcCol] !== undefined && rowArr[ndcCol].length > 1) {
      // add zeros to create standard NDC
      if (rowArr[ndcCol].length < 11 && rowArr[ndcCol].split('-').length === 1) {
        let ndc = rowArr[ndcCol].split('');
        while (ndc.length < 11) {
          ndc.unshift(0);
        }
        rowObj.NDC = ndc.join('');
      } else if (rowArr[ndcCol].length > 11 || rowArr[ndcCol].split('-').length === 2) {
        // remove hyphens to create standard NDC
        let sections = rowObj.NDC = rowArr[ndcCol].split('-');
        if (sections[0].length < 5) {
          sections[0] = '0' + sections[0];
        } else if (sections[1].length < 4) {
          sections[1] = '0' + sections[1];
        } else {
          // add exception for product.txt ndcs (only 9 numbers in full ndc)
          if (sections[2] !== undefined) {
            sections[2] = '0' + sections[2];
          }
        }
        rowObj.NDC = sections.join('');
      } else {
        rowObj.NDC = rowArr[ndcCol]
      }
      // pair column names and values as key value pairs
      for (let i = ndcCol + 1; i < rowArr.length; i++) {
        rowObj[columnNames[i]] = rowArr[i];
      }
      finalObject[rowObj.NDC] = rowObj;
    }
  })
  return finalObject
}

parseOneColumn = (file) => {
  // read data from input file
  const dataString = fs.readFileSync(`allDataFiles/${file}`, "utf8");

  // split raw data into rows
  let allVals = dataString.split('\n');

  // remove first row (column name)
  const colName = allVals.shift();

  let finalVals = [];

  if (colName.slice(0,3).toLowerCase() === 'ndc') {
    allVals.forEach((val) => {
      if (val !== undefined && val.length > 0 && val != 0) {
        // the line below is commented out to show where lines endings were being altered redundantly (in error)
        // val = val.slice(0,-1)
        // add zeros to create standard NDC
        if (val.length < 11) {
          val = (val+'').split('');
          while (val.length < 11) {
            val.unshift(0);
          }
          finalVals.push(val.join(''));
        } else if (val.length > 11) {
          // remove hyphens to create standard NDC
          finalVals.push(val.split('-').join(''));
        } else {
          finalVals.push(val);
        }
        }
      })
  }

  return finalVals
}

module.exports = { fileToObject, parseOneColumn };