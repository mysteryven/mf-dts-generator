import { describe, it, expect, test, } from 'vitest'
import ModuleGraph, { resolveUrl } from '../src/moduleGraph'
import path from 'path'
import { EMPTY_PATH } from '../src/constant'

describe('moduleGraph', () => {
    test('init without error', () => {
        expect(() => {
            const graph = new ModuleGraph()
            graph.init([path.join(__dirname, 'fixtures/example-1/a.ts')])
        }).not.toThrowError()
    })

    test('build import map with fullly path and not fullly path', async () => {
        const graph = new ModuleGraph()
        await graph.init([
            path.join(__dirname, 'fixtures/moduleGraphExample/normalImport/index.ts'),
            path.join(__dirname, 'fixtures/moduleGraphExample/withoutSuffix/index.ts')
        ])
        expect(graph.fileToModuleMap).toMatchSnapshot()
    })

    it('skip non-ts or non-tsx file', async () => {
        const graph = new ModuleGraph()
        await graph.init([
            path.join(__dirname, 'fixtures/moduleGraphExample/withNotTSImport/index.ts'),
        ])
        expect(graph.fileToModuleMap).toMatchSnapshot()
    })

    it('build import map with a common modules used by others', async () => {
        const graph = new ModuleGraph()
        await graph.init([
            path.join(__dirname, 'fixtures/moduleGraphExample/commonImport/index.ts'),
            path.join(__dirname, 'fixtures/moduleGraphExample/commonImport/index-2.ts'),
        ])
        expect(graph.fileToModuleMap).toMatchSnapshot()
    })

    it('build import map with a circle import', async () => {
        const graph = new ModuleGraph()
        await graph.init([
            path.join(__dirname, 'fixtures/moduleGraphExample/circleImport/index.ts'),
        ])
        expect(graph.fileToModuleMap).toMatchInlineSnapshot(`
          Map {
            "/Users/wenzhe/Documents/repos/give-me-type/test/fixtures/moduleGraphExample/circleImport/index.ts" => ModuleNode {
              "importedModules": Set {},
              "importers": Set {},
            },
            "/Users/wenzhe/Documents/repos/give-me-type/test/fixtures/moduleGraphExample/circleImport/a.ts" => ModuleNode {
              "importedModules": Set {},
              "importers": Set {},
            },
          }
        `)
    })

    test('getUpdateFilesByModuleName', async () => {
        const graph = new ModuleGraph()
        await graph.init([
            path.join(__dirname, 'fixtures/moduleGraphExample/normalImport/index.ts'),
        ])
        const changedFilePath = path.join(__dirname, 'fixtures/moduleGraphExample/normalImport/a.ts')
        expect(graph.getUpdateFilesByModuleName(changedFilePath)).toMatchInlineSnapshot('Set {}')
    })

    test('getUpdateFilesByModuleName with common import', async () => {
        const graph = new ModuleGraph()
        await graph.init([
            path.join(__dirname, 'fixtures/moduleGraphExample/commonImport/index.ts'),
            path.join(__dirname, 'fixtures/moduleGraphExample/commonImport/index-2.ts'),
        ])
        const changedFilePath = path.join(__dirname, 'fixtures/moduleGraphExample/commonImport/a.ts')
        expect(graph.getUpdateFilesByModuleName(changedFilePath)).toMatchInlineSnapshot(`
          Set {
            "/Users/wenzhe/Documents/repos/give-me-type/test/fixtures/moduleGraphExample/commonImport/index.ts",
            "/Users/wenzhe/Documents/repos/give-me-type/test/fixtures/moduleGraphExample/commonImport/index-2.ts",
          }
        `)
    })


    test('getUpdateFilesByModuleName with circle import', async () => {
        const graph = new ModuleGraph()
        await graph.init([
            path.join(__dirname, 'fixtures/moduleGraphExample/circleImport/index.ts'),
        ])
        const changedFilePath = path.join(__dirname, 'fixtures/moduleGraphExample/circleImport/a.ts')
        expect(graph.getUpdateFilesByModuleName(changedFilePath)).toMatchInlineSnapshot('Set {}')
    })
})


test('resolveUrl', () => {
    const alias = {
        '@': './src',
        '@/component': './src/component',
    }

    expect(resolveUrl('@/a.ts', alias)).toBe('./src/a.ts')
    expect(resolveUrl('@/component/b.tsx', alias)).toBe('./src/component/b.tsx')
    expect(resolveUrl('a.ts', alias)).toBe(EMPTY_PATH)
    expect(resolveUrl('lodash', alias)).toBe(EMPTY_PATH)
})
