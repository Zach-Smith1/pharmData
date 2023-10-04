const fs = require('fs');

// Takes a file name (string) from inputFiles and returns an object with ndcs as keys whose values are objects of drug data
fileToObject = (file) => {
  const dataString = fs.readFileSync(`inputFiles/${file}`, "utf8");
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

  allRows.forEach((row) => {
    let rowArr = row.split('\t');
    let rowObj = {};
    if (rowArr[ndcCol] !== undefined && rowArr[ndcCol].length > 1) {
      if (rowArr[ndcCol].length < 11 && rowArr[ndcCol].split('-').length === 1) {
        let ndc = rowArr[ndcCol].split('');
        while (ndc.length < 11) {
          ndc.unshift(0);
        }
        rowObj.NDC = ndc.join('');
      } else if (rowArr[ndcCol].length > 11 || rowArr[ndcCol].split('-').length === 2) {
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
  const dataString = fs.readFileSync(`inputFiles/${file}`, "utf8");
  let allVals = dataString.split('\n');
  const colName = allVals.shift();
  let finalVals = [];

  if (colName.slice(0,3).toLowerCase() === 'ndc') {
    allVals.forEach((val) => {
      if (val !== undefined && val.length > 0 && val != 0) {
        if (val.length < 11) {
          val = (val+'').split('');
          while (val.length < 11) {
            val.unshift(0);
          }
          finalVals.push(val.join(''));
        } else if (val.length > 11) {
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