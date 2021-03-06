# 模块联邦类型生成器
## 说明

用于为模块联邦项目生成类型，不依赖于框架，可以在 Webpack、Vite、Rollup 中使用。

## 安装

```
npm i mf-dts-generator
```

或者

```
pnpm i mf-dts-generator
```

## 命令介绍

`mf serve -c [<configFile>]`：启动服务

`mf listen -c [<configFile>]`：启动一个 websocket client 端

`mf server --help`： 查看帮助

`mf server --listen`： 查看帮助

## 功能介绍

受 [dts-loader](https://github.com/ruanyl/dts-loader) 灵感的激发。

在使用模块联邦的时候，一端叫做 host，他会使用来自 remote 的模块。本工具主要的原理是在 remote 模块文件变更的时候，会借助 Rollup 生成类型，生成类型完毕后再下载到 host 项目目录。这样就能在 host 目录获取到类型提示了。具体的效果可以跑一下 [example](./packages/playground/webpack-demo/) 的例子。

在监听类型变化的时候，是以 exposes 为维度做热更新的，也就是说如果我们 exposes 配置里导出两个模块，但只有一个模块下的依赖的文件发生变化，那只会重新生成一个入口文件的类型。

## 配置文件

格式如下：

```ts
export interface mfDtsGeneratorConfig {
    mfTypeConfig: mfTypeConfig
}

export interface MFTypeConfig {
    name: string; // 同 remote name 字段
    exposes: Record<string, string>; // 同 remote 的 exposes 字段，但是 value 需要是绝对路径
    targetPaths: string[]; // monorepo 可以指定此项，【如何使用】部分有介绍 
    clientOutDir?: string; // host 下载的目录，默认是 types
    alias: Record<string, string> 
    // 相当于配置别名 比如一项可能是：'@/component': path.join(__dirname, './src/component')，我只做的字符串替换，所有不支持 anyMatch 那种写法 
}
```

一个完整示例如下：

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

默认会读取目录的 `mf.config.js`，可以通过命令行自己指定其他名字的配置文件，但是格式要和上面一样：

```
mf server -c other.config.js
```

## 如何使用

最开始，要在 host 端的 tsconfig.json 引入类型目录：

```
{
    "baseUrl": "./",
    "paths": {
      "*": [ "*", "types/*" ]
    }, 
}
```

如何使用分两种，下面分别说明。

### 正常项目

如果 remote 端和 host 端是独立的项目，类型将通过 HTTP 服务下载。所以需要在 remote 端启动生成类型的服务，host 端启动一个 websocket client。

remote 端的配置文件如下：

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

然后运行 ` pnpm mf serve `

host 端的配置文件如下：

```js
module.exports = {
    mfTypeConfig: {
        clientOutDir: 'types',
    }
}
```

然后运行 ` pnpm mf listen`


host 端可以有多个。
### monorepo 项目

此时 remote 和 host 的相对位置都是固定的，于是就没有必要通过 HTTP 下载了，我们可以配置 remote 的 `targetPaths`，然后在类型生成后会自动拷贝到 host 的目录。此时 host 目录不需要配置。

remote 配置文件如下：

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




