const fs = require('fs');

convertNdc = (ndc) => {
  if (ndc.length < 11 && ndc.split('-').length === 1) {
    ndc = ndc.split('');
    while (ndc.length < 11) {
      ndc.unshift(0);
    }
    return ndc.join('');
  } else if (ndc.length > 11 || ndc.split('-').length === 2) {
    let sections = ndc.split('-');
    if (sections[0].length < 5) {
      sections[0] = '0' + sections[0];
    } else if (sections[1].length < 4) {
      sections[1] = '0' + sections[1];
    }
    else {
      // add exception for product.txt ndcs (will output only 9 numbers in full ndc)
      if (sections[2] !== undefined) {
        // doesn't add a zero if there are already 2 digits in 3rd section (mcKesson Data)
        if (sections[2].length < 2) {
          sections[2] = '0' + sections[2];
        }
      }
    }
    return sections.join('');
  } else {
    return ndc
  }
}

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
      let ndc = rowArr[ndcCol];
      rowObj.NDC = convertNdc(ndc)
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