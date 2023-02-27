var parser = require('./parser')

var data = parser.ObjOfObjs
var ourData = parser.ourObj

var dataByNDC = {}
var ourDataByNDC = {}
var joinedDataByNDC = {}

var dupes = {}
var inMcsNotOurs = [];

// functions describing tests to run on data
checkNDCs = (obj) => {
  var dupCount = 0;
  var ref = {};
  for (var key in obj) {
    if (ref[obj[key].NDC] === undefined) {
      ref[obj[key].NDC] = [key]
    } else {
      ref[obj[key].NDC].push(key)
      dupCount ++
    }
  }
  console.log(`${dupCount} duplicates(s) found`)
  if (dupCount < 1) {
    return
  } else {
    for (var key in ref) {
      if (ref[key].length > 1) {
        let prop = 'NDC_'+key;
        dupes[prop] = ref[key].join(', ')
      }
    }
    console.log(`Argument object NDC Duplicates are stored in the dupes variable`)
  }
}

rowCounter = (obj) => {
var count = 0;
for (var row in obj) {
  count ++
}
console.log(' row count = ', count)
}

organizeByNDC = () => {
  for (var item in data) {
    dataByNDC[data[item].NDC] = data[item]
    // probably better to have redundant NDC data than delete each key
    // delete dataByNDC[data[item].NDC].NDC;
  }
  for (var item in ourData) {
    ourDataByNDC[ourData[item].NDC] = ourData[item]
    // delete ourDataByNDC[ourData[item].NDC].NDC;
  }

}

findMissingItems = () => {
  var count = 0;
  for (var ndc in dataByNDC) {
    if (ourDataByNDC[ndc] === undefined) {
      count ++;
      inMcsNotOurs.push(ndc)
    } else {
    joinedDataByNDC[ndc] = {1: ourDataByNDC[ndc], 2: dataByNDC[ndc]}
  }
  }
  if (count > 0) {
    console.log(`${count} items found in McKesson data not in ours, list stored in inMcsNotOurs variable`)
  }
}

packSizeChecker = () => {
  var count = 0;
  var sameCount = 0;
  var noData = 0;
  for (var ndc in joinedDataByNDC) {
    if (joinedDataByNDC[ndc][1].packageSizeNCPDP == joinedDataByNDC[ndc][2].GenericManufactureSizeAmount * joinedDataByNDC[ndc][2]['Pkg Size Multiplier']) {
      sameCount ++
    } else if (joinedDataByNDC[ndc][1].packageSizeNCPDP === '') {
      noData ++
    } else {
      count ++
      // logs for debugging potential false negatives
      // console.log('pkg size multiplier = ', joinedDataByNDC[ndc][2]['Pkg Size Multiplier'])
      // console.log(`different... Our size = ${joinedDataByNDC[ndc][1].packageSizeNCPDP}, McKesson = ${joinedDataByNDC[ndc][2].GenericManufactureSizeAmount}` )
    }
  }
  console.log(`${count} package size discrepancies, ${sameCount} package size matches, ${noData} blank columns`)
}

console.log('Test Output:')

// tests to be run
checkNDCs(data)
organizeByNDC()
findMissingItems()
packSizeChecker()





