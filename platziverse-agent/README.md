# platziverse-agent

## Usage

``` js
  const PlatziverseAgent = require('platziverse-agent')
  
  const agent = new PlatziverseAgent({
    name: 'myapp',
    username: 'admin',
    interval: 2000
  })

  agent.addMetric('rss', function getRss(){
    return process.memoryUsage().rss
  })

  agent.addMetric('promiseMetric', function getRandomPromis(){
    return Promise.resolve(Math.random())
  })

  agent.addMetric('callbackMetric', fuction getRandomCallback(callback){
    setTimeout(()=>{
      callback(null, Math.random())
    }, 1000)
  })

  agent.connect()

// This agent only
  agent.on('connected', handler)
  agent.on('disconnected', handler)
  agent.on('message', handler)
  
// Other Agents
  agent.on('agent/connected', handler)  
  agent.on('agent/disconnected', handler)  
  agent.on('agent/message', payload =>{
    console.log(payload)
  })

  function handler(payload){
    console.log(payload)
  }

  setTimeout(() => agent.disconnect(), 20000)
```