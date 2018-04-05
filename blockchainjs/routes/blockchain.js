var express = require('express');
var router = express.Router();
var crypto = require("crypto-js");
const chain = Blockchain('GENESIS')
console.log('Genesis creation \n'+chain.peek())

function Block({ index, data, previousHash }) {
  const timestamp = Date()
  const hash = _createHash(`${index}.${timestamp}.${data}.${previousHash}`)

  function _createHash(data) {
    return crypto.SHA256(JSON.stringify(data)).toString()
  }

  const isValid = prev => previousHash === prev.hash && index - 1 === prev.index

  const peek = () => `
  Block (${index}):
    Timestamp: ${timestamp}
    Data: ${data}
    Hash: ${hash}
    Previous: ${previousHash}`

  return Object.freeze({
    get index() {
      return index
    },
    get hash() {
      return hash
    },
    isValid,
    peek
  })
}

function Blockchain(initialData) {
  const chain = []
  _createGenesisBlock(initialData)

  function createNextBlock(data) {
    const last = chain[chain.length - 1]
	var next = _createBlock(last.index + 1, data, last.hash)
	chain.push(next)
	return next
  }

  function isValid() {
    for (const block of chain) {
      if (block.index === 0) continue
      if (!block.isValid(chain[block.index - 1])) return false
    }
    return true
  }
  
  function validateHash(index, hash) {
	  for (const block of chain) {
		  if (block.index === 0) continue
		  if (block.index === index && block.hash === hash) {
			      if (!block.isValid(chain[block.index - 1])) {
					  return false
				  } else {
					  return true
				  }
		  }
	  }
	  return false
  }

  const peek = () => `Block Chain:
    ${chain.map(b => b.peek()).join('\n')}`

  function _createGenesisBlock(data) {
    chain.push(_createBlock(0, data, '0'))
  }

  function _createBlock(index, data, prev) {
    return Block({
      index,
      data,
      previousHash: prev
    })
  }

  return Object.freeze({
    createNextBlock,
	validateHash,
    isValid,
    peek
  })
}

router.post('/next', function(req, res, next) {
	var data = req.body.data
	console.log(data)
	if (data != null) {
		var next = chain.createNextBlock(data)
		console.log(next.peek())
		res.status(200).json({block: next});
	} else {
		res.status(400).json({error: 'Data is empty!'})
	}
});

router.post('/isvalid', function(req, res, next) {
	var hash = req.body.hash
	var index = req.body.index
	console.log(index+', '+hash)
	if (hash != null) {
		var valid = chain.validateHash(index, hash)
		res.status(200).json({isvalid: valid});
	} else {
		res.status(400).json({error: 'Data is empty!'})
	}
});

module.exports = router;
