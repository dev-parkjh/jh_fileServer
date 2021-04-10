const app = new Vue({
    el: '#app',
    data: () => {
        return {
            dirInfo: {
                name: '-',
                size: 0,
                mtime: '',
                child: []
            },
            sortInfo: {
                target: 'name',
                direction: 'asc'
            },
            isDarkMode: false,
            isSettingOpen: false
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
        getDirInfo: dirPath => {
            let isFirstLoad = false;
            if (dirPath == undefined) isFirstLoad = true;

            dirPath = dirPath || location.pathname;

            axios.get('/api/dir', {
                params: {
                    dirPath: dirPath
                }
            }).then(response => {
                const result = response.data;

                for (let i = 0, il = result.child.length; i < il; i++) {
                    result.child[i].extDetail = app.getExtDetail(result.child[i].ext);
                }

                app._data.dirInfo = result;
                app.sortFileList(app._data.dirInfo.child, app._data.sortInfo.target);

                const histState = {
                    dirInfo: app._data.dirInfo
                }

                if (isFirstLoad) {
                    history.replaceState(histState, '', dirPath);
                } else {
                    history.pushState(histState, '', dirPath);
                }
            });
        },
        sortFileList: (fileList, target, direction) => {
            direction = direction || 'asc';

            fileList.sort(
                (a, b) => {
                    // 디렉터리 상위 정렬후 파일 정렬
                    if (a.isDirectory == b.isDirectory) {
                        if (direction == 'asc') {
                            return (a[target] > b[target]) - (a[target] < b[target]);
                        } else {
                            return (a[target] < b[target]) - (a[target] > b[target]);
                        }
                    } else {
                        return b.isDirectory - a.isDirectory;
                    }
                }
            );

            app._data.sortInfo = {
                target: target,
                direction: direction
            }
        },
        sortFileListByTarget: target => {
            const direction = app._data.sortInfo.target == target && app._data.sortInfo.direction == 'asc' ? 'desc' : 'asc';
            app.sortFileList(app._data.dirInfo.child, target, direction);
            return true;
        },
        getExtDetail: ext => {
            let icon = '';
            let iconColor = '';
            let cmt = '';

            if (ext != '') cmt = ext.substring(1, ext.length);

            switch (ext) {
                case 'directory':
                    icon = 'folder';
                    iconColor = '';
                    cmt = '폴더';
                    break;
                case '.txt':
                    icon = 'edit_note';
                    iconColor = '';
                    cmt = '텍스트 문서';
                    break;
                case '.mp4':
                    icon = 'movie';
                    iconColor = '';
                    cmt += ' 동영상';
                    break;
                default:
                    icon = 'file_present';
                    iconColor = '';
                    cmt += ' 파일';
            }

            return {
                icon,
                iconColor,
                cmt
            };
        },
        themeSetting: () => {
            const defaultTheme = 'light';
            const theme = localStorage.getItem('theme') || defaultTheme;
            document.body.setAttribute('theme', theme);
            app._data.isDarkMode = (theme == 'dark');
        },
        linkClick: (event, child) => {
            if (child.isDirectory) {
                event.preventDefault();
                event.stopPropagation();
                const dirPath = location.pathname + '/' + child.name;
                app.getDirInfo(dirPath);
            }
        }
    },
    mounted: () => {
        window.addEventListener('popstate', () => {
            app._data.dirInfo = history.state.dirInfo;
        });
    },
    watch: {
        isDarkMode: val => {
            const theme = val ? 'dark' : 'light';
            document.body.setAttribute('theme', theme);
            localStorage.setItem('theme', theme);
        }
    }
});

app.themeSetting();
app.getDirInfo();