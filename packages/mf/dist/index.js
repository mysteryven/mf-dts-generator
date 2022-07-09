"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/server.ts
var server_exports = {};
__export(server_exports, {
  addAWebSocketClient: () => addAWebSocketClient,
  default: () => start,
  defaultConfigFileName: () => defaultConfigFileName
});
module.exports = __toCommonJS(server_exports);
var import_chokidar = __toESM(require("chokidar"));
var import_http2 = __toESM(require("http"));
var import_serve_handler = __toESM(require("serve-handler"));

// src/constant.ts
var WEBSOCKET_PORT = 9001;
var SERVER_PORT = 9e3;
var WebSOCKET_CLIENT_DOWNLOAD_PATH = `ws://127.0.0.1:${WEBSOCKET_PORT}`;
var MF_TYPE_DIR = "mf-type";
var bareImportRE = /^[\w@](?!.*:\/\/)/;
var EMPTY_PATH = "";
var tazName = "my-tarball.tgz";
var defaultConfigFileName = "mf.config.js";

// src/utils.ts
var import_picocolors = __toESM(require("picocolors"));
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
function info(str) {
  console.log(import_picocolors.default.dim(str));
}
function warn(str) {
  console.log(import_picocolors.default.yellow(str));
}
function readConfig(filePath) {
  const root = process.cwd();
  if (import_fs.default.existsSync(import_path.default.join(root, filePath))) {
    const config = require(import_path.default.join(root, filePath));
    validateConfig(config);
    if (!config.mfTypeConfig.clientOutDir) {
      config.mfTypeConfig.clientOutDir = "types";
    }
    if (!config.mfTypeConfig.exposes) {
      config.mfTypeConfig.exposes = {};
    }
    if (!config.mfTypeConfig.root) {
      config.mfTypeConfig.root = root;
    }
    return config.mfTypeConfig;
  } else {
    throw new Error(`\u76EE\u5F55[${root}]\u4E0B\u6CA1\u6709\u8BFB\u5230${filePath}\u6587\u4EF6`);
  }
}
function validateConfig(config) {
  const mfTypeConfig = config.mfTypeConfig;
  if (mfTypeConfig.clientOutDir) {
    return;
  }
  if (!mfTypeConfig.name) {
    throw new Error("name \u5FC5\u586B");
  }
  if (mfTypeConfig.exposes && typeof mfTypeConfig.exposes !== "object") {
    throw new Error("exposes \u5FC5\u987B\u662F\u5BF9\u8C61");
  }
  if (mfTypeConfig.targetPaths && !Array.isArray(mfTypeConfig.targetPaths)) {
    throw new Error("targetPaths \u5FC5\u987B\u662F\u6570\u7EC4");
  }
}
function getTime() {
  return new Date().toLocaleTimeString("default", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

// src/websocket.ts
var import_ws = require("ws");
var import_fs_extra = __toESM(require("fs-extra"));
var import_http = __toESM(require("http"));
var import_path2 = __toESM(require("path"));
var import_tar = __toESM(require("tar"));
function createWebSocketServer(options) {
  const wss = new import_ws.WebSocketServer({ port: WEBSOCKET_PORT });
  wss.on("connection", function connection(ws) {
    notifyClientToDownload();
  });
  if (Array.isArray(options.targetPaths) && options.targetPaths.length > 0) {
    createWebSocketClient(options);
  }
  function notifyClientToDownload() {
    wss.clients.forEach((client) => {
      if (client.readyState === import_ws.WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "download" }));
      }
    });
  }
  return notifyClientToDownload;
}
function addAWebSocketClient(filePath) {
  const config = readConfig(filePath);
  createWebSocketClient(config);
}
function createWebSocketClient(options) {
  const ws = new import_ws.WebSocket(WebSOCKET_CLIENT_DOWNLOAD_PATH);
  ws.on("message", async function message(data) {
    const payload = JSON.parse(data.toString());
    if (isMessagePayload(payload)) {
      info(payload.content);
    } else if (isDownloadPayload(payload)) {
      if (Array.isArray(options.targetPaths) && options.targetPaths.length > 0) {
        const sourceDest = import_path2.default.join(options.root, MF_TYPE_DIR);
        if (!import_fs_extra.default.existsSync(sourceDest)) {
          warn("\u6CA1\u6709\u627E\u5230\u7C7B\u578B\u6587\u4EF6\u76EE\u5F55" + MF_TYPE_DIR);
          return;
        }
        for (let pathName of options.targetPaths) {
          import_fs_extra.default.copySync(sourceDest, import_path2.default.join(pathName, options.clientOutDir));
        }
        info(`\u7C7B\u578B\u5DF2\u7ECF\u62F7\u8D1D\u597D[${getTime()}]`);
      } else {
        const tempClientDtsFileName = import_path2.default.resolve(__dirname, "my.tar.tgz");
        await downloadFile(tempClientDtsFileName);
        import_fs_extra.default.ensureDirSync(import_path2.default.join(__dirname, options.clientOutDir));
        await import_tar.default.x({
          file: tempClientDtsFileName,
          cwd: import_path2.default.join(__dirname, options.clientOutDir)
        });
        info(`\u7C7B\u578B\u5DF2\u4E0B\u8F7D\u597D\u4E86[${getTime()}]
`);
        await import_fs_extra.default.remove(tempClientDtsFileName);
      }
    }
  });
}
function isMessagePayload(payload) {
  return typeof payload === "object" && payload.type === "message";
}
function isDownloadPayload(payload) {
  return typeof payload === "object" && payload.type === "download";
}
function downloadFile(dtsFileName) {
  const url = "http://localhost:" + SERVER_PORT + "/" + tazName;
  return new Promise((resolve) => {
    const target = import_fs_extra.default.createWriteStream(dtsFileName);
    import_http.default.get(url, (response) => {
      response.pipe(target).on("close", () => {
        resolve(true);
      }).on("finish", () => {
        resolve(true);
      }).on("error", () => {
        resolve(false);
      });
    });
  });
}

// src/server.ts
var import_path5 = __toESM(require("path"));
var import_tar2 = __toESM(require("tar"));
var import_fs_extra3 = __toESM(require("fs-extra"));

// src/buildType.ts
var import_rollup = require("rollup");
var import_rollup_plugin_dts = __toESM(require("rollup-plugin-dts"));
var import_fs2 = __toESM(require("fs"));
var import_path3 = __toESM(require("path"));
var import_rollup_plugin_esbuild = __toESM(require("rollup-plugin-esbuild"));
function buildType(input, output) {
  if (!import_fs2.default.existsSync(input)) {
    throw new Error(`\u6784\u5EFA\u7C7B\u578B\u7684\u6587\u4EF6 ${input} \u4E0D\u5B58\u5728\uFF0C\u518D\u786E\u8BA4\u4E00\u4E0B\uFF01`);
  }
  const inputOptions = {
    input,
    plugins: [(0, import_rollup_plugin_esbuild.default)(), (0, import_rollup_plugin_dts.default)()]
  };
  const outputOptions = {
    file: import_path3.default.join(output, "index.d.ts"),
    format: "es"
  };
  return build(inputOptions, outputOptions);
}
async function build(inputOptions, outputOptions) {
  let bundle;
  try {
    bundle = await (0, import_rollup.rollup)(inputOptions);
    return await generateOutputs(bundle, outputOptions);
  } catch (e) {
    console.error("\u6253\u5305\u7C7B\u578B\u51FA\u9519\u4E86\uFF0C\u6682\u65F6\u4E2D\u65AD");
    return false;
  }
}
async function generateOutputs(bundle, outputOptions) {
  await bundle.write(outputOptions);
}

// src/server.ts
var import_throttle_debounce = require("throttle-debounce");

// src/moduleGraph.ts
var import_es_module_lexer = require("es-module-lexer");
var import_fs_extra2 = __toESM(require("fs-extra"));
var import_path4 = __toESM(require("path"));
var import_esbuild = __toESM(require("esbuild"));
var ModuleNode = class {
  importers = /* @__PURE__ */ new Set();
  importedModules = /* @__PURE__ */ new Set();
};
var ModuleGraph = class {
  fileToModuleMap = /* @__PURE__ */ new Map();
  alias = {};
  entrys = /* @__PURE__ */ new Set();
  constructor(alias) {
    this.alias = alias || {};
  }
  async init(entrys) {
    this.entrys = new Set(entrys);
    for (let entry of entrys) {
      await this.buildImportGraph(entry);
    }
  }
  async getImportedFileNames(filename) {
    await import_es_module_lexer.init;
    const content = import_fs_extra2.default.readFileSync(filename, "utf8");
    const [imports] = (0, import_es_module_lexer.parse)(filename.endsWith("ts") ? content : import_esbuild.default.transformSync(content, {
      loader: "tsx",
      target: "es2022"
    }).code);
    const ret = imports.map((i) => this.nomalizeFilename(import_path4.default.join(import_path4.default.dirname(filename), i.n || ""))).filter(Boolean);
    return ret;
  }
  async buildImportGraph(filename) {
    filename = this.nomalizeFilename(filename);
    let mod = this.fileToModuleMap.get(filename);
    if (!mod) {
      mod = new ModuleNode();
      const importedFileNames = await this.getImportedFileNames(filename);
      importedFileNames.forEach(async (importedFileName) => {
        if (importedFileName !== EMPTY_PATH) {
          const dep = await this.buildImportGraph(importedFileName);
          mod.importedModules.add(importedFileName);
          dep.importers.add(filename);
        }
      });
      this.fileToModuleMap.set(filename, mod);
    }
    return mod;
  }
  nomalizeFilename(filename) {
    if (bareImportRE.test(filename)) {
      filename = this.resolveUrl(filename);
    }
    if (!import_fs_extra2.default.existsSync(filename)) {
      if (import_fs_extra2.default.existsSync(filename + ".ts")) {
        filename = filename + ".ts";
      }
      if (import_fs_extra2.default.existsSync(filename + ".tsx")) {
        filename = filename + ".tsx";
      }
    }
    if (filename.endsWith(".ts") || filename.endsWith(".tsx")) {
      return filename;
    } else {
      return EMPTY_PATH;
    }
  }
  async handleModuleChange(moduleName) {
    moduleName = this.nomalizeFilename(moduleName);
    const importedFileNames = await this.getImportedFileNames(moduleName);
    const mod = this.fileToModuleMap.get(moduleName);
    if (mod) {
      for (let importedFileName of importedFileNames) {
        if (!mod.importedModules.has(importedFileName)) {
          const dep = await this.buildImportGraph(importedFileName);
          mod.importedModules.add(importedFileName);
          dep.importers.add(moduleName);
        }
      }
      for (let importedFileName of mod.importedModules) {
        if (!importedFileNames.includes(importedFileName)) {
          const dep = this.fileToModuleMap.get(importedFileName);
          mod.importedModules.delete(importedFileName);
          if (dep) {
            dep.importers.delete(moduleName);
            if (dep.importers.size === 0 && !this.entrys.has(importedFileName)) {
              this.cleanFileToModuleMap(importedFileName);
            }
          }
        }
      }
    }
  }
  cleanFileToModuleMap(name) {
    const importedModules = this.fileToModuleMap.get(name).importedModules;
    for (let importedModule of importedModules) {
      const dep = this.fileToModuleMap.get(importedModule);
      if (dep) {
        dep.importers.delete(name);
        if (dep.importers.size === 0) {
          this.cleanFileToModuleMap(importedModule);
        }
      }
    }
    this.fileToModuleMap.delete(name);
  }
  resolveUrl(url) {
    return resolveUrl(url, this.alias);
  }
  getUpdateFilesByModuleName(moduleName) {
    const needUpdateFiles = /* @__PURE__ */ new Set();
    if (!this.fileToModuleMap.has(moduleName)) {
      return needUpdateFiles;
    }
    getUpdateFilesByModuleNameImpl(moduleName, this.entrys, this.fileToModuleMap, needUpdateFiles, []);
    return needUpdateFiles;
  }
};
function getUpdateFilesByModuleNameImpl(moduleName, entrys, fileToModuleMap, needUpdateFiles, currentChain) {
  if (entrys.has(moduleName)) {
    needUpdateFiles.add(moduleName);
  } else {
    const module2 = fileToModuleMap.get(moduleName);
    if (module2) {
      for (let importer of module2.importers) {
        const subChain = [...currentChain, importer];
        if (!currentChain.includes(importer)) {
          getUpdateFilesByModuleNameImpl(importer, entrys, fileToModuleMap, needUpdateFiles, subChain);
        }
      }
    }
  }
}
function resolveUrl(url, alias) {
  for (let [key, value] of Object.entries(alias)) {
    if (url.startsWith(key)) {
      return url.replace(key, value);
    }
  }
  return EMPTY_PATH;
}

// src/server.ts
async function start(filePath) {
  const options = readConfig(filePath);
  info("\u6839\u636E\u6A21\u5757\u8054\u90A6\u5165\u53E3\u6784\u5EFA\u7C7B\u578B...");
  import_fs_extra3.default.ensureDir(MF_TYPE_DIR);
  import_fs_extra3.default.emptyDirSync(MF_TYPE_DIR);
  await Promise.all(Object.entries(options.exposes).map(([output, input]) => {
    return buildType(input, import_path5.default.join(MF_TYPE_DIR, options.name, output));
  }));
  compressTypes(options);
  info("\u542F\u52A8 http \u4E0B\u8F7D\u670D\u52A1");
  const server = import_http2.default.createServer((request, response) => {
    return (0, import_serve_handler.default)(request, response, {});
  });
  server.listen(SERVER_PORT, () => {
  });
  const notifyClientToDownload = createWebSocketServer(options);
  info("5 \u79D2\u540E\u5F00\u59CB\u76D1\u542C\u6587\u4EF6\u53D8\u5316...");
  setTimeout(async () => {
    const paths = Array.from(new Set(Object.values(options.exposes).map((str) => import_path5.default.dirname(str))));
    const callback = await debounceCallback(notifyClientToDownload);
    info("-------------------------------------");
    info("|**********\u5F00\u59CB\u76D1\u542C\u6587\u4EF6\u53D8\u5316*********|");
    info("-------------------------------------");
    import_chokidar.default.watch(paths, {
      awaitWriteFinish: true,
      ignored: ["**/*.d.ts", "**/*.css", "**/*.less", "**/*.scss", "**/*.js"]
    }).on("change", (...args) => {
      info("\u51C6\u5907\u91CD\u65B0\u751F\u6210[" + getTime() + "]");
      callback(...args);
    });
  }, 5e3);
  async function debounceCallback(notifyClientToDownload2) {
    const moduleGraph = new ModuleGraph(options.alias);
    await moduleGraph.init(Object.values(options.exposes));
    return (0, import_throttle_debounce.debounce)(3e3, async (changedPath, stats) => {
      if (changedPath.endsWith(".ts") || changedPath.endsWith(".tsx")) {
        await moduleGraph.handleModuleChange(changedPath);
        const changedEntryPaths = moduleGraph.getUpdateFilesByModuleName(changedPath);
        const changedExposes = [];
        for (let [key, value] of Object.entries(options.exposes)) {
          if (changedEntryPaths.has(value)) {
            changedExposes.push([key, value]);
          }
        }
        if (changedExposes.length === 0) {
          info(`\u6CA1\u6709\u9700\u8981\u4FEE\u6539\u7684\u6587\u4EF6[${getTime()}]`);
          return;
        }
        info("\u6839\u636E\u4FEE\u6539\uFF0C\u51C6\u5907\u91CD\u65B0\u751F\u6210\u4E0B\u9762\u51E0\u4E2A\uFF1A");
        for (let [key] of changedExposes) {
          info(`${key}`);
        }
        info("---");
        try {
          await Promise.allSettled(changedExposes.map(([output, input]) => {
            return buildType(input, import_path5.default.join(MF_TYPE_DIR, options.name, output));
          }));
          if (Array.isArray(options.targetPaths) && options.targetPaths.length > 0) {
            await compressTypes(options);
          }
          info(`\u91CD\u65B0\u751F\u6210\u5B8C\u6BD5[${getTime()}]`);
          notifyClientToDownload2();
        } catch (e) {
          console.error(e);
        }
      } else {
        info("\u6CA1\u6709\u9700\u8981\u751F\u6210\u7684");
      }
    });
  }
}
function compressTypes(options) {
  return import_tar2.default.c({
    file: tazName,
    cwd: MF_TYPE_DIR
  }, [options.name]);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addAWebSocketClient,
  defaultConfigFileName
});
//# sourceMappingURL=index.js.map