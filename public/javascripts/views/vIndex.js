// Vue.config.devtools = true;

const app = new Vue({
    el: '#app',
    data: {
        fileInfo: []
    },
    methods: {
        getEasyFileSize: size => {
            size *= 1;
            let i = 0;
            const name = [`Byte`, `KB`, `MB`, `GB`, `TB`, `PB`, `EB`, `ZB`, `YB`];
            for (; size >= 1024; size /= 1024) {
                if (++i > 8) return `error`;
            }
            return `${Math.round(size).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${name[i]}`;
        },
        getFileList: () => {
            axios.get('/file')
                .then(response => {
                    app._data.fileInfo = response.data;
                });
        },
        test: () => {
            alert(1);
        }
    }
});

app.getFileList();