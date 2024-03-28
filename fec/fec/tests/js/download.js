// Common for all/most tests
import './setup.js';
import * as sinonChai from 'sinon-chai';
import { expect, use } from 'chai';
import sinon from 'sinon/pkg/sinon-esm';
use(sinonChai);
// (end common)

import { default as moment } from 'moment';
import MockDate from 'mockdate';
import { download, hydrate, DownloadContainer, DownloadItem } from '../../static/js/modules/download.js';

function clearStorage() {
  Object.keys(window.localStorage).forEach(function(key) {
    window.localStorage.removeItem(key);
  });
}

describe('helpers', function() {
  afterEach(clearStorage);

  describe('download', function() {
    it('adds a pending download', function() {
      var item = download('/1');
      expect(item.$body).not.to.be.null;
    });

    it('is idempotent', function() {
      var item1 = download('/1');
      var item2 = download('/1');
      expect(item1.$body).not.to.be.null;
      expect(item2.$body).to.be.null;
    });

    it('focuses on the button', function() {
      var item = download('/1', false, true);
      expect(item.$button[0]).to.equal(document.activeElement);
    });
  });

  describe('hydrate', function() {
    it('restores downloads from localStorage', function() {
      window.localStorage.setItem(
        'download-/1',
        JSON.stringify({
          timestamp: '2015-10-01',
          downloadUrl: '/download/1'
        })
      );
      var items = hydrate();
      expect(items.length).to.equal(1);
      expect(items[0].$body).not.to.be.null;
    });
  });
});

describe('DownloadItem', function() {
  describe('constructor()', function() {
    beforeEach(function() {
      MockDate.set(moment('1985-10-01'));
    });

    afterEach(function() {
      MockDate.reset();
    });

    beforeEach(function() {
      this.container = DownloadContainer.getInstance(document.body);
      this.item = new DownloadItem('/v1/1/', this.container);
    });

    afterEach(function() {
      this.item.close();
    });

    it('finds dom nodes', function() {
      expect(this.item.$body).to.be.null;
      expect(this.item.$parent).to.equal(this.container.$list);
    });

    it('parses url parts', function() {
      expect(this.item.apiUrl).to.equal('/v1/download/1/');
      expect(this.item.resource).to.equal('1');
    });

    it('sets null values from payload', function() {
      expect(this.item.isPending).to.be.false;
      expect(this.item.timestamp.slice(0, 10)).to.equal('1985-10-01');
      expect(this.item.downloadUrl).not.to.be.ok;
    });

    it('parses localStorage', function() {
      var downloadUrl = '/download';
      window.localStorage.setItem(
        this.item.key,
        JSON.stringify({
          timestamp: '2015-10-01',
          downloadUrl: downloadUrl
        })
      );
      var item = new DownloadItem('/v1/1/', this.container);
      expect(item.isPending).to.be.true;
      expect(item.timestamp).to.equal('2015-10-01');
      expect(item.downloadUrl).to.equal(downloadUrl);
    });
  });

  describe('refresh()', function() {
    beforeEach(function() {
      this.container = DownloadContainer.getInstance(document.body);
      this.item = new DownloadItem('/v1/1/', this.container);
    });

    beforeEach(function() {
      this.promise = $.Deferred();
      sinon.stub($, 'ajax').returns(this.promise);
      sinon.stub(DownloadItem.prototype, 'schedule');
      sinon.stub(DownloadItem.prototype, 'finish');
      sinon.stub(DownloadItem.prototype, 'handleServerError');
    });

    afterEach(function() {
      $.ajax.restore();
      DownloadItem.prototype.schedule.restore();
      DownloadItem.prototype.finish.restore();
      DownloadItem.prototype.handleServerError.restore();
    });

    it('sends an ajax request', function() {
      this.item.refresh();
      expect($.ajax).to.have.been.calledWith({
        method: 'POST',
        url: this.item.apiUrl,
        data: JSON.stringify({filename: this.item.filename}),
        contentType: 'application/json',
        dataType: 'json'
      });
    });

    it('handles success on queued', function() {
      this.item.refresh();
      this.promise.resolve({status: 'queued'});
      expect(this.item.finish).not.to.have.been.called;
    });

    it('handles success on complete', function() {
      this.item.refresh();
      this.promise.resolve({status: 'complete', url: '/download'});
      expect(this.item.finish).to.have.been.calledWith('/download');
    });

    it('handles a 500 server error', function() {
      this.item.refresh();
      this.promise.reject({}, 'error');
      expect(this.item.handleServerError).to.have.been.called;
    });

    it('handles other server errors', function() {
      this.item.refresh();
      this.promise.reject({}, 'fake');
      expect(this.item.schedule).to.have.been.called;
    });

    it('handles a synthetic error', function() {
      this.item.refresh();
      this.promise.reject({}, 'abort');
      expect(this.item.schedule).not.to.have.been.called;
    });
  });
});

describe('DownloadContainer', function() {
  beforeEach(function() {
    DownloadContainer.getInstance().destroy();
  });

  afterEach(clearStorage);

  it('shows the container on download', function() {
    expect(DownloadContainer.instance).not.to.be.ok;
    download('/1');
    expect(DownloadContainer.instance).to.be.ok;
  });

  it('hides the container on download dismiss', function() {
    var item1 = download('/1');
    var item2 = download('/2');
    item1.close();
    expect(DownloadContainer.instance).to.be.ok;
    item2.close();
    expect(DownloadContainer.instance).not.to.be.ok;
  });
});
