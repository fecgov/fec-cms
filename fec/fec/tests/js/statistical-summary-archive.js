'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var $ = require('jquery');

require('./setup')();

var Tablefilter = require('../../static/js/modules/statistical-summary-archive').StatisticalSummaryArchive;

var dom =
    '<div class="filter-controls">' +
    '<div class="filter_year">' +
    '<label for="year" class="label">Two-year period</label>' +
    '<fieldset>' +
    '<select id="year" name="year" class="js-archive-select">' +
    '<option selected value="1988">1987-1988</option>' +
    '<option  value="1986">1985-1986</option>' +
    '<option  value="1984">1983-1984</option>' +
    '<option  value="1982">1981-1982</option>' +
    '<option  value="1980">1979-1980</option>' +
    '<option  value="1978">1977-1978</option>' +
    '<option  value="1976">1975-1976</option>' +
    '</select>' +
    '</div>' +
    '<div class="filter_filer">' +
    '<label for="filer" class="label">Filer type</label>' +
    '<select id="filer" name="filer" class="js-archive-select">' +
    '<option selected value="congressional">Congressional candidates</option>' +
    '<option value="presidential">Presidential candidates</option>' +
    '<option value="party">Party committee</option>' +
    '<option value="pac">Political action committee</option>' +
    '<option value="expenditures">Independent expenditures</option>' +
    '</select>' +
    '</fieldset>' +
    '</div>' +
    '</div>' +
    '<h3 class="js-table-title u-padding--top"></h3>';

describe('Tablefilter', function() {
    before(function() {

        this.$fixture = $('<div id="fixtures"></div>');
        $('body').append(this.$fixture);

    });

    beforeEach(function() {
        this.$fixture.empty().append(dom);

        this.chooseYear = this.$fixture.find("#year"); // "
 
        this.chooseFiler = this.$fixture.find("#filer"); // "

        this.tableTitle = this.$fixture.find(".js-table-title"); // "

        this.showTable = sinon.spy(Tablefilter.prototype, 'showTable');

        this.filter = new Tablefilter()

    });

    afterEach(function() {
        this.showTable.restore();
    });

    it('locates DOM elements', function() {
        expect(this.chooseYear.is('#fixtures #year')).to.be.true;
        expect(this.tableTitle.is('#fixtures .js-table-title')).to.be.true;
    });

    describe('showTable', function() {
        beforeEach(function() {
            this.filter.chosenYear = '1982';
            this.filter.chosenFiler = 'presidential';
        });

        afterEach(function() {
            this.showTable.restore();
        });
    });

    describe('disableNonPresYears', function() {
        beforeEach(function() {
            this.disableNonPresYears = sinon.spy(Tablefilter.prototype, 'disableNonPresYears');
            this.chooseYear.val('1982').change();
            this.chooseFiler.val('presidential').change();
            this.filter.showTable()

        });

        afterEach(function() {
            this.disableNonPresYears.restore();
        });

        it('calls disableNonPresYears() based on filer=presidential', function() {
            expect(this.filter.disableNonPresYears).to.have.been.called;
        })

        it('disables non-presidential years', function() {
            //target 1978 -- a non pres year
            var year = this.filter.chooseYear.options[5]
            expect(year.getAttribute('disabled', '')).to.equal('disabled');
        })

        it('it bumps selected-option to next single presidential year', function() {
            //target 1984 to test against
            var next_pres_year = this.filter.chooseYear.options[2]
            //test that is selects the next two year period when non pres year is chosen
            expect(next_pres_year.selected).to.equal(true);
            //test that the text displayed for the enabbled selects is just one year (four digits only)
            expect(new RegExp('^[0-9]{4}$').test(next_pres_year.text)).to.be.true;

        });

    });

});
