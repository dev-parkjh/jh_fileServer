const { log } = require('console');
const express = require('express');
const fs = require('fs');
const path = require("path");
const fileUtil = require('../scripts/fileUtil');
const router = express.Router();

const dataDir = path.normalize(__dirname + '/../data');

router.get('/dir', (req, res, next) => {
    const dirPath = dataDir + decodeURI(req.query.path);
    const dirInfo = fileUtil.getDirInfo(dirPath);
    res.json(dirInfo);
});


router.get('/file*', (req, res, next) => {
    const filePath = dataDir + decodeURI(req.path).replace(/\/file/, '');
    fileUtil.sendChunkFile(filePath, req, res);
});

module.exports = router;