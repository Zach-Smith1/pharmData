const fs = require('fs');
const parser = require('./parser');

const data = parser.ObjOfObjs;
const ourData = parser.ourObj;

const dataByNDC = {};
const ourDataByNDC = {};
const joinedDataByNDC = {};

const dupes = {};
const inMcsNotOurs = [];

// functions describing tests to run on data
checkNDCs = (obj) => {
  let dupCount = 0;
  const ref = {};
  for (const key in obj) {
    if (ref[obj[key].NDC] === undefined) {
      ref[obj[key].NDC] = [key];
    } else {
      ref[obj[key].NDC].push(key);
      dupCount ++;
    }
  }
  console.log(`\t${dupCount} duplicates(s) found`)
  if (dupCount < 1) {
    return
  } else {
    for (const key in ref) {
      if (ref[key].length > 1) {
        let prop = 'NDC_'+key;
        dupes[prop] = ref[key].join(', ');
      }
    }
    console.log(`\tArgument object NDC Duplicates are stored in the dupes variable`);
  }
}

rowCounter = (obj) => {
  let count = 0;
  for (const row in obj) {
    count++;
  }
  console.log(' row count = ', count);
}

organizeByNDC = () => {
  for (const item in data) {
    dataByNDC[data[item].NDC] = data[item];
    // probably better to have redundant NDC data than delete each key
    // delete dataByNDC[data[item].NDC].NDC;
  }
  for (const item in ourData) {
    ourDataByNDC[ourData[item].NDC] = ourData[item];
    // delete ourDataByNDC[ourData[item].NDC].NDC;
  }

}

findMissingItems = () => {
  let count = 0;
  for (const ndc in dataByNDC) {
    if (ourDataByNDC[ndc] === undefined) {
      count ++;
      inMcsNotOurs.push(ndc);
    } else {
    joinedDataByNDC[ndc] = {1: ourDataByNDC[ndc], 2: dataByNDC[ndc]};
  }
  }
  if (count > 0) {
    console.log(`\t${count} items found in McKesson data not in ours, list stored in inMcsNotOurs constiable`);
  }
}

packSizeChecker = () => {
  let count = 0;
  let sameCount = 0;
  let noData = 0;
  for (const ndc in joinedDataByNDC) {
    if (joinedDataByNDC[ndc][1].packageSizeNCPDP == joinedDataByNDC[ndc][2].GenericManufactureSizeAmount * joinedDataByNDC[ndc][2]['Pkg Size Multiplier']) {
      sameCount ++;
    } else if (joinedDataByNDC[ndc][1].packageSizeNCPDP === '') {
      noData ++;
    } else {
      count ++;
      // logs for debugging potential false negatives
      // console.log('pkg size multiplier = ', joinedDataByNDC[ndc][2]['Pkg Size Multiplier'])
      // console.log(`different... Our size = ${joinedDataByNDC[ndc][1].packageSizeNCPDP}, McKesson = ${joinedDataByNDC[ndc][2].GenericManufactureSizeAmount}` )
    }
  }
  console.log(`\t${count} package size discrepancies, ${sameCount} package size matches, ${noData} blank columns`);
}

makeFile = (data, arr) => {
  let row = 0;
  if (arr) {
    arr.forEach((ndc) => {
      let rows = '';
      for (const key in data[ndc]) {
        if (row === 0) {
          rows += `${key}\t`;
        } else {
          rows += `${data[ndc][key]}\t`;
        }
      }

      rows += '\n';
      if (row === 0) {
        fs.writeFileSync('outputFile.txt', rows, (err) => {
          if (err) console.log(err); return;
        })
        console.log('New File Created!');
        row = 1;
      } else {
        fs.appendFile('outputFile.txt', rows, (err) => {
          if (err) console.log(err);
        })
      }
    })
  } else {
    for (const ndc in data) {
      let rows = '';
      for (const key in data[ndc]) {
        if (row === 0) {
          rows += `${key}\t`;
        } else {
          rows += `${data[ndc][key]}\t`;
        }
      }
      rows += '\n'
      if (row === 0) {
        fs.writeFileSync('outputFile.txt', rows, (err) => {
          if (err) console.log(err); return;
        })
        console.log('New File Created!');
        row = 1;
      } else {
        fs.appendFile('outputFile.txt', rows, (err) => {
          if (err) console.log(err);
        })
      }
    }
  }

}

console.log('Test Output:');

// tests to be run
checkNDCs(data)
organizeByNDC()
findMissingItems()
packSizeChecker()
// to create file
makeFile(dataByNDC, inMcsNotOurs)




