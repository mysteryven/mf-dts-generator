import { WEBSOCKET_PORT, WebSOCKET_CLIENT_DOWNLOAD_PATH, MF_TYPE_DIR, SERVER_PORT, tazName } from './constant';
import { WebSocketServer, WebSocket } from 'ws';
import fs from 'fs-extra'
import http from 'http'
import path from 'path'
import { MessagePayload, MFTypeConfig, DownloadPayload } from './interface';
import tar from 'tar'
import { info, readConfig } from './utils';

export default function createWebSocketServer(options: MFTypeConfig) {
    const wss = new WebSocketServer({ port: WEBSOCKET_PORT });

    wss.on('connection', function connection(ws) {
        notifyClientToDownload()

        if (Array.isArray(options.targetPaths) && options.targetPaths.length > 0) {
            createWebSocketClient(options)
        }
    });

    function notifyClientToDownload() {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'download' }))
            }
        })
    }

    return notifyClientToDownload
}


export function addAWebSocketClient(filePath: string) {
    const config = readConfig(filePath)!;
    createWebSocketClient(config)
}

export function createWebSocketClient(options: MFTypeConfig) {
    const ws = new WebSocket(WebSOCKET_CLIENT_DOWNLOAD_PATH);

    ws.on('message', async function message(data) {
        const payload = JSON.parse(data.toString());

        if (isMessagePayload(payload)) {
            info(payload.content);
        } else if (isDownloadPayload(payload)) {
            if (Array.isArray(options.targetPaths) && options.targetPaths.length > 0) {
                const sourceDest = path.join(__dirname, MF_TYPE_DIR);
                if (!fs.existsSync(sourceDest)) {
                    return
                }
                for (let pathName of options.targetPaths) {
                    fs.copySync(
                        sourceDest,
                        path.join(pathName, options.clientOutDir!)
                    );
                }
                info('类型已经拷贝到需要的项目\n');
            } else {
                const tempClientDtsFileName = path.resolve(__dirname, 'my.tar.tgz');
                await downloadFile(tempClientDtsFileName)
                // readConfig 的时候强制添加了，默认值是 types
                fs.ensureDirSync(path.join(__dirname, options.clientOutDir!))
                await tar.x({
                    file: tempClientDtsFileName,
                    cwd: path.join(__dirname, options.clientOutDir!)
                })
                info('类型已下载到需要的项目\n');
                await fs.remove(tempClientDtsFileName)
            }
        }
    });
}

function isMessagePayload(payload: any): payload is MessagePayload {
    return typeof payload === 'object' && payload.type === 'message';
}

function isDownloadPayload(payload: any): payload is DownloadPayload {
    return typeof payload === 'object' && payload.type === 'download';
}


function downloadFile(dtsFileName: string) {
    const url = 'http://localhost:' + SERVER_PORT + '/' + tazName;

    return new Promise<boolean>((resolve) => {
        const target = fs.createWriteStream(dtsFileName);

        http.get(url, (response) => {
            response
                .pipe(target)
                .on('close', () => {
                    resolve(true)
                })
                .on('finish', () => {
                    resolve(true)
                })
                .on('error', () => {
                    resolve(false)
                })
        })
    })
}