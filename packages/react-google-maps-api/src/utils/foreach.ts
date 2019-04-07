export function forEach (obj: any, fn: any): any {
  Object.keys(obj).forEach(function iterator(key) {
    return fn(obj[key], key)
  })
}
