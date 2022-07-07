const path = require('path')

module.exports = {
    mfTypeConfig: {
        name: 'app2',
        exposes: {
            './App': './src/App',
        },
        targetPaths: [
            path.join(__dirname, '../app1')
        ]
    }
}