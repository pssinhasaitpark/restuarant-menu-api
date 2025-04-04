var router = require('express').Router()
const path = require("path")

module.exports = app => {
    router.get('/media/:name', (req, res) => {
        const { type, name } = req.params
        
        res.sendFile(path.join(__dirname, `../uploads/${name}`,))
    })

    app.use('/', router)
};