import chokidar from 'chokidar';
import http from 'http';
import serveHandler from 'serve-handler';
import { defaultConfigFileName, MF_TYPE_DIR, SERVER_PORT, tazName } from './constant';
import { info, readConfig } from './utils';
import createWebSocketServer, { addAWebSocketClient } from './websocket';
import path from 'path';
import tar from 'tar';
import fs from 'fs-extra';
import buildType from './buildType';
import { debounce } from 'throttle-debounce'
import ModuleGraph from './moduleGraph';
import { MFTypeConfig } from './interface';

export default async function start(filePath: string) {
    const options = readConfig(filePath)!

    info('根据模块联邦入口构建类型...');
    fs.ensureDir(MF_TYPE_DIR)
    fs.emptyDirSync(MF_TYPE_DIR)
    await Promise.all(Object.entries(options.exposes).map(([output, input]) => {
        return buildType(input, path.join(MF_TYPE_DIR, options.name, output))
    }))
    compressTypes(options)

    info('启动 http 下载服务');

    const server = http.createServer((request, response) => {
        return serveHandler(request, response, {
        });
    })

    server.listen(SERVER_PORT, () => {
    })

    const notifyClientToDownload = createWebSocketServer(options)

    info('5 秒后开始监听文件变化...')
    setTimeout(async () => {
        const paths = Array.from(new Set(Object.values(options.exposes).map(str => path.dirname(str))))

        const callback = await debounceCallback(notifyClientToDownload)

        info('-------------------------------------')
        info('|**********开始监听文件变化*********|')
        info('-------------------------------------')

        chokidar.watch(paths, {
            awaitWriteFinish: true,
            ignored: ['**/*.d.ts', '**/*.css', '**/*.less', '**/*.scss', '**/*.js']
        }).on('change', (...args) => {
            info('准备重新生成[' + Date().toString() + ']');
            callback(...args)
        });
    }, 5000)

    async function debounceCallback(notifyClientToDownload: () => void) {
        const moduleGraph = new ModuleGraph()
        await moduleGraph.init(Object.values(options.exposes))

        return debounce(3000, async (changedPath: string, stats?: fs.Stats) => {
            if (changedPath.endsWith('.ts') || changedPath.endsWith('.tsx')) {
                moduleGraph.handleModuleChange(changedPath)
                const changedEntryPaths = moduleGraph.getUpdateFilesByModuleName(changedPath)
                const changedExposes: Array<[string, string]> = []

                for (let [key, value] of Object.entries(options.exposes)) {
                    if (changedEntryPaths.has(value)) {
                        changedExposes.push([key, value])
                    }
                }
                if (changedExposes.length === 0) {
                    info('没有需要修改的文件')
                }

                info('根据您的修改，按需生成以下入口文件的类型')
                for (let value of changedEntryPaths) {
                    info('path:' + value)
                }
                try {
                    await Promise.allSettled(changedExposes.map(([output, input]) => {
                        return buildType(input, path.join(MF_TYPE_DIR, options.name, output))
                    }))
                    await compressTypes(options)

                    info('重新生成完毕[' + Date().toString() + ']');
                    notifyClientToDownload()
                } catch (e) {
                    console.error(e)
                }
            } else {
                info('没有需要生成的')
            }
        })
    }
}

function compressTypes(options: MFTypeConfig) {
    return tar.c(
        {
            file: tazName,
            cwd: MF_TYPE_DIR
        },
        [options.name]
    )
}

export {
    addAWebSocketClient,
    defaultConfigFileName,
}


