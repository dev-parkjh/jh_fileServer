const app = new Vue({
    el: '#app',
    data: () => {
        return {
            mainDirInfo: {
                name: '-',
                size: 0,
                mtime: '',
                child: []
            },
            sortInfo: {
                target: 'name',
                direction: 'asc'
            }
        }
    },
    methods: {
        getEasyFileSize: size => {
            if (size == 0) return '-';

            size *= 1;
            let i = 0;
            const name = [`Byte`, `KB`, `MB`, `GB`, `TB`, `PB`, `EB`, `ZB`, `YB`];
            for (; size >= 1024; size /= 1024) {
                if (++i > 8) return `error`;
            }
            return `${Math.round(size).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ${name[i]}`;
        },
        getDirInfo: () => {
            axios.get('/dir')
                .then(response => {
                    app._data.mainDirInfo = response.data;
                    app.sortFileList(app._data.mainDirInfo.child, app._data.sortInfo.target);
                });
        },
        sortFileList: (fileList, target, direction) => {
            direction = direction || 'asc';

            fileList.sort((a, b) => {
                if (a[target] == b[target]) {
                    return 0;
                } else if (direction == 'desc') {
                    return a[target] < b[target] ? 1 : -1;
                } else {
                    return a[target] > b[target] ? 1 : -1;
                }
            });

            // 폴더가 최상위/최하위에 위치할 수 있도록 재정렬
            fileList.sort((a, b) => {
                if (a.isDirectory == b.isDirectory) {
                    return 0;
                } else if (direction == 'desc') {
                    return a.isDirectory < b.isDirectory ? -1 : 1;
                } else {
                    return a.isDirectory > b.isDirectory ? -1 : 1;
                }
            });

            app._data.sortInfo = {
                target: target,
                direction: direction
            }
        },
        sortFileListByTarget: target => {
            const direction = app._data.sortInfo.target == target && app._data.sortInfo.direction == 'asc' ? 'desc' : 'asc';
            app.sortFileList(app._data.mainDirInfo.child, target, direction);
            return true;
        },
        getIconFromExt: ext => {
            let icon = '';

            switch (ext) {
                case '':
                    icon = 'folder';
                    break;
                case '.txt':
                    icon = 'edit_note';
                    break;
                case '.mp4':
                    icon = 'movie';
                    break;
                default:
                    icon = 'file_present';
            }

            return icon;
        },
        getCmtFromExt: ext => {
            let extCmt = '';

            if (ext != '') extCmt = ext.substring(1, ext.length);

            switch (ext) {
                case '.txt':
                    extCmt = '텍스트 문서';
                    break;
                case '.mp4':
                    extCmt += ' 동영상';
                    break;
                default:
                    extCmt += ' 파일';
            }

            return extCmt;
        }
    }
});

app.getDirInfo();