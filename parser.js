const fs = require('fs');

const McKesson = fs.readFileSync("./mckesson.tsv", "utf8");
const ourData = fs.readFileSync("./ndc_packageInfo_2.txt", "utf8");

// split raw data into rows
const McKessonRows = McKesson.split('\n');
let ourRows = ourData.split('\n');
// column names are at index 2 in the McKesson data and index 0 in our data
const McKessonCols = McKessonRows[2].split('\t');
const ourCols = ourRows[0].split('\t');

console.log('PARSING...');

// create new objects to store table information where it can be searched more easily
const ourObj = {};
const ObjOfObjs = {};

// omit column names from array of rows
ourRows = ourRows.slice(1)
const allRows = McKessonRows.slice(3);

// iterate through the McKesson rows and add them to the new object only if the item has an NDC
allRows.forEach((row) => {
  let rowArr = row.split('\t');
  if (rowArr[1] !== undefined && rowArr[1].length > 1) {
    let rowObj = {};
    // remove hyphens to create standard NDC
    rowObj[McKessonCols[1]] = rowArr[1].split('-').join('');
    // pair column names and values as key value pairs
    for (let i = 2; i < rowArr.length - 9; i++) {
      rowObj[McKessonCols[i]] = rowArr[i];
    }
    ObjOfObjs[rowArr[0]] = rowObj;
  }
})

// iterate through our rows and add them to the new object, adding 0's to make complete NDC's
let itemCount = 1;
ourRows.forEach((row) => {
  const rowArr = row.split('\t');

  const rowObj = {};
  // add zeros to create standard NDC
  if (rowArr[0].length < 11) {
    let ndc = rowArr[0].split('');
    while (ndc.length < 11) {
      ndc.unshift(0);
    }
    rowObj.NDC = ndc.join();
  }
  rowObj.NDC = rowArr[0];
  // pair column names and values as key value pairs
  for (let i = 1; i < rowArr.length; i++) {
    rowObj[ourCols[i]] = rowArr[i];
  }
  ourObj[itemCount] = rowObj;
  itemCount++;
})

module.exports = {ObjOfObjs, ourObj};