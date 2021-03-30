/**
 * 운영체제 종류를 반환합니다.
 * @return {String} 운영체제 종류('Windows'|Mac'|'Linux')
 */
const getOsType = () => {
    let osType = '';

    switch (process.platform) {
        case 'win32':
        case 'win64':
            osType = 'Windows';
            break;
        case 'darwin':
            osType = 'Mac';
            break;
        case 'linux':
            osType = 'Linux';
            break;
    }

    return osType;
}

exports.getOsType = getOsType;