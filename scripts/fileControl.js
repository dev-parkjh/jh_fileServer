/**
 * 파일 업로드를 관리하는 스크립트
 */
var fs = require('fs');
const multer = require('multer');

/**
 * 디렉터리 경로 마지막에 /를 포함하여 반환합니다.
 * @param {String} path 디렉터리 경로
 * @return {String} 마지막에 /가 포함된 디렉터리 경로
 */
const getFixedPath = path => path[path.length - 1] === '/' ? path : path + '/';

/**
 * 경로를 받아 파일 이름을 반환합니다
 * @param {String} path
 * @returns 
 */
const getFileNameFromPath = (path) => {
    const splitPath = path.split('/');
    let result = splitPath[splitPath.length - 1];
    return result;
}

/**
 * 파일 확장자를 받아 contentType을 반환합니다.
 * @param {String} extension 파일 확장자
 * @returns {String} contentType
 */
const mime = extension => {
    let contentType = `application/octet-stream`;

    switch (extension) {
        case `js`:
            contentType = `text/javascript`;
            break;

        case `css`:
        case `html`:
            contentType = `text/${extension}`;
            break;

        case `txt`:
            contentType = `text/plain`;
            break;

        case `mp3`:
            contentType = `audio/mpeg`;
            break;

        case `mp4`:
            contentType = `video/mp4`;
            break;

        case `png`:
        case `bmp`:
        case `jpg`:
        case `gif`:
            contentType = `image/${extension}`;
            break;
    }

    return contentType.indexOf('text') > -1 ? `${contentType}; charset=utf-8` : contentType;
}

/**
 * 업로드 기본 설정(경로, 파일명 지정 옵션)을 지정하여 multer 함수를 반환합니다.
 * @param {String} path 파일이 저장 될 경로
 * @param {String} fileNameType 파일명 지정 옵션 ( 'original':원본파일명.확장자 | 'timestamp':타임스탬프.확장자 | 'originalWithTimestamp':원본파일명-타임스탬프.확장자 )
 * @return {Function} 경로와 파일명 지정 옵션 값이 지정된 multer 함수
 */
const uploadSetting = (path, fileNameType) => {
    return multer({
        storage: multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, path);
            },
            filename: function (req, file, cb) {
                const lastDot = file.originalname.lastIndexOf('.');
                let fileExt = '';
                let fileName = file.originalname;
                if (lastDot > -1) {
                    fileExt = fileName.substr(lastDot, fileName.length);
                    fileName = fileName.substr(0, lastDot);
                }
                switch (fileNameType) {
                    case 'timestamp':
                        fileName = '';
                    case 'originalWithTimestamp':
                        fileName += ((fileName.length === 0 ? '' : '-') + new Date().valueOf());
                    default: // == 'original'
                }
                cb(null, fileName + fileExt);
            }
        })
    });
}

/**
 * 파일을 chunkSize로 분리하여 전송하는 함수
 * @param {String} path 디렉터리 경로
 * @param {String} fileName 파일명
 * @param {Object} request request
 * @param {Object} response response
 */
const sendChunkFile = (path, fileName, request, response) => {
    const file = `${getFixedPath(path)}${fileName}`;
    let contentType = mime(fileName.replace(/.*\./, ''));

    const stats = fs.statSync(file);
    const range = request.headers.range

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-")
        const start = parseInt(parts[0], 10)
        const end = parts[1] ?
            parseInt(parts[1], 10) :
            stats.size - 1
        const chunksize = (end - start) + 1
        const stream = fs.createReadStream(file, {
            start,
            end
        })

        response.writeHead(206, {
            "Content-Type": contentType,
            "Content-Length": chunksize,
            "Content-Range": `bytes ${start}-${end}/${stats.size}`,
            "Accept-Ranges": `bytes`,
        });
        stream.pipe(response);
    } else {
        response.writeHead(200, {
            "Content-Type": contentType,
            "Content-Length": stats.size,
            "Content-Disposition": `inline`
        })
        fs.createReadStream(file).pipe(response)
    }
}

exports.getFileNameFromPath = getFileNameFromPath;
exports.uploadSetting = uploadSetting;
exports.sendChunkFile = sendChunkFile;