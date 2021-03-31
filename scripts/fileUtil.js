/**
 * 파일 업로드를 관리하는 스크립트
 */
const fs = require('fs');
const pathUtil = require("path");
const multer = require('multer');
const spawnSync = require('child_process').spawnSync;
const commonUtil = require('./commonUtil');

/**
 * 경로 마지막에 separators를 포함하여 반환합니다.
 * @param {String} path 디렉터리 경로
 * @return {String} 마지막에 separators가 포함된 디렉터리 경로
 */
const getFixedPath = path => path[path.length - 1] === pathUtil.sep ? path : path + pathUtil.sep;

/**
 * 경로를 받아 파일 이름을 반환합니다.
 * @param {String} path
 * @returns 
 */
const getFileNameFromPath = (path) => {
    const splitPath = path.split(pathUtil.sep);
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
    const file = getFixedPath(path) + fileName;
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

/**
 * 파일경로를 받아 파일 정보를 반환합니다.
 * @param {String} path 파일 경로
 * @return {Number} 파일 용량(Byte)
 */
const getFileSizeFromPath = path => {
    let size = 0;
    const osType = commonUtil.getOsType();

    if (osType == 'Windows') {
        const command = `(gci "${pathUtil.normalize(path)}" | measure Length -s).sum`;
        const readFileSize = spawnSync("powershell.exe", [command]);
        size = readFileSize.stdout.toString().replace(/\r\n/, '');
    } else if (osType == 'Mac') {
        /**
         * 맥은 b: byte 단위 표시가 없고, k: KB 단위부터 옵션을 줄 수 있다.
         * 단위옵션 없이 조회할 경우 "512바이트 = 1블록" 으로 결과값을 리턴한다.
         * 따라서 결과값*512 값을 주어 다른 운영체제 리턴값과 동일한 형식으로 설정한다.
         */
        const readFileSize = spawnSync('du', ['-s', path]);
        size = readFileSize.stdout.toString().replace(/^(\d*)?\t.*\n$/, '$1');
        size = Number(size) * 512;
    } else if (osType == 'Linux') {
        const readFileSize = spawnSync('du', ['-sb', path]);
        size = readFileSize.stdout.toString().replace(/^(\d*)?\t.*\n$/, '$1');
    }

    return Number(size);
}

/**
 * 파일경로를 받아 확장자를 반환합니다.
 * @param {String} path 파일 경로
 * @return {String} 확장자
 */
const getExtensionTypeFromPath = path => {
    const pathArray = path.split(pathUtil.sep);
    const fileName = pathArray[pathArray.length-1];

    let extensionType = '';
    let dotPosition = fileName.lastIndexOf('.');

    if (dotPosition != -1) {
        extensionType = fileName.substring(dotPosition, path.length).toLowerCase();
    }

    return extensionType;
}


/**
 * 파일경로를 받아 파일 정보를 반환합니다.
 * @param {String} path 파일 경로
 * @return {JSON} 파일정보(타입, 이름, 용량, 생성시간 등...)
 */
const getFileInfoFromPath = path => {
    const fileInfo = {
        type: '', // 'directory' | 'file'
        name: '',
        size: '',
        mtime: '',
        extType: '',
        child: [] // 디렉터리일 경우 하위 파일 목록
    }

    const stats = fs.statSync(path); //파일정보 로드

    fileInfo.type = stats.isDirectory() ? 'directory' : 'file';
    fileInfo.name = getFileNameFromPath(path);
    fileInfo.size = getFileSizeFromPath(path);
    fileInfo.mtime = stats.mtime;
    fileInfo.ext = stats.isDirectory() ? '' : getExtensionTypeFromPath(path);

    if (fileInfo.type == 'directory') {
        const subFileList = fs.readdirSync(path); // 디렉터리 내부정보 로드

        let child = [];

        for (let i = 0, il = subFileList.length; i < il; i++) {
            const subFilePath = getFixedPath(path) + subFileList[i];
            const subFileStats = fs.statSync(subFilePath);

            child[i] = {
                type: subFileStats.isDirectory() ? 'directory' : 'file',
                name: subFileList[i],
                size: getFileSizeFromPath(subFilePath),
                extType: subFileStats.isDirectory() ? '' : getExtensionTypeFromPath(subFilePath),
                mtime: subFileStats.mtime
            }
        }

        fileInfo.child = child;
    }

    return fileInfo;
}

exports.getFileNameFromPath = getFileNameFromPath;
exports.getFileInfoFromPath = getFileInfoFromPath;
exports.uploadSetting = uploadSetting;
exports.sendChunkFile = sendChunkFile;