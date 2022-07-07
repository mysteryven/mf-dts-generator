import { OutputOptions, rollup, RollupBuild, RollupOptions } from 'rollup';
import dts from 'rollup-plugin-dts'
import fs from 'fs'
import path from 'path'
import esbuild from 'rollup-plugin-esbuild'

export default function buildType(input: string, output: string) {
    if (!fs.existsSync(input)) {
        throw new Error(`构建类型的文件 ${input} 不存在，再确认一下！`)
    }

    const inputOptions: RollupOptions = {
        input,
        plugins: [esbuild(), dts()]
    };

    const outputOptions: OutputOptions = {
        file: path.join(output, 'index.d.ts'),
        format: 'es',
    }

    return build(inputOptions, outputOptions)
}

async function build(inputOptions: RollupOptions, outputOptions: OutputOptions) {
    let bundle: RollupBuild | null;
    try {
        bundle = await rollup(inputOptions);
        return await generateOutputs(bundle, outputOptions);
    } catch (e) {
        console.error('打包类型出错了，暂时中断')
        return false
    }
}

async function generateOutputs(bundle: RollupBuild, outputOptions: OutputOptions) {
    await bundle.write(outputOptions);

    // 这个可以拿到最终打出来的结果，后面发现也不需要了
    // 就先注释了
    // let codes: string[] = []
    // for (const chunkOrAsset of output) {
    //     if (chunkOrAsset.type === 'chunk') {
    //         codes.push(chunkOrAsset.code)
    //     }
    // }
    // console.log('-----')
    // console.log(codes)
    // console.log('-----')

    // return codes
}

