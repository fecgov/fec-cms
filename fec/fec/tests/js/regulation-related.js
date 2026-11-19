import { expect } from 'chai';
import { stub } from 'sinon/pkg/sinon-esm';

import loadRegulationRelated from '../../static/js/modules/regulation-related.js';

describe('Regulation related content', function() {
  beforeEach(function() {
    this.container = document.createElement('div');
    this.container.dataset.regulationRelatedUrl = '/legal/regulations/1.1/related/murs/';
    this.container.dataset.regulationRelatedLabel = 'MURs';
    this.container.innerHTML = '<a href="/legal/regulations/1.1/related/murs/">View MURs</a>';
    this.fetch = stub(window, 'fetch');
  });

  afterEach(function() {
    this.fetch.restore();
  });

  it('announces loading and replaces it with the rendered partial', async function() {
    this.fetch.resolves({ ok: true, text: () => Promise.resolve('<p>No MURs found.</p>') });
    const pending = loadRegulationRelated(this.container);
    expect(this.container.getAttribute('aria-busy')).to.equal('true');
    expect(this.container.textContent).to.equal('Loading MURs...');
    await pending;
    expect(this.fetch.firstCall.args[0]).to.equal(this.container.dataset.regulationRelatedUrl);
    expect(this.container.innerHTML).to.equal('<p>No MURs found.</p>');
    expect(this.container.getAttribute('aria-busy')).to.equal('false');
  });

  for (const failure of ['network', 'http']) {
    it('retains a usable fallback after a ' + failure + ' failure', async function() {
      if (failure === 'network') this.fetch.rejects(new Error('offline'));
      else this.fetch.resolves({ ok: false });
      await loadRegulationRelated(this.container);
      expect(this.container.textContent).to.contain('Unable to load MURs.');
      expect(this.container.querySelector('a').getAttribute('href'))
        .to.equal('/legal/regulations/1.1/related/murs/');
      expect(this.container.getAttribute('aria-busy')).to.equal('false');
    });
  }
});
