const path = require('path')

module.exports = {
    mfTypeConfig: {
        name: 'app2',
        exposes: {
            './App': path.join(__dirname, 'src/App.tsx'),
        },

    }
}