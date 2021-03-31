const express = require('express');
const fs = require('fs');
const path = require("path");
const fileUtil = require('../scripts/fileUtil');
const router = express.Router();

const dataFolder = path.normalize(__dirname + '/../data');

router.get('/', function (req, res, next) {
  res.render('index', { title: '' });
});

// 디렉터리 정보 불러오기
router.get('/dir', (req, res, next) => {
  const params = req.params;
  const dirPath = dataFolder; //params.filePath

  const dirInfo = fileUtil.getDirInfo(dirPath);

  res.json(dirInfo);
});

module.exports = router;
