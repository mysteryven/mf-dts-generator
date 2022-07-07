import { init, parse } from 'es-module-lexer'
import fs from 'fs-extra'
import path from 'path';
import { bareImportRE, EMPTY_PATH } from './constant';

class ModuleNode {
    importers = new Set<string>();
    importedModules = new Set<string>()
}

export default class ModuleGraph {
    fileToModuleMap = new Map<string, ModuleNode>()
    alias: Record<string, string> = {}
    entrys = new Set<string>()

    constructor(alias?: Record<string, string>) {
        this.alias = alias || {}
    }

    async init(entrys: string[]) {
        this.entrys = new Set(entrys)
        for (let entry of entrys) {
            await this.buildImportGraph(entry)
        }
    }

    async getImportedFileNames(filename: string) {
        await init
        const [imports] = parse(fs.readFileSync(filename, 'utf8'));
        return imports.map(i => this.nomalizeFilename(path.join(path.dirname(filename), i.n || '')));
    }

    async buildImportGraph(filename: string) {
        filename = this.nomalizeFilename(filename)
        let mod = this.fileToModuleMap.get(filename)
        if (!mod) {
            mod = new ModuleNode()

            const importedFileNames = await this.getImportedFileNames(filename)
            importedFileNames.forEach(async (importedFileName) => {
                if (importedFileName !== EMPTY_PATH) {
                    const dep = await this.buildImportGraph(importedFileName)
                    mod!.importedModules.add(importedFileName)
                    dep.importers.add(filename)
                }
            })

            this.fileToModuleMap.set(filename, mod)
        }

        return mod
    }
    nomalizeFilename(filename: string) {
        if (bareImportRE.test(filename)) {
            filename = this.resolveUrl(filename)
        }

        if (!fs.existsSync(filename)) {
            if (fs.existsSync(filename + '.ts')) {
                filename = filename + '.ts'
            }

            if (fs.existsSync(filename + '.tsx')) {
                filename = filename + '.tsx'
            }
        }

        if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
            return filename
        } else {
            return EMPTY_PATH
        }
    }

    async handleModuleChange(moduleName: string) {
        moduleName = this.nomalizeFilename(moduleName)
        const importedFileNames = await this.getImportedFileNames(moduleName)
        const mod = this.fileToModuleMap.get(moduleName)

        if (mod) {
            for (let importedFileName of importedFileNames) {
                // 当前文件新增了模块
                if (!mod.importedModules.has(importedFileName)) {
                    const dep = await this.buildImportGraph(importedFileName)
                    mod.importedModules.add(importedFileName)
                    dep.importers.add(moduleName)
                }
            }

            for (let importedFileName of mod.importedModules) {
                // 当前文件删除了模块
                if (!importedFileNames.includes(importedFileName)) {
                    const dep = this.fileToModuleMap.get(importedFileName)
                    mod.importedModules.delete(importedFileName)

                    if (dep) {
                        dep.importers.delete(moduleName)
                        if (dep.importers.size === 0 && !this.entrys.has(importedFileName)) {
                            this.cleanFileToModuleMap(importedFileName)
                        }
                    }
                }
            }
        }
    }

    cleanFileToModuleMap(name: string) {
        const importedModules = this.fileToModuleMap.get(name)!.importedModules

        for (let importedModule of importedModules) {
            const dep = this.fileToModuleMap.get(importedModule)
            if (dep) {
                dep.importers.delete(name)
                if (dep.importers.size === 0) {
                    this.cleanFileToModuleMap(importedModule)
                }
            }
        }

        this.fileToModuleMap.delete(name)
    }

    resolveUrl(url: string) {
        return resolveUrl(url, this.alias)
    }

    getUpdateFilesByModuleName(moduleName: string) {
        const needUpdateFiles = new Set<string>()

        if (!this.fileToModuleMap.has(moduleName)) {
            return needUpdateFiles
        }

        getUpdateFilesByModuleNameImpl(
            moduleName,
            this.entrys,
            this.fileToModuleMap,
            needUpdateFiles,
            []
        )
        return needUpdateFiles
    }
}

function getUpdateFilesByModuleNameImpl(
    moduleName: string,
    entrys: Set<string>,
    fileToModuleMap: Map<string, ModuleNode>,
    needUpdateFiles: Set<string>,
    currentChain: string[]
) {
    if (entrys.has(moduleName)) { // 到顶部了
        needUpdateFiles.add(moduleName)
    } else {
        const module = fileToModuleMap.get(moduleName)
        if (module) {
            for (let importer of module.importers) {
                const subChain = [...currentChain, importer]
                if (!currentChain.includes(importer)) {
                    getUpdateFilesByModuleNameImpl(importer, entrys, fileToModuleMap, needUpdateFiles, subChain)
                }
            }
        }
    }
}

export function resolveUrl(url: string, alias: Record<string, string>) {
    for (let [key, value] of Object.entries(alias)) {
        if (url.startsWith(key)) {
            return url.replace(key, value)
        }
    }

    return EMPTY_PATH
}
