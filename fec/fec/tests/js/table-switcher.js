// Common for all/most tests
import './setup.js';
import * as sinonChai from 'sinon-chai';
import { expect, use } from 'chai';
import sinon from 'sinon/pkg/sinon-esm';
use(sinonChai);
// (end common)

import TableSwitcher from '../../static/js/modules/table-switcher.js';

describe('Table switcher', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').append(this.$fixture);
  });

  beforeEach(function() {
    this.$fixture.empty().append(
    '<fieldset>' +
      '<legend>Data type</legend>' +
      '<label for="switcher-processed">' +
        '<input type="radio" value="processed" id="switcher-processed" checked name="data_type">' +
        '<span>Processed</span>' +
      '</label>' +
      '<label for="switcher-efilings">' +
        '<input type="radio" value="efiling" id="switcher-efilings" name="data_type">' +
        '<span>Raw</span>' +
      '</label>' +
      '<div id="processed-message" class="js-table-switcher-message" aria-hidden="false">' +
        '<p>Processed message.</p>' +
      '</div>' +
      '<div id="efiling-message" class="js-table-switcher-message" aria-hidden="true">' +
        '<p>Raw message</p>' +
      '</div>' +
    '</fieldset>'
    );
    this.tableSwitcher = new TableSwitcher(this.$fixture.find('fieldset'), {
        efiling: {
          path: ['efile', 'filings'],
          dataType: 'efiling'
        },
        processed: {
          path: ['filings'],
          dataType: 'processed'
        }
      }
      );

    this.trigger = sinon.spy($.prototype, 'trigger');
  });

  afterEach(function() {
    $.prototype.trigger.restore();
  });

  it('locates dom elements', function() {
    expect(this.tableSwitcher.$control.is('#fixtures fieldset')).to.be.true;
  });

  it('triggers an event with the options for the checked input on init', function() {
    this.tableSwitcher.init();
    expect(this.trigger).to.have.been.calledWith('table:switch',
      {
        path: ['filings'],
        dataType: 'processed'
      }
    );
  });

  it('triggers an the table:switch with the correct options on change', function() {
    var target = $('#fixtures input[value="efiling"]');
    var e = {
      target: target
    };
    this.tableSwitcher.handleChange(e);
    expect(this.trigger).to.have.been.calledWith('table:switch',
      {
        path: ['efile', 'filings'],
        dataType: 'efiling'
      }
    );
  });

  it('toggles visibility of the message', function() {
    this.tableSwitcher.toggleMessage('efiling');
    expect($('#efiling-message').attr('aria-hidden')).to.equal('false');
    expect($('#processed-message').attr('aria-hidden')).to.equal('true');
  });
});
