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

  const target = dataFolder;

  const fileInfo = {
    type: '', // 'directory' | 'file'
    name: '',
    size: '',
    mtime: '',
    link: '',
    child: [] // 디렉토리일 경우 하위 파일 목록
  }

  //파일정보 로드
  const stats = fs.statSync(target);
  const readFileSize = spawnSync('du', ['-sb', target]);

  fileInfo.type = stats.isDirectory() ? 'directory' : 'file';
  fileInfo.name = fileControl.getFileNameFromPath(target);
  fileInfo.size = readFileSize.stdout.toString().replace(/^(\d*)?\t.*\n$/, '$1');
  fileInfo.mtime = stats.mtime;

  // 디렉토리 내부정보 로드
  if (fileInfo.type == 'directory') {
    const fileList = fs.readdirSync(target);

    let child = [];

    for (let i = 0, il = fileList.length; i < il; i++) {
      const subTarget = target + '/' + fileList[i];
      const subFileStats = fs.statSync(subTarget);
      const readSubFileSize = spawnSync('du', ['-sb', subTarget]);

      child[i] = {
        type: subFileStats.isDirectory() ? 'directory' : 'file',
        name: fileList[i],
        size: readSubFileSize.stdout.toString().replace(/^(\d*)?\t.*\n$/, '$1'),
        mtime: subFileStats.mtime
      }
    }

    fileInfo.child = child;
  }

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
