import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'

config({ path: join(__dirname, '..', '.env') })

function loadDatabaseConfigs(): string[]{
	if(process.env.DATABASE_URL !== undefined){
		return ['', '', '', '', ''];
	}

	if(	process.env.PGHOST !== undefined &&
		process.env.PGPORT !== undefined &&
		process.env.PGUSER !== undefined &&
		process.env.PGPASSWORD !== undefined &&
		process.env.PGDATABASE !== undefined){

		return [process.env.PGHOST, process.env.PGPORT, process.env.PGUSER, process.env.PGPASSWORD, process.env.PGDATABASE]
	}
	else{
		throw Error("Database environment variables were undefined")
	}
}

const [pgHost, pgPortStr, pgUser, pgPassword, pgDatabase] = loadDatabaseConfigs()
const pgPort = parseInt(pgPortStr)

export { pgHost, pgPort, pgUser, pgPassword, pgDatabase }