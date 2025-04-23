var router = require('express').Router()
const path = require("path")
const fs = require("fs");

module.exports = app => {
    router.get('/media/:type/:name', (req, res) => {
        const { type, name } = req.params;

        let folderPath;

        if (type === 'image') {
            folderPath = path.join(__dirname, `../uploads/${name}`);
        } else if (type === 'pdf') {
            folderPath = path.join(__dirname, `../uploads/qr_pdfs/${name}`);
        } else {
            return res.status(400).send('Invalid type');
        }

        fs.exists(folderPath, (exists) => {
            if (exists) {
                res.sendFile(folderPath);
            } else {
                res.status(404).send('File not found');
            }
        });
    });

    app.use('/', router);
};


