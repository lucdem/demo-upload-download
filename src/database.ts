import { pgHost, pgPort, pgUser, pgPassword, pgDatabase } from './config'
import { File } from './file'

import pg from 'pg'

function _initPool(){
	if(process.env.DATABASE_URL !== undefined){
		return new pg.Pool({ 
			connectionString: process.env.DATABASE_URL,
			ssl:{
				rejectUnauthorized: false
			}
		})
	}
	return new pg.Pool({
		host: pgHost,
		port: pgPort,
		user: pgUser,
		password: pgPassword,
		database: pgDatabase
	})
}

export class Database{
	static _dbPool = _initPool()

	static async selectFile(id: number): Promise<File>{
		let query = {
			text: 'SELECT id, name, path, ip, size FROM file WHERE id = $1',
			rowMode: 'array',
			values: [id]
		}
		let res = await Database._dbPool.query(query)
		return res.rows.map(row =>{
			return {
				id: row[0],
				name: row[1],
				path: row[2],
				ip: row[3],
				size: row[4]
			}
		})[0]
	}

	static async selectIpFiles(ip: string): Promise<File[]>{
		let query = {
			text: 'SELECT id, name, path, ip, size FROM file WHERE ip = $1',
			rowMode: 'array',
			values: [ip]
		}
		let res = await Database._dbPool.query(query)
		return res.rows.map(row =>{
			return {
				id: row[0],
				name: row[1],
				path: row[2],
				ip: row[3],
				size: row[4]
			}
		}) ?? []
	}

	static async getUsedSpace(ip: string): Promise<number>{
		let query = {
			text: 'SELECT ip, SUM(size) FROM file WHERE ip = $1 GROUP BY ip',
			rowMode: 'array',
			values: [ip]
		}
		let res = await Database._dbPool.query(query)
		return res.rows.map(row => Number(row[1]))[0] ?? 0
	}

	static async insertFile(file: File): Promise<number>{
		let query = {
			text: 'INSERT INTO file (name, path, ip, size) VALUES ($1, $2, $3, $4) RETURNING id',
			rowMode: 'array',
			values: [file.name, file.path, file.ip, file.size]
		}
		let res = await Database._dbPool.query(query)
		return res.rows[0]
	}
}