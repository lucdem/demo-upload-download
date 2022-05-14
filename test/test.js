const os = require('os')
const fs = require('fs')
const fetch = require('node-fetch')

const formData = require('form-data')

const port = 3001
const baseUrl = `http://localhost:${port}/api/`

let fullTest = async () => {
	let size = fs.statSync('test.txt').size
	await testGetList(0)
	let id = await testSend(false)
	await testGetList(1)
	await testDownload(id, size)
	try {
		await testSend(true)
	} catch (e) {
		if(e.statusCode !== 400){
			throw e
		}
	}
	await testGetList(1)
	await testSend(false)
	await testGetList(2)
	await testSend(false)
	await testGetList(3)
	try{
		await testSend(false)
	}
	catch (e){
		if(e.statusCode !== 400){
			throw e
		}
	}
}

setTimeout(fullTest, 500)

async function testSend(big){
	let filePath = 'test.txt'
	if(big){
		filePath = 'big-test.txt'
	}
	let stream = fs.createReadStream(filePath)
	let size = fs.statSync(filePath).size
	let data = new formData()
	data.append('test', stream, { knownLength: size })
	let res = await fetch(baseUrl + 'files', { method:'POST', body: data })
	if(res.status !== 200){
		let error = new Error()
		error.statusCode = res.status
		throw error
	}
	let id = (await res.json()).id
	stream.destroy()
	return id
}

async function testGetList(expectedLength){
	let res = await fetch(baseUrl + 'files')
	if(res.status !== 200){
		throw Error()
	}
	let json = await res.json()
	console.log(json)
	if(json.files.length !== expectedLength){
		throw Error()
	}
}

async function testDownload(id, expected_size){
	if(!fs.existsSync('test-temp')){
		fs.mkdirSync('test-temp')
	}
	let tempPath = 'test-temp/test.txt'

	fetch(baseUrl + 'files/' + id).then(res => new Promise((resolve, reject) => {	
		let stream = fs.createWriteStream(tempPath)
		if(res.status !== 200){
			throw Error()
		}
		res.body.pipe(stream)
		stream.on('error', reject);
		res.body.on('end', () => {
			stream.destroy()
			resolve()
		});
	})).then(() => {
		let downloadSize = fs.statSync(tempPath).size
		if(downloadSize !== expected_size){
			console.log(`downloadSize == ${downloadSize} !== expected_size ${expected_size}`)
			throw Error()
		}
		fs.unlinkSync(tempPath)
	})
}