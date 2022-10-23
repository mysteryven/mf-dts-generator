# Module Federation Type Generator

[![npm version](https://badgen.net/npm/v/mf-dts-generator)](https://npm.im/mf-dts-generator) 
[![npm downloads](https://badgen.net/npm/dm/mf-dts-generator)](https://npm.im/mf-dts-generator)

> Generate TypeScript Type for specific files.

## Install

```
npm i mf-dts-generator
```

or

```
pnpm i mf-dts-generator
```

## API

`mf serve -c [<configFile>]` Start type dispatch server

`mf listen -c [<configFile>]`：Start type receiver server

`mf serve --help`： Show help of dispatch server

`mf listen --help`： Show help of reveriver server

## Intro

Inspired by [dts-loader](https://github.com/ruanyl/dts-loader).

When we use MF(Module Federation) in host to consume a module(used module from Remote), like this:

```
import Button from 'app2/remote'
```

It can't get type hint. So I build type in Remote by Rollup and move it to Host directory. You can run [example](./packages/playground/webpack-demo/) in local.


## Config File

The full config will like below:

```ts
export interface mfDtsGeneratorConfig {
    mfTypeConfig: mfTypeConfig
}

export interface MFTypeConfig {
    name: string; // keep sync with remote's name
    exposes: Record<string, string>; // key sync with remote's exposes, but the `value` should be absolute path
    targetPaths: string[]; // If you use monorepo, the type move from Remote to Host will not use WebSocket, and just move to targetPaths
    clientOutDir?: string; // the download directory in Host, default to types
    alias: Record<string, string> 
    //  for example, one record will be '@/component': path.join(__dirname, './src/component')，
}
```

There is a demo config file:

```js
module.exports = {
    mfTypeConfig: {
        name: 'app2',
        exposes: {
            './App': path.join(__dirname, 'src/App.tsx'),
        },
        targetPaths: [
            path.join(__dirname, '../app1')
        ]
    }
}
```

The default name of config file is `mf.config.js`, and you can use `-c` to specific another file

```
mf server -c other.config.js
```

## How to use

add to tsconfig.json in Host

```
{
    "baseUrl": "./",
    "paths": {
      "*": [ "*", "types/*" ]
    }, 
}
```

### Normal Project

1. If Remote and Host is independent project, change dir to remote, add those to config file, and run `pnpm mf serve`:

```js
module.exports = {
    mfTypeConfig: {
        name: 'app2',
        exposes: {
            './App': path.join(__dirname, 'src/App.tsx'),
        },
    }
}
```

2.  change dir to host.

```js
module.exports = {
    mfTypeConfig: {
        clientOutDir: 'types',
    }
}
```

Then run ` pnpm mf listen`


### monorepo 

remote：

```js
module.exports = {
    mfTypeConfig: {
        name: 'app2',
        exposes: {
            './App': path.join(__dirname, 'src/App.tsx'),
        },
        targetPaths: [
            path.join(__dirname, '../app1')
        ]
    }
}
```


## Credicts

[dts-loader](https://github.com/ruanyl/dts-loader)

