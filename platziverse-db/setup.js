'use strict'

const debug = require('debug')('platziverse:db:setup')
const inquirer = require('inquirer')
const chalk = require('chalk')
const db = require('./')

const prompt = inquirer.createPromptModule()
async function setup () {
  // esto hay que agregar para recibir parametros por medio de la consola
  // const eliminar = process.argv[2].replace('--','')
  const answer = await prompt([
    {
      type: 'confirm',
      name: 'setup',
      message: 'Esto va a borrar su base de datos, esta seguro?'
    }
  ])
  if (!answer.setup) {
    return console.log('No pasa nada.')
  }

  const config = {
    database: process.env.DB_NAME || 'platziverse',
    username: process.env.DB_USER || 'platzi',
    password: process.env.DB_PASS || 'platzi',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: s => debug(s),
    setup: true
  }

  await db(config).catch(handleFatalError)

  console.log('Success!')
  process.exit(0)
}

function handleFatalError (err) {
  console.error(`${chalk.red('[FATAL ERROR]')} ${err.message}`)
  console.error(err.stack)
  process.exit(1)
}

setup()
