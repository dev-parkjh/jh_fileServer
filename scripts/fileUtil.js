/**
 * 파일 업로드를 관리하는 스크립트
 */
const fs = require('fs');
const path = require("path");
const multer = require('multer');

/**
  * 해당경로에 존재하는 모든 파일을 배열로 반환합니다.
  * @param {String} dirPath 디렉터리 경로
  * @param {Array} fileArray 재귀호출을 위한 배열
  * @returns {Array} 파일목록
  */
const getAllSubFilePathList = (dirPath, fileArray) => {
    try {
        fileArray = fileArray || [];
        files = fs.readdirSync(dirPath);

        files.forEach(file => {
            const target = dirPath + path.sep + file;
            if (fs.statSync(target).isDirectory()) {
                fileArray = getAllSubFilePathList(target, fileArray);
            } else {
                fileArray[fileArray.length] = target;
            }
        });
    } catch (error) {
        console.error(error);
    }

    return fileArray;
}

/**
  * 경로를 받아 폴더 용량을 반환합니다.
  * @param {String} filePath
  * @returns {number} 폴더용량(Byte)
  */
const getDirSize = dirPath => {
    const allSubFilePathList = getAllSubFilePathList(dirPath);
    let totalSize = 0;

    allSubFilePathList.forEach(filePath => {
        try {
            totalSize += fs.statSync(filePath).size;
        } catch (error) {
            console.error(error);
        }
    });

    return totalSize;
}

/**
  * 경로를 받아 파일명을 반환합니다.
  * @param {String} filePath
  * @returns {String} 파일명
  */
const getNameFromPath = filePath => {
    const splitPath = filePath.split(path.sep);
    return splitPath[splitPath.length - 1];
}

/**
  * 파일명을 받아 확장자를 반환합니다.
  * @param {String} fileName 파일명
  * @return {String} 확장자
  */
const getExt = fileName => {
    let ext = '';
    let dotPos = fileName.lastIndexOf('.');

    if (dotPos != -1) {
        ext = fileName.substring(dotPos, fileName.length).toLowerCase();
    }

    return ext;
}

/**
 * 디렉터리 경로를 받아 디렉터리 정보를 반환합니다.
 * @param {String} dirPath 파일 경로
 * @return {JSON} 디렉터리 정보
 */
const getDirInfo = dirPath => {
    let dirInfo = {};

    try {
        const subFileList = fs.readdirSync(dirPath); // 디렉터리 내부정보 로드
        let child = [];

        subFileList.forEach((subFile, index) => {
            const subFilePath = dirPath + path.sep + subFile;
            const subFileStats = fs.statSync(subFilePath);
            let subFileSize = 0;
            let subFileExt = '';

            if (subFileStats.isDirectory()) {
                subFileSize = getDirSize(subFilePath);
                subFileExt = 'directory';
            } else {
                subFileSize = subFileStats.size;
                subFileExt = getExt(subFile);
            }

            child[index] = {
                isDirectory: subFileStats.isDirectory(),
                name: subFile,
                size: subFileSize,
                mtime: subFileStats.mtime,
                ext: subFileExt
            }
        });

        const dirStats = fs.statSync(dirPath);
        let dirSize = 0;

        child.forEach(subFile => {
            dirSize += subFile.size;
        });

        dirInfo = {
            name: getNameFromPath(dirPath),
            size: dirSize,
            mtime: dirStats.mtime,
            child: child
        }
    } catch (error) {
        console.error(error);
    }

    return dirInfo;
}

/**
 * 파일 확장자를 받아 contentType을 반환합니다.
 * @param {String} ext 파일 확장자
 * @returns {String} contentType
 */
const getMime = ext => {
    let contentType = `application/octet-stream`;

    switch (ext) {
        case `js`:
            contentType = `text/javascript`;
            break;

        case `css`:
        case `html`:
            contentType = `text/${ext}`;
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
            contentType = `image/${ext}`;
            break;
    }

    if (contentType.indexOf('text') > -1) {
        contentType = contentType + '; charset=utf-8';
    }

    return contentType;
}


/**
 * 파일을 chunkSize로 분리하여 전송하는 함수
 * @param {String} filePath 파일 경로
 * @param {Object} req request
 * @param {Object} res response
 */
const sendChunkFile = (filePath, req, res) => {
    const fileName = getNameFromPath(filePath);
    const contentType = getMime(fileName.replace(/.*\./, ''));

    const stats = fs.statSync(filePath);
    const range = req.headers.range

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-")
        const start = parseInt(parts[0], 10)
        const end = parts[1] ?
            parseInt(parts[1], 10) :
            stats.size - 1
        const chunksize = (end - start) + 1
        const stream = fs.createReadStream(filePath, {
            start,
            end
        })

        res.writeHead(206, {
            "Content-Type": contentType,
            "Content-Length": chunksize,
            "Content-Range": `bytes ${start}-${end}/${stats.size}`,
            "Accept-Ranges": `bytes`,
        });
        stream.pipe(res);
    } else {
        res.writeHead(200, {
            "Content-Type": contentType,
            "Content-Length": stats.size,
            "Content-Disposition": `inline`
        })
        fs.createReadStream(filePath).pipe(res)
    }
}

exports.getDirInfo = getDirInfo;
exports.sendChunkFile = sendChunkFile;
