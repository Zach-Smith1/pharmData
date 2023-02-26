var parser = require('./parser')

var data = parser.ObjOfObjs

var dupes = {}

checkNDCs = () => {
  var dupCount = 0;
  var ref = {};
  for (var key in data) {
    if (ref[data[key].NDC] === undefined) {
      ref[data[key].NDC] = [key]
    } else {
      ref[data[key].NDC].push(key)
      dupCount ++
    }
  }
  console.log(`${dupCount} DUPLICATE(S) found`)
  if (dupCount < 1) {
    return
  } else {
    for (var key in ref) {
      if (ref[key].length > 1) {
        let prop = 'NDC_'+key;
        dupes[prop] = ref[key].join(', ')
      }
    }
    console.log('Duplicates have been stored in the dupes variable')
  }
}

checkNDCs();

