'use strict'
const agent = {
  id: 1,
  uuid: 'yyy-yyy-yyy',
  name: 'fixture',
  username: 'platzi',
  hostname: 'test-host',
  pid: 0,
  connected: true,
  createdAt: new Date(),
  updatedAt: new Date()
}

const agents = [
  agent,
  extend(agent, {id: 2, uuid: 'yyy-yyy-www', username: 'test', connected: false}),
  extend(agent, {id: 3, uuid: 'yyy-yyy-xxx'}),
  extend(agent, {id: 4, uuid: 'yyy-yyy-zzz', username: 'test'})

]

function extend (obj, values) {
  const clone = Object.assign({}, obj)
  return Object.assign(clone, values)
}

module.exports = {
  single: agent,
  all: agents,
  connected: agents.filter(a => a.connected),
  platzi: agents.filter(a => a.username === 'platzi'),
  findbyUuid: id => agents.filter(a => a.uuid === id).shift(),
  findById: id => agents.filter(a => a.id === id).shift()
}
