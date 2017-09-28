'use strict';

var $ = require('jquery');
var URI = require('urijs');
var _ = require('underscore');
var moment = require('moment');

var templates = {
  item: require('../templates/download/item.hbs'),
  container: require('../templates/download/container.hbs')
};

var PREFIX = 'download-';
var DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

function hydrate() {
  return storedDownloads().map(function(key) {
    return download(key.slice(PREFIX.length), true);
  });
}

function download(url, init, focus) {
  var container = DownloadContainer.getInstance(document.body);
  var item = new DownloadItem(url, container);

  if (init || !item.isPending) {
    item.init();
  }

  if (focus) {
    item.$button.focus();
  }

  return item;
}

function isPending(url) {
  return !!window.localStorage.getItem(PREFIX + url);
}

function storedDownloads() {
  return Object.keys(window.localStorage).filter(function(key) {
    return key.indexOf(PREFIX) === 0;
  });
}

function pendingCount() {
  return storedDownloads().length;
}

function getUrlParts(url) {
  var uri = URI(url);
  var path = uri.path().split('/');
  path.splice(2, 0, 'download');
  uri.path(path.join('/'));
  return {
    resource: path[path.length - 2],
    apiUrl: uri.toString()
  };
}

var defaultOpts = {
  timeout: 5000
};

function DownloadItem(url, container, opts) {
  this.url = url;
  this.container = container;
  this.opts = _.extend({}, defaultOpts, opts);

  this.$body = null;
  this.$parent = this.container.$list;

  this.timeout = null;
  this.promise = null;

  this.key = PREFIX + this.url;

  var urlParts = getUrlParts(this.url);
  this.apiUrl = urlParts.apiUrl;
  this.resource = urlParts.resource;

  var payload = JSON.parse(window.localStorage.getItem(this.key)) || {};
  this.timestamp = payload.timestamp || moment().format(DATE_FORMAT);
  this.downloadUrl = payload.downloadUrl;
  this.isPending = !_.isEmpty(payload);
  this.filename = this.resource + '-' + this.timestamp + '.csv';
}

DownloadItem.prototype.init = function() {
  this.draw();
  this.container.add();
  if (!this.downloadUrl) {
    this.refresh();
    this.push();
  }
};

DownloadItem.prototype.draw = function() {
  var template = templates.item;
  this.$body = $(template(this.serialize()));
  this.$body.appendTo(this.$parent);

  this.$button = this.$body.find('.download__button');

  this.$body.find('.js-close').on('click', this.close.bind(this));
};

DownloadItem.prototype.serialize = function() {
  return {
    url: this.url,
    apiUrl: this.apiUrl,
    downloadUrl: this.downloadUrl,
    filename: this.filename
  };
};

DownloadItem.prototype.schedule = function() {
  this.timeout = window.setTimeout(this.refresh.bind(this), this.opts.timeout);
};

DownloadItem.prototype.push = function() {
  window.localStorage.setItem(
    this.key,
    JSON.stringify({
      timestamp: this.timestamp,
      downloadUrl: this.downloadUrl
    })
  );
};

DownloadItem.prototype.refresh = function() {
  this.promise = $.ajax({
    method: 'POST',
    url: this.apiUrl,
    data: JSON.stringify({filename: this.filename}),
    contentType: 'application/json',
    dataType: 'json'
  });
  this.promise.done(this.handleSuccess.bind(this));
  this.promise.fail(this.handleError.bind(this));
};

DownloadItem.prototype.cancel = function() {
  var message = 'Your request contains more than 100,000 results.';
  this.close();
  window.alert(message);
};

DownloadItem.prototype.handleSuccess = function(response) {
  if (response && response.status === 'complete') {
    this.finish(response.url);
  } else {
    this.schedule();
  }
};

DownloadItem.prototype.handleError = function(xhr, textStatus) {
  if (textStatus === 'error') {
    this.handleServerError();
  } else if (textStatus !== 'abort') {
    this.schedule();
  } else if (xhr.status === 403) {
    this.cancel();
  }
};

DownloadItem.prototype.finish = function(downloadUrl) {
  this.downloadUrl = downloadUrl;
  this.push();
  this.$body.removeClass('is-pending');
  this.$body.addClass('is-complete');
  this.$body.find('.download__message').remove();
  this.$button.attr('href', this.downloadUrl).removeClass('is-disabled');
};

DownloadItem.prototype.close = function() {
  window.clearTimeout(this.timeout);
  this.promise && this.promise.abort();
  this.$body && this.$body.remove();
  window.localStorage.removeItem(this.key);
  this.container.subtract();
};

DownloadItem.prototype.handleServerError = function() {
    // This is how we handle a 500 server error
    // First, display a message
    this.$body.html('<div class="message message--alert message--mini">' +
                      'Sorry, there was a server error. Please try again later.' +
                    '</div>');

    // Clear all traces of the downloadUrl
    window.clearTimeout(this.timeout);
    this.promise && this.promise.abort();
    this.$body.removeClass('is-pending');
    this.$body.removeClass('download');
    window.localStorage.removeItem(this.key);

    // Tell the container to subtract an item, but preserve the DOM itself
    // so that the message stays visible
    this.container.subtract(true);
};

function DownloadContainer(parent) {
  this.$parent = $(parent);
  this.$body = $(templates.container());
  this.$list = this.$body.find('.js-downloads-list');
  this.$parent.append(this.$body);
  this.items = 0;
}

DownloadContainer.prototype.add = function() {
  this.items++;
  if (this.$body) {
    this.$body.trigger({type: 'download:countChanged', count: this.items});
  }
};

DownloadContainer.prototype.subtract = function(preserve) {
  this.items = this.items - 1;
  if (this.$body) {
    this.$body.trigger({type: 'download:countChanged', count: this.items});
  }
  if (this.items === 0 && !preserve) {
    this.destroy();
  }
};

DownloadContainer.prototype.destroy = function() {
  this.$body.remove();
  DownloadContainer.instance = null;
};

DownloadContainer.instance = null;
DownloadContainer.getInstance = function(parent) {
  DownloadContainer.instance = DownloadContainer.instance || new DownloadContainer(parent);
  return DownloadContainer.instance;
};

module.exports = {
  hydrate: hydrate,
  download: download,
  isPending: isPending,
  pendingCount: pendingCount,
  DownloadItem: DownloadItem,
  DownloadContainer: DownloadContainer
};
