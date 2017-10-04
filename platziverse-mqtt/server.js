'use strict'

const debug = require('debug')
const mosca = require('mosca')
const redis = require('redis')
const chalk = require('chalk')
const db = require('platziverse-db')
const { parsePayload } = require('./utils')

const backend = {
  type: 'redis',
  redis,
  return_buffers: true
}

const settings = {
  port: 1883,
  backend
}

const config = {
  database: process.env.DB_NAME || 'platziverse',
  username: process.env.DB_USER || 'platzi',
  password: process.env.DB_PASS || 'platzi',
  host: process.env.DB_HOST || 'localhost',
  dialect: 'postgres',
  logging: s => debug(s)
}

const server = new mosca.Server(settings)
const clients = new Map()

let Agent, Metric

server.on('clientConnected', client => {
  console.log(`${chalk.green('Client connected: ')} ${client.id}\n`)
  clients.set(client.id, null)
  // debug(`Client connected: ${client.id}`)
})

server.on('clientDisconnected', async client => {
  console.log(`${chalk.red('Client Disconnected:')} ${client.id}\n`)
  debug(`Client Disconnected: ${client.id}`)
  const agent = clients.get(client.id)

  if (agent) {
    // Mark this agent as disconnected
    agent.connected = false

    try {
      await Agent.createOrUpdate(agent)
    } catch (e) {
      return handleError(e)
    }

    // delete Agente from Client List
    clients.delete(client.id)
    server.publish({
      topic: 'agent/disconnected',
      payload: JSON.stringify({
        agent: {
          uuid: agent.uuid
        }
      })
    })

    console.log(`${chalk.cyan(`Client (${client.id}) associated to Agent (${agent.uuid}) marked as Disconnected:`)}\n`)
  }
})

server.on('published', async(packet, client) => {
  switch (packet.topic) {
    case 'agent/connected':
    case 'agent/disconnected':
      console.log(`${chalk.cyan('Payload: ')} ${packet.payload}\n`)
      break
    case 'agent/message':
      const payload = parsePayload(packet.payload)
      console.log(`${chalk.cyan('Payload: ')} ${packet.payload}\n`)

      if (payload) {
        payload.agent.connected = true
        let agent

        try {
          agent = await Agent.createOrUpdate(payload.agent)
        } catch (e) {
          return handleError(e)
        }
        console.log(`${chalk.green(`Agent ${agent.uuid} saved`)}\n`)

        if (!clients.get(client.id)) {
          clients.set(client.id, agent)
          server.publish({
            topic: 'agent/connected',
            payload: JSON.stringify({
              agent: {
                uuid: agent.uuid,
                name: agent.name,
                hostname: agent.hostname,
                pid: agent.pid,
                connected: agent.connected
              }
            })
          })
        }

        // Store Metrics
        for (let metric of payload.metrics) {
          let m
          try {
            m = await Metric.create(agent.uuid, metric)
          } catch (e) {
            return handleError(e)
          }

          console.log(`${chalk.green(`Metric ${m.id} saved on agent ${agent.uuid}`)}\n`)
        }
      }
      break
  }
  console.log(`${chalk.cyan('Received: ')} ${packet.topic}\n`)

  debug(`Received: ${packet.topic}`)
  debug(`Payload: ${packet.payload}`)
})

server.on('ready', async () => {
  const services = await db(config).catch(handleFatalError)
  Agent = services.Agent
  Metric = services.Metric
  console.log(`${chalk.green('[platziverse-mqtt] ')} server is running...`)
})

server.on('error', handleFatalError)

function handleFatalError (error) {
  console.error(`${chalk.bgRed('[fatalError]')} ${error}`)
  console.error(error.stack)
  process.exit(1)
}

function handleError (error) {
  console.error(`${chalk.bgRed('[error]')} ${error}`)
  console.error(error.stack)
}

process.on('uncaughtException: ', handleFatalError)
process.on('unhandledRejection: ', handleFatalError)
