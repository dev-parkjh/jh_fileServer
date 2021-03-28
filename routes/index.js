const express = require('express');
const fs = require('fs');
const spawnSync = require('child_process').spawnSync;
const router = express.Router();

const dataFolder = __dirname + '/../data';

router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/test', function (req, res, next) {
  res.render('index', { title: 'Express' });

  const target = dataFolder;

  const fileInfo = {
    type: '', // 'directory' | 'file'
    name: '',
    size: '',
    mtime: '', // 생성일시
    link: '',
    child: [] // 디렉토리일 경우 하위 파일 목록
  }

  const getFileNameFromPath = (path) => {
    const splitPath = path.split('/');
    let result = splitPath[splitPath.length - 1];
    return result;
  }

  //파일정보 로드
  const stats = fs.statSync(target);
  const readFileSize = spawnSync('du', ['-sb', target]);

  fileInfo.type = stats.isDirectory() ? 'directory' : 'file';
  fileInfo.name = getFileNameFromPath(target);
  fileInfo.size = readFileSize.stdout.toString().replace(/^(\d*)?\t.*\n$/, '$1');
  fileInfo.mtime = stats.mtime;

  // 디렉토리 내부정보 로드
  if (fileInfo.type == 'directory') {
    const fileList = fs.readdirSync(target);

    let child = [];

    for(let i=0, il=fileList.length; i<il; i++) {
      const subTarget = target+'/'+fileList[i];
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

  console.log(fileInfo);
});

module.exports = router;
