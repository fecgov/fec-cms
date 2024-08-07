import { default as _toArray } from 'underscore/modules/toArray.js';

export default function Listeners() {
  this.listeners = [];
}

Listeners.prototype.on = function(elm) {
  var $elm = $(elm);
  var args = _toArray(arguments).slice(1);
  this.listeners = this._listeners || [];
  this.listeners.push({ $elm: $elm, args: args });
  $elm.on.apply($elm, args);
};

Listeners.prototype.clear = function() {
  this.listeners.forEach(function(listener) {
    var $elm = listener.$elm;
    var args = listener.args;
    $elm.off.apply($elm, args);
  });
};
