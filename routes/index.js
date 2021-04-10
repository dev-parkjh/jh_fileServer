const express = require('express');
const fs = require('fs');
const http = require('http');
const path = require('path');
const router = express.Router();

const dataDir = path.normalize(__dirname + '/../data');

// 함수
const reqExtend = req => {
  const ua = req.headers['user-agent'];
  req.isIe = (ua.indexOf("MSIE ") > 0 || !!ua.match(/Trident.*rv\:11\./));

  // TODO: 그걸로 끝나는지, 혹은 뒤에 더있는지 처리해줘야 함 / 이거ㅇㅇ

  req.isPathPublic = req.path == '/public' || /^\/public\/.*/.test(req.path);
  req.isPathHome = req.path == '/home' || /^\/home\/.*/.test(req.path);

  return req;
}

router.get('/', function (req, res, next) {
  // TODO: 세션 작업 해야 함
  const session = false;

  if (session) {
    res.redirect('/home');
  } else {
    res.redirect('/public');
  }
});

// 그 외의 경로에 대해 수행
router.get('/*', (req, res, next) => {
  req = reqExtend(req);

  if (req.isIe) {
    res.render('ieGuide');
    return true;
  }

  // TODO: 세션 작업 해야 함
  const session = false;

  if (req.isPathHome) {
    if (!session) {
      // TODO: 로그인 부분 만들기
      const loginSuccess = true;
      if (!loginSuccess) {
        // TODO: 로그인 실패 처리
      } else {
        next();
      }
    }
  } else if (req.isPathPublic) {
    next();
  } else {
    res.statusCode = 404;
    res.render('404page');
    return false;
  }
}, (req, res) => {
  req = reqExtend(req);

  if (req.isPathHome) {
    // TODO: 경로 치환해줘야 함
  }

  try {
    const target = dataDir + decodeURI(req.path);
    if (fs.existsSync(target)) {
      const stats = fs.statSync(target);
      if (stats.isDirectory()) {
        res.render('index', { title: 'webStorage' });
      } else {
        // api 프록시
        const reqHeadersHostArr = req.headers.host.split(':');
        const reqOptions = {
          hostname: reqHeadersHostArr[0],
          port: reqHeadersHostArr[1],
          path: '/api/file' + req.path,
          method: req.method,
          headers: req.headers
        };

        const proxy = http.request(reqOptions, apiRes => {
          res.writeHead(apiRes.statusCode, apiRes.headers);
          apiRes.pipe(res, { end: true });
        });

        req.pipe(proxy, { end: true });
      }
    } else {
      res.status(404);
      res.render('404page');
    }
  } catch (error) {
    console.error(error);
  }
});

module.exports = router;