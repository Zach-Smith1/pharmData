var fs = require('fs');

var McKesson = fs.readFileSync("./mckesson.tsv", "utf8");

let McKessonRows = McKesson.split('\n')
// drug rows start at index 3

let McKessonCols = McKessonRows[2].split('\t')

console.log('starting...')
// create new object to store table information where it can be searched more easily
var ObjOfObjs = {};
var allRows = McKessonRows.slice(3);
// iterate throught the rows and add them to the new object only if the item has an NDC
allRows.forEach((row) => {
  let rowArr = row.split('\t');
  if (rowArr[1] !== undefined && rowArr[1].length > 1) {
    let rowObj = {};
    // remove hyphens to create standard NDC
    rowObj[McKessonCols[1]] = rowArr[1].split('-').join('');
    for (var i = 2; i < rowArr.length - 9; i ++) {
      rowObj[McKessonCols[i]] = rowArr[i]
    }
    ObjOfObjs[rowArr[0]] = rowObj
}
})

module.exports = { ObjOfObjs };