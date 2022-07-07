const { default: start, addAWebSocketClient, defaultConfigFileName } = require('../dist/index')
const cli = require('cac')()

cli.command('serve', '启动类型生成服务器')
    .option('-c <name>, --config <name>', '指定配置文件路径，不指定为当前目录 mf.config.js')
    .action((options) => {
        start(options.c || defaultConfigFileName)
    })

cli.command('listen', '增加一个类型监听客户端')
    .option('-c <name>, --config <name>', '指定配置文件路径，不指定为当前目录 mf.config.js')
    .action((options) => {
        addAWebSocketClient(options.c || defaultConfigFileName)
    })

cli.help()

const parsed = cli.parse()


