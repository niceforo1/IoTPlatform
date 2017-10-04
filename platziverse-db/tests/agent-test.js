'use strict'

const test = require('ava')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const agentFixture = require('./fixtures/agent')

let config = {
  logging: function () {}
}

let MetricStub = {
  belongsTo: sinon.spy()
}

let AgentStub = null
let db = null
let uuid = 'yyy-yyy-yyy'
let sandbox = null
let single = Object.assign({}, agentFixture.single)
let id = 1
let usernameArgs = {
  where: { username: 'platzi', connected: true }
}
let connectedArgs = {
  where: { connected: true }
}
let uuidArgs = {
  where: {
    uuid
  }
}
let newAgent = {
  uuid: '123-123-123',
  name: 'test',
  username: 'test',
  hostname: 'test',
  pid: 0,
  connected: false
}

test.beforeEach(async () => {
  sandbox = sinon.sandbox.create()
  AgentStub = {
    hasMany: sandbox.spy()
  }

  // Model update Stub
  AgentStub.update = sandbox.stub()
  AgentStub.update.withArgs(single, uuidArgs).returns(Promise.resolve(single))

  // Model create Stub
  AgentStub.create = sandbox.stub()
  AgentStub.create.withArgs(newAgent).returns(Promise.resolve({
    toJSON () { return newAgent }
  }))

  // Model findById Stub
  AgentStub.findById = sandbox.stub()
  AgentStub.findById.withArgs(id).returns(Promise.resolve(agentFixture.findById(id)))

  // Model findOne Stub
  AgentStub.findOne = sandbox.stub()
  AgentStub.findOne.withArgs(uuidArgs).returns(Promise.resolve(agentFixture.findbyUuid(uuid)))

  // Model findAll Stub
  AgentStub.findAll = sandbox.stub()
  AgentStub.findAll.withArgs().returns(Promise.resolve(agentFixture.all))
  AgentStub.findAll.withArgs(connectedArgs).returns(Promise.resolve(agentFixture.connected))
  AgentStub.findAll.withArgs(usernameArgs).returns(Promise.resolve(agentFixture.platzi))

  const setupDatabase = proxyquire('../', {
    './models/agent': () => AgentStub,
    './models/metric': () => MetricStub
  })

  db = await setupDatabase(config)
})

test.afterEach(() => {
  sandbox && sinon.sandbox.restore()
})

test('Agent', t => {
  t.truthy(db.Agent, 'Agent service should exists')
})

test.serial('Setup', t => {
  t.true(AgentStub.hasMany.called, 'AgentModel.hasMany was executed')
  t.true(AgentStub.hasMany.calledWith(MetricStub), 'Argument should be the MetricModel')
  t.true(MetricStub.belongsTo.called, 'MetricStuc.belongsTo was executed')
  t.true(MetricStub.belongsTo.calledWith(AgentStub), 'Argument should be the AgentModel')
})

test.serial('Agent#findById', async t => {
  let agent = await db.Agent.findById(id)

  t.true(AgentStub.findById.called, 'findById should be called on model')
  t.true(AgentStub.findById.calledOnce, 'findById should be called once')
  t.true(AgentStub.findById.calledWith(id), 'findById should be called with specified id')

  t.deepEqual(agent, agentFixture.findById(id), 'should be the same')
})

test.serial('Agent#findByUuid', async t => {
  let agents = await db.Agent.findByUuid(uuid)
  t.true(AgentStub.findOne.called, 'findOne should be called')
  t.true(AgentStub.findOne.calledOnce, 'findOne should be called once')
  t.true(AgentStub.findOne.calledWith(uuidArgs), 'findOne should be called with username args')

  t.deepEqual(agents, agentFixture.findbyUuid(uuid), 'agents should be de same')
})

test.serial('Agent#findByUsername', async t => {
  let agents = await db.Agent.findByUsername('platzi')
  t.true(AgentStub.findAll.called, 'findAll should be called')
  t.true(AgentStub.findAll.calledOnce, 'findAll should be called once')
  t.true(AgentStub.findAll.calledWith(usernameArgs), 'findAll should be called with username args')

  t.is(agents.length, agentFixture.platzi.length, 'agents should be the same length')
  t.deepEqual(agents, agentFixture.platzi, 'agents should be de same')
})

test.serial('Agent#findAll', async t => {
  let agents = await db.Agent.findAll()
  t.true(AgentStub.findAll.called, 'findAll should be called')
  t.true(AgentStub.findAll.calledOnce, 'findAll should be called once')
  t.true(AgentStub.findAll.calledWith(), 'findAll should be called without args')

  t.is(agents.length, agentFixture.all.length, 'agents should be the same length')
  t.deepEqual(agents, agentFixture.all, 'agents should be the same')
})

test.serial('Agent#findByUsername', async t => {
  let agents = await db.Agent.findConnected()
  t.true(AgentStub.findAll.called, 'findAll should be called')
  t.true(AgentStub.findAll.calledOnce, 'findAll should be called once')
  t.true(AgentStub.findAll.calledWith(connectedArgs), 'findAll should be called with connected args')

  t.is(agents.length, agentFixture.connected.length, 'agents should be the same length')
  t.deepEqual(agents, agentFixture.connected)
})
/*
test.serial('Agent#createOrUpdate - userExists', async t => {
  let agent = await db.Agent.createOrUpdate(single)

  t.true(AgentStub.findOne.called, 'findOne should be called on model')
  t.true(AgentStub.findOne.calledTwice, 'findOne should be called twice')
  t.true(AgentStub.update.calledOnce, 'update should be called once')

  t.deepEqual(agent, single, 'Agent should be the same')
})
*/

test.serial('Agent#createOrUpdate - exits', async t => {
  let agent = await db.Agent.createOrUpdate(single)

  t.true(AgentStub.findOne.called, 'findOne should be called on model')
  t.true(AgentStub.findOne.calledTwice, 'findOne should be called twice')
  t.true(AgentStub.findOne.calledWith(uuidArgs), 'findOne should be called with uuid args')
  t.true(AgentStub.update.called, 'update should be called')
  t.true(AgentStub.update.calledOnce, 'update should be called once')
  t.true(AgentStub.update.calledWith(single), 'update should be called with single')

  t.deepEqual(agent, single, 'Agent should be the same')
})

test.serial('Agent#createOrUpdate - new', async t => {
  let agent = await db.Agent.createOrUpdate(newAgent)
  t.true(AgentStub.findOne.called, 'findOne should be called')
  t.true(AgentStub.findOne.calledOnce, 'findOne should be called once')
  t.true(AgentStub.findOne.calledWith({
    where: { uuid: newAgent.uuid }
  }), 'findOne should be called with uuid args')
  t.true(AgentStub.create.called, 'create should be called on model')
  t.true(AgentStub.create.calledOnce, 'create should be called once')
  t.true(AgentStub.create.calledWith(newAgent), 'create should be called with newAgent args')

  t.deepEqual(agent, newAgent, 'agent should be the same')
})
