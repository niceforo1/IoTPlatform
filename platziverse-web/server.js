'use strict'

const debug = require('debug')('platziverse:web')
const http = require('http')
const path = require('path')
const express = require('express')
const chalk = require('chalk')
const socketio = require('socket.io')
const PlatziverseAgent = require('platziverse-agent')

const port = process.env.PORT || 8080
const app = express()
const server = http.createServer(app)
const io = socketio(server)
const agent = new PlatziverseAgent()


app.use(express.static(path.join(__dirname, 'public')))

// Socket.io / Web Socket
io.on('connect', socket => {
  debug(`Connected: ${socket.id}`)
  
  agent.on('agent/message', payload => {
    debug('agent/message', payload)
    socket.emit('agent/message', payload)
  })

  agent.on('agent/connected', payload => {
    debug('agent/connected', payload)
    socket.emit('agent/connected', payload)
  })

  agent.on('agent/disconnected', payload => {
    debug('agent/disconnected', payload)
    socket.emit('agent/disconnected', payload)
  })
})



function handleFatalError (err) {
  console.error(`${chalk.red('[Fatal error]')} ${err.message}`)
  console.error(err.stack)
  process.exit(1)
}

process.on('uncaughtException', handleFatalError)
process.on('unhandledRejection', handleFatalError)

server.listen(port, () => {
  console.log(`${chalk.green('[platziverse-web]')} server listening on ${port}`)
  agent.connect()
})
