import { expect, it } from "vitest"
import path from 'path'
import fs from 'fs'
import buildType from "../src/buildType"
import { URL } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;

it('convert independent ts file successfully', async () => {
  await buildType(path.join(__dirname, './fixtures/sum.ts'), path.join(__dirname, './fixtures/sum'))
  expect(fs.existsSync(path.join(__dirname, './fixtures/sum/index.d.ts'))).toBe(true)
  const content = fs.readFileSync(path.join(__dirname, './fixtures/sum/index.d.ts'), 'utf8')

  expect(content).toMatchInlineSnapshot(`
    "declare function sum(a: number, b: number): number;
    declare function sum2(a: number, b: number, c: number, d: number): number;

    export { sum as default, sum2 };
    "
  `)

  fs.rmSync(path.join(__dirname, './fixtures/sum/index.d.ts'))
})

it('throw error if path not exist', async () => {
  expect(
    () =>
      buildType(path.join(__dirname, '../fixtures'), '')
  ).toThrowError()
})

it('convert recursive files successfully', async () => {
  await buildType(path.join(__dirname, './fixtures/example-1/a.ts'), path.join(__dirname, './fixtures/example-1/a'))
  expect(fs.existsSync(path.join(__dirname, './fixtures/example-1/a/index.d.ts'))).toBe(true)
  const content = fs.readFileSync(path.join(__dirname, './fixtures/example-1/a/index.d.ts'), 'utf8')

  expect(content).toMatchInlineSnapshot(`
    "declare function minus(a: number, b: number): number;

    declare function sum(a: number, b: number): number;
    declare const b = 1;

    export { b, sum as default, minus };
    "
  `)

  fs.rmSync(path.join(__dirname, './fixtures/example-1/a/index.d.ts'))
})




