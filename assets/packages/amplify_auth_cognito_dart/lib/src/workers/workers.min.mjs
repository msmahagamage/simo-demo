// Compiles a dart2wasm-generated main module from `source` which can then
// be instantiated via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm module from `bytes` which is then
// instantiable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arguments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `use-load-ids` option is passed. Each load ID maps to
  //   one or more wasm files as specified in the emitted JSON file. It also
  //   takes a callback that should be invoked for each loaded module with 2
  //   arguments: (1) the module name, (2) the loaded module in a format
  //   supported by `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  //   The callback returns a Promise that resolves when the module is
  //   instantiated.
  //   loadDeferredId should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports, {loadDeferredModules, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            AB: (x0,x1,x2) => new DataView(x0,x1,x2),
      AC: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      B: s => printToConsole(s),
      BB: (o, p) => o[p],
      BC: f => f.dartFunction,
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      CC: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      DC: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      E: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      EB: o => o.byteOffset,
      EC: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      F: () => new Error().stack,
      FB: o => o.buffer,
      FC: (o, i) => o[i],
      G: s => JSON.stringify(s),
      GB: Function.prototype.call.bind(DataView.prototype.getUint8),
      GC: (o, p) => o[p],
      H: Function.prototype.call.bind(Number.prototype.toString),
      HB: (b, o) => new DataView(b, o),
      HC: o => o.length,
      I: Function.prototype.call.bind(String.prototype.indexOf),
      IB: (b, o, l) => new DataView(b, o, l),
      IC: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      J: (s, p, i) => s.lastIndexOf(p, i),
      JB: Function.prototype.call.bind(DataView.prototype.getFloat64),
      JC: x0 => x0.data,
      K: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      KB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      KC: (o, t) => typeof o === t,
      L: o => o === undefined,
      LB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      LC: (x0,x1,x2) => x0.postMessage(x1,x2),
      M: o => String(o),
      MB: (t, s) => t.set(s),
      MC: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      N: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      NB: Function.prototype.call.bind(DataView.prototype.setFloat32),
      NC: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      O: (string, times) => string.repeat(times),
      OB: Function.prototype.call.bind(DataView.prototype.getFloat32),
      OC: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      P: x0 => x0.random(),
      PB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      PC: s => s.toUpperCase(),
      Q: o => o,
      QB: Function.prototype.call.bind(DataView.prototype.getUint32),
      QC: Object.is,
      R: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      RB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      RC: (x0,x1) => x0.exec(x1),
      S: () => globalThis.Math,
      SB: Function.prototype.call.bind(DataView.prototype.getInt32),
      SC: x0 => x0.length,
      T: (l, r) => l === r,
      TB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      TC: (x0,x1) => { x0.lastIndex = x1 },
      U: (x0,x1) => x0.postMessage(x1),
      UB: o => o instanceof Uint16Array,
      UC: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      V: x0 => x0.close(),
      VB: Function.prototype.call.bind(DataView.prototype.getUint16),
      VC: o => o instanceof RegExp,
      W: s => new Date(s * 1000).getTimezoneOffset() * 60,
      WB: o => o instanceof Int16Array,
      WC: x0 => x0.dotAll,
      X: Date.now,
      XB: Function.prototype.call.bind(DataView.prototype.getInt16),
      XC: x0 => x0.unicode,
      Y: (o, m, a) => o[m].apply(o, a),
      YB: o => o instanceof Uint8ClampedArray,
      YC: x0 => x0.ignoreCase,
      Z: x0 => new Array(x0),
      ZB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      ZC: x0 => x0.multiline,
      a: o => [o],
      aB: Function.prototype.call.bind(DataView.prototype.setInt32),
      aC: (string, token) => string.split(token),
      b: (o0, o1) => [o0, o1],
      bB: Function.prototype.call.bind(DataView.prototype.setUint32),
      bC: x0 => x0.index,
      c: (o0, o1, o2) => [o0, o1, o2],
      cB: Function.prototype.call.bind(DataView.prototype.setInt16),
      cC: (x0,x1) => x0[x1],
      d: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      dB: Function.prototype.call.bind(DataView.prototype.setUint16),
      dC: x0 => x0.flags,
      e: (x0,x1,x2) => { x0[x1] = x2 },
      eB: Function.prototype.call.bind(DataView.prototype.setUint8),
      eC: Function.prototype.call.bind(String.prototype.toLowerCase),
      f: o => o,
      fB: Function.prototype.call.bind(DataView.prototype.setInt8),
      fC: x0 => x0.pop(),
      g: (o,s,v) => o[s] = v,
      gB: Function.prototype.call.bind(DataView.prototype.getInt8),
      gC: (o, p, r) => o.replace(p, () => r),
      h: () => Symbol("jsBoxedDartObjectProperty"),
      hB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      hC: (o, p, r) => o.replaceAll(p, () => r),
      i: () => ({}),
      iB: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      iC: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      j: (o, p, v) => o[p] = v,
      jB: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      jC: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      k: () => [],
      kB: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      kC: s => s.trim(),
      l: (a, i) => a.push(i),
      lB: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      lC: (o, p) => p in o,
      m: b => !!b,
      mB: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      mC: x0 => x0.groups,
      n: x0 => new Int8Array(x0),
      nB: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      nC: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      o: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      oB: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      oC: (x0,x1) => { x0.onmessage = x1 },
      p: x0 => new Uint8Array(x0),
      pB: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      pC: (a, i) => a[i],
      q: x0 => new Uint8ClampedArray(x0),
      qB: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      qC: a => a.length,
      r: x0 => new Int16Array(x0),
      rB: () => globalThis.self,
      rC: o => o instanceof Array,
      s: x0 => new Uint16Array(x0),
      sB: (x0,x1) => x0.test(x1),
      sC: (a, s, e) => a.slice(s, e),
      t: x0 => new Int32Array(x0),
      tB: o => o,
      tC: x0 => x0.ports,
      u: x0 => new Uint32Array(x0),
      uB: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      uC: (x0,x1) => x0.getRandomValues(x1),
      v: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      vB: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      vC: () => globalThis.crypto,
      w: x0 => new Float32Array(x0),
      wB: (x0,x1,x2) => x0.addEventListener(x1,x2),
      wC: l => new DataView(new ArrayBuffer(l)),
      x: x0 => new Float64Array(x0),
      xB: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      y: x0 => new ArrayBuffer(x0),
      yB: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      z: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      zB: o => Object.keys(o),

    };

    const baseImports = {
      _: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    const jsStringPolyfill = {
      "charCodeAt": (s, i) => s.charCodeAt(i),
      "compare": (s1, s2) => {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      },
      "concat": (s1, s2) => s1 + s2,
      "equals": (s1, s2) => s1 === s2,
      "fromCharCode": (i) => String.fromCharCode(i),
      "length": (s) => s.length,
      "substring": (s, a, b) => s.substring(a, b),
      "fromCharCodeArray": (a, start, end) => {
        if (end <= start) return '';

        const read = dartInstance.exports.$wasmI16ArrayGet;
        let result = '';
        let index = start;
        const chunkLength = Math.min(end - index, 500);
        let array = new Array(chunkLength);
        while (index < end) {
          const newChunkLength = Math.min(end - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(a, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
      "intoCharCodeArray": (s, a, start) => {
        if (s === '') return 0;

        const write = dartInstance.exports.$wasmI16ArraySet;
        for (var i = 0; i < s.length; ++i) {
          write(a, start++, s.charCodeAt(i));
        }
        return s.length;
      },
      "test": (s) => typeof s == "string",
    };


    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
      "wasm:js-string": jsStringPolyfill,
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
