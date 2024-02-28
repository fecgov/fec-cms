export default function extend(out) {
  out = out || {};
  for (let i = 1; i < arguments.length; i++) {
    if (!arguments[i]) continue;
    for (let key in arguments[i]) {
      if (arguments[i].hasOwnProperty(key)) {
        out[key] = arguments[i][key];
      }
    }
  }
  return out;
};
