// Polyfills para máxima compatibilidad

if (typeof Object.hasOwn !== 'function') {
  Object.hasOwn = function (object: any, property: PropertyKey): boolean {
    if (object == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    return Object.prototype.hasOwnProperty.call(object, property);
  };
}

if (typeof (Array.prototype as any).at !== 'function') {
  (Array.prototype as any).at = function (n: number) {
    n = Math.trunc(n) || 0;
    if (n < 0) n += this.length;
    if (n < 0 || n >= this.length) return undefined;
    return this[n];
  };
}

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

export {};
