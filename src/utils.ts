import pc, { green } from 'picocolors'
import fs from 'fs'
import path from 'path'
import { MFTypeConfig } from './interface';

export function success(str: string) {
    console.log(green(pc.bold(str)));
}

export function info(str: string) {
    console.log(pc.dim(str))
}

export function readConfig(filePath: string) {
    const root = process.cwd()
    if (fs.existsSync(path.join(root, filePath))) {
        const config = require(path.join(root, filePath));
        validateConfig(config)
        if (!config.mfTypeConfig.clientOutDir) {
            config.mfTypeConfig.clientOutDir = 'types'
        }
        if (!config.mfTypeConfig.exposes) {
            config.mfTypeConfig.exposes = {}
        }

        return config.mfTypeConfig as MFTypeConfig
    } else {
        throw new Error(`目录[${root}]下没有读到${filePath}文件`)
    }
}

function validateConfig(config: any) {
    const mfTypeConfig = config.mfTypeConfig

    if (!mfTypeConfig.name) {
        throw new Error('name 必填')
    }

    if (mfTypeConfig.exposes && typeof mfTypeConfig.exposes !== 'object') {
        throw new Error('exposes 必须是对象')
    }

    if (mfTypeConfig.targetPaths && !Array.isArray(mfTypeConfig.targetPaths)) {
        throw new Error('targetPaths 必须是数组')
    }
}