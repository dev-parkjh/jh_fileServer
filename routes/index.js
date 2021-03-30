const express = require('express');
const fs = require('fs');
const spawnSync = require('child_process').spawnSync;
const fileControl = require('../scripts/fileControl');
const router = express.Router();

const dataFolder = __dirname + '/../data';

router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

// 파일정보 불러오기
router.get('/file', (req, res, next) => {
  const params = req.params;

  /**
   * TODO
   * 경로 지정(+세션.아이디 포함해서)
   * 히든파일 표시여부
   */

  const filePath = dataFolder; //params.filePath
  const fileInfo = fileControl.getFileInfoFromPath(filePath);

  res.json(fileInfo);
});

// 파일 업로드
router.post('/file', (req, res, next) => {
  console.log(req.body);
  res.json(req.body);
});

// 파일 삭제
router.delete('/file', (req, res, next) => {
  console.log(req.body);
  res.json(req.body);
});

// 파일 이동(이름변경)
router.put('/file', (req, res, next) => {
  console.log(req.body);
  res.json(req.body);
});

module.exports = router;
