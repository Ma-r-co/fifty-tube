export const scramble = (org) => {
  return [...org].map((c, i) => (
    c.charCodeAt(0) + i
  ));
}

export const convert = (arr) => {
  let rst = arr.map((n, i) => (
    String.fromCharCode(n - i)
  ));
  return rst.join('')
}