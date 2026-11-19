// Polyfills para Android WebViews (Chromium < 93 / Android 9-11) y compatibilidad total

// 1. Object.hasOwn
if (typeof Object.hasOwn !== 'function') {
  Object.hasOwn = function (object: any, property: PropertyKey): boolean {
    if (object == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    return Object.prototype.hasOwnProperty.call(object, property);
  };
}

// 2. Array.prototype.at
if (typeof (Array.prototype as any).at !== 'function') {
  (Array.prototype as any).at = function (n: number) {
    n = Math.trunc(n) || 0;
    if (n < 0) n += this.length;
    if (n < 0 || n >= this.length) return undefined;
    return this[n];
  };
}

// 3. String.prototype.replaceAll
if (typeof (String.prototype as any).replaceAll !== 'function') {
  (String.prototype as any).replaceAll = function (searchValue: any, replaceValue: any) {
    if (searchValue instanceof RegExp) {
      if (!searchValue.global) {
        throw new TypeError('replaceAll must be called with a global RegExp');
      }
      return this.replace(searchValue, replaceValue);
    }
    return this.split(searchValue).join(replaceValue);
  };
}

// 4. Array.prototype.findLast
if (typeof (Array.prototype as any).findLast !== 'function') {
  (Array.prototype as any).findLast = function (predicate: Function, thisArg?: any) {
    for (let i = this.length - 1; i >= 0; i--) {
      if (predicate.call(thisArg, this[i], i, this)) {
        return this[i];
      }
    }
    return undefined;
  };
}

// 5. Array.prototype.findLastIndex
if (typeof (Array.prototype as any).findLastIndex !== 'function') {
  (Array.prototype as any).findLastIndex = function (predicate: Function, thisArg?: any) {
    for (let i = this.length - 1; i >= 0; i--) {
      if (predicate.call(thisArg, this[i], i, this)) {
        return i;
      }
    }
    return -1;
  };
}

// 6. Object.fromEntries
if (typeof Object.fromEntries !== 'function') {
  Object.fromEntries = function (entries: any) {
    if (!entries || !entries[Symbol.iterator]) {
      throw new TypeError('Object.fromEntries requires an iterable');
    }
    const obj: any = {};
    for (const [key, val] of entries) {
      obj[key] = val;
    }
    return obj;
  };
}

// 7. globalThis fallback
if (typeof (window as any).globalThis === 'undefined') {
  (window as any).globalThis = window;
}

export {};
