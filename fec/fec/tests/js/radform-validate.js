'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var $ = require('jquery');

require('./setup')();

var RadFormValidate = require('../../static/js/pages/contact-form').RadFormValidate;

var dom =

    '<form class="js-contact-form contact-form" id="id_contact_form">' +
    '<div class="row">' +
    '<input type="text" name="u_contact_first_name" required="" id="id_u_contact_first_name">' +
    '<span class="error t-sans t-bold id_u_contact_first_name" aria-live="polite"></span>' +
    '</div>' +
    '<div class="row">' +
    '<input type="text" name="u_contact_last_name" required="" id="id_u_contact_last_name">' +
    '<span class="error t-sans t-bold id_u_contact_last_name" aria-live="polite"></span>' +
    '</div>' +
    '<div class="contact-form__element">' +
    '<hr class="hr--light">' +
    '<div class="row">' +
    '<input type="text" name="committee_name" id="id_committee_name" required>' +
    '<span class="twitter-typeahead" style="position: relative; display: block; height: auto;"><input type="text" name="committee_name" class="js-contact-typeahead tt-input invalid_border" required="" id="id_committee_name" spellcheck="false" dir="auto" aria-activedescendant="" aria-owns="id_committee_name_listbox" role="combobox" aria-autocomplete="list" style="position: relative; vertical-align: top;" aria-expanded="false" autocomplete="off"><span class="error t-sans t-bold id_committee_name" aria-live="polite">Please choose a valid committee</span><span style="color:green" id="chosenId"></span><span role="status" aria-live="polite" style="position: absolute; padding: 0px; border: 0px; height: 1px; width: 1px; margin-bottom: -1px; margin-right: -1px; overflow: hidden; clip: rect(0px, 0px, 0px, 0px); white-space: nowrap;"></span><pre aria-hidden="true" style="position: absolute; visibility: hidden; white-space: pre; font-family: karla, sans-serif; font-size: 14px; font-style: normal; font-variant: normal; font-weight: 400; word-spacing: 0px; letter-spacing: 0px; text-indent: 0px; text-rendering: auto; text-transform: none;">ACT</pre><div role="listbox" class="tt-menu tt-empty" aria-live="polite" aria-expanded="false" style="position: absolute; top: 100%; left: 0px; z-index: 100; display: none;"><div role="presentation" class="tt-dataset tt-dataset-committee"></div></div></span>' +
    '</div>' +
    '</div>' +
    '<input name="u_committee" id="id_u_committee">' +
    '<button class="js-submit button button--cta">Submit</button>' +
    '</form>';

describe('RadFormValidate', function() {
    before(function() {

        this.$fixture = $('<div id="fixtures"></div>');
        $('body').append(this.$fixture);

    });

    beforeEach(function() {
        this.$fixture.empty().append(dom);

        this.messages = {
            id_u_contact_first_name: 'Please provide your first name',
            id_u_contact_last_name: 'Please provide your last name',
            id_u_contact_email: 'Please include a valid email address',
            id_committee_name: 'Please choose a valid committee',
            id_u_category: 'Please choose a category',
            id_u_description: 'Please include a detailed question',
            id_u_committee_member_certification: 'Please agree before submitting'
        };

        this.radform = this.$fixture.find('#id_contact_form');

        this.committeeName = this.$fixture.find('#id_committee_name');
        console.log('this.committeeName' + this.committeeName)

        this.committeeId = this.$fixture.find("#id_u_committee");

        this.id_u_contact_first_name = this.$fixture.find("#id_u_contact_first_name");

        this.first_name_error = this.$fixture.find(".error.t-sans.t-bold.id_u_contact_first_name");

        this.handleSubmit = sinon.spy(RadFormValidate.prototype, 'handleSubmit', );

        this.showError = sinon.spy(RadFormValidate.prototype, 'showError');

        this.handleBlur = sinon.spy(RadFormValidate.prototype, 'handleBlur');

        this.validateCommitteeId = sinon.spy(RadFormValidate.prototype, 'validateCommitteeId');

        this.validate = new RadFormValidate('#id_contact_form');

    });

    afterEach(function() {
        this.showError.restore();
        this.validateCommitteeId.restore()
        this.handleBlur.restore();
        this.handleSubmit.restore();
        //this.submit.restore();
    });

    it('locates DOM elements', function() {
        
        expect(this.committeeName.is('#fixtures #id_committee_name')).to.be.true;
        expect(this.committeeId.is('#fixtures #id_u_committee')).to.be.true;

    });

    describe('validateCommitteeId', function() {
        beforeEach(function() {
            ;
            this.committeeName.val('ACTBLUE')
            this.committeeId.val('');
            this.validate.handleBlur()
        });


        it('it calls validateCommitteeId on blur', function() {
            
            expect(this.validateCommitteeId).to.have.been.called;
        });


        it('it clears committeeName field if committeeId is empty', function() {
            
            expect(this.committeeName.val()).to.equal('');
        });
    });

    describe('handelBlur function', function() {

        beforeEach(function() {
            this.committeeId.val('');
            this.committeeName.val('ACTBLUE') //.trigger('keyup')
            this.validate.handleBlur()

        });

        it('calls showError on blur', function() {
            
            expect(this.showError).to.have.been.called;
        })

        it('clears committeeName if committeeId is left blank on blur', function() {
            
            expect(this.committeeName.val()).to.equal('')
            expect(this.validateCommitteeId).to.have.been.called;
        })


        it('puts red border around empty(invalid) field', function() {
            
            expect(this.committeeName.attr('class')).to.equal('invalid_border')
        })
    })

    describe('handleSubmit function', function() {

        it('calls show error on submit ', function() {
            this.validate.handleSubmit({ preventDefault: sinon.spy()});
            
            expect(this.validate.showError).to.have.been.called;
        })

        it('renders error message/red border for invalid field', function() {
            //this.id_u_contact_first_name.val('')
            this.validate.handleSubmit({ preventDefault: sinon.spy()});
            
            expect($('.id_u_contact_first_name').text()).to.have.string('Please provide your first name')
        })

        it('does not render error message for valid field', function() {         
            this.id_u_contact_first_name.val('Me')
            this.validate.handleSubmit({ preventDefault: sinon.spy()});

            expect($('.id_u_contact_first_name').text()).to.have.string('')
        })
    });

})