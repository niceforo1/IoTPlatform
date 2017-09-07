'use strict'
const agent = {
    id:1,
    uuid: 'yyy-yyy-yyy',
    name: 'platzi',
    username: 'test-host',
    pid: 0,
    connected: true,
    createdAt: new Date(),
    updatedAt: new Date()
}

const agents = [
    agent,
    extend(agent, {id:2, uuid: 'yyy-yyy-www', username: 'test', connected: false,}),
    extend(agent, {id:3, uuid: 'yyy-ooo-www'}),
    extend(agent, {id:4, uuid: 'yyy-ooo-zzz', username: 'test'}),

]

function extend(obj, values){
    const clone = Object.assign({}, obj)
    return Object.assign(clone, values)
}

module.exports={
    single: agent,
    all: agents,
    connected: agents.filter(a => a.connected),
    platzi: agents.filter(a => a.username === 'platzi'),
    byUuid:id => agents.filter(a => a.uuid=== id).shift(),
    byId:id => agents.filter(a => a.id=== id).shift()    
}