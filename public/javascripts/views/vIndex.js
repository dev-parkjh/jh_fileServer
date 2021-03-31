const app = new Vue({
    el: '#app',
    data: () => {
        return {
            fileInfo: {
                type: '',
                name: '-',
                size: 0,
                ext: '',
                extType: '',
                mtime: '',
                child: []
            }
        }
    },
    methods: {
        getEasyFileSize: size => {
            if(size == 0) return '-';

            size *= 1;
            let i = 0;
            const name = [`Byte`, `KB`, `MB`, `GB`, `TB`, `PB`, `EB`, `ZB`, `YB`];
            for (; size >= 1024; size /= 1024) {
                if (++i > 8) return `error`;
            }
            return `${Math.round(size).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ${name[i]}`;
        },
        getFileList: () => {
            axios.get('/file')
                .then(response => {
                    app._data.fileInfo = response.data;
                });
        },
        getIconFromExtension: extension => {
            let icon = '';

            switch (extension) {
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
        }
    }
});

app.getFileList();