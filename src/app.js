const fs = require('fs');
const express = require('express')
const { MongoClient } = require("mongodb");

const app = express()
const port = process.env.PORT || 3000

app.set('view engine', 'hbs')
app.use(express.urlencoded({extended: true}))

app.use(express.json())

app.listen(port, () => {
    console.log('Server is up on port ' + port) 
})

//paste an uri that you desire
const uri = "xxx"
const client = new MongoClient(uri);

async function connectDB() {
  try {

    await client.connect()
    await client.db("support-portal").command({ ping: 1 })
    console.log("Connected successfully to server")

    const cursor = client.db("support-portal").collection("users").find({})
    const results =  cursor.toArray()

    return results

  } catch (e) {
      console.log(e)
  }
}

async function run() {
    try {
        const data = await connectDB()
        let userList = []
        data.forEach((datum) => {
            if ( datum.manager ) {
                let tempJSON = {}
                tempJSON.name = datum.name
                tempJSON.username = datum.username
                tempJSON.manager = datum.manager
                userList.push(tempJSON)
            }
        })
    
        let managerList = []
        data.forEach((datum) => {
            if (datum.manager) {
                if ( !managerList.includes(datum.manager)) {
                    managerList.push(datum.manager)
                }
            }
        })
    
        let finalManagerList = []
        managerList.forEach((manager) => {
            data.forEach((datum) => {
                if (datum.username === manager){
                    finalManagerList.push(datum)
                }
    
            })
        })
    
        let topManager
        finalManagerList.forEach((manager) => {
            if ( !manager.manager ) {
                topManager = manager
            }
        })
    
        let firstNode = {}
        firstNode.name = topManager.name
        firstNode.username = topManager.username
        firstNode.children = []
        
        userList.forEach((user) => {
            if (user.manager === topManager.username) {
                let tempJSON = {}
                tempJSON.name = user.name
                tempJSON.username = user.username
                tempJSON.children = []
                firstNode.children.push(tempJSON)
            }
        })
    
        userList.forEach((user) => {
            if (user.manager === firstNode.children[0].username) {
                let tempJSON = {}
                tempJSON.name = user.name
                tempJSON.username = user.username
                tempJSON.children = []
                firstNode.children[0].children.push(tempJSON)
            }
        })
    
        userList.forEach((user) => {
            
            if ( user.manager === firstNode.children[0].children[0].username ) {
                let tempJSON = {}
                tempJSON.name = user.name
                tempJSON.username = user.username
                tempJSON.children = []
                firstNode.children[0].children[0].children.push(tempJSON)
            }
        })

    
        var jsonStr = JSON.stringify(firstNode)
    
        return jsonStr
    } catch (e) {
        console.log(e)
    }
}

app.get('/users', async(req,res) => {
    try {
        var promise = Promise.resolve(run())
        promise.then(function(val) {
            fs.writeFile('myjsonfile.json', val,  function(err) {
                if (err) throw err;
                console.log('complete');
                }
            )
        })
        return res.render('collapseibletree', {})
    } catch (e) {
        console.log(e)
        res.status(400).send(e)
    }
})