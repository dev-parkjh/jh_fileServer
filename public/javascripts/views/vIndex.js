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
                    const result = response.data;
                    
                    for(let i=0, il=result.child.length; i<il; i++) {
                        result.child[i].extDetail = app.getExtDetail(result.child[i].ext);
                    }

                    app._data.mainDirInfo = result;
                    app.sortFileList(app._data.mainDirInfo.child, app._data.sortInfo.target);
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
            app.sortFileList(app._data.mainDirInfo.child, target, direction);
            return true;
        },
        getExtDetail: ext => {
            let icon = '';
            let iconColor = '';
            let extCmt = '';

            if (ext != '') extCmt = ext.substring(1, ext.length);

            switch (ext) {
                case 'directory':
                    icon = 'folder';
                    iconColor = '';
                    extCmt = '폴더';
                    break;
                case '.txt':
                    icon = 'edit_note';
                    iconColor = '';
                    extCmt = '텍스트 문서';
                    break;
                case '.mp4':
                    icon = 'movie';
                    iconColor = '';
                    extCmt += ' 동영상';
                    break;
                default:
                    icon = 'file_present';
                    iconColor = '';
                    extCmt += ' 파일';
            }

            return {
                icon,
                iconColor,
                cmt
            };
        },
        easterEgg: () => {
            // svg 배경은 저사양 컴퓨터에서 렉이 너무 심해서 기능 제거함
        }
    },
    mounted: () => {
        const el = document.querySelector('.site-name')
        const fx = new TextScramble(el)
        fx.setText(el.innerText, 40);
    }
});

app.getDirInfo();



// let OSTheme = localStorage.os_theme;
// let defaultTheme = 'light';
// document.documentElement.setAttribute(
//     'data-theme',
//     OSTheme || defaultTheme,
// );