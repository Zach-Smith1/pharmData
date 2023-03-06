const fs = require('fs');

// This function takes as an argument a file name (string) and returns a JSON object
parseRawData = (file) => {
  console.log(`PARSING ${file} file...`);

  // create new object to store table information where it can be searched more easily
  const outputObject = {}

  // read data from input file
  const dataString = fs.readFileSync(file, "utf8");

  // split raw data into rows
  let allRows = dataString.split('\n');

  // find row containing column names
  let headerRow = 0;
  while (allRows[headerRow].split('\t').length < 3) {
    headerRow ++
  }

  // column names are at index 2 in the McKesson data and index 0 in our data
  const columnNames = allRows[headerRow].split('\t');

  // omit column names from array of rows
  allRows = allRows.slice(headerRow + 1);

  // find column containing NDC number
  let ndcCol = 0;
  while (columnNames[ndcCol].slice(0, 3).toLowerCase() !== 'ndc') {
    ndcCol ++
  }

  // create item number for use if input table lacks item number column
  let itemCount = 1;

  // create output object for this function to return
  const finalObject = {};

  // iterate through the rows and add them to the new object only if the item has an NDC
  allRows.forEach((row) => {
    let rowArr = row.split('\t');
    let rowObj = {};
    if (rowArr[ndcCol] !== undefined && rowArr[ndcCol].length > 1) {
      // add zeros to create standard NDC
      if (rowArr[ndcCol].length < 11) {
        let ndc = rowArr[ndcCol].split('');
        while (ndc.length < 11) {
          ndc.unshift(0);
        }
        rowObj.NDC = ndc.join('');
      } else if (rowArr[ndcCol].length > 11) {
        // remove hyphens to create standard NDC
        rowObj.NDC = rowArr[ndcCol].split('-').join('');
      }
      // pair column names and values as key value pairs
      for (let i = ndcCol + 1; i < rowArr.length; i++) {
        rowObj[columnNames[i]] = rowArr[i];
      }
      // each row of is represented as key value pair in the final object, the key is the item number, the value is an object of column names (keys) and values
      if (ndcCol - 1 >= 0) {
        finalObject[rowArr[ndcCol - 1]] = rowObj;
      } else {
        // add arbitrary item number if input data lacked item numbers
        finalObject[itemCount] = rowObj;
        itemCount ++
      }
    }
  })
  return finalObject
}

module.exports = { parseRawData };