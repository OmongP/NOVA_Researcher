var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// _lib/uibowl.js
var MCP_URL = "https://uibowl.io/api/mcp";
var TOKEN_URL = "https://uibowl.io/api/oauth/token";
var AUTH_KEY = "auth";
var EXPIRY_MARGIN_MS = 6e4;
var readAuth = /* @__PURE__ */ __name(async (kv) => JSON.parse(await kv.get(AUTH_KEY) ?? "null"), "readAuth");
async function refresh(kv, auth) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: auth.tokens.refresh_token, client_id: auth.client.client_id })
  });
  const json2 = await res.json().catch(() => ({}));
  if (!res.ok || !json2.access_token) {
    const latest = await readAuth(kv);
    if (latest && latest.tokens.access_token !== auth.tokens.access_token) return latest;
    throw new Error(`UI Bowl \uD1A0\uD070 \uAC31\uC2E0\uC5D0 \uC2E4\uD328\uD588\uC5B4\uC694(${json2.error ?? res.status}). scripts/cloud-auth.js\uB85C \uB2E4\uC2DC \uB85C\uADF8\uC778\uD574 \uC8FC\uC138\uC694`);
  }
  const next = {
    ...auth,
    tokens: { ...auth.tokens, ...json2, refresh_token: json2.refresh_token ?? auth.tokens.refresh_token, obtainedAt: Date.now() }
  };
  await kv.put(AUTH_KEY, JSON.stringify(next));
  return next;
}
__name(refresh, "refresh");
async function validAuth(kv) {
  const auth = await readAuth(kv);
  if (!auth?.tokens?.access_token) return null;
  const expiresAt = (auth.tokens.obtainedAt ?? 0) + (auth.tokens.expires_in ?? 0) * 1e3;
  return Date.now() > expiresAt - EXPIRY_MARGIN_MS ? refresh(kv, auth) : auth;
}
__name(validAuth, "validAuth");
async function readRpc(res) {
  const text = await res.text();
  if ((res.headers.get("content-type") ?? "").includes("text/event-stream")) {
    const data = text.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).filter(Boolean);
    return JSON.parse(data[data.length - 1] ?? "null");
  }
  return text ? JSON.parse(text) : null;
}
__name(readRpc, "readRpc");
async function getAuthStatus(kv) {
  try {
    return { connected: Boolean(await validAuth(kv)) };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}
__name(getAuthStatus, "getAuthStatus");
async function createCallTool(kv) {
  const auth = await validAuth(kv);
  if (!auth) throw new Error("UI Bowl\uC5D0 \uC5F0\uACB0\uB418\uC9C0 \uC54A\uC558\uC5B4\uC694(Cloudflare \uB85C\uADF8\uC778 \uC815\uBCF4 \uC5C6\uC74C)");
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    Authorization: `Bearer ${auth.tokens.access_token}`
  };
  let id = 0;
  let session = null;
  const post = /* @__PURE__ */ __name(async (body, extra = {}) => {
    const res = await fetch(MCP_URL, { method: "POST", headers: { ...headers, ...extra }, body: JSON.stringify(body) });
    if (res.status === 401) throw new Error("UI Bowl \uC778\uC99D\uC774 \uB9CC\uB8CC\uB410\uC5B4\uC694");
    if (!res.ok && res.status !== 202) throw new Error(`UI Bowl \uC751\uB2F5 \uC624\uB958 HTTP ${res.status}`);
    return res;
  }, "post");
  const init = await post({
    jsonrpc: "2.0",
    id: ++id,
    method: "initialize",
    params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "ux-lens-demo", version: "0.1.0" } }
  });
  session = init.headers.get("mcp-session-id");
  await readRpc(init);
  const sessionHeader = session ? { "mcp-session-id": session } : {};
  await post({ jsonrpc: "2.0", method: "notifications/initialized" }, sessionHeader).then((r) => r.text());
  const cache = /* @__PURE__ */ new Map();
  return /* @__PURE__ */ __name(async function callTool(name, args) {
    const key = JSON.stringify([name, args]);
    if (cache.has(key)) return cache.get(key);
    const res = await post({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: { name, arguments: args } }, sessionHeader);
    const msg = await readRpc(res);
    const result = msg?.result;
    const data = result?.structuredContent;
    if (msg?.error || result?.isError || !data) {
      const text = result?.content?.find((c) => c.type === "text")?.text;
      throw new Error(text || msg?.error?.message || `${name} \uD638\uCD9C \uC2E4\uD328`);
    }
    cache.set(key, data);
    return data;
  }, "callTool");
}
__name(createCallTool, "createCallTool");

// _lib/guard.js
function sameSite(request) {
  const origin = request.headers.get("origin") ?? request.headers.get("referer");
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}
__name(sameSite, "sameSite");
var json = /* @__PURE__ */ __name((data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } }), "json");

// api/auth/status.js
async function onRequestGet({ env: env2 }) {
  if (!env2.UXLENS_AUTH) return json({ connected: false });
  const { connected: connected2 } = await getAuthStatus(env2.UXLENS_AUTH);
  return json({ connected: connected2 });
}
__name(onRequestGet, "onRequestGet");

// ../src/data/darkPatternRules.js
var TYPES = {
  \uC624\uB3C4\uD615: "\uAC70\uC9D3\uC744 \uC54C\uB9AC\uAC70\uB098 \uD1B5\uC0C1\uC801 \uAE30\uB300\uC640 \uB2E4\uB974\uAC8C \uD654\uBA74\xB7\uBB38\uC7A5\uC744 \uAD6C\uC131\uD574 \uC18C\uBE44\uC790\uC758 \uCC29\uAC01\xB7\uC2E4\uC218\uB97C \uC720\uB3C4",
  \uBC29\uD574\uD615: "\uC18C\uBE44\uC790\uAC00 \uC6D0\uD558\uB294 \uD589\uB3D9(\uD574\uC9C0, \uD0C8\uD1F4, \uCDE8\uC18C \uB4F1)\uC744 \uC5B4\uB835\uAC8C \uB9CC\uB4E4\uC5B4 \uD3EC\uAE30\uD558\uB3C4\uB85D \uC720\uB3C4",
  \uC555\uBC15\uD615: "\uC2EC\uB9AC\uC801 \uC555\uBC15\uAC10\uC744 \uC870\uC131\uD558\uC5EC \uC18C\uBE44\uC790\uAC00 \uC6D0\uD558\uC9C0 \uC54A\uB294 \uC758\uC0AC\uACB0\uC815\uC744 \uD558\uB3C4\uB85D \uC720\uB3C4",
  \uD3B8\uCDE8\uC720\uB3C4\uD615: "\uC18C\uBE44\uC790\uAC00 \uC758\uB3C4\uD558\uC9C0 \uC54A\uC740 \uCD94\uAC00 \uBE44\uC6A9\uC774\uB098 \uC11C\uBE44\uC2A4\uC5D0 \uAC00\uC785\uD558\uB3C4\uB85D \uC720\uB3C4"
};
var TYPE_DETAILS = {
  \uC624\uB3C4\uD615: {
    summary: TYPES.\uC624\uB3C4\uD615,
    definition: "\uAC70\uC9D3\uC744 \uC54C\uB9AC\uAC70\uB098 \uD1B5\uC0C1\uC801\uC778 \uAE30\uB300\uC640 \uC804\uD600 \uB2E4\uB974\uAC8C \uD654\uBA74\xB7\uBB38\uC7A5 \uB4F1\uC744 \uAD6C\uC131\uD574 \uCC29\uAC01\xB7\uC2E4\uC218\uB97C \uC720\uB3C4\uD558\uB294 \uD589\uC704",
    example: "\uB300\uCD9C \uAE08\uB9AC \uD45C\uC2DC \uC2DC \uB0AE\uC740 \uAE08\uB9AC\uB9CC \uAC15\uC870\uD558\uACE0 \uC2E4\uC81C \uC801\uC6A9 \uAE08\uB9AC\uB294 \uC791\uAC8C \uD45C\uAE30",
    subtypes: ["DP-M01", "DP-M02", "DP-M03", "DP-M04", "DP-M05"],
    frames: "DF_3, DF_4, DF_5"
  },
  \uBC29\uD574\uD615: {
    summary: TYPES.\uBC29\uD574\uD615,
    definition: "\uC758\uC0AC\uACB0\uC815\uC5D0 \uD544\uC694\uD55C \uC815\uBCF4 \uC218\uC9D1\xB7\uBD84\uC11D\uC5D0 \uACFC\uB3C4\uD55C \uC2DC\uAC04\xB7\uB178\uB825\xB7\uBE44\uC6A9\uC744 \uB4E4\uAC8C \uB9CC\uB4E4\uC5B4 \uD569\uB9AC\uC801 \uC120\uD0DD\uC744 \uD3EC\uAE30\uD558\uAC8C \uC720\uB3C4\uD558\uB294 \uD328\uD134",
    example: "\uC11C\uBE44\uC2A4 \uD574\uC9C0 \uC808\uCC28\uB97C \uBCF5\uC7A1\uD558\uAC8C \uAD6C\uC131, \uD574\uC9C0 \uBC84\uD2BC\uC744 \uCC3E\uAE30 \uC5B4\uB835\uAC8C \uBC30\uCE58",
    subtypes: ["DP-O01", "DP-O02", "DP-O03", "DP-O04"],
    frames: "DF_3, DF_4, DF_6"
  },
  \uC555\uBC15\uD615: {
    summary: TYPES.\uC555\uBC15\uD615,
    definition: "\uAE08\uC735\uC18C\uBE44\uC790\uC5D0\uAC8C \uC2EC\uB9AC\uC801 \uC555\uBC15\uC744 \uAC00\uD574 \uD2B9\uC815 \uD589\uC704\uB97C \uD558\uAC70\uB098 \uD558\uC9C0 \uC54A\uB3C4\uB85D \uC720\uB3C4\uD558\uB294 \uB514\uC790\uC778 \uC124\uACC4 \uD328\uD134",
    example: "'\uC9C0\uAE08 \uC2E0\uCCAD\uD558\uC9C0 \uC54A\uC73C\uBA74 \uD61C\uD0DD\uC774 \uC0AC\uB77C\uC9D1\uB2C8\uB2E4', \uCE74\uC6B4\uD2B8\uB2E4\uC6B4 \uD0C0\uC774\uBA38, \uD55C\uC815 \uC218\uB7C9 \uD45C\uC2DC \uB4F1",
    subtypes: ["DP-P05", "DP-P01", "DP-P04", "DP-P03", "DP-P02"],
    frames: "DF_3, DF_4, DF_7"
  },
  \uD3B8\uCDE8\uC720\uB3C4\uD615: {
    summary: TYPES.\uD3B8\uCDE8\uC720\uB3C4\uD615,
    definition: "\uAE08\uC735\uC18C\uBE44\uC790\uAC00 \uC54C\uC544\uCC44\uAE30 \uC5B4\uB824\uC6B4 \uC778\uD130\uD398\uC774\uC2A4 \uC870\uC791\uC744 \uD1B5\uD574 \uBE44\uD569\uB9AC\uC801\uC774\uAC70\uB098 \uC608\uC0C1\uD558\uC9C0 \uBABB\uD55C \uC9C0\uCD9C\uC744 \uC720\uB3C4\uD558\uB294 \uD328\uD134",
    example: "\uB300\uCD9C \uC2E0\uCCAD \uC2DC \uBD88\uD544\uC694\uD55C \uBD80\uAC00\uC11C\uBE44\uC2A4\uAC00 \uAE30\uBCF8 \uCCB4\uD06C\uB418\uC5B4 \uC788\uB294 \uACBD\uC6B0, \uC228\uACA8\uC9C4 \uC218\uC218\uB8CC",
    subtypes: ["DP-F01"],
    frames: "DF_3, DF_4, DF_8"
  }
};
var HIERARCHY_EXCEPTIONS = [
  '\uD604\uC7AC \uACFC\uC5C5 \uC218\uD589\uC744 \uC704\uD55C \uD575\uC2EC Primary Action (\uC608: \uB0B4 \uCC28 \uD314\uAE30 \uD654\uBA74\uC758 "\uCD5C\uACE0\uAC00\uB85C \uB0B4 \uCC28 \uD314\uAE30")',
  '\uACE0\uAC1D \uBCF4\uD638\xB7\uD53C\uD574 \uC608\uBC29\uC744 \uC704\uD55C \uAD8C\uC7A5 \uD589\uB3D9 (\uC608: \uBCF4\uC774\uC2A4\uD53C\uC2F1 \uBB38\uC9C4\uC758 "\uB2F5\uBCC0 \uC218\uC815\uD558\uAE30")',
  "\uBC95\uB839\xB7\uACC4\uC57D\uC0C1 \uBC18\uB4DC\uC2DC \uD544\uC694\uD55C \uD544\uC218 \uC808\uCC28",
  '\uACE0\uAC1D \uD3B8\uC775\uC744 \uC704\uD55C \uD569\uB9AC\uC801\uC778 \uAD8C\uC7A5 \uD589\uB3D9 + \uBA85\uD655\uD55C \uB300\uC548 \uC81C\uACF5 (\uC608: \uB300\uD45C \uC5F0\uB77D\uCC98 \uBCC0\uACBD "\uB2E4\uC74C\uC5D0" \uC81C\uACF5)',
  "\uC120\uD0DD\uC744 \uC720\uB3C4\uD558\uC9C0 \uC54A\uB294 \uC815\uBCF4 \uBA85\uD655\uC131 \uBB38\uC81C (\uC608: \uC774\uC6A9 \uBD88\uAC00 \uC0AC\uC720\uAC00 \uBD88\uBA85\uD655\uD55C \uC548\uB0B4 \uBB38\uAD6C)"
];
var REPEAT_EXCEPTIONS = [
  "\uACE0\uAC1D\uC774 \uC9C1\uC811 \uB3D9\uC758\xB7\uC124\uC815 \uBCC0\uACBD\uC744 \uC694\uCCAD\uD55C \uACBD\uC6B0",
  "\uBC95\uB839\xB7\uACC4\uC57D\uC0C1 \uC7AC\uD655\uC778\uC774 \uD544\uC694\uD55C \uACBD\uC6B0",
  "\uAE30\uC874 \uB3D9\uC758\uC640 \uBAA9\uC801\uC774 \uC2E4\uC9C8\uC801\uC73C\uB85C \uB2E4\uB978 \uC0C8\uB85C\uC6B4 \uB3D9\uC758",
  "\uC0C1\uD488\xB7\uC11C\uBE44\uC2A4 \uC870\uAC74 \uBCC0\uACBD\uC73C\uB85C \uC0C8\uB85C\uC6B4 \uC758\uC0AC\uACB0\uC815\uC774 \uD544\uC694\uD55C \uACBD\uC6B0",
  "\uCDA9\uBD84\uD55C \uAE30\uAC04\uC774 \uC9C0\uB098 \uD569\uB9AC\uC801\uC778 \uC7AC\uD655\uC778 \uD544\uC694\uC131\uC774 \uBC1C\uC0DD\uD55C \uACBD\uC6B0",
  "\uC624\uB958 \uBC29\uC9C0\xB7\uC911\uC694 \uC815\uBCF4 \uD655\uC778\xB7\uC18C\uBE44\uC790 \uBCF4\uD638\uB97C \uC704\uD55C \uD569\uB9AC\uC801\uC778 \uC7AC\uD655\uC778"
];
var j = /* @__PURE__ */ __name((arr) => arr.join(" / "), "j");
var RULES = [
  // ══ 오도형 (DF_5) ══
  {
    id: "DP-M01",
    type: "\uC624\uB3C4\uD615",
    name: "\uC124\uBA85 \uC808\uCC28\uC758 \uACFC\uB3C4\uD55C \uCD95\uC57D",
    framework: "Information",
    keyQuestion: "\uD655\uC778\uD588\uB294\uAC00?",
    definition: "\uC808\uCC28 \uACFC\uC815\uC5D0\uC11C \uD558\uB098 \uC774\uC0C1\uC758 \uB2E8\uACC4\uB97C \uC81C\uAC70\uD558\uC5EC \uAE08\uC735\uC18C\uBE44\uC790\uAC00 \uD2B9\uC815 \uC0AC\uD56D\uC744 \uC624\uC778",
    questions: ["\uC911\uC694 \uC815\uBCF4\uB97C \uD655\uC778\uD558\uC9C0 \uC54A\uACE0\uB3C4 \uB2E4\uC74C \uB2E8\uACC4\uB85C \uC9C4\uD589\uD560 \uC218 \uC788\uB294\uAC00?", "\uACE0\uAC1D \uD310\uB2E8\uC5D0 \uD544\uC694\uD55C \uD575\uC2EC \uC124\uBA85\xB7\uD655\uC778 \uC808\uCC28\uAC00 \uC0DD\uB7B5\uB418\uC5C8\uB294\uAC00?"],
    extraQuestions: [{ q: "\uC57D\uAD00 \uC0C1\uC138\uB97C \uC5F4\uB78C\uD558\uC9C0 \uC54A\uC544\uB3C4 \uC804\uCCB4 \uB3D9\uC758\uB9CC\uC73C\uB85C \uB3D9\uC758\uB97C \uC644\uB8CC\uD560 \uC218 \uC788\uB294\uAC00?", source: "DF_22 \uC815\uD0D0 \uD310\uB2E8 \uADFC\uAC70" }],
    examples: ["\uC0C1\uD488\uC758 \uC911\uC694\uD55C \uC0AC\uD56D\uC5D0 \uB300\uD55C \uAC1C\uBCC4 \uC774\uD574 \uD655\uC778\uC744 \uC0DD\uB7B5\uD558\uACE0, \uC77C\uAD04 \uD655\uC778\uB9CC\uC73C\uB85C \uB2E4\uC74C \uB2E8\uACC4\uB85C \uC9C4\uD589\uD558\uAC8C \uD558\uB294 \uACBD\uC6B0"],
    improvements: ["\uC911\uC694 \uC815\uBCF4 \uD655\uC778 \uC808\uCC28 \uD655\uBCF4"],
    cases: [
      {
        frame: "DF_22",
        title: "\uD55C\uB3C4\xB7\uAE08\uB9AC \uC870\uD68C \uB3D9\uC758 \u2014 \uC57D\uAD00\uC744 \uC5F4\uB78C\uD558\uC9C0 \uC54A\uC544\uB3C4 \uC804\uCCB4 \uB3D9\uC758\uB85C \uC644\uB8CC",
        guideNote: "\uD544\uC218 \uC815\uBCF4\uB97C \uD654\uBA74\uC5D0 \uC81C\uACF5\uD558\uB294 \uAC83\uB9CC\uC73C\uB85C \uCDA9\uBD84\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uACE0\uAC1D\uC774 \uC758\uC0AC\uACB0\uC815\uC5D0 \uD544\uC694\uD55C \uD575\uC2EC \uB0B4\uC6A9\uC744 \uC2E4\uC81C\uB85C \uD655\uC778\uD560 \uC218 \uC788\uB294 \uC808\uCC28\uAC00 \uC81C\uACF5\uB418\uB294\uC9C0 \uD568\uAED8 \uD310\uB2E8\uD569\uB2C8\uB2E4.",
        summary: "\uC57D\uAD00\uC744 \uC5F4\uB78C\uD558\uC9C0 \uC54A\uC544\uB3C4 \uC804\uCCB4 \uB3D9\uC758\uB9CC\uC73C\uB85C \uB3D9\uC758 \uC808\uCC28\uB97C \uC644\uB8CC\uD560 \uC218 \uC788\uC5B4, \uACE0\uAC1D\uC774 \uB3D9\uC758 \uB0B4\uC6A9\uC744 \uD655\uC778\uD558\uC9C0 \uC54A\uC740 \uCC44 \uC758\uC0AC\uACB0\uC815\uC744 \uC644\uB8CC\uD560 \uC218 \uC788\uB294 \uAD6C\uC870\uB77C\uACE0 \uD310\uB2E8.",
        basis: ["\uC57D\uAD00 \uC0C1\uC138 \uB0B4\uC6A9\uC744 \uC5F4\uB78C\uD558\uC9C0 \uC54A\uC544\uB3C4 \uB3D9\uC758 \uC644\uB8CC \uAC00\uB2A5", "\uB3D9\uC758 \uACB0\uACFC\uC5D0 \uC601\uD5A5\uC744 \uC8FC\uB294 \uC911\uC694 \uB0B4\uC6A9\uC744 \uD655\uC778\uD560 \uAE30\uD68C\uAC00 \uCDA9\uBD84\uD788 \uBCF4\uC7A5\uB418\uC9C0 \uC54A\uC74C"],
        improvement: "\uB3D9\uC758 \uC804 \uC57D\uAD00 \uB0B4\uC6A9\uC744 \uD655\uC778\uD560 \uC218 \uC788\uB294 \uC808\uCC28\uB97C \uBCF4\uC7A5\uD558\uACE0, \uD655\uC778 \uD6C4 \uB3D9\uC758\uB97C \uC644\uB8CC\uD560 \uC218 \uC788\uB3C4\uB85D \uAD6C\uC131"
      }
    ],
    applyGuide: {
      frame: "DF_20(\uC801\uC6A9 \uAC00\uC774\uB4DC)",
      title: "\uC911\uC694 \uC815\uBCF4 \uD655\uC778 \uC808\uCC28 \uC81C\uACF5",
      summary: "\uD544\uC218 \uC815\uBCF4\uAC00 \uC874\uC7AC\uD558\uAC70\uB098 \uB3D9\uC758 \uD56D\uBAA9\uC774 \uD45C\uC2DC\uB418\uC5B4 \uC788\uB2E4\uB294 \uAC83\uB9CC\uC73C\uB85C \uCDA9\uBD84\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uACE0\uAC1D\uC758 \uC758\uC0AC\uACB0\uC815\uC5D0 \uC911\uC694\uD55C \uB0B4\uC6A9\uC744 \uB3D9\uC758\xB7\uC2E0\uCCAD \uC804\uC5D0 \uC9C1\uC811 \uD655\uC778\uD560 \uC218 \uC788\uB294 \uC808\uCC28\uAC00 \uC81C\uACF5\uB418\uB294\uC9C0 \uD310\uB2E8\uD569\uB2C8\uB2E4.",
      problems: ["\uACE0\uAC1D \uD310\uB2E8\uC5D0 \uD544\uC694\uD55C \uD575\uC2EC \uC124\uBA85\xB7\uD655\uC778 \uC808\uCC28\uAC00 \uC0DD\uB7B5\uB41C \uC0C1\uD669", "(\uC57D\uAD00\uB3D9\uC758) \uC57D\uAD00 \uC0C1\uC138\uB97C \uD655\uC778\uD558\uC9C0 \uC54A\uB354\uB77C\uB3C4 \uB3D9\uC758\uAC00 \uB418\uB294 \uC0C1\uD669", "(\uC0C1\uD488 \uC2E0\uCCAD) \uC911\uC694 \uC815\uBCF4\uC758 \uD655\uC778 \uC808\uCC28\uAC00 \uC5C6\uB294 \uACBD\uC6B0"],
      check: "\uACE0\uAC1D\uC774 \uB3D9\uC758\xB7\uC2E0\uCCAD \uC804\uC5D0 \uC911\uC694 \uC815\uBCF4\uB97C \uC9C1\uC811 \uD655\uC778\uD560 \uC218 \uC788\uB294\uAC00?",
      improvements: [
        "\uC57D\uAD00 \uB3D9\uC758 \uC804 \uC57D\uAD00 \uC0C1\uC138 \uB0B4\uC6A9 \uD655\uC778 \uACBD\uB85C \uC81C\uACF5",
        "\uC0C1\uD488 \uC2E0\uCCAD \uC804 \uC8FC\uC694 \uC870\uAC74\xB7\uBE44\uC6A9\xB7\uC704\uD5D8 \uB4F1 \uD575\uC2EC \uC815\uBCF4 \uD655\uC778 \uACBD\uB85C \uC81C\uACF5",
        "\uD655\uC778 \uC808\uCC28\uB97C \uAC70\uCE58\uC9C0 \uC54A\uACE0 \uB3D9\uC758\xB7\uC2E0\uCCAD\uB9CC \uC644\uB8CC\uB418\uB294 \uAD6C\uC870 \uBC29\uC9C0",
        "\uC57D\uAD00 \uD56D\uBAA9 \uC120\uD0DD \u2192 \uC0C1\uC138 \uB0B4\uC6A9 \uD655\uC778 \u2192 \uB3D9\uC758"
      ]
    },
    exceptions: [],
    evidence: ["\uC57D\uAD00\xB7\uC124\uBA85\uC11C \uC0C1\uC138\uB97C \uC5F4\uC9C0 \uC54A\uACE0 \uB3D9\uC758\uAC00 \uC644\uB8CC\uB418\uB294\uC9C0 \uC2E4\uC81C \uD50C\uB85C\uC6B0 \uD655\uC778"],
    triggers: ["\uC804\uCCB4 \uB3D9\uC758", "\uC804\uCCB4\uB3D9\uC758", "\uBAA8\uB450 \uB3D9\uC758", "\uC77C\uAD04"],
    searches: [
      { tool: "search_by_ocr_text", args: { text_query: "\uC804\uCCB4 \uB3D9\uC758" } },
      { tool: "search_ui_patterns", args: { query: "\uC57D\uAD00" } }
    ],
    source: { frame: "DF_5, DF_22, DF_20(\uC801\uC6A9)", nodeId: "93:3866" }
  },
  {
    id: "DP-M02",
    type: "\uC624\uB3C4\uD615",
    name: "\uC18D\uC784\uC218 \uC9C8\uBB38",
    framework: "Choice",
    keyQuestion: "\uC774\uD574\uD588\uB294\uAC00?",
    definition: "\uC18C\uBE44\uC790\uAC00 \uC758\uB3C4\uD558\uC9C0 \uC54A\uC740 \uB300\uB2F5\uC774\uB098 \uC120\uD0DD\uC744 \uD558\uB3C4\uB85D \uC18D\uC784\uC218\uB97C \uC368\uC11C \uC9C8\uBB38\uD558\uB294 \uD589\uC704",
    questions: ["\uC9C8\uBB38\uACFC \uC120\uD0DD\uC9C0\uB97C \uC27D\uAC8C \uC774\uD574\uD560 \uC218 \uC788\uB294\uAC00?", "\uC774\uC911\uBD80\uC815\xB7\uBCF5\uC7A1\uD55C \uD45C\uD604\uC73C\uB85C \uBC18\uB300 \uC758\uBBF8\uB97C \uC120\uD0DD\uD560 \uAC00\uB2A5\uC131\uC774 \uC788\uB294\uAC00?"],
    extraQuestions: [],
    examples: ["\u201C\uD574\uC9C0\uB97C \uCDE8\uC18C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?\u201D \uB4F1 \uC774\uC911\uBD80\uC815 \uC9C8\uBB38"],
    improvements: ["\uD55C \uC9C8\uBB38\uC5D0 \uD558\uB098\uC758 \uC758\uBBF8\uB9CC \uC804\uB2EC"],
    cases: [],
    exceptions: [],
    evidence: ["\uBC84\uD2BC\uC744 \uB20C\uB800\uC744 \uB54C\uC758 \uC2E4\uC81C \uACB0\uACFC(\uB3D9\uC758/\uAC70\uC808)\uAC00 \uC9C8\uBB38 \uC758\uBBF8\uC640 \uC77C\uCE58\uD558\uB294\uC9C0 \uD655\uC778"],
    triggers: ["\uC54A\uACA0\uC2B5\uB2C8\uAE4C", "\uC54A\uC73C\uC2DC\uACA0\uC2B5\uB2C8\uAE4C", "\uCDE8\uC18C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C", "\uD558\uC9C0 \uC54A\uC74C"],
    searches: [
      { tool: "search_by_ocr_text", args: { text_query: "\uC54A\uACA0\uC2B5\uB2C8\uAE4C" } },
      { tool: "search_by_ocr_text", args: { text_query: "\uCDE8\uC18C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C" } }
    ],
    source: { frame: "DF_5", nodeId: "93:3866" }
  },
  {
    id: "DP-M03",
    type: "\uC624\uB3C4\uD615",
    name: "\uC798\uBABB\uB41C \uACC4\uCE35\uAD6C\uC870",
    aliases: ["\uC798\uBABB\uB41C \uACC4\uCE35 \uAD6C\uC870 (DF_4 \uD45C\uAE30)"],
    framework: "Choice",
    keyQuestion: "\uACF5\uC815\uD558\uAC8C \uC120\uD0DD\uD588\uB294\uAC00?",
    definition: "\uAE08\uC735\uC18C\uBE44\uC790\uC5D0\uAC8C \uBD88\uB9AC\uD558\uAC70\uB098 \uC0AC\uC5C5\uC790\uC5D0\uAC8C \uC720\uB9AC\uD55C \uC120\uD0DD \uD56D\uBAA9\uC744 \uC2DC\uAC01\uC801\uC73C\uB85C \uB450\uB4DC\uB7EC\uC9C0\uAC8C \uD45C\uC2DC",
    questions: [
      "\uBE44\uC6A9\xB7\uAC00\uC785\uACB0\uC815\xB7\uC120\uD0DD \uB3D9\uC758\xB7\uAC1C\uC778\uC815\uBCF4 \uC81C\uACF5\xB7\uCD94\uAC00 \uACC4\uC57D\xB7\uD574\uC9C0\uCC98\uB7FC \uACE0\uAC1D\uC758 \uAD8C\uB9AC\xB7\uC758\uBB34\xB7\uBD80\uB2F4\uC744 \uBC14\uAFB8\uACE0, \uAC15\uC870\uB41C \uCABD\uC774 \uC0AC\uC5C5\uC790\uC5D0\uAC8C \uC720\uB9AC",
      "\uC0AC\uC5C5\uC790\uC5D0\uAC8C \uC720\uB9AC\uD55C \uC120\uD0DD \uD56D\uBAA9\uC744 \uC2DC\uAC01\uC801\uC73C\uB85C \uB450\uB4DC\uB7EC\uC9C0\uAC8C \uD45C\uC2DC, \uC0AC\uC6A9\uC790\uC758 \uC790\uC720\uB85C\uC6B4 \uC120\uD0DD\xB7\uACB0\uC815\uC744 \uC2E4\uC81C\uB85C \uC65C\uACE1\uD558\uAC70\uB098 \uBC29\uD574\uD558\uB294\uAC00"
    ],
    extraQuestions: [
      { q: "\uC0AC\uC5C5\uC790\uC5D0\uAC8C \uC720\uB9AC\uD558\uACE0 \uACE0\uAC1D\uC5D0\uAC8C \uCD94\uAC00 \uBD80\uB2F4\uC774\uB098 \uC601\uD5A5\uC744 \uC8FC\uB294\uAC00(\uBE44\uC6A9, \uC120\uD0DD \uB3D9\uC758, \uAC1C\uC778\uC815\uBCF4 \uC81C\uACF5 \uB4F1)", source: "DF_12~14 \uC798\uBABB\uB41C \uACC4\uCE35\uAD6C\uC870 \uD310\uB2E8 \uAE30\uC900" },
      { q: "\uD2B9\uC815 \uC120\uD0DD\uC744 \uACFC\uB3C4\uD558\uAC8C \uAC15\uC870\uD558\uAC70\uB098 \uBC18\uB300 \uC120\uD0DD\uC744 \uC57D\uD654\xB7\uC740\uD3D0\uD588\uB294\uAC00?", source: "DF_12~14, DF_20 \uC798\uBABB\uB41C \uACC4\uCE35\uAD6C\uC870 \uD310\uB2E8 \uAE30\uC900" },
      { q: "\uC2DC\uAC01\uC801 \uC704\uACC4\uB85C \uC778\uD574 \uACE0\uAC1D\uC774 \uC120\uD0DD\uC758 \uC758\uBBF8\uB97C \uC624\uC778\uD558\uAC70\uB098, \uC0AC\uC5C5\uC790\uC5D0\uAC8C \uC720\uB9AC\uD55C \uC120\uD0DD\uC744 \uD544\uC218\xB7\uAD8C\uC7A5 \uD589\uB3D9\uC73C\uB85C \uC798\uBABB \uC778\uC2DD\uD558\uAC8C \uD558\uB294\uAC00?", source: "DF_15" },
      { q: "\uAC15\uC870\uB41C \uC120\uD0DD\uC774 \uACE0\uAC1D\uC5D0\uAC8C \uCD94\uAC00 \uBD80\uB2F4\uC744 \uC8FC\uACE0, \uBC18\uB300 \uC120\uD0DD\uC744 \uC5B4\uB835\uAC8C \uB9CC\uB4E4\uC5B4 \uC120\uD0DD\uC744 \uC65C\uACE1\uD558\uB294\uAC00?", source: "DF_16" },
      { q: "\uCD5C\uCD08 \uC81C\uC548\uC778\uAC00? (\uC774\uBBF8 \uAC70\uC808\uD55C \uB4A4\uC758 \uC7AC\uC81C\uC548\uC774\uBA74 \uBC18\uBCF5\uAC04\uC12D\uC73C\uB85C \uAC80\uD1A0)", source: "DF_20" }
    ],
    examples: ["\uC120\uD0DD\uB3D9\uC758\uC5D0\uC11C \uB3D9\uC758\uD558\uAE30\uB9CC \uAC15\uC870", "\uBD80\uAC00\uC11C\uBE44\uC2A4 \uAC00\uC785\uB9CC \uAC15\uC870 \uBC84\uD2BC \uCC98\uB9AC", "\uD2B9\uC815 \uC635\uC158\uB9CC \uACFC\uB3C4\uD55C \uAC15\uC870 \uCC98\uB9AC"],
    improvements: ["\uC120\uD0DD \uC131\uACA9\uC5D0 \uB9DE\uB294 \uADE0\uD615 \uC788\uB294 \uC704\uACC4 \uC81C\uACF5", "\uC120\uD0DD\uACFC \uC120\uD0DD\uD558\uC9C0 \uC54A\uB294 \uACBD\uC6B0\uB97C \uAC19\uC740 \uC218\uC900 \uD615\uD0DC \uAD6C\uC131\uD558\uC5EC \uC911\uB9BD\uC801\uC778 \uC758\uC0AC\uACB0\uC815\uC744 \uD560 \uC218 \uC788\uB3C4\uB85D \uD568 (DF_9)"],
    appendix: {
      frame: "DF_9",
      title: "\uBD80\uB85D - \uAE08\uC735 \uAC00\uC774\uB4DC\uB77C\uC778 \uC6D0\uBB38 \xB7 \uC624\uB3C4\uD615 - \uC798\uBABB\uB41C \uACC4\uCE35\uAD6C\uC870",
      definition: "\uC0AC\uC5C5\uC790\uC5D0\uAC8C \uC720\uB9AC\uD55C \uC120\uD0DD \uD56D\uBAA9\uC744 \uC2DC\uAC01\uC801\uC73C\uB85C \uB450\uB4DC\uB7EC\uC9C0\uAC8C \uD45C\uC2DC, \uC0AC\uC6A9\uC790\uC758 \uC790\uC720\uB85C\uC6B4 \uC120\uD0DD\xB7\uACB0\uC815\uC744 \uC2E4\uC81C\uB85C \uC65C\uACE1\uD558\uAC70\uB098 \uBC29\uD574\uD558\uB294\uAC00",
      scope: [
        "\uBE44\uC6A9\xB7\uAC00\uC785\uACB0\uC815\xB7\uC120\uD0DD \uB3D9\uC758\xB7\uAC1C\uC778\uC815\uBCF4 \uC81C\uACF5\xB7\uCD94\uAC00 \uACC4\uC57D\xB7\uD574\uC9C0",
        "(\uBD80\uAC00\uC11C\uBE44\uC2A4 \uAC00\uC785) \uD734\uB300\uD3F0 \uC694\uAE08 \uB0A9\uBD80",
        "(\uC120\uD0DD\uB3D9\uC758)\uD61C\uD0DD\uC815\uBCF4 \uBC1B\uAE30, \uAD11\uACE0 \uC815\uBCF4 \uC218\uC2E0, \uAC1C\uC778\uC815\uBCF4 \uC774\uC6A9",
        "(\uC635\uC158\uC120\uD0DD) \uC801\uB9BD\uC2DD \uC635\uC158\uC5D0 \uB300\uD55C \uC2DC\uAC01\uC801 \uAC15\uC870"
      ],
      resolution: "\uC120\uD0DD\uACFC \uC120\uD0DD\uD558\uC9C0 \uC54A\uB294 \uACBD\uC6B0\uB97C \uAC19\uC740 \uC218\uC900 \uD615\uD0DC \uAD6C\uC131\uD558\uC5EC \uC911\uB9BD\uC801\uC778 \uC758\uC0AC\uACB0\uC815\uC744 \uD560 \uC218 \uC788\uB3C4\uB85D \uD568",
      procedure: ["\uD654\uBA74\uC758 \uBAA9\uC801\uACFC \uC120\uD0DD\uC758 \uC758\uB3C4\uB97C \uBA3C\uC800 \uD30C\uC545", "\uC6D0\uBB38\uC758 \uC815\uC758\uC640 \uC0AC\uB840\uC5D0 \uB300\uC751\uB418\uB294 \uACBD\uC6B0\uC5D0\uB9CC \uAC80\uD1A0", "\uC720\uC0AC\uD574 \uBCF4\uC778\uB2E4\uB294 \uC774\uC720\uB9CC\uC73C\uB85C \uD655\uB300 \uC801\uC6A9\uD558\uC9C0 \uC54A\uC74C"]
    },
    cases: [
      {
        frame: "DF_17",
        title: "\uC120\uD0DD\uB3D9\uC758\uC758 \uC7AC\uAD8C\uC720 \u2014 \uACAC\uC801 \uC548\uB0B4 (\uD55C\uB3C4\uC870\uD68C \uB3D9\uC758 > \uC120\uD0DD\uB3D9\uC758 \uBBF8\uC120\uD0DD > \uB178\uCD9C)",
        guideNote: "\uC120\uD0DD\uB3D9\uC758\uCC98\uB7FC \uACE0\uAC1D\uC5D0\uAC8C \uCD94\uAC00 \uC815\uBCF4 \uC81C\uACF5\xB7\uD65C\uC6A9\uC774 \uBC1C\uC0DD\uD558\uB294 \uC120\uD0DD\uC740 \uB3D9\uC758\uC640 \uBE44\uB3D9\uC758\uB97C \uB3D9\uB4F1\uD558\uAC8C \uC81C\uACF5\uD558\uACE0, \uAC70\uC808 \uC774\uD6C4 \uC7AC\uAD8C\uC720 \uC2DC \uD2B9\uC815 \uC120\uD0DD\uC744 \uC6B0\uC120\uC801\uC73C\uB85C \uAC15\uC870\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
        summary: "\u2018\uB124, \uBC1B\uC544\uBCFC\uAC8C\uC694\u2019 \uB9CC Primary CTA\uB85C \uC81C\uACF5\uD558\uC5EC \u2018\uAC1C\uC778\uC815\uBCF4\uB97C \uC81C\uACF5\u2019 \uD558\uB294 \uC120\uD0DD\uB3D9\uC758\uB97C \uC6B0\uC120\uC801\uC778 \uAC83\uCC98\uB7FC \uC778\uC2DD\uD558\uAC8C \uD568",
        basis: ["\uC120\uD0DD \uC2DC \uAC1C\uC778\uC815\uBCF4 \uC81C\uACF5\xB7\uB9C8\uCF00\uD305 \uD65C\uC6A9 \uB3D9\uC758 \uBC1C\uC0DD", "\uB124, \uBC1B\uC544\uBCFC\uAED8\uC694 \uB9CC \uC0C9\uC0C1 \uAC15\uC870", "\uC774\uBBF8 \uAC70\uC808\uD55C \uC120\uD0DD\uC744 \uB2E4\uC2DC \uC81C\uC548\uD558\uB294 \uAD6C\uC870"],
        improvement: '\uAC1C\uC120 \uD6C4: \uC120\uD0DD \uBB38\uAD6C\uB97C "\uB124, \uBC1B\uC544 \uBCFC\uAC8C\uC694 / \uC544\uB2C8\uC624, \uAD1C\uCC2E\uC544\uC694" \uAC19\uC740 \uB3D9\uB4F1\uD55C \uB450 \uC120\uD0DD\uC9C0\uB85C \uC81C\uACF5',
        note: "\u2192 \uBC18\uBCF5\uAC04\uC12D \uB9AC\uC2A4\uD06C\uB294 \uB0A8\uC544\uC788\uC74C : \uAC70\uC808\uD588\uC74C\uC5D0\uB3C4 \uC7AC \uC720\uB3C4\uB97C \uD558\uAE30 \uB54C\uBB38, \uC0AD\uC81C \uD544\uC694\uD558\uB098 \uBC84\uD2BC \uC704\uACC4\uB97C \uB3D9\uC77C\uD558\uAC8C\uB85C \uC6B0\uD68C \uD574\uACB0 (\uCD9C\uCC98 \uD45C\uAE30: \uB124\uC774\uBC84\uD398\uC774, \uBAA8\uBC14\uC77C \uC2E0\uCC28 \uC784\uB300)"
      },
      {
        frame: "DF_17",
        title: "\uC120\uD0DD\uB3D9\uC758\uC758 \uC7AC\uAD8C\uC720 \u2014 \uC0C1\uB2F4 \uC548\uB0B4",
        summary: "\u2018\uB3D9\uC758\uD558\uACE0 \uC548\uB0B4\uBC1B\uAE30\u2019\uAC00 Primary CTA\uB85C \uAC15\uC870\uB418\uC5B4 \uACE0\uAC1D\uC758 \uD2B9\uC815 \uC120\uD0DD\uC744 \uC720\uB3C4\uD55C\uB2E4\uACE0 \uD310\uB2E8",
        basis: ["\uC0C1\uB2F4 \uC2E0\uCCAD\uACFC \uD568\uAED8 \uC120\uD0DD\uB3D9\uC758 \uBC1C\uC0DD", "\uB3D9\uC758\uD558\uACE0 \uC548\uB0B4\uBC1B\uAE30\uB9CC Primary\uB85C \uAC15\uC870", "\uAC70\uC808\uD588\uB358 \uC120\uD0DD\uB3D9\uC758\uB97C \uB2E4\uC2DC \uC81C\uC548"],
        improvement: '\uAC1C\uC120 \uD6C4: "\uB3D9\uC758\uD558\uACE0 \uC548\uB0B4\uBC1B\uAE30 / \uB2E4\uC74C\uC5D0"\uB97C \uB3D9\uB4F1\uD55C \uC704\uACC4\uB85C \uC81C\uACF5',
        note: "* (\uC0C1\uBC18\uAE30 \uBD84\uB958) \uC555\uBC15\uD615 - \uAC10\uAC01\uC870\uC791 \uC73C\uB85C \uD310\uB2E8 \uB418\uC5C8\uC73C\uB098 \uD574\uB2F9 \uC0AC\uD56D \uC5C6\uC74C / * (\uC0C1\uBC18\uAE30) \uC555\uBC15\uD615 - \uAC10\uC815\uC801 \uC5B8\uC5B4 \uD310\uB2E8 \uB418\uC5C8\uC73C\uB098 \uD574\uB2F9 \uC0AC\uD56D \uC5C6\uC74C"
      },
      {
        frame: "DF_18",
        ref: "DPI-18368 26.09.03 09:28",
        title: "\uC120\uD0DD\uB3D9\uC758\uC758 \uC7AC\uAD8C\uC720 \u2014 \uB9C8\uC774\uB370\uC774\uD130 \uC5F0\uACB0 (\uC120\uD0DD\uB3D9\uC758 \uBBF8\uC120\uD0DD > \uB178\uCD9C)",
        guideNote: "\uC120\uD0DD\uB3D9\uC758\uCC98\uB7FC \uACE0\uAC1D\uC5D0\uAC8C \uCD94\uAC00 \uC815\uBCF4 \uC81C\uACF5\xB7\uD65C\uC6A9\uC774 \uBC1C\uC0DD\uD558\uB294 \uC120\uD0DD\uC740 \uB3D9\uC758\uC640 \uBE44\uB3D9\uC758\uB97C \uB3D9\uB4F1\uD558\uAC8C \uC81C\uACF5\uD558\uACE0, \uAC70\uC808 \uC774\uD6C4 \uC7AC\uAD8C\uC720 \uC2DC \uD2B9\uC815 \uC120\uD0DD\uC744 \uC6B0\uC120\uC801\uC73C\uB85C \uAC15\uC870\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
        summary: "\uB124, \uB3D9\uC758\uD569\uB2C8\uB2E4\uB9CC Primary CTA\uB85C \uAC15\uC870\uD558\uACE0 \uBE44\uB3D9\uC758 \uC120\uD0DD\uC744 \uC0C1\uB300\uC801\uC73C\uB85C \uC57D\uD558\uAC8C \uC81C\uACF5\uD558\uC5EC \uB3D9\uC758\uB97C \uC6B0\uC120 \uC120\uD0DD\uD558\uB3C4\uB85D \uC720\uB3C4\uD568.",
        basis: ["\uACC4\uC88C \uC785\xB7\uCD9C\uAE08 \uB0B4\uC5ED \uC870\uD68C\uB97C \uC704\uD55C \uC120\uD0DD\uB3D9\uC758\uAC00 \uCD94\uAC00\uB85C \uBC1C\uC0DD", "\uB3D9\uC758 \uC120\uD0DD\uB9CC Primary\uB85C \uAC15\uC870", "\uBE44\uB3D9\uC758 \uC120\uD0DD\uC740 Text \uD615\uD0DC\uB85C \uC0C1\uB300\uC801\uC73C\uB85C \uC57D\uD558\uAC8C \uC81C\uACF5"],
        improvement: "\uB3D9\uC758\uD558\uAE30 / \uB2E4\uC74C\uC5D0\uB97C \uB3D9\uB4F1\uD55C \uBC84\uD2BC \uC704\uACC4\uB85C \uC81C\uACF5 \u2014 9.3\uC77C\uC790 \uC774\uD6C4 \uC120\uD0DD\uC57D\uC815 \uBC84\uD2BC \uAD00\uB828\uD55C \uC774\uC288\uB294 Gray / Secondary / \uBC84\uD2BC\uC73C\uB85C \uC801\uC6A9",
        note: "\uB9C8\uC774\uB370\uC774\uD130\uC0AC\uC5C5\uC790 \uB4E4\uC758 \uBB38\uC758\uC640 \uC694\uCCAD\uC73C\uB85C \uAE08\uC735\uAC10\uB3C5\uC6D0\uACFC \uCD94\uAC00 \uD611\uC758 \uC644\uB8CC \u2192 \uB3D9\uC77C\uD55C \uC0C9\uC0C1\uC740 \uC544\uB2C8\uB354\uB77C\uB3C4 \uCD5C\uB300\uD55C \uBE44\uC2B7\uD55C \uCC44\uB3C4/\uC0C9\uC0C1\uC73C\uB85C \uBC18\uC601\uD558\uBA74 \uAC00\uC774\uB4DC \uC704\uBC18\uC774 \uC544\uB2CC\uAC83\uC73C\uB85C \uD655\uC778\uBC1B\uC74C / ex) \uD1A0\uC2A4,\uBC45\uD06C\uC0D0\uB7EC\uB4DC \uB4F1 \uC120\uD0DD\uB3D9\uC758 \uC720\uB3C4\uC2DC Primary(\uAC15\uC870) \uC0C9\uC0C1\uC744 Secondary \uC0C9\uC0C1\uC73C\uB85C \uBCC0\uACBD\uD558\uC5EC \uCC44\uB3C4\uC640 \uBA85\uB3C4\uB97C \uB0AE\uCD94\uACE0 \uBE44\uC2B7\uD558\uAC8C \uC801\uC6A9\uD558\uC5EC \uD1B5\uACFC"
      }
    ],
    applyGuide: {
      frame: "DF_18(\uC801\uC6A9 \uAC00\uC774\uB4DC)",
      title: "\uD2B9\uC815 \uC120\uD0DD\uC73C\uB85C\uC758 \uC720\uB3C4 \uCD5C\uC18C\uD654",
      summary: "\uC120\uD0DD \uAC04 \uC704\uACC4\uAC00 \uD544\uC694\uD55C \uACBD\uC6B0\uC5D0\uB3C4, \uC0AC\uC5C5\uC790\uC5D0\uAC8C \uC720\uB9AC\uD55C \uC120\uD0DD\uC774 \uACE0\uAC1D\uC758 \uD310\uB2E8\uC744 \uC65C\uACE1\uD558\uC9C0 \uC54A\uB3C4\uB85D \uAC15\uC870 \uC218\uC900\uC744 \uC870\uC815\uD569\uB2C8\uB2E4.",
      problems: [
        "\uACE0\uAC1D\uC5D0\uAC8C \uCD94\uAC00 \uBD80\uB2F4\xB7\uC601\uD5A5\uC774 \uBC1C\uC0DD\uD558\uB294 \uC120\uD0DD",
        "(\uBD80\uAC00\uC11C\uBE44\uC2A4 \uAC00\uC785) \uD734\uB300\uD3F0 \uC694\uAE08 \uB0A9\uBD80",
        "(\uC120\uD0DD\uB3D9\uC758)\uD61C\uD0DD\uC815\uBCF4 \uBC1B\uAE30, \uAD11\uACE0 \uC815\uBCF4 \uC218\uC2E0, \uAC1C\uC778\uC815\uBCF4 \uC774\uC6A9",
        "(\uC635\uC158\uC120\uD0DD) \uC801\uB9BD\uC2DD \uC635\uC158\uC5D0 \uB300\uD55C \uC2DC\uAC01\uC801 \uAC15\uC870"
      ],
      check: "\uD2B9\uC815 \uC120\uD0DD\uC744 \uACFC\uB3C4\uD558\uAC8C \uAC15\uC870\uD558\uAC70\uB098, \uBC18\uB300 \uC120\uD0DD\uC744 \uC57D\uD654\xB7\uC740\uD3D0\uD558\uC9C0 \uC54A\uC558\uB294\uC9C0 \uD655\uC778",
      improvements: [
        "\uC120\uD0DD\uC9C0 \uAC04 \uC0C9\uC0C1\xB7\uD06C\uAE30 \uCC28\uC774\uB97C \uC904\uC5EC \uD2B9\uC815 \uC120\uD0DD\uC73C\uB85C\uC758 \uC720\uB3C4 \uCD5C\uC18C\uD654 (\uC67C\uCABD\uBC84\uD2BC BlueGray / \uC624\uB978\uCABD \uBC84\uD2BC Blue 8)",
        "\uB3D9\uC758\uD558\uAE30\uB97C Primary\uB85C \uAC15\uC870 \u2192 \uB3D9\uC758 \uC120\uD0DD \uC720\uB3C4 \uAC00\uB2A5",
        "\uB2E4\uC74C\uC5D0\uC640 \uB3D9\uC758\uD558\uAE30\uC758 \uC704\uACC4 \uC644\uD654 \u2192 \uACE0\uAC1D\uC758 \uC790\uC728\uC801 \uC120\uD0DD \uC9C0\uC6D0"
      ]
    },
    exceptions: HIERARCHY_EXCEPTIONS,
    evidence: ["\uAC15\uC870\uB41C \uC120\uD0DD\uC744 \uD588\uC744 \uB54C \uACE0\uAC1D\uC5D0\uAC8C \uC0C8 \uBD80\uB2F4(\uBE44\uC6A9\xB7\uB3D9\uC758\xB7\uAC1C\uC778\uC815\uBCF4 \uC81C\uACF5\xB7\uCD94\uAC00 \uACC4\uC57D)\uC774 \uC0DD\uAE30\uB294\uC9C0 \uD655\uC778"],
    triggers: ["(\uC120\uD0DD)", "\uB3D9\uC758\uD558\uAE30", "\uB124, \uBC1B\uC544", "\uB3D9\uC758\uD558\uACE0", "\uAC00\uC785\uD558\uAE30"],
    searches: [
      { tool: "search_by_ocr_text", args: { text_query: "\uC120\uD0DD", pattern: "\uC57D\uAD00\uB3D9\uC758", component: "\uBC14\uD140\uC2DC\uD2B8" } },
      { tool: "search_by_ocr_text", args: { text_query: "\uB3D9\uC758\uD558\uACE0" } }
    ],
    source: { frame: "DF_5, DF_9(\uC6D0\uBB38), DF_12~16(\uC624\uD0D0), DF_17\xB718(\uC815\uD0D0), DF_18(\uC801\uC6A9)", nodeId: "93:3866" }
  },
  {
    id: "DP-M04",
    type: "\uC624\uB3C4\uD615",
    name: "\uD2B9\uC815\uC635\uC158\uC758 \uC0AC\uC804\uC120\uD0DD",
    aliases: ["\uD2B9\uC815\uC635\uC158\uC758 \uC0AC\uC804 \uC120\uD0DD (DF_4 \uD45C\uAE30)"],
    framework: "Choice",
    keyQuestion: "\uC9C1\uC811 \uC120\uD0DD\uD588\uB294\uAC00?",
    definition: "\uC0AC\uC5C5\uC790\uC5D0\uAC8C \uC720\uB9AC\uD55C \uC120\uD0DD\uC635\uC158\uC744 \uBBF8\uB9AC \uC120\uD0DD\uD574 \uB193\uACE0 \uC18C\uBE44\uC790\uAC00 \uC774\uB97C \uC9C0\uB098\uCE58\uAC70\uB098, \uADF8\uB300\uB85C \uC218\uC6A9",
    questions: ["\uACE0\uAC1D\uC774 \uC120\uD0DD\uD558\uAE30 \uC804\uC5D0 \uD2B9\uC815 \uC635\uC158\uC774 \uBBF8\uB9AC \uC120\uD0DD\uB418\uC5B4 \uC788\uB294\uAC00?", "\uADF8\uB300\uB85C \uC9C4\uD589\uD558\uBA74 \uACE0\uAC1D\uC774 \uC758\uB3C4\uD558\uC9C0 \uC54A\uC740 \uB3D9\uC758\xB7\uAC00\uC785\xB7\uBE44\uC6A9\uC774 \uBC1C\uC0DD\uD558\uB294\uAC00?"],
    extraQuestions: [],
    examples: ["\uB9C8\uCF00\uD305 \uC120\uD0DD\uB3D9\uC758\uAC00 \uAE30\uBCF8 \uCCB4\uD06C\uB41C \uC0C1\uD0DC\uB85C \uB178\uCD9C"],
    improvements: ["\uC120\uD0DD\uC0AC\uD56D \uAE30\uBCF8 \uCCB4\uD06C \uD574\uC81C"],
    cases: [],
    exceptions: [],
    evidence: ["\uD654\uBA74 \uC9C4\uC785 \uC2DC\uC810\uC758 \uCD08\uAE30 \uCCB4\uD06C \uC0C1\uD0DC \uD655\uC778 (\uC774\uC804 \uD654\uBA74\uC5D0\uC11C \uACE0\uAC1D\uC774 \uC9C1\uC811 \uC120\uD0DD\uD588\uB294\uC9C0)"],
    notes: ['DF_3 \uD3B8\uCDE8\uC720\uB3C4\uD615 \uB300\uD45C \uC0AC\uB840: "\uB300\uCD9C \uC2E0\uCCAD \uC2DC \uBD88\uD544\uC694\uD55C \uBD80\uAC00\uC11C\uBE44\uC2A4\uAC00 \uAE30\uBCF8 \uCCB4\uD06C\uB418\uC5B4 \uC788\uB294 \uACBD\uC6B0, \uC228\uACA8\uC9C4 \uC218\uC218\uB8CC"'],
    triggers: ["(\uC120\uD0DD)", "\uB9C8\uCF00\uD305", "\uBD80\uAC00\uC11C\uBE44\uC2A4", "\uC790\uB3D9\uACB0\uC81C"],
    searches: [
      { tool: "search_by_ocr_text", args: { text_query: "\uB9C8\uCF00\uD305", component: "\uCCB4\uD06C\uBC15\uC2A4" } },
      { tool: "search_components", args: { component_type: "\uCCB4\uD06C\uBC15\uC2A4", pattern: "\uC57D\uAD00\uB3D9\uC758" } }
    ],
    source: { frame: "DF_5, DF_3", nodeId: "93:3866" }
  },
  {
    id: "DP-M05",
    type: "\uC624\uB3C4\uD615",
    name: "\uD5C8\uC704\uAD11\uACE0 \uBC0F \uAE30\uB9CC\uC801 \uC720\uC778\uD589\uC704",
    aliases: ["\uD5C8\uC704\uAD11\uACE0 \uBC0F \uAE30\uB9CC\uC801\uC778 \uC720\uC778\uD589\uC704 (DF_4 \uD45C\uAE30)", "\uD5C8\uC704 \uAD11\uACE0 \uBC0F \uAE30\uB9CC\uC801\uC778 \uC720\uC778 \uD589\uC704 : \uC2E4\uC81C\uC640 \uB2E4\uB978 \uC815\uBCF4 (DF_21 \uD45C\uAE30)"],
    framework: "Information",
    keyQuestion: "\uC0AC\uC2E4\uACFC \uC77C\uCE58\uD558\uB294\uAC00?",
    definition: "\uC18C\uBE44\uC790\uC758 \uC120\uD0DD\uC5D0 \uC601\uD5A5\uC744 \uBBF8\uCE60 \uC218 \uC788\uB294 \uC0AC\uC2E4\uC758 \uC804\uBD80 \uB610\uB294 \uC77C\uBD80\uB97C \uC870\uC791, \uC740\uD3D0, \uB204\uB77D \uCD95\uC18C",
    questions: ["\uD654\uBA74\uC758 \uD45C\uD604\uACFC \uC2E4\uC81C \uC870\uAC74\xB7\uACB0\uACFC\uAC00 \uB2E4\uB978\uAC00?", "\uD61C\uD0DD\xB7\uAC00\uACA9\xB7\uC870\uAC74\uC744 \uC2E4\uC81C\uBCF4\uB2E4 \uC720\uB9AC\uD558\uAC8C \uC624\uC778\uD558\uAC8C \uD558\uB294\uAC00?"],
    extraQuestions: [{ q: "\uD0DC\uADF8(\uC778\uAE30\xB7New\xB7Sale \uB4F1)\uC758 \uC758\uBBF8\uC640 \uAC1D\uAD00\uC801\uC778 \uC120\uC815 \uAE30\uC900\uC774 \uC788\uACE0 \uC2E4\uC81C \uB370\uC774\uD130\uC640 \uC77C\uCE58\uD558\uB294\uAC00?", source: "DF_21 \uC815\uD0D0 \uD310\uB2E8 \uADFC\uAC70" }],
    examples: [
      "\uC2E4\uC81C \uC801\uC6A9\uC774 \uC5B4\uB824\uC6B4 \uC870\uAC74\uC784\uC5D0\uB3C4 \u201C\uB204\uAD6C\uB098 \uCD5C\uC800\uAE08\uB9AC \uC801\uC6A9\u201D\uCC98\uB7FC \uD45C\uD604, \uC2E0\uCCAD\uC744 \uC720\uB3C4",
      "\uD2B9\uC815 \uC870\uAC74\uC744 \uCDA9\uC871\uD574\uC57C \uBC1B\uB294 \uD61C\uD0DD\uC744 \uC870\uAC74 \uC124\uBA85 \uC5C6\uC774 \uB204\uAD6C\uB098 \uBC1B\uC744 \uC218 \uC788\uB294 \uAC83 \uCC98\uB7FC \uAD11\uACE0"
    ],
    improvements: ["\uC2E4\uC81C \uC870\uAC74\xB7\uD589\uB3D9 \uACB0\uACFC\uC640 \uC77C\uCE58\uD558\uAC8C \uD45C\uD604"],
    cases: [
      {
        frame: "DF_21",
        title: "\uCC28\uC885 \uC120\uD0DD \uD0DC\uADF8 (\uB124\uC774\uBC84 \uD398\uC774 > \uCC28\uC885 \uC120\uD0DD)",
        guideNote: "\uC2E4\uC81C \uC870\uAC74\xB7\uC120\uD0DD\uC758 \uC758\uBBF8\uC640 \uB2E4\uB978 \uC815\uBCF4\uB098 \uD45C\uD604\uC73C\uB85C \uACE0\uAC1D\uC774 \uC0C1\uD488\xB7\uD61C\uD0DD \uB610\uB294 \uC120\uD0DD \uACB0\uACFC\uB97C \uC798\uBABB \uC774\uD574\uD558\uB3C4\uB85D \uC720\uB3C4\uD558\uB294\uC9C0\uB97C \uD310\uB2E8\uD569\uB2C8\uB2E4.",
        summary: "\uC778\uAE30 / New / Sale \uB4F1 \uD0DC\uADF8\uC758 \uD2B9\uC131\uC774 \uBA85\uD655\uD55C \uB370\uC774\uD130\uB85C \uC81C\uC2DC\uB418\uC9C0 \uC54A\uC544, \uC2E4\uC81C \uCC28\uB7C9\uC758 \uD2B9\uC131\uC774\uB098 \uC0C1\uD0DC\uB97C \uC624\uC778\uD560 \uC218 \uC788\uB2E4\uACE0 \uD310\uB2E8",
        basis: ["\uD0DC\uADF8\uC758 \uC758\uBBF8\uC640 \uAC1D\uAD00\uC801\uC778 \uC120\uC815 \uAE30\uC900\uC774 \uC5C6\uC74C", "\uC2E4\uC81C \uB370\uC774\uD130\uC640 \uC77C\uCE58\uD558\uB294 \uC815\uBCF4\uAC00 \uC544\uB2D8"],
        improvement: "\uD0DC\uADF8\uBCC4 \uC120\uC815 \uAE30\uC900\uC744 \uC815\uC758\uD558\uACE0 \uC2E4\uC81C \uB370\uC774\uD130\uC5D0 \uADFC\uAC70\uD574 \uB178\uCD9C"
      },
      {
        frame: "DF_21",
        title: "\uC120\uD0DD\uB3D9\uC758 - \uD50C\uB7EC\uC2A4\uBA64\uBC84\uC2ED (\uD55C\uB3C4\uC870\uD68C \uB3D9\uC758 > \uC120\uD0DD\uB3D9\uC758 \uBBF8\uC120\uD0DD > \uB178\uCD9C)",
        summary: "\uAE08\uB9AC \uD560\uC778 \uBB38\uAD6C\uB85C \uACE0\uAC1D \uC624\uD574\uB97C \uC77C\uC73C\uD0B4",
        basis: ["\uAE08\uB9AC \uD560\uC778\uC774 \uC5C6\uC74C\uC5D0\uB3C4 \uD61C\uD0DD \uCC98\uB7FC \uC548\uB0B4"],
        improvement: ""
      }
    ],
    exceptions: [],
    evidence: ["\uD45C\uC2DC\uB41C \uD61C\uD0DD\xB7\uAE08\uB9AC\xB7\uD0DC\uADF8\uC758 \uC2E4\uC81C \uC801\uC6A9 \uC870\uAC74\uACFC \uADFC\uAC70 \uB370\uC774\uD130 \uD655\uC778"],
    triggers: ["\uB204\uAD6C\uB098", "\uCD5C\uC800\uAE08\uB9AC", "\uBB34\uC774\uC790", "\uC778\uAE30", "\uD560\uC778", "\uD61C\uD0DD"],
    searches: [
      { tool: "search_by_ocr_text", args: { text_query: "\uB204\uAD6C\uB098" } },
      { tool: "search_by_ocr_text", args: { text_query: "\uCD5C\uC800\uAE08\uB9AC" } }
    ],
    source: { frame: "DF_5, DF_21(\uC815\uD0D0)", nodeId: "1:5879" }
  },
  // ══ 방해형 (DF_6) ══
  {
    id: "DP-O01",
    type: "\uBC29\uD574\uD615",
    name: "\uCDE8\uC18C\xB7\uD0C8\uD1F4 \uB4F1\uC758 \uBC29\uD574",
    aliases: ["\uCDE8\uC18C \uD0C8\uD1F4 \uB4F1\uC758 \uBC29\uD574 (DF_4 \uD45C\uAE30)"],
    framework: "Obstruction",
    keyQuestion: "\uD574\uC9C0\uAC00 \uC5B4\uB824\uC6B4\uAC00?",
    definition: "\uC11C\uBE44\uC2A4\uC758 \uAC00\uC785 \uBCF4\uB2E4 \uCDE8\uC18C,\uD574\uC9C0,\uD0C8\uD1F4 \uB4F1\uC758 \uC808\uCC28\uAC00 \uBCF5\uC7A1\uD558\uC5EC \uBC29\uD574\uD558\uB294 \uD589\uC704",
    questions: ["\uC11C\uBE44\uC2A4 \uAC00\uC785\uC740 \uAC04\uB2E8\uD558\uC9C0\uB9CC, \uD574\uC9C0\xB7\uCDE8\uC18C\xB7\uD0C8\uD1F4 \uC2DC \uACFC\uB3C4\uD55C \uB2E8\uACC4\uB97C \uC694\uAD6C\uD558\uB294\uAC00?", "\uC628\uB77C\uC778 \uAC00\uC785 \uD6C4 \uD574\uC9C0\uB294 \uC0C1\uB2F4 \uB4F1 \uB354 \uC5B4\uB824\uC6B4 \uBC29\uC2DD\uB9CC \uAC00\uB2A5\uD55C\uAC00?"],
    extraQuestions: [],
    examples: ["\uAC00\uC785\uC740 \uAC04\uB2E8\uD558\uC9C0\uB9CC \uD574\uC9C0\uB294 \uC5EC\uB7EC \uB2E8\uACC4\uC758 \uC0AC\uC720 \uC120\uD0DD\xB7\uD61C\uD0DD \uC7AC\uC548\uB0B4\xB7\uC0C1\uB2F4 \uC5F0\uACB0\uC744 \uAC70\uCCD0\uC57C \uD568", "\uD574\uC9C0 \uBA54\uB274\uAC00 \uC874\uC7AC\uD558\uC9C0 \uC54A\uC544 \uC0C1\uB2F4\uC6D0\uC73C\uB85C \uC5F0\uACB0"],
    improvements: ["\uC0C1\uD488 \uBC0F \uC11C\uBE44\uC2A4\uB97C \uC27D\uAC8C \uCDE8\uC18C\xB7\uD574\uC9C0\xB7\uD0C8\uD1F4\uD560 \uC218 \uC788\uB3C4\uB85D \uAD6C\uC131"],
    cases: [],
    exceptions: ['\uBCF4\uD638 \uB9C8\uCC30\uC740 \uC81C\uC678 (DF_4 "\uCDE8\uC18C\xB7\uD574\uC9C0\xB7\uAC70\uC808\xB7\uBE44\uAD50 \uACFC\uC815\uC5D0 \uBD88\uD544\uC694\uD55C \uB2E8\uACC4\uC640 \uB9C8\uCC30\uC744 \uCD94\uAC00\uD588\uB294\uC9C0 \uD655\uC778 (\uBCF4\uD638 \uB9C8\uCC30 \uC81C\uC678)")'],
    evidence: ["\uAC00\uC785 \uB2E8\uACC4 \uC218\uC640 \uD574\uC9C0 \uB2E8\uACC4 \uC218 \uBE44\uAD50", "\uC571 \uC548\uC5D0\uC11C \uD574\uC9C0\uAC00 \uAC00\uB2A5\uD55C\uC9C0 \uD655\uC778"],
    triggers: ["\uD574\uC9C0", "\uD0C8\uD1F4", "\uC815\uB9D0", "\uC0AC\uC720"],
    searches: [
      { tool: "search_ui_patterns", args: { query: "\uD574\uC9C0" } },
      { tool: "search_ui_patterns", args: { query: "\uD0C8\uD1F4" } }
    ],
    source: { frame: "DF_6", nodeId: "93:4033" }
  },
  {
    id: "DP-O02",
    type: "\uBC29\uD574\uD615",
    name: "\uC228\uACA8\uC9C4 \uC815\uBCF4",
    framework: "Information",
    keyQuestion: "\uC911\uC694 \uC815\uBCF4\uB97C \uC27D\uAC8C \uCC3E\uB294\uAC00?",
    definition: "\uC0C1\uD488 \uC11C\uBE44\uC2A4 \uAC00\uC785 \uACFC\uC815\uC5D0\uC11C \uD544\uC694\uD55C \uC911\uC694 \uC815\uBCF4\uB97C \uC81C\uB300\uB85C \uD45C\uC2DC\uD558\uC9C0 \uC54A\uAC70\uB098 \uC740\uD3D0, \uB204\uB77D, \uCD95\uC18C\uC2DC\uD0A8 \uACBD\uC6B0",
    questions: ["\uBE44\uC6A9\xB7\uAE08\uB9AC\xB7\uC870\uAC74 \uB4F1 \uC911\uC694 \uC815\uBCF4\uAC00 \uC27D\uAC8C \uBC1C\uACAC\uB418\uB294\uAC00?", "\uC815\uBCF4\uB97C \uCC3E\uAE30 \uC704\uD574 \uCD94\uAC00 \uD0D0\uC0C9\uC774\uB098 \uBD88\uD544\uC694\uD55C \uD074\uB9AD\uC774 \uC788\uB294\uAC00?"],
    extraQuestions: [{ q: "\uACE0\uAC1D\uC774 \uBD80\uB2F4\uD558\uB294 \uBE44\uC6A9\xB7\uC218\uC218\uB8CC \uB4F1 \uC911\uC694 \uC815\uBCF4\uB97C \uC2E0\uCCAD\xB7\uACC4\uC57D \uACB0\uC815 \uC804\uC5D0 \uC27D\uAC8C \uD655\uC778\uD560 \uC218 \uC788\uB294\uAC00? (\uC57D\uAD00 \uC804\uBB38\uC5D0\uB9CC \uC788\uC9C0 \uC54A\uC740\uAC00)", source: "DF_24 \uC815\uD0D0 \uD310\uB2E8 \uADFC\uAC70" }],
    examples: ["\uC911\uB3C4\uC815\uC0B0 \uC218\uC218\uB8CC\uB97C \uC0C1\uC138\uBCF4\uAE30 \uC548\uC5D0\uC11C\uB9CC \uD655\uC778 \uAC00\uB2A5", "\uADFC\uC800\uB2F9 \uC124\uC815\xB7\uD574\uC9C0 \uBE44\uC6A9\uC744 \uC791\uC740 \uC57D\uAD00 \uC804\uBB38\uC73C\uB85C \uC81C\uACF5"],
    improvements: ["\uC911\uC694 \uC815\uBCF4\uB294 \uC758\uC0AC\uACB0\uC815 \uC2DC\uC810\uC5D0 \uBC14\uB85C \uB178\uCD9C"],
    cases: [
      {
        frame: "DF_24",
        title: "\uADFC\uC800\uB2F9 \uC124\uC815 \uC2E0\uCCAD (\uC624\uD1A0\uB514\uC9C0\uD138 > \uADFC\uC800\uB2F9 \uC124\uC815)",
        guideNote: "\uC911\uC694\uD55C \uC815\uBCF4\uAC00 \uC81C\uACF5\uB418\uC5C8\uB2E4\uB294 \uC0AC\uC2E4\uB9CC\uC73C\uB85C \uCDA9\uBD84\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uACE0\uAC1D\uC758 \uBE44\uC6A9\xB7\uACC4\uC57D \uC870\uAC74\uC5D0 \uC601\uD5A5\uC744 \uC8FC\uB294 \uD575\uC2EC \uC815\uBCF4\uB97C \uC758\uC0AC\uACB0\uC815 \uC804\uC5D0 \uC27D\uAC8C \uBC1C\uACAC\uD558\uACE0 \uC774\uD574\uD560 \uC218 \uC788\uB294\uC9C0 \uD310\uB2E8\uD569\uB2C8\uB2E4.",
        summary: "\uADFC\uC800\uB2F9 \uC124\uC815\xB7\uD574\uC9C0 \uC2DC \uACE0\uAC1D\uC774 \uBD80\uB2F4\uD558\uB294 \uBE44\uC6A9\uC774 \uBC1C\uC0DD\uD558\uC9C0\uB9CC, \uD574\uB2F9 \uC815\uBCF4\uAC00 \uC57D\uAD00 \uC804\uBB38\uC5D0 \uD3EC\uD568\uB418\uC5B4 \uC788\uC5B4 \uC2E0\uCCAD \uD654\uBA74\uC5D0\uC11C \uC989\uC2DC \uD655\uC778\uD558\uAE30 \uC5B4\uB824\uC6C0.",
        basis: ["\uACE0\uAC1D\uC774 \uBD80\uB2F4\uD558\uB294 \uBE44\uC6A9\xB7\uC218\uC218\uB8CC \uB4F1 \uC911\uC694 \uC815\uBCF4\uC784", "\uC2E0\uCCAD\xB7\uACC4\uC57D \uACB0\uC815 \uC804\uC5D0 \uC27D\uAC8C \uD655\uC778\uD560 \uC218 \uC5C6\uC74C"],
        improvement: "\uC124\uC815\xB7\uD574\uC9C0 \uBE44\uC6A9 \uB4F1 \uD575\uC2EC \uC870\uAC74\uC744 \uC2E0\uCCAD \uD654\uBA74\uC5D0 \uC9C1\uC811 \uB178\uCD9C"
      }
    ],
    exceptions: [],
    evidence: ["\uD574\uB2F9 \uBE44\uC6A9\xB7\uC870\uAC74\uC774 \uC2E0\uCCAD \uD654\uBA74 \uBCF8\uBB38\uC5D0 \uC788\uB294\uC9C0, \uC811\uD798\xB7\uC57D\uAD00 \uC804\uBB38\uC5D0\uB9CC \uC788\uB294\uC9C0 \uD655\uC778"],
    triggers: ["\uC218\uC218\uB8CC", "\uD574\uC9C0\uBE44\uC6A9", "\uC0C1\uC138 \uBE44\uC6A9", "\uC57D\uAD00 \uC804\uBB38", "\uC911\uB3C4\uC0C1\uD658"],
    searches: [
      { tool: "search_by_ocr_text", args: { text_query: "\uC218\uC218\uB8CC", pattern: "\uB300\uCD9C" } },
      { tool: "search_by_ocr_text", args: { text_query: "\uC911\uB3C4\uC0C1\uD658" } }
    ],
    source: { frame: "DF_6, DF_24(\uC815\uD0D0)", nodeId: "1:6098" }
  },
  {
    id: "DP-O03",
    type: "\uBC29\uD574\uD615",
    name: "\uAC00\uACA9\uBE44\uAD50 \uBC29\uD574",
    aliases: ["\uAC00\uACA9 \uBE44\uAD50 \uBC29\uD574 (DF_4 \uD45C\uAE30)"],
    framework: "Information",
    keyQuestion: "\uAC19\uC740 \uAE30\uC900\uC73C\uB85C \uBE44\uAD50\uAC00 \uB418\uB294\uAC00?",
    definition: "\uC0C1\uD488 \uBC0F \uC11C\uBE44\uC2A4 \uAC00\uC785\uC5D0\uC11C \uB2E4\uB978 \uC81C\uC548\uC774\uB098 \uAC00\uACA9\uACFC \uBE44\uAD50\uD558\uB294 \uAC83\uC744 \uC81C\uD55C\uD558\uC5EC \uC18C\uBE44\uC790\uC5D0\uAC8C \uC720\uB9AC\uD55C \uC120\uD0DD\uC744 \uBC29\uD574\uD558\uB294 \uD589\uC704",
    questions: ["\uC0C1\uD488 \uAC04 \uAC00\uACA9\xB7\uAE08\uB9AC\xB7\uC870\uAC74\uC744 \uAC19\uC740 \uAE30\uC900\uC73C\uB85C \uBE44\uAD50\uD560 \uC218 \uC788\uB294\uAC00?", "\uD2B9\uC815 \uC0C1\uD488\uB9CC \uC720\uB9AC\uD55C \uAE30\uC900\uC73C\uB85C \uBCF4\uC5EC \uBE44\uAD50 \uACB0\uACFC\uB97C \uC65C\uACE1\uD558\uB294\uAC00?"],
    extraQuestions: [],
    examples: ["\uC790\uC0AC\uB300\uCD9C\uC740 \uCD5C\uC800\uAE08\uB9AC, \uD0C0\uC0AC\uB300\uCD9C\uC740 \uCD5C\uACE0\uAE08\uB9AC\uB85C \uD45C\uC2DC\uD574 \uC790\uC0AC\uAC00 \uB354 \uC720\uB9AC\uD574 \uBCF4\uC774\uAC8C \uD568"],
    improvements: ["\uB3D9\uC77C \uAE30\uC900\xB7\uC870\uAC74\uC73C\uB85C \uBE44\uAD50 \uC815\uBCF4 \uC81C\uACF5"],
    cases: [],
    exceptions: [],
    evidence: ["\uBE44\uAD50 \uD56D\uBAA9\uB9C8\uB2E4 \uAC19\uC740 \uAE30\uC900(\uCD5C\uC800/\uCD5C\uACE0, \uAE30\uAC04, \uC870\uAC74)\uC778\uC9C0 \uD655\uC778"],
    triggers: ["\uCD5C\uC800", "\uCD5C\uACE0", "\uBE44\uAD50"],
    searches: [{ tool: "search_ui_patterns", args: { query: "\uBE44\uAD50", category: "\uAE08\uC735" } }],
    source: { frame: "DF_6", nodeId: "93:4033" }
  },
  {
    id: "DP-O04",
    type: "\uBC29\uD574\uD615",
    name: "\uD074\uB9AD \uD53C\uB85C\uAC10 \uC720\uBC1C",
    framework: "Obstruction",
    keyQuestion: "\uBD88\uD544\uC694\uD55C \uD589\uB3D9\uC744 \uBC18\uBCF5\uD574\uC57C \uD558\uB294\uAC00?",
    definition: "\uC18C\uBE44\uC790\uAC00 \uC720\uB9AC\uD55C \uC635\uC158\uC744 \uC120\uD0DD\uD558\uAC70\uB098 \uC6D0\uD558\uB294 \uC815\uBCF4\uB97C \uAD6C\uD558\uAE30 \uC704\uD574 \uB9CE\uC740 \uD074\uB9AD\uC774 \uD544\uC694\uD558\uB3C4\uB85D \uB9CC\uB4E4\uC5B4 \uD53C\uB85C\uAC10 \uC720\uBC1C",
    questions: ["\uC6D0\uD558\uB294 \uAE30\uB2A5\uAE4C\uC9C0 \uBD88\uD544\uC694\uD55C \uB2E8\uACC4\xB7\uD074\uB9AD\uC774 \uBC18\uBCF5\uB418\uB294\uAC00?", "\uC5EC\uB7EC \uD56D\uBAA9\uC744 \uD558\uB098\uC529 \uCC98\uB9AC\uD558\uB3C4\uB85D \uC758\uB3C4\uC801\uC73C\uB85C \uBD84\uB9AC\uD588\uB294\uAC00?", "\uADF8 \uACB0\uACFC \uACE0\uAC1D\uC774 \uBCC0\uACBD\xB7\uD574\uC81C \uB4F1\uC744 \uD3EC\uAE30\uD560 \uAC00\uB2A5\uC131\uC774 \uC788\uB294\uAC00?"],
    extraQuestions: [],
    examples: ["\uC5EC\uB7EC \uACC4\uC88C \uC5F0\uACB0 \uD574\uC81C \uC2DC \uAC01 \uACC4\uC88C\uB97C \uD558\uB098\uC529 \uC9C4\uC785\uD574 \uBC18\uBCF5\uC801\uC73C\uB85C \uD574\uC81C\uD574\uC57C \uD568"],
    improvements: ["\uC804\uCCB4\uC120\uD0DD, \uC804\uCCB4\uCDE8\uC18C\uAC00 \uAC00\uB2A5\uD55C \uBC84\uD2BC \uD65C\uC131\uD654"],
    cases: [],
    exceptions: [],
    evidence: ["\uD574\uC81C\xB7\uBCC0\uACBD \uD50C\uB85C\uC6B0\uC758 \uC2E4\uC81C \uD074\uB9AD \uC218 \uD655\uC778"],
    triggers: ["\uD574\uC81C", "\uC5F0\uACB0 \uD574\uC81C", "\uD558\uB098\uC529"],
    searches: [{ tool: "search_by_ocr_text", args: { text_query: "\uC5F0\uACB0 \uD574\uC81C" } }],
    source: { frame: "DF_6", nodeId: "93:4033" }
  },
  // ══ 압박형 (DF_7) ══
  {
    id: "DP-P01",
    type: "\uC555\uBC15\uD615",
    name: "\uACC4\uC57D\uACFC\uC815 \uC911 \uAE30\uC2B5\uC801 \uAD11\uACE0",
    typeConflict: "\uC815\uC758(DF_2\xB7DF_4\xB7DF_7)\uB294 \uC555\uBC15\uD615, \uC815\uD0D0 \uC0AC\uB840(DF_23)\xB7\uC801\uC6A9 \uAC00\uC774\uB4DC(DF_21)\xB7\uC139\uC158 \uB77C\uBCA8\uC740 \uBC29\uD574\uD615\uC73C\uB85C \uD45C\uAE30\uB3FC \uC788\uC5B4\uC694. \uAE08\uC735\uB2F9\uAD6D \uC6D0\uBB38(2025.12.)\uC740 \uC555\uBC15\uD615 \uC138\uBD80 \uC720\uD615\uC73C\uB85C \uBD84\uB958\uD574\uC694(3\uCABD \uD45C, 19\uCABD). \uAC00\uC774\uB4DC \uB2F4\uB2F9\uC790 \uD655\uC778\uC774 \uD544\uC694\uD574\uC694. (SOURCE_ISSUES \uCC38\uACE0)",
    framework: "Influence",
    keyQuestion: "\uD604\uC7AC \uACFC\uC5C5\uACFC \uBB34\uAD00\uD55C \uAC1C\uC785\uC778\uAC00?",
    definition: "\uAC70\uB798 \uBAA9\uC801\uACFC \uBB34\uAD00\uD55C \uC0C1\uD488 \uBC0F \uC11C\uBE44\uC2A4\uB97C \uAE30\uC2B5\uC801\uC73C\uB85C \uAD11\uACE0\uD558\uB294 \uD589\uC704",
    questions: ["\uD604\uC7AC \uACFC\uC5C5\uACFC \uBB34\uAD00\uD55C \uC0C1\uD488\xB7\uC11C\uBE44\uC2A4\uAC00 \uC911\uAC04\uC5D0 \uAC1C\uC785\uD558\uB294\uAC00?", "\uACE0\uAC1D\uC774 \uC608\uC0C1\uD558\uC9C0 \uBABB\uD55C \uC2DC\uC810\uC5D0 \uB178\uCD9C\uB418\uC5B4 \uCD94\uAC00 \uAC00\uC785\xB7\uB3D9\uC758\uB97C \uC720\uB3C4\uD558\uB294\uAC00?"],
    extraQuestions: [
      { q: "\uACC4\uC57D\xB7\uC2E0\uCCAD\uC774 \uC644\uB8CC\uB418\uAE30 \uC804\uC5D0 \uAD11\uACE0\uAC00 \uB178\uCD9C\uB418\uB294\uAC00?", source: "DF_23 \uC815\uD0D0 \uD310\uB2E8 \uADFC\uAC70" },
      { q: "\uAD11\uACE0 \uD655\uC778\xB7\uB2EB\uAE30 \uB4F1\uC758 \uD589\uB3D9\uC73C\uB85C \uACFC\uC5C5\uC758 \uD750\uB984\uC744 \uBC29\uD574\uD558\uB294\uAC00?", source: "DF_21 \uC801\uC6A9 \uAC00\uC774\uB4DC" },
      { q: "\uC0AC\uC6A9\uC790\uC758 \uC608\uC0C1 \uD750\uB984 \uBC16\uC5D0\uC11C \uAD11\uACE0\uAC00 \uAC1C\uC785\uB418\uC5C8\uACE0, \uCD94\uAC00 \uAE08\uC735\uC0C1\uD488 \uAC00\uC785\uC744 \uC720\uB3C4\uD558\uB294\uAC00?", source: "DF_2 \uD310\uB2E8 \uAE30\uC900" }
    ],
    examples: ["\uB300\uCD9C \uAC00\uC785 \uACFC\uC815\uC5D0\uC11C \uBCF4\uD5D8\xB7\uBD80\uAC00\uC11C\uBE44\uC2A4 \uAC00\uC785 \uAD11\uACE0 \uB178\uCD9C"],
    improvements: [
      "\uBAA8\uB4E0 \uACC4\uC57D(\uAC00\uC785)\uC774 \uC644\uB8CC \uD6C4 \uBCC4\uB3C4 \uC548\uB0B4",
      "\uAD8C\uC7A5 : \uAD11\uACE0 \uBC14\uD140\uC2DC\uD2B8\uB97C \uC81C\uAC70 (DF_2)",
      "\uCC28\uC120 : \uAD11\uACE0 \uC720\uC9C0\uAC00 \uD544\uC694\uD55C \uACBD\uC6B0 \uC0AC\uC6A9\uC790\uC758 \uC120\uD0DD\uAD8C\uC744 \uBCF4\uC7A5\uD558\uB294 \uAD6C\uC870\uB85C \uAC1C\uC120 (\uBC30\uB108\uD615 or \uAC70\uC808\uC120\uD0DD\uC9C0) (DF_2)"
    ],
    cases: [
      {
        frame: "DF_23",
        title: "DB\uC190\uD574\uBCF4\uD5D8 \uAC00\uC785 \uAD11\uACE0 (\uC0C1\uD488 \uAC00\uC785 \uC911)",
        guideNote: "\uACC4\uC57D\xB7\uC2EC\uC0AC \uACFC\uC815\uC5D0\uC11C \uACE0\uAC1D\uC774 \uC694\uCCAD\uD558\uC9C0 \uC54A\uC740 \uC0C1\uD488\uC744 \uB178\uCD9C\uD558\uC5EC, \uD604\uC7AC \uACFC\uC5C5\uC758 \uD750\uB984\uC744 \uBC29\uD574\uD558\uAC70\uB098 \uB2E4\uB978 \uC0C1\uD488 \uC120\uD0DD\uC744 \uC720\uB3C4\uD558\uB294\uC9C0 \uD310\uB2E8\uD569\uB2C8\uB2E4.",
        summary: "\uC0C1\uD488 \uAC00\uC785\uC744 \uC218\uD589\uC911, \uACE0\uAC1D\uC774 \uC694\uCCAD\uD558\uC9C0 \uC54A\uC740 \uD574\uB2F9 \uACFC\uC5C5\uACFC \uAD00\uB828\uC5C6\uB294 \uBCC4\uB3C4\uC758 \uBCF4\uD5D8\uC0C1\uD488 \uAD11\uACE0\uAC00 \uB178\uCD9C",
        basis: ["\uD604\uC7AC \uACFC\uC5C5\uACFC \uC9C1\uC811 \uAD00\uB828 \uC5C6\uB294 \uC0C1\uD488\uC784", "\uACC4\uC57D\xB7\uC2E0\uCCAD\uC774 \uC644\uB8CC\uB418\uAE30 \uC804\uC5D0 \uAD11\uACE0\uAC00 \uB178\uCD9C"],
        improvement: "\uD604\uC7AC \uACFC\uC5C5\uC744 \uC6B0\uC120 \uC644\uB8CC\uD560 \uC218 \uC788\uB3C4\uB85D \uD558\uACE0, \uAD00\uB828 \uC0C1\uD488 \uAD11\uACE0\uB294 \uACC4\uC57D \uC644\uB8CC \uD6C4 \uBCC4\uB3C4 \uC601\uC5ED\uC5D0\uC11C \uC81C\uACF5",
        note: "* (\uC0C1\uBC18\uAE30 \uBD84\uB958) \uC624\uB3C4\uD615-\uC798\uBABB\uB41C \uACC4\uCE35\uAD6C\uC870\uB85C \uD310\uB2E8 \uB418\uC5C8\uC73C\uB098 \uBC29\uD574\uD615\uC73C\uB85C \uCD94\uAC00 \uD310\uB2E8 \uD544\uC694"
      },
      {
        frame: "DF_23",
        title: "\uB300\uCD9C \uC2EC\uC0AC \uACB0\uACFC > \uC0C1\uD488 \uAD11\uACE0 (\uC2E0\uC6A9\uAD00\uB9AC)",
        summary: "\uB300\uCD9C \uC774\uC6A9\uC774 \uC5B4\uB835\uB2E4\uB294 \uC2EC\uC0AC \uACB0\uACFC\uB97C \uD655\uC778\uD558\uB294 \uC2DC\uC810\uC5D0 \uACE0\uAC1D\uC774 \uC694\uCCAD\uD558\uC9C0 \uC54A\uC740 \uC2E0\uC6A9\uAD00\uB9AC \uC0C1\uD488\uC744 \uCD94\uAC00 \uB178\uCD9C",
        basis: ["\uC2EC\uC0AC \uACB0\uACFC\uC640 \uC9C1\uC811 \uAD00\uB828 \uC5C6\uB294 \uBCC4\uB3C4 \uC0C1\uD488\uC784"],
        improvement: "\uC2EC\uC0AC \uACB0\uACFC\uC640 \uD6C4\uC18D \uC870\uCE58\uB97C \uC6B0\uC120 \uC548\uB0B4\uD558\uACE0, \uBCC4\uB3C4 \uC0C1\uD488 \uAD11\uACE0\uB294 \uACB0\uACFC \uD655\uC778 \uC774\uD6C4 \uBD84\uB9AC\uD558\uC5EC \uC81C\uACF5",
        note: "* (\uC0C1\uBC18\uAE30 \uBD84\uB958) \uC624\uB3C4\uD615-\uC798\uBABB\uB41C \uACC4\uCE35\uAD6C\uC870\uB85C \uD310\uB2E8 \uB418\uC5C8\uC73C\uB098 \uBC29\uD574\uD615\uC73C\uB85C \uD310\uB2E8 \uD544\uC694"
      }
    ],
    applyGuide: {
      frame: "DF_21(\uC801\uC6A9 \uAC00\uC774\uB4DC)",
      title: "\uD604\uC7AC \uACFC\uC5C5 \uC644\uB8CC \uD6C4 \uB178\uCD9C (\uC6D0\uBB38 \uC81C\uBAA9: \uBC29\uD574\uD615 - \uACC4\uC57D\uACFC\uC815 \uC911 \uAE30\uC2B5\uC801 \uAD11\uACE0)",
      summary: "\uACC4\uC57D\xB7\uC2EC\uC0AC \uACFC\uC815\uC5D0\uC11C \uD604\uC7AC \uACFC\uC5C5\uACFC \uBB34\uAD00\uD55C \uC0C1\uD488 \uAD11\uACE0\uB97C \uB178\uCD9C\uD558\uC5EC, \uACE0\uAC1D\uC758 \uC9C4\uD589\uC744 \uBC29\uD574\uD558\uAC70\uB098 \uB2E4\uB978 \uC0C1\uD488 \uC120\uD0DD\uC744 \uC720\uB3C4\uD558\uB294\uC9C0 \uD310\uB2E8\uD569\uB2C8\uB2E4.",
      problems: [
        "\uD604\uC7AC \uACFC\uC5C5\uACFC \uBB34\uAD00\uD55C \uC0C1\uD488 \uAD11\uACE0\uAC00 \uACC4\uC57D\xB7\uC2EC\uC0AC \uACFC\uC815\uC5D0 \uB178\uCD9C\uB418\uB294 \uACBD\uC6B0",
        "(\uC0C1\uD488 \uAC00\uC785) \uC0C1\uD488 \uAC00\uC785 \uB3C4\uC911 \uBB34\uAD00\uD55C \uAD11\uACE0 \uB178\uCD9C",
        "\uAD11\uACE0 \uD655\uC778\xB7\uB2EB\uAE30 \uB4F1\uC758 \uD589\uB3D9\uC73C\uB85C \uACFC\uC5C5\uC758 \uD750\uB984\uC744 \uBC29\uD574\uD558\uB294 \uACBD\uC6B0"
      ],
      check: "",
      improvements: ["\uACE0\uAC1D\uC774 \uD604\uC7AC \uACFC\uC5C5\uC744 \uC644\uB8CC\uD55C \uC774\uD6C4 \uBCC4\uB3C4 \uC601\uC5ED\uC5D0\uC11C \uAD11\uACE0 \uC81C\uACF5", "\uC0C1\uD488\uACFC \uC5F0\uAD00\uB41C \uAD11\uACE0\uB9CC \uB178\uCD9C"]
    },
    exceptions: ["\uACE0\uAC1D\uC774 \uD604\uC7AC \uACFC\uC5C5\uC744 \uC644\uB8CC\uD55C \uC774\uD6C4 \uBCC4\uB3C4 \uC601\uC5ED(\uBC30\uB108\uD615 \uB4F1)\uC5D0\uC11C, \uAC70\uC808 \uC120\uD0DD\uC9C0\uC640 \uD568\uAED8 \uC81C\uACF5\uD558\uB294 \uC0C1\uD488 \uC5F0\uAD00 \uAD11\uACE0 (DF_2, DF_21 \uC801\uC6A9 \uAC00\uC774\uB4DC)"],
    evidence: ["\uAD11\uACE0\uAC00 \uB178\uCD9C\uB418\uB294 \uC2DC\uC810\uC774 \uACC4\uC57D\xB7\uC2E0\uCCAD \uC644\uB8CC \uC804\uC778\uC9C0 \uD655\uC778"],
    triggers: ["\uBCF4\uD5D8", "\uAC00\uC785\uD558\uACE0", "\uC0C1\uD488\uAD8C", "\uC774\uBCA4\uD2B8", "\uAD11\uACE0"],
    searches: [
      { tool: "search_by_ocr_text", args: { text_query: "\uC6B4\uC804\uC790\uBCF4\uD5D8" } },
      { tool: "search_components", args: { component_type: "\uBC30\uB108", pattern: "\uB300\uCD9C" } }
    ],
    source: { frame: "DF_7, DF_2, DF_23(\uC815\uD0D0), DF_21(\uC801\uC6A9)", nodeId: "1:4772" }
  },
  {
    id: "DP-P02",
    type: "\uC555\uBC15\uD615",
    name: "\uBC18\uBCF5\uAC04\uC12D",
    framework: "Influence",
    keyQuestion: "\uAC70\uC808\uD55C \uC120\uD0DD\uC744 \uB2E4\uC2DC \uC694\uAD6C\uD558\uB294\uAC00?",
    definition: "\uC0AC\uC5C5\uC790\uC5D0\uAC8C \uC720\uB9AC\uD55C \uD2B9\uC815 \uD589\uC704\uB97C \uAE08\uC735\uC18C\uBE44\uC790\uC5D0\uAC8C \uC9C0\uC18D\uC801\uC73C\uB85C \uC694\uAD6C\uD558\uB294 \uD589\uC704",
    questions: ["\uACE0\uAC1D\uC774 \uC774\uBBF8 \uAC70\uC808\uD55C \uC120\uD0DD\uC744 \uB2E4\uC2DC \uC694\uAD6C\uD558\uB294\uAC00?", "\uB3D9\uC77C\uD55C \uC120\uD0DD\uC744 \uBC18\uBCF5 \uB178\uCD9C\uD574 \uACB0\uC815\uC744 \uBC14\uAFB8\uB3C4\uB85D \uC555\uBC15\uD558\uB294\uAC00?"],
    extraQuestions: [
      { q: "\uACE0\uAC1D\uC774 \uD574\uB2F9 \uC120\uD0DD\uC5D0 \uC774\uBBF8 \uC758\uC0AC\uB97C \uD45C\uD604\uD588\uB294\uAC00?", source: "DF_20 \uCD5C\uCD08 \uC81C\uC548/\uC7AC \uC81C\uC548 \uD310\uB2E8" },
      { q: "\uACE0\uAC1D\uC774 \uAC70\uC808\uD55C \uB3D9\uC77C\xB7\uC720\uC0AC\uD55C \uC120\uD0DD\uC744 \uB2E4\uC2DC \uBCC0\uACBD\uD558\uB3C4\uB85D \uC694\uAD6C\uD558\uB294\uAC00?", source: "DF_20" },
      { q: "\uB2E8\uC21C \uBC18\uBCF5\uC774 \uC544\uB2C8\uB77C \uAC70\uBD80 \uC758\uC0AC \uC774\uD6C4\uC5D0 \uBC18\uBCF5 \uC694\uAD6C\uD558\uB294 \uACBD\uC6B0\uC778\uAC00?", source: "DF_10 \uBD80\uB85D \uC6D0\uBB38" },
      { q: "\uD61C\uD0DD\uACFC \uACB0\uD569\uD574 \uAE30\uC874 \uAC70\uC808 \uC758\uC0AC\uB97C \uBC14\uAFB8\uB3C4\uB85D \uC7AC\uC720\uB3C4\uD558\uB294\uAC00?", source: "DF_19 \uC815\uD0D0 \uD310\uB2E8 \uADFC\uAC70" },
      { q: "\uBCC4\uB3C4\uC758 \uBA85\uC2DC\uC801\uC778 \uBE44\uB3D9\uC758 \uC120\uD0DD \uC5C6\uC774 \uB2EB\uAE30(X)\uB85C\uB9CC \uC774\uD0C8\uD560 \uC218 \uC788\uB294\uAC00?", source: "DF_19 \uC815\uD0D0 \uD310\uB2E8 \uADFC\uAC70" }
    ],
    examples: ["\uC120\uD0DD\uC57D\uAD00 \uAC70\uC808 \uD6C4 \uB3D9\uC77C \uB3D9\uC758\uB97C \uBC18\uBCF5\uC801\uC73C\uB85C \uC7AC\uC694\uCCAD", "(\uAC1C\uC778\uC815\uBCF4 \uC81C\uACF5) \uB9C8\uC774\uB370\uC774\uD130 \u2018\uB2E4\uC74C\uC5D0 \uD558\uAE30' \uD6C4 \uC7AC \uAD8C\uC720", "(\uBD80\uAC00\uC11C\uBE44\uC2A4 \uAC00\uC785) \uD6C4\uBD88 \uD558\uC774\uD328\uC2A4 \u2018\uC2E0\uCCAD\uC548\uD568' \uD6C4 \uC7AC \uAD8C\uC720"],
    improvements: ["\uAC70\uC808 \uC758\uC0AC \uC874\uC911, \uBD88\uD544\uC694\uD55C \uC7AC\uB178\uCD9C \uC81C\uD55C", "\uC18C\uBE44\uC790\uAC00 \uBA85\uD655\uD788 \uAC70\uBD80\uD55C \uC120\uD0DD\uC744 \uB3D9\uC77C\uD55C \uC758\uC0AC\uACB0\uC815 \uACFC\uC815\uC5D0\uC11C \uBC18\uBCF5\uC801\uC73C\uB85C \uC694\uAD6C\uD558\uC9C0 \uC54A\uB3C4\uB85D \uC124\uACC4 (DF_10)"],
    appendix: {
      frame: "DF_10",
      title: "\uBD80\uB85D - \uAE08\uC735 \uAC00\uC774\uB4DC\uB77C\uC778 \uC6D0\uBB38 \xB7 \uC555\uBC15\uD615 - \uBC18\uBCF5\uAC04\uC12D",
      definition: "\uC18C\uBE44\uC790\uAC00 \uC5B4\uB5A0\uD55C \uAC70\uBD80 \uC758\uC0AC\uB97C \uC774\uBBF8 \uD558\uC600\uC74C\uC5D0\uB3C4 \uBD88\uAD6C\uD558\uACE0 \uBC18\uBCF5\uD558\uC5EC \uC758\uC0AC\uD45C\uC2DC\uD560 \uAC83\uC744 \uC694\uAD6C\uD558\uB294 \uAC83\uC774 \uBB38\uC81C\uB420 \uC218 \uC788\uC74C",
      scope: ["(\uAC1C\uC778\uC815\uBCF4 \uC81C\uACF5) \uB9C8\uC774\uB370\uC774\uD130 \u2018\uB2E4\uC74C\uC5D0 \uD558\uAE30' \uD6C4 \uC7AC \uAD8C\uC720", "(\uBD80\uAC00\uC11C\uBE44\uC2A4 \uAC00\uC785) \uD6C4\uBD88 \uD558\uC774\uD328\uC2A4 \u2018\uC2E0\uCCAD\uC548\uD568' \uD6C4 \uC7AC \uAD8C\uC720"],
      resolution: "\uC18C\uBE44\uC790\uAC00 \uBA85\uD655\uD788 \uAC70\uBD80\uD55C \uC120\uD0DD\uC744 \uB3D9\uC77C\uD55C \uC758\uC0AC\uACB0\uC815 \uACFC\uC815\uC5D0\uC11C \uBC18\uBCF5\uC801\uC73C\uB85C \uC694\uAD6C\uD558\uC9C0 \uC54A\uB3C4\uB85D \uC124\uACC4",
      procedure: [
        "\uB2E8, \uC624\uB958 \uBC29\uC9C0\xB7\uC911\uC694 \uC815\uBCF4 \uD655\uC778\xB7\uC18C\uBE44\uC790 \uBCF4\uD638 \uB4F1\uC744 \uC704\uD55C \uD569\uB9AC\uC801\uC778 \uC7AC \uD655\uC778 \uC81C\uC678",
        "\uB2E8\uC21C \uBC18\uBCF5\uC774 \uC544\uB2C8\uB77C, \u2018\uAC70\uBD80 \uC758\uC0AC \uC774\uD6C4\uC5D0 \uBC18\uBCF5 \uC694\uAD6C \uD558\uB294 \uACBD\uC6B0",
        "\uC6D0\uBB38\uC758 \uC815\uC758\uC640 \uC0AC\uB840\uC5D0 \uB300\uC751\uB418\uB294 \uACBD\uC6B0\uC5D0\uB9CC \uAC80\uD1A0"
      ]
    },
    cases: [
      {
        frame: "DF_19",
        title: "\uC120\uD0DD\uB3D9\uC758 \uC7AC \uC624\uD37C - \uC0C1\uD488 \uC548\uB0B4 / \uC5F0\uB77D \uB3D9\uC758",
        guideNote: "\uACE0\uAC1D\uC774 \uC120\uD0DD\uB3D9\uC758\uB97C \uAC70\uC808\uD55C \uC774\uD6C4, \uB3D9\uC77C\xB7\uC720\uC0AC\uD55C \uB3D9\uC758\uB97C \uB2E4\uC2DC \uC694\uAD6C\uD558\uC5EC \uAE30\uC874 \uC120\uD0DD\uC744 \uBCC0\uACBD\uD558\uB3C4\uB85D \uBC18\uBCF5\uC801\uC73C\uB85C \uC720\uB3C4\uD558\uB294 \uACBD\uC6B0 \uBC18\uBCF5\uAC04\uC12D\uC73C\uB85C \uD310\uB2E8\uD569\uB2C8\uB2E4.",
        summary: "\uACE0\uAC1D\uC774 \uC55E\uC11C \uAC70\uC808\uD55C \uC120\uD0DD\uB3D9\uC758\uB97C \u2018\uBE60\uB978 \uCD9C\uACE0 \uCC28\uB7C9 \uC548\uB0B4\u2019\uB77C\uB294 \uD61C\uD0DD\uACFC \uACB0\uD569\uD574 \uB2E4\uC2DC \uC81C\uC548\uD558\uC5EC \uB3D9\uC758\uB97C \uC7AC\uAD8C\uC720\uD568.",
        basis: [
          "\uACE0\uAC1D\uC774 \uD574\uB2F9 \uC120\uD0DD\uB3D9\uC758\uB97C \uC774\uBBF8 \uAC70\uC808\uD55C \uC774\uB825\uC774 \uC788\uC74C",
          "\uB3D9\uC77C\xB7\uC720\uC0AC\uD55C \uAC1C\uC778\uC815\uBCF4 \uC81C\uACF5 \uB3D9\uC758\uB97C \uB2E4\uC2DC \uC694\uAD6C\uD568",
          "\uBCC4\uB3C4\uC758 \uBA85\uC2DC\uC801\uC778 \uBE44\uB3D9\uC758 \uC120\uD0DD \uC5C6\uC774 \uB2EB\uAE30(X)\uB85C\uB9CC \uC774\uD0C8 \uAC00\uB2A5",
          "\u2018\uBE60\uB978 \uCD9C\uACE0 \uCC28\uB7C9 \uC548\uB0B4\u2019\uB77C\uB294 \uD61C\uD0DD\uACFC \uACB0\uD569\uD558\uC5EC \uAE30\uC874 \uAC70\uC808 \uC758\uC0AC\uB97C \uBCC0\uACBD\uD558\uB3C4\uB85D \uC7AC\uC720\uB3C4"
        ],
        improvement: ""
      }
    ],
    applyGuide: {
      frame: "DF_19(\uC801\uC6A9 \uAC00\uC774\uB4DC)",
      title: "\uAC70\uC808\uD55C \uC120\uD0DD\uC740 \uBC18\uBCF5 \uAD8C\uC720\uD558\uC9C0 \uC54A\uC74C",
      summary: "\uACE0\uAC1D\uC774 \uC120\uD0DD\uB3D9\uC758\xB7\uBD80\uAC00\uC11C\uBE44\uC2A4 \uB4F1\uC744 \uBA85\uD655\uD788 \uAC70\uC808\uD55C \uD6C4, \uB3D9\uC77C\xB7\uC720\uC0AC\uD55C \uC120\uD0DD\uC744 \uB2E4\uC2DC \uC81C\uC548\uD558\uC5EC \uAE30\uC874 \uC120\uD0DD\uC744 \uBCC0\uACBD\uD558\uB3C4\uB85D \uC720\uB3C4\uD558\uB294 \uACBD\uC6B0 \uBC18\uBCF5\uAC04\uC12D\uC73C\uB85C \uD310\uB2E8\uD569\uB2C8\uB2E4.",
      problems: [
        "\uACE0\uAC1D\uC774 \uC774\uBBF8 \uAC70\uC808 \uC758\uC0AC\uB97C \uD45C\uC2DC\uD55C \uC120\uD0DD\uC758 \uC7AC\uAD8C\uC720",
        "(\uAC1C\uC778\uC815\uBCF4 \uC81C\uACF5) \uB9C8\uC774\uB370\uC774\uD130 \u2018\uB2E4\uC74C\uC5D0 \uD558\uAE30' \uD6C4 \uC7AC \uAD8C\uC720",
        "(\uBD80\uAC00\uC11C\uBE44\uC2A4 \uAC00\uC785) \uD6C4\uBD88 \uD558\uC774\uD328\uC2A4 \u2018\uC2E0\uCCAD\uC548\uD568' \uD6C4 \uC7AC \uAD8C\uC720",
        "(\uC120\uD0DD\uB3D9\uC758)\uD61C\uD0DD\uC815\uBCF4 \uBC1B\uAE30, \uAD11\uACE0 \uC815\uBCF4 \uC218\uC2E0, \uAC1C\uC778\uC815\uBCF4 \uC774\uC6A9"
      ],
      check: "",
      improvements: [
        "\uACE0\uAC1D\uC774 \uBA85\uD655\uD788 \uAC70\uC808\uD55C \uB3D9\uC77C\xB7\uC720\uC0AC \uC120\uD0DD\uC740 \uBC18\uBCF5 \uB178\uCD9C\uD558\uC9C0 \uC54A\uC74C",
        "\uC7AC \uC548\uB0B4\uAC00 \uD544\uC694\uD55C \uACBD\uC6B0 \uD569\uB9AC\uC801 \uC0AC\uC720\uAC00 \uC788\uB294\uC9C0 \uAC80\uD1A0",
        "\u203B \uBC95\uC801 \uC7AC\uD655\uC778, \uACE0\uAC1D\uC758 \uC9C1\uC811 \uC694\uCCAD, \uC870\uAC74 \uBCC0\uACBD \uB4F1",
        "\uAC70\uC808\uD55C \uC120\uD0DD\uB3D9\uC758\uB294 \uC774\uD6C4 \uACFC\uC815\uC5D0\uC11C \uB2E4\uC2DC \uAD8C\uC720\uD558\uC9C0 \uC54A\uC74C",
        "\uC7AC \uB178\uCD9C\uD560 \uD569\uB9AC\uC801 \uC0AC\uC720\uAC00 \uC788\uB294 \uACBD\uC6B0 \uD2B9\uC815 \uC120\uD0DD\uC73C\uB85C\uC758 \uC720\uB3C4 \uCD5C\uC18C\uD654"
      ]
    },
    exceptions: REPEAT_EXCEPTIONS,
    evidence: ["\uC774 \uD654\uBA74 \uC9C1\uC804\uC5D0 \uACE0\uAC1D\uC774 \uAC19\uC740 \uC120\uD0DD\uC744 \uAC70\uC808\uD588\uB294\uC9C0(\uD50C\uB85C\uC6B0 \uC21C\uC11C) \uD655\uC778"],
    triggers: ["\uB2E4\uC2DC", "\uB2E4\uC74C\uC5D0", "\uB3D9\uC758\uD558\uC2DC\uBA74", "\uC548\uB0B4\uBC1B\uC544", "\uBC1B\uC544 \uBCFC\uAC8C\uC694"],
    searches: [
      { tool: "search_by_ocr_text", args: { text_query: "\uB3D9\uC758\uD558\uC2DC\uBA74" } },
      { tool: "search_by_ocr_text", args: { text_query: "\uB2E4\uC74C\uC5D0", component: "\uBC14\uD140\uC2DC\uD2B8" } }
    ],
    source: { frame: "DF_7, DF_10(\uC6D0\uBB38), DF_19(\uC815\uD0D0), DF_20(\uD310\uB2E8\uAE30\uC900), DF_19(\uC801\uC6A9)", nodeId: "1:6196" }
  },
  {
    id: "DP-P03",
    type: "\uC555\uBC15\uD615",
    name: "\uAC10\uC815\uC801 \uC5B8\uC5B4\uC0AC\uC6A9",
    framework: "Influence",
    keyQuestion: "\uAC10\uC815\uC744 \uC790\uADF9\uD574 \uC120\uD0DD\uC744 \uC555\uBC15\uD558\uB294\uAC00?",
    definition: "\uAC10\uC815\uC744 \uC790\uADF9\uD558\uB294 \uC5B8\uC5B4\uC801 \uD45C\uD604\uC744 \uD1B5\uD574 \uAE08\uC735\uC18C\uBE44\uC790\uAC00 \uD2B9\uC815 \uD589\uB3D9\uC744 \uD558\uB3C4\uB85D \uC555\uBC15",
    questions: ["\uBD88\uC548\xB7\uC8C4\uCC45\uAC10\xB7\uC190\uC2E4 \uC6B0\uB824\uB97C \uC790\uADF9\uD574 \uC120\uD0DD\uC744 \uC555\uBC15\uD558\uB294\uAC00?", "\uC120\uD0DD\uD558\uC9C0 \uC54A\uC744 \uACBD\uC6B0\uC758 \uACB0\uACFC\uB97C \uACFC\uC7A5\uD558\uAC70\uB098 \uC704\uD611\uC801\uC73C\uB85C \uD45C\uD604\uD558\uB294\uAC00?"],
    extraQuestions: [],
    examples: ["\uD574\uC9C0 \uC2DC '\uC18C\uC911\uD55C \uD61C\uD0DD\uC744 \uD3EC\uAE30\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?', '\uB2E4\uC2DC \uAC00\uC785\uD558\uBA74 \uC870\uAC74\uC774 \uBD88\uB9AC\uD574\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4' \uB4F1 \uC190\uC2E4 \uD504\uB808\uC774\uBC0D \uBB38\uAD6C \uC0AC\uC6A9"],
    improvements: ["\uC911\uB9BD\uC801\uC774\uACE0 \uC0AC\uC2E4 \uC911\uC2EC\uC758 \uBB38\uAD6C \uC0AC\uC6A9"],
    cases: [],
    exceptions: [],
    evidence: ["\uBB38\uAD6C\uAC00 \uB9D0\uD558\uB294 \uBD88\uC774\uC775\uC774 \uC0AC\uC2E4\uC778\uC9C0 \uD655\uC778"],
    notes: ['DF_17: \uC120\uD0DD\uB3D9\uC758 \uC7AC\uC624\uD37C \uC0AC\uB840\uC5D0\uC11C "(\uC0C1\uBC18\uAE30) \uC555\uBC15\uD615 - \uAC10\uC815\uC801 \uC5B8\uC5B4 \uD310\uB2E8 \uB418\uC5C8\uC73C\uB098 \uD574\uB2F9 \uC0AC\uD56D \uC5C6\uC74C"'],
    triggers: ["\uD3EC\uAE30", "\uB5A0\uB098", "\uC18C\uC911\uD55C", "\uBD88\uB9AC", "\uD6C4\uD68C"],
    searches: [
      { tool: "search_by_ocr_text", args: { text_query: "\uD3EC\uAE30" } },
      { tool: "search_by_ocr_text", args: { text_query: "\uB5A0\uB098\uC2DC" } }
    ],
    source: { frame: "DF_7, DF_17", nodeId: "93:4199" }
  },
  {
    id: "DP-P04",
    type: "\uC555\uBC15\uD615",
    name: "\uAC10\uAC01\uC870\uC791",
    framework: "Influence",
    keyQuestion: "\uBD88\uD544\uC694\uD55C \uAE34\uAE09\uC131\uC744 \uB9CC\uB4DC\uB294\uAC00?",
    definition: "\uC0AC\uC6A9\uC790\uC758 \uC8FC\uC758\uB97C \uD55C \uAC00\uC9C0\uC5D0 \uC9D1\uC911\uC2DC\uCF1C \uB2E4\uB978 \uAC83\uB4E4\uB85C\uBD80\uD130 \uC8FC\uC758\uB97C \uBD84\uC0B0\uC2DC\uD0A4\uB294 \uC2DC\uAC01\uC801 \uC870\uC791",
    questions: ["\uC0C9\uC0C1\xB7\uC6C0\uC9C1\uC784\xB7\uD06C\uAE30 \uB4F1\uC73C\uB85C \uD2B9\uC815 \uC120\uD0DD\uB9CC \uACFC\uB3C4\uD558\uAC8C \uC8FC\uBAA9\uC2DC\uD0A4\uB294\uAC00?", "\uC2DC\uAC01\uC801 \uAC15\uC870\uAC00 \uACE0\uAC1D\uC758 \uC219\uACE0\uBCF4\uB2E4 \uC989\uAC01\uC801\uC778 \uD589\uB3D9\uC744 \uC720\uB3C4\uD558\uB294\uAC00?"],
    extraQuestions: [{ q: "\uCE74\uC6B4\uD2B8\uB2E4\uC6B4\xB7\uB9C8\uAC10 \uD45C\uC2DC \uB4F1\uC73C\uB85C \uBD88\uD544\uC694\uD55C \uAE34\uAE09\uC131\uC744 \uB9CC\uB4DC\uB294\uAC00?", source: "DF_7 \uD575\uC2EC \uC9C8\uBB38, DF_3 \uC555\uBC15\uD615 \uC0AC\uB840(\uCE74\uC6B4\uD2B8\uB2E4\uC6B4 \uD0C0\uC774\uBA38, \uD55C\uC815 \uC218\uB7C9 \uD45C\uC2DC)" }],
    examples: ["\uD544\uC218 \uC57D\uAD00\uC5D0 \uB3D9\uC758\uD55C \uB4A4 \uC120\uD0DD \uC57D\uAD00 \uC601\uC5ED\uC744 \uBC18\uBCF5\uC801\uC73C\uB85C \uAE5C\uBE61\uC774\uAC8C \uD574 \uC120\uD0DD \uB3D9\uC758\uB97C \uC720\uB3C4\uD558\uB294 \uACBD\uC6B0"],
    improvements: ["\uBD88\uD544\uC694\uD55C \uAE34\uAE09\uC131\xB7\uC2DC\uAC01 \uC790\uADF9 \uC81C\uAC70"],
    cases: [],
    exceptions: [],
    evidence: ["\uC560\uB2C8\uBA54\uC774\uC158\xB7\uAE5C\uBE61\uC784\uC740 \uC815\uC9C0 \uD654\uBA74\uC73C\uB85C \uD655\uC778\uD560 \uC218 \uC5C6\uC5B4 \uC2E4\uC81C \uC571\uC5D0\uC11C \uD655\uC778 \uD544\uC694"],
    notes: ['DF_17: \uC120\uD0DD\uB3D9\uC758 \uC7AC\uC624\uD37C \uBC14\uD140\uC2DC\uD2B8\uB294 "(\uC0C1\uBC18\uAE30 \uBD84\uB958) \uC555\uBC15\uD615 - \uAC10\uAC01\uC870\uC791 \uC73C\uB85C \uD310\uB2E8 \uB418\uC5C8\uC73C\uB098 \uD574\uB2F9 \uC0AC\uD56D \uC5C6\uC74C"'],
    triggers: ["\uB9C8\uAC10", "\uB0A8\uC740 \uC2DC\uAC04", "\uD55C\uC815", "\uC624\uB298\uB9CC", "LIMITED"],
    searches: [
      { tool: "search_by_ocr_text", args: { text_query: "\uB9C8\uAC10" } },
      { tool: "search_by_ocr_text", args: { text_query: "\uB0A8\uC740 \uC2DC\uAC04" } }
    ],
    source: { frame: "DF_7, DF_3, DF_17", nodeId: "93:4199" }
  },
  {
    id: "DP-P05",
    type: "\uC555\uBC15\uD615",
    name: "\uB2E4\uB978 \uC18C\uBE44\uC790\uC758 \uD65C\uB3D9\uC54C\uB9BC",
    aliases: ["\uC870\uC791\uB41C \uB2E4\uB978 \uC18C\uBE44\uC790 \uD65C\uB3D9 (DF_4 \uD45C\uAE30)"],
    framework: "Influence",
    keyQuestion: "\uD0C0\uC778\uC758 \uD589\uB3D9\uC73C\uB85C \uC870\uAE09\uD568\uC744 \uC720\uB3C4\uD558\uB294\uAC00?",
    definition: "\uD574\uB2F9 \uAE08\uC735\uC0C1\uD488\uC744 \uBCF4\uAC70\uB098 \uAD6C\uB9E4\uD55C \uAE08\uC735\uC18C\uBE44\uC790\uC758 \uC218\uB97C \uD45C\uC2DC\uD558\uC5EC \uAC00\uC785\uC744 \uC720\uB3C4",
    questions: ["\uB2E4\uB978 \uACE0\uAC1D\uC758 \uD589\uB3D9 \uC815\uBCF4\uB97C \uC774\uC6A9\uD574 \uC870\uAE09\uD568\xB7\uB3D9\uC870 \uC2EC\uB9AC\uB97C \uC720\uBC1C\uD558\uB294\uAC00?", "\uD45C\uC2DC\uB41C \uD65C\uB3D9\xB7\uC218\uB7C9\xB7\uC2DC\uAC04 \uC815\uBCF4\uAC00 \uC0AC\uC2E4\uC5D0 \uADFC\uAC70\uD558\uACE0 \uAC80\uC99D \uAC00\uB2A5\uD55C\uAC00?"],
    extraQuestions: [],
    examples: ["\u201C\uD604\uC7AC 238\uBA85\uC774 \uC870\uD68C \uC911\u201D, \u201C\uC624\uB298 00\uBA85 \uC2E0\uCCAD\u201D \uB4F1\uC73C\uB85C \uAC00\uC785 \uC555\uBC15"],
    improvements: ["\uC815\uD655\uD55C \uC815\uBCF4\uB9CC \uC81C\uACF5, \uD5C8\uC704\xB7\uACFC\uC7A5\uB41C \uC815\uBCF4 \uAE08\uC9C0"],
    cases: [],
    exceptions: ["\uAC80\uC99D \uAC00\uB2A5\uD55C \uC2E4\uC81C \uD1B5\uACC4\uB97C \uADFC\uAC70\uC640 \uD568\uAED8 \uD45C\uC2DC"],
    evidence: ["\uC218\uCE58\uAC00 \uC2E4\uC2DC\uAC04 \uC2E4\uC81C \uB370\uC774\uD130\uC778\uC9C0, \uC9D1\uACC4\xB7\uAC31\uC2E0 \uBC29\uC2DD\uACFC \uADFC\uAC70 \uD655\uC778"],
    triggers: ["\uBA85\uC774", "\uBA85 \uC2E0\uCCAD", "\uC870\uD68C\uC911", "\uC870\uD68C \uC911", "\uC2E0\uCCAD \uC911", "\uAC00\uC785\uD568", "\uBC29\uAE08"],
    searches: [
      { tool: "search_by_ocr_text", args: { text_query: "\uBA85\uC774 \uC2E0\uCCAD" } },
      { tool: "search_by_ocr_text", args: { text_query: "\uBA85\uC774 \uAC00\uC785" } }
    ],
    source: { frame: "DF_7", nodeId: "93:4199" }
  },
  // ══ 편취유도형 (DF_8) ══
  {
    id: "DP-F01",
    type: "\uD3B8\uCDE8\uC720\uB3C4\uD615",
    name: "\uC21C\uCC28\uACF5\uAC1C \uAC00\uACA9\uCC45\uC815",
    framework: "Information",
    keyQuestion: "\uCD1D \uAC00\uACA9\uC744 \uCC98\uC74C\uBD80\uD130 \uBA85\uD655\uD788 \uC548\uB0B4\uD558\uB294\uAC00?",
    definition: "\uC18C\uBE44\uC790\uB97C \uC720\uC778\uD558\uAE30 \uC704\uD574 \uC77C\uBD80\uB7EC \uAC00\uACA9\uC744 \uB0AE\uAC8C \uD45C\uC2DC\uD558\uACE0, \uACC4\uC57D \uC808\uCC28\uAC00 \uC9C4\uD589\uB428\uC5D0 \uB530\uB77C \uC228\uACA8\uC9C4 \uBE44\uC6A9, \uAC00\uACA9\uB4E4\uC744 \uBCF4\uC5EC\uC8FC\uB294 \uD589\uC704",
    questions: ["\uCC98\uC74C \uC81C\uC2DC\uD55C \uAC00\uACA9\uC5D0 \uD544\uC218 \uBE44\uC6A9\uC774 \uBE60\uC838 \uC788\uB294\uAC00?", "\uACB0\uC81C \uB2E8\uACC4\uAC00 \uC9C4\uD589\uB420\uC218\uB85D \uCD94\uAC00 \uBE44\uC6A9\uC774 \uB4A4\uB2A6\uAC8C \uACF5\uAC1C\uB418\uB294\uAC00?"],
    extraQuestions: [],
    examples: ["\uC6D4 \uC774\uC6A9\uB8CC\uB9CC \uBA3C\uC800 \uC81C\uC2DC\uD558\uACE0, \uAD00\uB9AC\uC218\uC218\uB8CC\xB7\uCDE8\uAE09\uBE44 \uB4F1 \uD544\uC218 \uBE44\uC6A9\uC744 \uACB0\uC81C \uB2E8\uACC4\uC5D0\uC11C \uC21C\uCC28\uC801\uC73C\uB85C \uCD94\uAC00"],
    improvements: ["\uCD08\uAE30\uC5D0 \uC608\uC0C1 \uAC00\uB2A5\uD55C \uC774\uC728\xB7\uBE44\uC6A9 \uC801\uC6A9 \uC870\uAC74, \uBCC0\uACBD \uAC00\uB2A5\uC131 \uC548\uB0B4"],
    cases: [],
    exceptions: [],
    evidence: ["\uCCAB \uD654\uBA74 \uD45C\uC2DC \uAC00\uACA9\uACFC \uCD5C\uC885 \uACB0\uC81C \uAE08\uC561 \uBE44\uAD50"],
    triggers: ["\uB0A9\uC785", "\uCD1D", "\uCD94\uAC00", "\uC138\uAE08", "\uC218\uC218\uB8CC"],
    searches: [
      { tool: "search_by_ocr_text", args: { text_query: "\uC6D4 \uB0A9\uC785", pattern: "\uACAC\uC801" } },
      { tool: "search_ui_patterns", args: { query: "\uACAC\uC801" } }
    ],
    source: { frame: "DF_8", nodeId: "93:4376" }
  }
];
for (const r of RULES) {
  r.example = j(r.examples);
  r.improvement = j(r.improvements);
}
var CRITERIA_HIERARCHY = [
  "\uC0AC\uC5C5\uC790\uC5D0\uAC8C \uC720\uB9AC\uD558\uACE0 \uACE0\uAC1D\uC5D0\uAC8C \uCD94\uAC00 \uBD80\uB2F4\uC774\uB098 \uC601\uD5A5\uC744 \uC8FC\uB294\uAC00(\uBE44\uC6A9, \uC120\uD0DD \uB3D9\uC758, \uAC1C\uC778\uC815\uBCF4 \uC81C\uACF5 \uB4F1)",
  "\uD2B9\uC815 \uC120\uD0DD\uC744 \uACFC\uB3C4\uD558\uAC8C \uAC15\uC870\uD558\uAC70\uB098 \uBC18\uB300 \uC120\uD0DD\uC744 \uC57D\uD654\xB7\uC740\uD3D0\uD588\uB294\uAC00?"
];
var FALSE_POSITIVES = [
  {
    id: "FP-1",
    source: "DF_12",
    title: "\uD604\uC7AC \uACFC\uC5C5\uACFC Primary CTA\uAC00 \uC77C\uCE58",
    summary: '"\uCD5C\uACE0\uAC00\uB85C \uB0B4 \uCC28 \uD314\uAE30"\uB9CC \uAC15\uC870\uD574\uB3C4 \uD654\uBA74 \uBAA9\uC801\uACFC \uC77C\uCE58\uD558\uACE0 \uC0C8 \uBD80\uB2F4\uC774 \uC5C6\uC73C\uBA74 \uC798\uBABB\uB41C \uACC4\uCE35\uAD6C\uC870 \uC544\uB2D8',
    headline: "\uAD8C\uC7A5 \uD589\uB3D9\uC744 \uAC15\uC870\uB9CC\uC73C\uB85C \uB2E4\uD06C\uD328\uD134 \uD310\uB2E8\uD560 \uC218 \uC5C6\uC74C",
    subtitle: "Primary CTA\uC758 \uAC15\uC870 \uC5EC\uBD80\uAC00 \uC544\uB2C8\uB77C, \uD604\uC7AC \uACFC\uC5C5\uACFC\uC758 \uAD00\uACC4\uC640 \uACE0\uAC1D \uC120\uD0DD\uC5D0 \uBBF8\uCE58\uB294 \uC601\uD5A5\uC744 \uAE30\uC900\uC73C\uB85C \uD310\uB2E8\uD569\uB2C8\uB2E4.",
    caseName: "\uB0B4 \uCC28 \uD314\uAE30 (\uCD5C\uACE0\uAC00\uB85C \uB0B4 \uCC28 \uD314\uAE30 / \uC774\uC6A9 \uB3D9\uC758 \uD574\uC9C0\uD558\uAE30)",
    previous: {
      judgment: "\uC624\uB3C4\uD615 \xB7 \uC798\uBABB\uB41C \uACC4\uCE35\uAD6C\uC870 \u2014 \uCD5C\uACE0\uAC00\uB85C \uB0B4 \uCC28 \uD314\uAE30\uAC00 Primary CTA\uB85C \uAC15\uC870\uB418\uC5B4 \uD2B9\uC815 \uC120\uD0DD\uC744 \uC720\uB3C4\uD55C\uB2E4\uACE0 \uD310\uB2E8",
      basis: ["\uCD5C\uACE0\uAC00\uB85C \uB0B4 \uCC28 \uD314\uAE30\uB9CC Primary\uB85C \uAC15\uC870", "\uC120\uD0DD\uC9C0 \uAC04 \uAC15\uC870 \uC218\uC900\uC744 \uB3D9\uC77C\uD558\uAC8C \uC870\uC815"]
    },
    criteria: [...CRITERIA_HIERARCHY, "ex) \uBD80\uAC00\uC11C\uBE44\uC2A4 \uAC00\uC785 \uC720\uB3C4\uC2DC \uAC00\uC785\uC744 \uAC15\uC870, \uC120\uD0DD\uB3D9\uC758 \uC7AC \uC720\uB3C4\uC2DC \uB3D9\uC758 \uAC15\uC870"],
    checks: [
      { title: "\uD604\uC7AC \uACFC\uC5C5\uACFC Primary CTA\uAC00 \uC77C\uCE58", detail: "\uC0AC\uC6A9\uC790\uC758 \uBCF8\uB798 \uBAA9\uC801, \uC989 \u201C\uB0B4 \uCC28 \uD314\uAE30\u201D \uC11C\uBE44\uC2A4\uC758 \uC774\uD574 \uBC0F \uC2DC\uC791\uACFC CTA\uAC00 \uC77C\uCE58" },
      { title: "\uCD94\uAC00 \uBD80\uB2F4\uC774 \uBC1C\uC0DD\uD558\uC9C0 \uC54A\uC74C", detail: "CTA \uC120\uD0DD\uB9CC\uC73C\uB85C \uBCC4\uB3C4 \uC0C1\uD488 \uAC00\uC785\xB7\uCD94\uAC00 \uBE44\uC6A9\xB7\uC120\uD0DD\uB3D9\uC758\xB7\uAC1C\uC778\uC815\uBCF4 \uC81C\uACF5 \uB4F1 \uC0C8\uB85C\uC6B4 \uBD80\uB2F4\uC774 \uBC1C\uC0DD\uD558\uC9C0 \uC54A\uC74C" },
      { title: "\uB3D9\uC758 \uD574\uC9C0\uB294 \uACFC\uC5C5 \uBAA9\uC801\uACFC \uB2E4\uB984", detail: "\uB0B4 \uCC28 \uD314\uAE30 \uC774\uC6A9 \uACFC\uC5C5\uACFC \uBAA9\uC801\uC774 \uB2E4\uB978 \uB3D9\uC758 \uAD00\uB9AC \uAE30\uB2A5\uC73C\uB85C, \uB3D9\uC77C \uC704\uACC4\uC758 CTA\uB85C \uC81C\uACF5\uD560 \uD544\uC694 \uC5C6\uC74C \uAD00\uB9AC \uC601\uC5ED\uC5D0 \uBC30\uCE58" }
    ],
    conclusion: {
      result: "PASS \u2192 \uC798\uBABB\uB41C \uACC4\uCE35\uAD6C\uC870 \uC544\uB2D8",
      rationale: "\uD604\uC7AC \uD654\uBA74\uC758 \uBAA9\uC801\uACFC \uC8FC\uC694 CTA \uC561\uC158\uC774 \uB3D9\uC77C",
      detail: "\uCD5C\uACE0\uAC00\uB85C \uB0B4 \uCC28 \uD314\uAE30\uB294 \uD604\uC7AC \uD654\uBA74\uC758 \uBAA9\uC801\uACFC \uC77C\uCE58\uD558\uB294 \uD575\uC2EC \uD589\uB3D9\uC774\uBA70, \uC120\uD0DD \uC2DC \uC0C8\uB85C\uC6B4 \uBE44\uC6A9\xB7\uACC4\uC57D\xB7\uB3D9\uC758 \uB4F1\uC758 \uBD80\uB2F4\uC774 \uBC1C\uC0DD\uD558\uC9C0 \uC54A\uC74C. \uB530\uB77C\uC11C Primary CTA\uC758 \uC2DC\uAC01\uC801 \uAC15\uC870\uB9CC\uC73C\uB85C \uACE0\uAC1D \uC120\uD0DD\uC744 \uC65C\uACE1\uD588\uB2E4\uACE0 \uBCF4\uAE30 \uC5B4\uB824\uC6C0."
    },
    reflectedAt: "\uBC18\uC601\uC77C : \uC8FC\uD0DD, \uC2E0\uC6A9/\uC790\uB2F4"
  },
  {
    id: "FP-2",
    source: "DF_13",
    title: "\uD544\uC694\uD55C \uD589\uB3D9 \uAD8C\uC7A5 + \uBA85\uD655\uD55C \uB300\uC548",
    summary: '\uB300\uD45C \uC5F0\uB77D\uCC98 "\uBCC0\uACBD\uD558\uAE30" \uAC15\uC870, "\uB2E4\uC74C\uC5D0"\uB85C \uACC4\uC18D \uC9C4\uD589 \uAC00\uB2A5\uD558\uBA74 \uB2E4\uD06C\uD328\uD134 \uC544\uB2D8',
    headline: "\uAD8C\uC7A5 \uD589\uB3D9\uC744 \uAC15\uC870\uB9CC\uC73C\uB85C \uB2E4\uD06C\uD328\uD134 \uD310\uB2E8\uD560 \uC218 \uC5C6\uC74C",
    subtitle: "\uACE0\uAC1D\uC5D0\uAC8C \uD544\uC694\uD55C \uD589\uB3D9\uC744 \uAC15\uC870\uD558\uB294 \uAC83\uC740 \uC815\uC0C1\uC801\uC778 UX\uC774\uBA70, \uC120\uD0DD\uC744 \uC65C\uACE1\uD558\uAC70\uB098 \uAC70\uC808 \uD6C4 \uBC18\uBCF5\uC801\uC73C\uB85C \uC7AC\uC720\uB3C4\uD558\uB294 \uACBD\uC6B0\uC5D0 \uB2E4\uD06C\uD328\uD134\uC73C\uB85C \uD310\uB2E8\uD569\uB2C8\uB2E4.",
    caseName: "\uB300\uD45C \uC5F0\uB77D\uCC98 \uBCC0\uACBD (\uBCC0\uACBD\uD558\uAE30 / \uB2E4\uC74C\uC5D0)",
    previous: {
      judgment: "\uC624\uB3C4\uD615 \xB7 \uC798\uBABB\uB41C \uACC4\uCE35\uAD6C\uC870 \u2014 \uBCC0\uACBD\uD558\uAE30\uAC00 Primary CTA\uB85C \uAC15\uC870\uB418\uC5B4 \uACE0\uAC1D\uC5D0\uAC8C \uB300\uD45C \uC5F0\uB77D\uCC98 \uBCC0\uACBD\uC744 \uC720\uB3C4\uD55C\uB2E4\uACE0 \uD310\uB2E8",
      basis: ["\uBCC0\uACBD\uD558\uAE30\uB9CC Primary CTA\uB85C \uAC15\uC870", "\uB2E4\uC74C\uC5D0\uB294 \uC0C1\uB300\uC801\uC73C\uB85C \uB0AE\uC740 \uC704\uACC4", "\uBC84\uD2BC\uC758 \uC2DC\uAC01\uC801 \uCC28\uC774\uB97C \uC120\uD0DD \uC720\uB3C4\uB85C \uD574\uC11D"]
    },
    criteria: [
      "\uC0AC\uC5C5\uC790\uC5D0\uAC8C \uC720\uB9AC\uD558\uACE0 \uACE0\uAC1D\uC5D0\uAC8C \uCD94\uAC00 \uBD80\uB2F4\uC774\uB098 \uC601\uD5A5\uC744 \uC8FC\uB294\uAC00(\uCD94\uAC00 \uBE44\uC6A9, \uB9C8\uCF00\uD305\uC744 \uC704\uD55C \uC120\uD0DD \uB3D9\uC758, \uAC1C\uC778\uC815\uBCF4 \uC81C\uACF5 \uB4F1)",
      CRITERIA_HIERARCHY[1],
      "ex) \uBD80\uAC00\uC11C\uBE44\uC2A4 \uAC00\uC785 \uC720\uB3C4, \uC120\uD0DD \uB3D9\uC758 \uC7AC \uC720\uB3C4 \uC0C1\uD669"
    ],
    checks: [
      { title: "\uBCC0\uACBD\uC774 \uD544\uC694\uD55C \uC774\uC720\uAC00 \uBA85\uD655\uD568", detail: "\uB300\uD45C \uC5F0\uB77D\uCC98\uB294 \uAC70\uB798\xB7\uC548\uB0B4\uC5D0 \uD544\uC694\uD55C \uC815\uBCF4\uB85C, \uCD5C\uC2E0 \uC815\uBCF4 \uC720\uC9C0\uB97C \uC704\uD574 \uBCC0\uACBD\uC744 \uAD8C\uC7A5" },
      { title: "\uBCC0\uACBD\uD558\uC9C0 \uC54A\uC544\uB3C4 \uC9C4\uD589 \uAC00\uB2A5\uD568", detail: "\uB2E4\uC74C\uC5D0\uB97C \uD1B5\uD574 \uBCC0\uACBD\uD558\uC9C0 \uC54A\uACE0 \uD604\uC7AC \uD504\uB85C\uC138\uC2A4\uB97C \uACC4\uC18D \uC9C4\uD589\uD560 \uC218 \uC788\uC74C" },
      { title: "\uACE0\uAC1D\uC5D0\uAC8C \uCD94\uAC00 \uBD80\uB2F4, \uC601\uD5A5\uC744 \uC8FC\uB294 \uC694\uC18C\uAC00 \uC544\uB2D8", detail: "\uAC1C\uC778\uC815\uBCF4 \uC5C5\uB370\uC774\uD2B8\uC5D0 \uB300\uD55C \uB0B4\uC6A9\uC73C\uB85C \uC0AC\uC5C5\uC790\uC5D0\uAC8C \uC720\uB9AC\uD55C \uCD94\uAC00 \uBE44\uC6A9, \uB9C8\uCF00\uD305 \uAC1C\uC778\uC815\uBCF4 \uC81C\uACF5 \uB4F1\uC758 \uB0B4\uC6A9\uC774 \uC544\uB2D8" }
    ],
    conclusion: {
      result: "PASS \u2192 \uB2E4\uD06C\uD328\uD134\uC774\uB77C\uACE0 \uBCFC \uC218 \uC5C6\uC74C",
      rationale: "\uD544\uC694\uD55C \uD589\uB3D9\uC758 \uAD8C\uC7A5 + \uBA85\uD655\uD55C \uB300\uC548 \uC81C\uACF5",
      detail: "\uB300\uD45C \uC5F0\uB77D\uCC98 \uBCC0\uACBD\uC740 \uACE0\uAC1D \uC815\uBCF4\uC758 \uC815\uD655\uD55C \uAD00\uB9AC\uB97C \uC704\uD55C \uD569\uB9AC\uC801\uC778 \uAD8C\uC7A5 \uD589\uB3D9\uC774\uBA70, \uBCC0\uACBD\uD558\uC9C0 \uC54A\uACE0 \uC9C4\uD589\uD560 \uC218 \uC788\uB294 \uB300\uC548\uB3C4 \uBA85\uD655\uD558\uAC8C \uC81C\uACF5\uB428. \uD2B9\uC815 \uC120\uD0DD\uC73C\uB85C \uC778\uD55C \uCD94\uAC00 \uBD80\uB2F4\uC774\uB098 \uC120\uD0DD \uC65C\uACE1, \uAC70\uC808 \uD6C4 \uBC18\uBCF5\uC801\uC778 \uC7AC\uC720\uB3C4\uAC00 \uC5C6\uC5B4 \uB2E4\uD06C\uD328\uD134\uC73C\uB85C \uBCF4\uAE30 \uC5B4\uB824\uC6C0."
    },
    reflectedAt: "\uBC18\uC601\uC77C : \uC8FC\uD0DD, \uC2E0\uC6A9/\uC790\uB2F4 7.22"
  },
  {
    id: "FP-3",
    source: "DF_14",
    title: "\uACE0\uAC1D \uBCF4\uD638\uB97C \uC704\uD55C \uAD8C\uC7A5 \uD589\uB3D9",
    summary: '\uBCF4\uC774\uC2A4\uD53C\uC2F1 \uBB38\uC9C4\uC758 "\uB2F5\uBCC0 \uC218\uC815\uD558\uAE30" \uAC15\uC870\uB294 \uD53C\uD574 \uC608\uBC29 \uBAA9\uC801\uC774\uB77C \uC120\uD0DD \uC65C\uACE1 \uC544\uB2D8',
    headline: "\uACE0\uAC1D \uBCF4\uD638\uB97C \uC704\uD55C \uAD8C\uC7A5 \uD589\uB3D9\uC740 \uAC15\uC870\uB9CC\uC73C\uB85C \uB2E4\uD06C\uD328\uD134\uC774 \uC544\uB2D8",
    subtitle: "Primary Action\uC758 \uC2DC\uAC01\uC801 \uAC15\uC870 \uC790\uCCB4\uAC00 \uC544\uB2C8\uB77C, \uADF8 \uC704\uACC4\uB85C \uC778\uD574 \uACE0\uAC1D\uC774 \uC120\uD0DD\uC758 \uC758\uBBF8\uB97C \uC624\uC778\uD558\uAC70\uB098 \uB300\uC548 \uC120\uD0DD\uC774 \uC5B4\uB824\uC6CC\uC9C0\uB294\uC9C0\uB97C \uD310\uB2E8\uD569\uB2C8\uB2E4.",
    caseName: "\uBCF4\uC774\uC2A4\uD53C\uC2F1 \uBB38\uC9C4 (\uB2F5\uBCC0 \uC218\uC815\uD558\uAE30 / \uC2E0\uCCAD \uC911\uB2E8\uD558\uAE30)",
    previous: {
      judgment: "\uC624\uB3C4\uD615 \xB7 \uC798\uBABB\uB41C \uACC4\uCE35\uAD6C\uC870 \u2014 Primary CTA\uB85C \uAC15\uC870\uB418\uC5B4 \uACE0\uAC1D\uC758 \uD2B9\uC815 \uC120\uD0DD\uC744 \uC720\uB3C4\uD55C\uB2E4\uACE0 \uD310\uB2E8",
      basis: ["\uB2F5\uBCC0 \uC218\uC815\uD558\uAE30\uAC00 Primary CTA\uB85C \uAC15\uC870", "\uC2E0\uCCAD \uC911\uB2E8\uD558\uAE30\uBCF4\uB2E4 \uB192\uC740 \uC2DC\uAC01\uC801 \uC704\uACC4", "\uBC84\uD2BC \uC704\uACC4 \uCC28\uC774\uB97C \uD2B9\uC815 \uC120\uD0DD \uC720\uB3C4\uB85C \uD310\uB2E8"]
    },
    criteria: [...CRITERIA_HIERARCHY, "ex) (\uCD94\uAC00 \uBE44\uC6A9, \uB9C8\uCF00\uD305\uC744 \uC704\uD55C \uC120\uD0DD \uB3D9\uC758, \uAC1C\uC778\uC815\uBCF4 \uC81C\uACF5 \uB4F1)"],
    checks: [
      { title: "\uD654\uBA74\uC758 \uBAA9\uC801\uC774 \uACE0\uAC1D \uBCF4\uD638\uC784", detail: "\uBCF4\uC774\uC2A4\uD53C\uC2F1 \uC704\uD5D8 \uB2F5\uBCC0\uC744 \uB2E4\uC2DC \uD655\uC778\uD558\uACE0, \uD544\uC694\uD55C \uACBD\uC6B0 \uC2E0\uCCAD\uC744 \uC911\uB2E8\uD558\uB3C4\uB85D \uC548\uB0B4\uD558\uB294 \uD53C\uD574 \uC608\uBC29 \uC808\uCC28" },
      { title: "\uC0C8\uB85C\uC6B4 \uC120\uD0DD\uC774\uB098 \uCD94\uAC00 \uBD80\uB2F4\uC744 \uC694\uAD6C\uD558\uC9C0 \uC54A\uC74C", detail: "\uC0C1\uD488\xB7\uBD80\uAC00\uC11C\uBE44\uC2A4 \uAC00\uC785, \uB9C8\uCF00\uD305 \uB3D9\uC758, \uAC1C\uC778\uC815\uBCF4 \uCD94\uAC00 \uC81C\uACF5 \uB4F1 \uC0AC\uC5C5\uC790\uC5D0\uAC8C \uC720\uB9AC\uD55C \uCD94\uAC00 \uD589\uB3D9\uC744 \uC694\uAD6C\uD558\uC9C0 \uC54A\uC74C" },
      { title: "\uAC15\uC870\uB41C \uD589\uB3D9\uC5D0 \uD569\uB9AC\uC801\uC778 \uC774\uC720\uAC00 \uC788\uC74C", detail: "\uB2F5\uBCC0 \uC218\uC815\uD558\uAE30\uB294 \uC798\uBABB \uC785\uB825\uD55C \uB2F5\uBCC0\uC744 \uBC14\uB85C\uC7A1\uC544 \uBCF4\uC774\uC2A4\uD53C\uC2F1 \uC704\uD5D8\uC744 \uC7AC\uD655\uC778\uD558\uAE30 \uC704\uD55C \uAD8C\uC7A5 \uD589\uB3D9" }
    ],
    conclusion: {
      result: "PASS \u2192 \uB2E4\uD06C\uD328\uD134\uC774\uB77C\uACE0 \uBCFC \uC218 \uC5C6\uC74C",
      rationale: "\uACE0\uAC1D \uBCF4\uD638\uB97C \uC704\uD55C \uD569\uB9AC\uC801 \uAD8C\uC7A5 \u2260 \uC120\uD0DD \uC65C\uACE1",
      detail: "\uD2B9\uC815 \uC0C1\uD488\uC774\uB098 \uCD94\uAC00 \uC120\uD0DD\uC744 \uC720\uB3C4\uD558\uB294 \uAC83\uC774 \uC544\uB2C8\uB77C, \uBCF4\uC774\uC2A4\uD53C\uC2F1 \uD53C\uD574\uB97C \uC608\uBC29\uD558\uACE0 \uD604\uC7AC \uB300\uCD9C \uC2E0\uCCAD\uC744 \uC548\uC804\uD558\uAC8C \uC218\uD589\uD558\uAE30 \uC704\uD55C \uC7AC\uC548\uB0B4\uC784. \uAD8C\uC7A5 \uD589\uB3D9\uC758 \uAC15\uC870\uC5D0 \uD569\uB9AC\uC801\uC778 \uBAA9\uC801\uC774 \uC788\uACE0 \uB300\uC548\uB3C4 \uBA85\uD655\uD558\uBBC0\uB85C \uC120\uD0DD \uC65C\uACE1\uC73C\uB85C \uBCF4\uAE30 \uC5B4\uB824\uC6C0."
    },
    reflectedAt: "\uBC18\uC601\uC77C : \uC8FC\uD0DD, \uC2E0\uC6A9/\uC790\uB2F4 7.22"
  },
  {
    id: "FP-4",
    source: "DF_15",
    title: "\uC815\uBCF4 \uBA85\uD655\uC131 \uBB38\uC81C\uB294 \uB2E4\uD06C\uD328\uD134\uC774 \uC544\uB2D8",
    summary: "\uC774\uC6A9 \uBD88\uAC00 \uC0AC\uC720\uAC00 \uBD88\uBA85\uD655\uD55C \uC548\uB0B4\uB294 \uC815\uBCF4 \uBA85\uD655\uC131 \uAC1C\uC120 \uB300\uC0C1\uC774\uC9C0 \uB2E4\uD06C\uD328\uD134 \uAC1C\uC120 \uB300\uC0C1\uC774 \uC544\uB2D8",
    headline: "\uC815\uBCF4 \uC548\uB0B4 \uBB38\uAD6C\uC758 \uBA85\uD655\uC131 \uBB38\uC81C\uB294 \uB2E4\uD06C\uD328\uD134\uC774 \uC544\uB2D8",
    subtitle: "\uACE0\uAC1D\uC758 \uC120\uD0DD\uC744 \uC720\uB3C4\xB7\uC65C\uACE1\uD558\uB294 \uAD6C\uC870\uC778\uC9C0, \uB2E8\uC21C\uD788 \uACB0\uACFC \uC815\uBCF4\uB97C \uBD88\uBA85\uD655\uD558\uAC8C \uC548\uB0B4\uD55C \uBB38\uC81C\uC778\uC9C0 \uAD6C\uBD84\uD558\uC5EC \uD310\uB2E8\uD569\uB2C8\uB2E4.",
    caseName: "\uC801\uD569\uC131 \uC815\uBCF4 \uD655\uC778 \u2014 \uC774\uC6A9 \uBD88\uAC00 \uC548\uB0B4 \uBB38\uAD6C",
    previous: {
      judgment: "\uC624\uB3C4\uD615 \xB7 \uC798\uBABB\uB41C \uACC4\uCE35\uAD6C\uC870 \u2014 \uC0AC\uC5C5\uC790\uC5D0\uAC8C \uC720\uB9AC\uD55C \uC81C\uC548 \uC720\uB3C4\uB85C \uC9C0\uBB38 \uBB38\uAD6C \uC218\uC815 \uBC0F \uD31D\uC5C5\uC758 \uC548\uB0B4 \uBB38\uAD6C \uC218\uC815",
      basis: ["\uC774\uC6A9 \uBD88\uAC00 \uC0AC\uC720\uAC00 \uBD88\uBA85\uD655\uD568"]
    },
    criteria: [
      "\uC2DC\uAC01\uC801 \uC704\uACC4\uB85C \uC778\uD574 \uACE0\uAC1D\uC774 \uC120\uD0DD\uC758 \uC758\uBBF8\uB97C \uC624\uC778\uD558\uAC70\uB098, \uC0AC\uC5C5\uC790\uC5D0\uAC8C \uC720\uB9AC\uD55C \uC120\uD0DD\uC744 \uD544\uC218\xB7\uAD8C\uC7A5 \uD589\uB3D9\uC73C\uB85C \uC798\uBABB \uC778\uC2DD\uD558\uAC8C \uD558\uB294\uAC00?",
      "ex) \uBD80\uAC00\uC11C\uBE44\uC2A4 \uAC00\uC785 \uC720\uB3C4\uC2DC \uAC00\uC785\uC744 \uAC15\uC870, \uC120\uD0DD\uB3D9\uC758 \uC7AC \uC720\uB3C4\uC2DC \uB3D9\uC758 \uAC15\uC870"
    ],
    checks: [
      { title: "\uACE0\uAC1D\uC758 \uC120\uD0DD\uC744 \uC720\uB3C4\uD558\uB294 \uD654\uBA74\uC774 \uC544\uB2D8", detail: "\uACE0\uAC1D\uC774 \uC5EC\uB7EC \uB300\uC548 \uC911 \uD558\uB098\uB97C \uC120\uD0DD\uD558\uB294 \uD654\uBA74\uC774 \uC544\uB2C8\uB77C \uC2EC\uC0AC \uACB0\uACFC\uB97C \uC548\uB0B4\uD558\uB294 \uD654\uBA74" },
      { title: "\uCD94\uAC00 \uBD80\uB2F4\uC774 \uBC1C\uC0DD\uD558\uC9C0 \uC54A\uC74C", detail: "\uBE44\uC6A9\xB7\uACC4\uC57D\xB7\uC120\uD0DD\uB3D9\uC758\xB7\uAC1C\uC778\uC815\uBCF4 \uC81C\uACF5 \uB4F1 \uC0AC\uC5C5\uC790\uC5D0\uAC8C \uC720\uB9AC\uD55C \uCD94\uAC00 \uD589\uB3D9\uC744 \uC694\uAD6C\uD558\uC9C0 \uC54A\uC74C" },
      { title: "\uBB38\uC81C\uB294 \u2018\uC120\uD0DD \uC65C\uACE1\u2019\uC774 \uC544\uB2C8\uB77C \u2018\uC815\uBCF4 \uBA85\uD655\uC131\u2019", detail: "\uAE30\uC874 \uBB38\uAD6C\uB9CC\uC73C\uB85C\uB294 \uC774\uC6A9 \uBD88\uAC00 \uC0AC\uC720\uB97C \uC774\uD574\uD558\uAE30 \uC5B4\uB824\uC6CC \uAD6C\uCCB4\uC801\uC778 \uACB0\uACFC \uC548\uB0B4\uAC00 \uD544\uC694\uD55C \uC815\uBCF4 \uBA85\uD655\uC131 \uBB38\uC81C" }
    ],
    conclusion: {
      result: "PASS \u2192 \uC798\uBABB\uB41C \uACC4\uCE35\uAD6C\uC870 \uC544\uB2D8",
      rationale: "\uB2E4\uD06C\uD328\uD134 \uAC1C\uC120\uC774 \uC544\uB2CC \uC815\uBCF4 \uBA85\uD655\uC131 \uAC1C\uC120",
      detail: "\uAE30\uC874 \uBB38\uAD6C\uB294 \uC774\uC6A9 \uBD88\uAC00 \uC6D0\uC778\uC744 \uBA85\uD655\uD788 \uC124\uBA85\uD558\uC9C0 \uC54A\uC544 \uAC1C\uC120 \uD544\uC694\uC131\uC774 \uC788\uC5C8\uC73C\uB098, \uACE0\uAC1D\uC758 \uC120\uD0DD\uC744 \uC65C\uACE1\uD558\uAC70\uB098 \uC0AC\uC5C5\uC790\uC5D0\uAC8C \uC720\uB9AC\uD55C \uD589\uB3D9\uC744 \uC720\uB3C4\uD558\uB294 \uAD6C\uC870\uB294 \uC544\uB2D8. \uB530\uB77C\uC11C \uB2E4\uD06C\uD328\uD134 \uAC1C\uC120\uC774 \uC544\uB2CC \uC815\uBCF4 \uBA85\uD655\uC131 \uAC1C\uC120\uC73C\uB85C \uBD84\uB958\uD558\uB294 \uAC83\uC774 \uC801\uC808\uD568."
    },
    reflectedAt: "\uBC18\uC601 : \uC2E0\uC6A9/\uC790\uB2F4"
  },
  {
    id: "FP-5",
    source: "DF_16",
    title: "\uC9C4\uD589 \uC911 \uACFC\uC5C5\uC758 Primary Action",
    summary: '"\uACC4\uC18D \uC2E0\uCCAD\uD558\uAE30" \uAC15\uC870\uC640 "\uADF8\uB9CC\uD558\uAE30" \uACB0\uACFC(\uC815\uBCF4 \uBBF8\uC800\uC7A5) \uC0AC\uC804 \uC548\uB0B4\uAC00 \uC788\uC73C\uBA74 \uC815\uC0C1 \uC704\uACC4',
    headline: "Primary CTA \uAC15\uC870\uB9CC\uC73C\uB85C\uB294 \u2018\uC798\uBABB\uB41C \uACC4\uCE35\uAD6C\uC870\u2019\uAC00 \uC544\uB2D8",
    subtitle: "\uBC84\uD2BC\uC758 \uC2DC\uAC01\uC801 \uC704\uACC4\uAC00 \uC544\uB2C8\uB77C, \uADF8 \uAC15\uC870\uAC00 \uACE0\uAC1D\uC758 \uC120\uD0DD\uC744 \uC65C\uACE1\uD558\uAC70\uB098 \uBC18\uB300 \uC120\uD0DD\uC744 \uC5B4\uB835\uAC8C \uB9CC\uB4DC\uB294\uC9C0\uB97C \uD310\uB2E8\uD569\uB2C8\uB2E4.",
    caseName: "\uB300\uCD9C \uC2E0\uCCAD \uC911\uB2E8 \uD31D\uC5C5 (\uACC4\uC18D \uC2E0\uCCAD\uD558\uAE30 / \uADF8\uB9CC\uD558\uAE30)",
    previous: {
      judgment: "\uC624\uB3C4\uD615 \xB7 \uC798\uBABB\uB41C \uACC4\uCE35\uAD6C\uC870 \u2014 \uACC4\uC18D \uC2E0\uCCAD\uD558\uAE30\uAC00 Primary CTA\uB85C \uAC15\uC870\uB418\uC5B4 \uACE0\uAC1D\uC5D0\uAC8C \uB300\uCD9C \uC2E0\uCCAD \uACC4\uC18D\uC744 \uC720\uB3C4\uD55C\uB2E4\uACE0 \uD310\uB2E8",
      basis: ["\u2018\uACC4\uC18D \uC2E0\uCCAD\uD558\uAE30\u2019\uB9CC \uC2DC\uAC01\uC801 \uAC15\uC870", "\u2018\uADF8\uB9CC\uD558\uAE30'\uB294 \uC57D\uD558\uAC8C \uD45C\uD604", "\uBC84\uD2BC \uAC04 \uC704\uACC4 \uCC28\uC774\uB97C \uC120\uD0DD \uC720\uB3C4\uB85C \uD574\uC11D"]
    },
    criteria: ["\uAC15\uC870\uB41C \uC120\uD0DD\uC774 \uACE0\uAC1D\uC5D0\uAC8C \uCD94\uAC00 \uBD80\uB2F4\uC744 \uC8FC\uACE0, \uBC18\uB300 \uC120\uD0DD\uC744 \uC5B4\uB835\uAC8C \uB9CC\uB4E4\uC5B4 \uC120\uD0DD\uC744 \uC65C\uACE1\uD558\uB294\uAC00?", "ex) \uCD94\uAC00 \uBE44\uC6A9\uC774 \uB4DC\uB294 \uBD80\uAC00\uC11C\uBE44\uC2A4 \uAC00\uC785 \uC720\uB3C4, \uC120\uD0DD\uB3D9\uC758 \uC7AC \uC720\uB3C4\uC2DC \uB3D9\uC758\uB9CC \uAC15\uC870"],
    checks: [
      { title: "\uC120\uD0DD \uACB0\uACFC\uAC00 \uBA85\uD655\uD568", detail: "\uADF8\uB9CC\uD558\uAE30 \uC120\uD0DD \uC2DC \uC785\uB825 \uC815\uBCF4\uAC00 \uC800\uC7A5\uB418\uC9C0 \uC54A\uC74C\uC744 \uC0AC\uC804\uC5D0 \uC548\uB0B4" },
      { title: "\uC798\uBABB\uB41C \uACC4\uCE35\uAD6C\uC870 \uBC94\uC704\uAC00 \uC544\uB2D8", detail: "\uACE0\uAC1D\uC5D0\uAC8C \uCD94\uAC00 \uBD80\uB2F4\uC744 \uC8FC\uACE0 \uBC18\uB300 \uC120\uD0DD\uC744 \uC5B4\uB835\uAC8C \uB9CC\uB4E4\uACE0 \uC788\uC9C0 \uC54A\uC74C" },
      { title: "\uC120\uD0DD\uC744 \uC65C\uACE1\uD558\uB294 \uC694\uC18C\uAC00 \uC5C6\uC74C", detail: "\uCD94\uAC00 \uBE44\uC6A9\xB7\uB3D9\uC758\xB7\uC0C1\uD488 \uAC00\uC785\uC744 \uC720\uB3C4\uD558\uC9C0 \uC54A\uC73C\uBA70, \uADF8\uB9CC\uD558\uAE30\uB97C \uC228\uAE30\uAC70\uB098 \uC120\uD0DD\uD558\uAE30 \uC5B4\uB835\uAC8C \uB9CC\uB4E4\uC9C0 \uC54A\uC74C" }
    ],
    conclusion: {
      result: "PASS \u2192 \uC798\uBABB\uB41C \uACC4\uCE35\uAD6C\uC870 \uC544\uB2D8",
      rationale: "",
      detail: "\uACC4\uC18D \uC2E0\uCCAD\uD558\uAE30\uB294 \uD604\uC7AC \uC9C4\uD589 \uC911\uC778 \uB300\uCD9C \uC2E0\uCCAD\uC758 Primary Action\uC744 \uAC15\uC870\uD55C \uC815\uC0C1\uC801\uC778 \uC815\uBCF4 \uC704\uACC4\uC784. \uC785\uB825\uD558\uB294 \uC815\uBCF4\uAC00 \uC720\uC2E4\uB420 \uB54C, \uD31D\uC5C5\uC774 \uB178\uCD9C\uB418\uBBC0\uB85C \uC870\uAC74\uC774 \uBA85\uD655\uD568"
    },
    reflectedAt: "\uBC18\uC601\uC77C : \uC8FC\uD0DD, \uC2E0\uC6A9/\uC790\uB2F4 7.22"
  }
];
var FIRST_OR_REPEAT = {
  frame: "DF_20",
  headline: "\uC624\uB3C4\uD615\xB7\uBC18\uBCF5\uAC04\uC12D \uD310\uB2E8 \uAE30\uC900 : \uCD5C\uCD08 \uC81C\uC548\uACFC \uC7AC \uC81C\uC548 \uC5EC\uBD80\uB85C \uD310\uB2E8",
  summary: "\uAD8C\uC720\uC758 \uC0C1\uD669\uC774 \uCD5C\uCD08 \uC120\uD0DD \uC0C1\uD669\uC774\uB77C\uBA74 \uC624\uB3C4\uD615\uC73C\uB85C \uAC80\uD1A0, \uC7AC \uC81C\uC548 \uC0C1\uD669\uC5D0 \uAC70\uC808\uC744 \uD55C \uC0C1\uD0DC\uB77C\uBA74 \uBC18\uBCF5\uAC04\uC12D\uC73C\uB85C \uAC80\uD1A0\uB97C \uC9C4\uD589\uD569\uB2C8\uB2E4.",
  notDarkPattern: "\uBE44\uC6A9\xB7\uAC00\uC785\xB7\uC120\uD0DD\uB3D9\uC758\xB7\uAC1C\uC778\uC815\uBCF4 \uC81C\uACF5\xB7\uCD94\uAC00 \uACC4\uC57D \uB4F1 \uACE0\uAC1D\uC758 \uAD8C\uB9AC\xB7\uC758\uBB34 \uB610\uB294 \uBD80\uB2F4\uC5D0 \uC601\uD5A5\uC744 \uC8FC\uB294 \uC120\uD0DD \u2014 \uB2E4\uD06C\uD328\uD134\uC73C\uB85C \uBCF4\uC9C0 \uC54A\uB294 \uC8FC\uC694 \uC0C1\uD669 \uAE30\uC900",
  first: { label: "\uCD5C\uCD08 \uC81C\uC548", questions: ["\uD2B9\uC815 \uC120\uD0DD\uC744 \uACFC\uB3C4\uD558\uAC8C \uAC15\uC870\uD558\uAC70\uB098 \uBC18\uB300 \uC120\uD0DD\uC744 \uC57D\uD654\xB7\uC740\uD3D0\uD588\uB294\uAC00?"], exceptionsTitle: "\uC798\uBABB\uB41C \uACC4\uCE35\uAD6C\uC870 \uC608\uC678", exceptions: HIERARCHY_EXCEPTIONS.slice(0, 4) },
  repeat: {
    label: "\uC7AC \uC81C\uC548",
    questions: ["\uACE0\uAC1D\uC774 \uD574\uB2F9 \uC120\uD0DD\uC5D0 \uC774\uBBF8 \uC758\uC0AC\uB97C \uD45C\uD604\uD588\uB294\uAC00?", "\uACE0\uAC1D\uC774 \uAC70\uC808\uD55C \uB3D9\uC77C\xB7\uC720\uC0AC\uD55C \uC120\uD0DD\uC744 \uB2E4\uC2DC \uBCC0\uACBD\uD558\uB3C4\uB85D \uC694\uAD6C\uD558\uB294\uAC00?"],
    exceptionsTitle: "\uBC18\uBCF5\uAC04\uC12D \uC608\uC678",
    exceptions: REPEAT_EXCEPTIONS.slice(0, 5)
  }
};
var ruleById = /* @__PURE__ */ __name((id) => RULES.find((r) => r.id === id), "ruleById");

// ../src/lib/searchQuery.js
var FILLER = /(화면|검색|찾아줘|찾아|보여줘|관련|UI|ui|플로우|페이지)/g;
var squash = /* @__PURE__ */ __name((s) => String(s ?? "").replace(/\s+/g, "").toLowerCase(), "squash");
var ACTION_WORDS = [
  "\uB0A9\uC785\uAE08",
  "\uC785\uB825",
  "\uB4F1\uB85D",
  "\uC870\uD68C",
  "\uC2E0\uCCAD",
  "\uC778\uC99D",
  "\uC644\uB8CC",
  "\uBCC0\uACBD",
  "\uC124\uC815",
  "\uD655\uC778",
  "\uC120\uD0DD",
  "\uAC80\uC0C9",
  "\uACB0\uC81C",
  "\uD574\uC9C0",
  "\uAC00\uC785",
  "\uB0A9\uC785",
  "\uC218\uC815",
  "\uC0AD\uC81C",
  "\uCD94\uAC00",
  "\uC5F0\uACB0",
  "\uB3D9\uC758",
  "\uBC1C\uAE09",
  "\uBE44\uAD50",
  "\uACC4\uC0B0",
  "\uACAC\uC801",
  "\uC608\uC57D",
  "\uCDE8\uC18C",
  "\uC548\uB0B4",
  "\uC54C\uB9BC",
  "\uB0B4\uC5ED",
  "\uAD00\uB9AC",
  "\uC2E4\uD328",
  "\uC624\uB958"
];
function splitCompound(word) {
  if (word.length < 4 || /\s/.test(word)) return null;
  const suffix = ACTION_WORDS.find((w) => word.endsWith(w) && word.length - w.length >= 2);
  return suffix ? `${word.slice(0, -suffix.length)} ${suffix}` : null;
}
__name(splitCompound, "splitCompound");
var CRYPTO_INVEST = ["\uCF54\uC778", "\uB80C\uB529", "\uAC00\uC0C1\uC790\uC0B0", "\uCF54\uBE57", "\uC5C5\uBE44\uD2B8", "\uBE57\uC378", "\uCF54\uC778\uC6D0", "Bybit", "\uBC14\uC774\uB0B8\uC2A4", "\uBAA8\uC758\uD22C\uC790", "\uC8FC\uC2DD", "\uC99D\uAD8C", "\uBD80\uB3D9\uC0B0"];
var DICTIONARY = [
  {
    match: ["\uB300\uCD9C", "\uD55C\uB3C4"],
    core: "\uB300\uCD9C \uD55C\uB3C4",
    uibowl: "\uB300\uCD9C",
    ocr: { text: "\uD55C\uB3C4", pattern: "\uB300\uCD9C" },
    exact: ["\uD55C\uB3C4", "\uB300\uCD9C \uAC00\uB2A5", "\uAC00\uB2A5 \uAE08\uC561"],
    journey: ["\uB300\uCD9C", "\uAE08\uB9AC", "\uC2E0\uCCAD", "\uBE44\uAD50", "\uC2EC\uC0AC", "\uC870\uD68C"],
    exclude: CRYPTO_INVEST,
    related: ["\uB300\uCD9C \uAC00\uB2A5 \uAE08\uC561", "\uC608\uC0C1 \uD55C\uB3C4", "\uD55C\uB3C4 \uC870\uD68C \uACB0\uACFC", "\uB300\uCD9C \uBE44\uAD50", "\uB300\uCD9C \uAE08\uB9AC", "\uB300\uCD9C \uC2EC\uC0AC"]
  },
  {
    match: ["\uC2DC\uC138"],
    core: "\uC790\uB3D9\uCC28 \uC2DC\uC138",
    uibowl: "\uC2DC\uC138",
    ocr: { text: "\uC2DC\uC138" },
    exact: ["\uC2DC\uC138", "\uB0B4 \uCC28 \uD314\uAE30", "\uB9E4\uC785"],
    journey: ["\uCC28\uB7C9", "\uC911\uACE0\uCC28", "\uACAC\uC801"],
    exclude: CRYPTO_INVEST,
    related: ["\uB0B4 \uCC28 \uC2DC\uC138", "\uC911\uACE0\uCC28 \uC2DC\uC138", "\uCC28\uB7C9 \uAC00\uCE58", "\uB9E4\uC785 \uACAC\uC801"]
  },
  {
    match: ["\uCC28\uB7C9", "\uB0B4 \uCC28", "\uB0B4\uCC28"],
    core: "\uCC28\uB7C9 \uB4F1\uB85D",
    uibowl: "\uCC28\uB7C9",
    ocr: { text: "\uCC28\uB7C9\uBC88\uD638" },
    exact: ["\uCC28\uB7C9\uBC88\uD638", "\uCC28\uB7C9 \uBC88\uD638", "\uCC28\uB7C9 \uB4F1\uB85D", "\uB0B4 \uCC28 \uB4F1\uB85D", "\uCC28\uB7C9\uB4F1\uB85D"],
    journey: ["\uCC28\uB7C9", "\uB0B4 \uCC28", "\uC778\uC99D"],
    exclude: [],
    related: ["\uB0B4 \uCC28 \uB4F1\uB85D", "\uCC28\uB7C9\uBC88\uD638", "\uCC28\uB7C9 \uC815\uBCF4", "\uCC28\uB7C9 \uAD00\uB9AC"]
  },
  {
    match: ["\uB0A9\uC785", "\uD560\uBD80", "\uB9AC\uC2A4", "\uB80C\uD2B8", "\uAD6C\uB3C5"],
    core: "\uC6D4 \uB0A9\uC785\uAE08",
    uibowl: "\uD560\uBD80",
    ocr: { text: "\uC6D4 \uB0A9\uC785" },
    exact: ["\uB0A9\uC785", "\uD560\uBD80", "\uB9AC\uC2A4", "\uB80C\uD2B8", "\uC6D4\uB0A9\uC785", "\uC6D4\uC694\uAE08", "\uC6D4\uC774\uC6A9\uB8CC"],
    journey: ["\uACAC\uC801", "\uAD6C\uB3C5", "\uC694\uAE08", "\uCC28\uB7C9"],
    exclude: CRYPTO_INVEST,
    related: ["\uD560\uBD80", "\uB9AC\uC2A4", "\uB80C\uD2B8", "\uACAC\uC801", "\uC6D4 \uB0A9\uC785", "\uAD6C\uB3C5"]
  },
  {
    match: ["\uC778\uC99D"],
    core: "\uBCF8\uC778\uC778\uC99D",
    uibowl: "\uC778\uC99D",
    ocr: { text: "\uBCF8\uC778\uC778\uC99D" },
    exact: ["\uBCF8\uC778\uC778\uC99D", "\uBCF8\uC778 \uC778\uC99D", "\uC778\uC99D\uC11C", "\uD734\uB300\uD3F0 \uC778\uC99D", "\uC2E0\uBD84\uC99D"],
    journey: ["\uC778\uC99D", "\uB85C\uADF8\uC778", "\uAC00\uC785"],
    exclude: [],
    related: ["\uD734\uB300\uD3F0 \uC778\uC99D", "\uC778\uC99D\uC11C", "\uC2E0\uBD84\uC99D \uCD2C\uC601", "\uAC04\uD3B8\uC778\uC99D"]
  },
  {
    match: ["\uC0C1\uD658", "\uC5F0\uCCB4", "\uB0A9\uBD80"],
    core: "\uC0C1\uD658",
    uibowl: "\uC0C1\uD658",
    ocr: { text: "\uC0C1\uD658" },
    exact: ["\uC0C1\uD658", "\uB0A9\uBD80", "\uC5F0\uCCB4"],
    journey: ["\uB300\uCD9C", "\uB0B4\uC5ED"],
    exclude: CRYPTO_INVEST,
    related: ["\uC911\uB3C4\uC0C1\uD658", "\uC0C1\uD658 \uC77C\uC815", "\uB0A9\uBD80", "\uC5F0\uCCB4"]
  },
  {
    match: ["empty", "\uBE48 \uD654\uBA74", "\uC5E0\uD2F0"],
    core: "\uBE48 \uD654\uBA74",
    component: "\uBE48 \uD654\uBA74",
    exact: [],
    journey: [],
    exclude: [],
    related: ["Empty", "\uB0B4\uC5ED \uC5C6\uC74C", "\uB370\uC774\uD130 \uC5C6\uC74C"]
  }
];
function interpretQuery(raw) {
  const text = raw.trim();
  if (!text) return null;
  const sq = squash(text);
  const entry = DICTIONARY.find((d) => d.match.some((m) => sq.includes(squash(m))));
  const cleaned = text.replace(FILLER, " ").replace(/\s+/g, " ").trim();
  const words = cleaned.split(" ").filter(Boolean);
  const first = words[0];
  const joined = words.join("");
  const split = words.length === 1 ? splitCompound(words[0]) : null;
  const phrases = [...new Set([cleaned, joined, split].filter(Boolean))];
  const head = words.length > 1 ? words[0] : split ? split.split(" ")[0] : null;
  const core = entry ? entry.core : cleaned || text;
  const related = entry ? entry.related : [];
  const terms = [...new Set([core, ...related, ...phrases].filter(Boolean))];
  return {
    raw: text,
    core,
    related,
    terms,
    uibowl: entry?.uibowl || phrases[0] || text,
    phrases,
    head: head && head.length >= 2 ? head : null,
    component: entry?.component ?? null,
    ocr: entry?.ocr ?? null,
    exact: entry?.exact ?? (phrases.length ? phrases : first ? [first] : []),
    journey: entry?.journey ?? (head && head.length >= 2 ? [head] : []),
    exclude: entry?.exclude ?? []
  };
}
__name(interpretQuery, "interpretQuery");

// ../server/searchCore.js
var AUTO_APPS = ["\uB9C8\uC774\uD604\uB300", "Kia", "\uD5E4\uC774\uB51C\uB7EC", "\uCC28\uBD07"];
var SEARCH_SCOPES = {
  \uC804\uCCB4: [{}],
  \uAE08\uC735: [{ category: "\uAE08\uC735" }],
  \uBAA8\uBE4C\uB9AC\uD2F0: [{ category: "\uBAA8\uBE4C\uB9AC\uD2F0" }],
  \uC790\uB3D9\uCC28: AUTO_APPS.map((app_name) => ({ app_name }))
};
var PAGES_BY_DOMAIN = { \uC804\uCCB4: 3, \uAE08\uC735: 3, \uBAA8\uBE4C\uB9AC\uD2F0: 3, \uC790\uB3D9\uCC28: 1 };
var OCR_PAGES = 3;
function interleaveByService(screens) {
  const groups = /* @__PURE__ */ new Map();
  for (const s of screens) groups.set(s.service, [...groups.get(s.service) ?? [], s]);
  const lists = [...groups.values()];
  const out = [];
  for (let i = 0; out.length < screens.length; i++) for (const list of lists) if (list[i]) out.push(list[i]);
  return out;
}
__name(interleaveByService, "interleaveByService");
function classify(appName, category) {
  if (AUTO_APPS.some((name) => appName.includes(name))) return "\uC790\uB3D9\uCC28";
  return category || "\uAE30\uD0C0";
}
__name(classify, "classify");
function toScreens(data, sourceTool) {
  const groups = data.presentation?.groups ?? [];
  return groups.map((group3, i) => {
    const result = data.results?.[i] ?? {};
    const images = group3.images ?? [];
    return {
      id: `${sourceTool}-${group3.id}`,
      service: group3.app_name,
      domain: classify(group3.app_name, group3.category),
      category: group3.category,
      pattern: group3.pattern,
      variant: group3.pattern_variant ?? "",
      title: group3.pattern_variant || group3.pattern,
      dataMonth: group3.data_month,
      screenCount: group3.total_screen_count ?? images.length,
      components: result.components ?? [],
      matchedTexts: result.matched_texts ?? [],
      image: images[0]?.url,
      images: images.map((img) => ({ id: img.id, url: img.url, uiUrl: img.ui_url })),
      uiUrl: group3.ui_url,
      source: "UI Bowl",
      sourceTool,
      sourceTools: [sourceTool],
      mau: result.mau ?? null
    };
  });
}
__name(toScreens, "toScreens");
function mergeScreens(screens) {
  const byKey = /* @__PURE__ */ new Map();
  for (const s of screens) {
    const key = `${s.service}|${s.pattern}|${s.variant}`;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, s);
      continue;
    }
    prev.matchedTexts = [.../* @__PURE__ */ new Set([...prev.matchedTexts, ...s.matchedTexts])];
    prev.sourceTools = [.../* @__PURE__ */ new Set([...prev.sourceTools, ...s.sourceTools])];
    prev.components = prev.components.length ? prev.components : s.components;
    if (s.sourceTool === "search_ui_patterns") {
      prev.images = s.images;
      prev.image = s.image;
      prev.uiUrl = s.uiUrl;
    }
  }
  return [...byKey.values()];
}
__name(mergeScreens, "mergeScreens");
async function runSearch(q, domain2, callTool) {
  const query = interpretQuery(q ?? "");
  if (!query) return null;
  const scopes = SEARCH_SCOPES[domain2] ?? SEARCH_SCOPES.\uC804\uCCB4;
  const pages = PAGES_BY_DOMAIN[domain2] ?? 1;
  const calls = [];
  for (const scope of scopes) {
    const base = scope.app_name ? { ...scope } : { ...scope, country: "\uD55C\uAD6D" };
    if (query.component) {
      calls.push(["search_components", { ...base, component_type: query.component, limit: 8 }]);
      continue;
    }
    const patternQueries = [...new Set([query.uibowl, ...query.phrases, query.head].filter(Boolean))].slice(0, 5);
    patternQueries.forEach((q2, i) => {
      const pagesFor = i === 0 ? pages : 1;
      for (let page = 1; page <= pagesFor; page++) calls.push(["search_ui_patterns", { ...base, query: q2, ...page > 1 && { page } }]);
    });
    const ocrCall = /* @__PURE__ */ __name((args, first) => {
      for (let page = 1; page <= (first ? OCR_PAGES : 1); page++) calls.push(["search_by_ocr_text", { ...base, ...args, ...page > 1 && { page } }]);
    }, "ocrCall");
    if (query.ocr) ocrCall({ text_query: query.ocr.text, ...query.ocr.pattern && { pattern: query.ocr.pattern } }, true);
    else {
      const ordered = query.phrases.length ? [...query.phrases].sort((x, y) => Number(/\s/.test(y)) - Number(/\s/.test(x))) : [query.uibowl].filter(Boolean);
      const ocrPhrases = scopes.length > 1 ? ordered.slice(0, 1) : ordered.slice(0, 2);
      ocrPhrases.forEach((text_query, i) => ocrCall({ text_query }, i === 0));
    }
  }
  const settled = await Promise.allSettled(calls.map(([tool, args]) => callTool(tool, args).then((d) => toScreens(d, tool))));
  const screens = mergeScreens(settled.flatMap((r) => r.status === "fulfilled" ? r.value : []));
  const errors = settled.filter((r) => r.status === "rejected").map((r) => r.reason.message);
  const filtered = interleaveByService(domain2 === "\uC804\uCCB4" ? screens : screens.filter((s) => s.domain === domain2));
  return {
    query,
    screens: filtered,
    dropped: screens.length - filtered.length,
    calls: calls.length,
    failedCalls: errors.length,
    errors,
    searchedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
__name(runSearch, "runSearch");
async function runDarkSearch(rule, callTool) {
  const calls = rule.searches.flatMap(({ tool, args }) => {
    const categories = args.category ? [args.category] : ["\uAE08\uC735", "\uBAA8\uBE4C\uB9AC\uD2F0"];
    return categories.map((category) => [tool, { ...args, category, country: "\uD55C\uAD6D", ...tool === "search_components" && { limit: 8 } }]);
  });
  const settled = await Promise.allSettled(calls.map(([tool, args]) => callTool(tool, args).then((d) => toScreens(d, tool))));
  const screens = mergeScreens(settled.flatMap((r) => r.status === "fulfilled" ? r.value : [])).map((s) => {
    const text = [...s.matchedTexts, s.title, s.pattern].join(" ");
    return { ...s, triggerHits: rule.triggers.filter((t) => text.includes(t)) };
  });
  const errors = settled.filter((r) => r.status === "rejected").map((r) => r.reason.message);
  return {
    ruleId: rule.id,
    screens,
    searches: calls.map(([tool, args]) => ({ tool, args })),
    calls: calls.length,
    failedCalls: errors.length,
    errors,
    searchedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
__name(runDarkSearch, "runDarkSearch");

// api/dark/search.js
async function onRequestPost({ request, env: env2 }) {
  if (!sameSite(request)) return json({ error: "\uD5C8\uC6A9\uB418\uC9C0 \uC54A\uC740 \uC694\uCCAD\uC774\uC5D0\uC694" }, 403);
  const { ruleId } = await request.json().catch(() => ({}));
  const rule = ruleById(ruleId);
  if (!rule) return json({ error: "\uADDC\uCE59\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC5B4\uC694" }, 400);
  try {
    const callTool = await createCallTool(env2.UXLENS_AUTH);
    return json(await runDarkSearch(rule, callTool));
  } catch (err) {
    return json({ error: err.message }, 502);
  }
}
__name(onRequestPost, "onRequestPost");

// api/search.js
async function onRequestPost2({ request, env: env2 }) {
  if (!sameSite(request)) return json({ error: "\uD5C8\uC6A9\uB418\uC9C0 \uC54A\uC740 \uC694\uCCAD\uC774\uC5D0\uC694" }, 403);
  const { q, domain: domain2 = "\uC804\uCCB4" } = await request.json().catch(() => ({}));
  if (!interpretQuery(q ?? "")) return json({ error: "\uAC80\uC0C9\uC5B4\uAC00 \uBE44\uC5B4 \uC788\uC5B4\uC694" }, 400);
  try {
    const callTool = await createCallTool(env2.UXLENS_AUTH);
    return json(await runSearch(q, domain2, callTool));
  } catch (err) {
    return json({ error: err.message }, 502);
  }
}
__name(onRequestPost2, "onRequestPost");

// ../.wrangler/tmp/pages-tAMbz2/functionsRoutes-0.6901043141230264.mjs
var routes = [
  {
    routePath: "/api/auth/status",
    mountPath: "/api/auth",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/dark/search",
    mountPath: "/api/dark",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/search",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  }
];

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j2 = i + 1;
      while (j2 < str.length) {
        var code = str.charCodeAt(j2);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j2++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j2;
      continue;
    }
    if (char === "(") {
      var count3 = 1;
      var pattern = "";
      var j2 = i + 1;
      if (str[j2] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j2));
      }
      while (j2 < str.length) {
        if (str[j2] === "\\") {
          pattern += str[j2++] + str[j2++];
          continue;
        }
        if (str[j2] === ")") {
          count3--;
          if (count3 === 0) {
            j2++;
            break;
          }
        } else if (str[j2] === "(") {
          count3++;
          if (str[j2 + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j2));
          }
        }
        pattern += str[j2++];
      }
      if (count3)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j2;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env2, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context2 = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env: env2,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context2);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error3) {
      if (isFailOpen) {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error3;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
