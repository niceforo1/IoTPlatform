'use strict'

const debug = require('debug')('platziverse:api:routes')
const express = require('express')
const db = require('platziverse-db')
const asyncify = require('express-asyncify')
const auth = require('express-jwt')
const guard = require('express-jwt-permissions')()

const config = require('./config')

const api = asyncify(express.Router())

let services, Agent, Metrics

api.use('*', async (req, res, next) => {
  if (!services) {
    debug('Connecting to database')
    try {
      services = await db(config.db)
    } catch (e) {
      return next(e)
    }

    Agent = services.Agent
    Metrics = services.Metric
  }
  next()
})

api.get('/agents', auth(config.auth), async (req, res, next) => {
  debug('A request has to come to /agents')

  const { user } = req

  if (!user || !user.username) {
    return next(new Error('Not Authorized'))
  }

  let agents = []
  try {
    if (user.admin){
      agents = await Agent.findConnected()
    }else{
      agents = await Agent.findByUsername(user.username)
    }
    agents = await Agent.findConnected()
  } catch (e) {
    return next(e)
  }
  res.send(agents)
})

api.get('/agent/:uuid', auth(config.auth), guard.check(['metrics:read']) , async (req, res, next) => {
  const { uuid } = req.params
  debug(`request to /agent/${uuid}`)
  

  let agent

  try {
    agent = await Agent.findByUuid(uuid)
  } catch (e) {
    next(e)
  }

  if (!agent) {
    return next(new Error(`Agent not found with uuid ${uuid}`))
  }

  res.send(agent)
})

api.get('/metrics/:uuid',auth(config.auth), guard.check(['metrics:read']), async (req, res, next) => {
  const { uuid } = req.params

  debug(`request to /metrics/${uuid}`)

  let metrics = []
  try {
    metrics = await Metrics.findByAgentUuid(uuid)
  } catch (e) {
    next(e)
  }

  if (!metrics || metrics.length === 0) {
    return next(new Error(`Metrics not found for agent with uuid ${uuid}`))
  }

  res.send(metrics)
})

api.get('/metrics/:uuid/:type', async (req, res, next) => {
  const { uuid, type } = req.params

  debug(`request to /metrics/${uuid}/${type}`)

  let metrics = []

  try {
    metrics = await Metrics.findByTypeAgentUuid(type, uuid)
  } catch (e) {
    next(e)
  }

  if (!metrics || metrics.length === 0) {
    return next(new Error(`Metrics not found for agent with uuid ${uuid} and type ${type}`))
  }
  res.send(metrics)
})

module.exports = api
