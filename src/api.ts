import { pgHost, pgPort, pgUser, pgPassword, pgDatabase } from './config'
import { Database } from './database'
import { File } from './file'

import express from 'express'
import formidable from 'formidable'

import os from 'os'
import fs from 'fs'
import path from 'path'

const app = express()
const sizeLimit = 300 * 1024 * 1024

const temp_dir = path.join(os.tmpdir(), 'pixlog-demo')
if(!fs.existsSync(temp_dir)){
	fs.mkdirSync(temp_dir)
}

app.get('/api/files', async (req, res) => {
	let files = await Database.selectIpFiles(req.ip)
	files.forEach(f => delete f.path)
	let totalSize = files.reduce((acc, file) => (acc + file.size), 0)
	res.json({
		files: files,
		spaceRemaining: sizeLimit - totalSize
	})
})

app.get('/api/files/:id', async (req, res) => {
	let file = await Database.selectFile(Number(req.params.id))
	if(file.ip !== req.ip){
		res.statusCode = 401
		res.send()
		return;
	}
	if(file){
		res.download(file.path)
	}
	else{
		res.statusCode = 404
		res.send()
	}
})

app.post('/api/files', (req, res) => {
	if(!req.headers['content-type'].includes('multipart/form-data')){
		res.statusCode = 400
		res.setHeader('content-type', 'text/plain')
		res.send("Content must be multipart/form-data")
		return;
	}
	const form = formidable({ 
		// 95 ao invés de 100 pq github não aceita arquivos maiores que 100mb e eu queria
		// colocar um arquivo maior que o limite da api na pasta de teste
		maxFileSize: 95 * 1024 * 1024,
		uploadDir: temp_dir, 
		maxFiles: 1,
		keepExtensions: true
	});

	form.parse(req, (err, fields, files) => {
		if(err){
			res.statusCode = 400
			res.setHeader('content-type', 'text/plain')
			res.send("Content must be ")
			return;
		}
		let file = files[Object.keys(files)[0]] as formidable.File
		Database.getUsedSpace(req.ip).then(spaceUsed => {
			if(spaceUsed + file.size > sizeLimit){
				res.statusCode = 400
				res.setHeader('content-type', 'text/plain')
				res.send("Content would exceed this Ip storage limit")
				return Promise.reject()
			}
		}).then(() => {
			let dbFile: File = {
				name: file.originalFilename,
				path: file.filepath,
				ip: req.ip,
				size: file.size
			}
			return Database.insertFile(dbFile).then(id => {
				dbFile.id = id
				return dbFile
			})
		}).then(dbFile => {
			res.json(dbFile)
		}).catch(() => {}) // uncatched rejection crashes express api
	});
})

// heroku na versão gratuita peridicamente coloca a aplicação para dormir a limpa o espaço em disco utilizado
// como esta aplicação tem fins apenas demonstrativos, quando a aplicação acorda a tabela no banco de dados
// é limpada para não manter referencias a arquivos que ja foram apagados do disco 
Database.truncate().then(() => app.listen(process.env.PORT || 3001))