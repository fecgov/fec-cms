'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var $ = require('jquery');

require('./setup')();

var RadFormValidate = require('../../static/js/pages/radform-validate').RadFormValidate;

var dom =
    '<form class="js-contact-form contact-form" id="radform_id">' +
    '<div class="contact-form__element">' +
    '<hr class="hr--light">'+
    '<div class="row">' +
    '<input type="text" name="committee_name" id="id_committee_name" required>' +
    '<span class="twitter-typeahead" style="position: relative; display: block; height: auto;"><input type="text" name="committee_name" class="js-contact-typeahead tt-input invalid_border" required="" id="id_committee_name" spellcheck="false" dir="auto" aria-activedescendant="" aria-owns="id_committee_name_listbox" role="combobox" aria-autocomplete="list" style="position: relative; vertical-align: top;" aria-expanded="false" autocomplete="off"><span class="error t-sans t-bold id_committee_name" aria-live="polite">Please choose a valid committee</span><span style="color:green" id="chosenId"></span><span role="status" aria-live="polite" style="position: absolute; padding: 0px; border: 0px; height: 1px; width: 1px; margin-bottom: -1px; margin-right: -1px; overflow: hidden; clip: rect(0px, 0px, 0px, 0px); white-space: nowrap;"></span><pre aria-hidden="true" style="position: absolute; visibility: hidden; white-space: pre; font-family: karla, sans-serif; font-size: 14px; font-style: normal; font-variant: normal; font-weight: 400; word-spacing: 0px; letter-spacing: 0px; text-indent: 0px; text-rendering: auto; text-transform: none;">ACT</pre><div role="listbox" class="tt-menu tt-empty" aria-live="polite" aria-expanded="false" style="position: absolute; top: 100%; left: 0px; z-index: 100; display: none;"><div role="presentation" class="tt-dataset tt-dataset-committee"></div></div></span>' +
    '</div>' +
    '</div>' +
    '<input name="u_committee" id="id_u_committee">' +
    '</form>'

describe('RadFormValidate', function() {
    before(function() {

        this.$fixture = $('<div id="fixtures"></div>');
        $('body').append(this.$fixture);

    });

    beforeEach(function() {
         this.$fixture.empty().append(dom);

        this.radform = this.$fixture.find($('.js-contact-form'));
        // this.radform = this.$fixture.find($('#radform_id'));
        // console.log('this.radform'+ this.radform) 

        this.committeeName = this.$fixture.find('#id_committee_name'); 
        console.log('this.committeeName'+ this.committeeName)
 
        this.committeeId = this.$fixture.find("#id_u_committee");
        // //console.log('this.committeeId', this.committeeId)   

        //this.req_fields = this.$fixture.find('[required]');   

        this.showError = sinon.spy(RadFormValidate.prototype, 'showError');
        // //this.showTable = sinon.spy(Tablefilter.prototype, 'showTable');

        this.handleBlur = sinon.spy(RadFormValidate.prototype, 'handleBlur');

        //this.validateCommitteeId = sinon.spy(RadFormValidate.prototype, 'validateCommitteeId');

        this.validate = new RadFormValidate('radform_id');
        //console.log('this.radform.id)'+ this.radform.id) 
        //this.form = new ContactForm($('#form'));
    });

    afterEach(function() {
        this.showError.restore();
        //this.validateCommitteeId.restore()
        this.handleBlur.restore();
    });

    it('locates DOM elements', function() {
        expect(this.committeeName.is('#fixtures #id_committee_name')).to.be.true;
        expect(this.committeeId.is('#fixtures #id_u_committee')).to.be.true;

        //expect(this.validate.id_committee_name.is('#id_committee_name')).to.be.true;
        //expect(this.validate.id_u_committee.is('#id_u_committee')).to.be.true;
    });

    describe('showError', function() {
    beforeEach(function() {
        this.validate.committeeName.val('ACTBLUE');
        this.validate.committeeId.val('C00401224');
        });

    })

    describe('validateCommitteeId', function() {
        beforeEach(function() {
            this.validateCommitteeId = sinon.spy(RadFormValidate.prototype, 'validateCommitteeId');
            //this.committeeId.val('C00401224')
            this.committeeName.val('').blur();
            this.committeeId.val('');
            //this.handleBlur()
            //this.committeeId.val('C00401224')
            //this.validateCommitteeId();
        });

        afterEach(function() {
            this.validateCommitteeId.restore();
            
        });

        // it('it calls validateCommitteeId on blur', function() {
        // //     //target 1978 -- a non pres year
        // //     var commName = this.committeeName.val();
        //     //this.committeeName.val('').blur();
        //     expect(this.validateCommitteeId).to.have.been.called;
        // });
        
        //THIS does not really do annything
        it('it removes comm ID value on blur if no typeahead chosen', function() {
            //target 1978 -- a non pres year
            
            var commId = this.committeeId.val();
            expect(commId).to.equal('');
        });

       
    });

    describe('validateCommitteeId', function() {
        beforeEach(function() {
            //this.handleBlur = sinon.spy(RadFormValidate.prototype, 'handleBlur');
            this.validateCommitteeId = sinon.spy(RadFormValidate.prototype, 'validateCommitteeId');
            //this.handleBlurStub = sinon.stub(validate, 'handleBlur').callsArgWith({results: electionOffices})
            //this.validate.committeeName.value = '';
            //this.validate.committeeId.value = '';
            //console.log('committeeName'+ this.validate.committeeName)
            //$('#id_committee_name').value =''//.blur();
            //$('#id_u_committee').value = 'C00401224'
            //this.$fixture.getElementById('id_u_committee').value = '';
            //$('body').getElementById('id_committee_name').value = '';
            //this.validateCommitteeId();
            //this.$fixture.find('#id_committee_name').value = '';
            //this.$fixture.find("#id_u_committee").value ='';
            //this.committeeName = $('#id_committee_name'); 
            //this.committeeId = $('#id_u_committee');
            this.committeeName.val('ACTBLUE')
            this.committeeId.val('');
            this.validate.handleBlur()
        });

         afterEach(function() {
            this.validateCommitteeId.restore();
            
        });

         it('it calls validateCommitteeId on blur', function() {
        //     //target 1978 -- a non pres year
        //     var commName = this.committeeName.val();
            //this.validate.committeeName.val('ACTBLUE').blur();
            expect(this.validate.validateCommitteeId).to.have.been.called;
        });


         it('it clears committeeName field if committeeId is empty', function() {
        //     //target 1978 -- a non pres year
            
            //this.validate.committeeName.val('ACTBLUE').blur();
            expect(this.committeeName.val()).to.equal('');
        });
     });

    describe('clears comm_name field and add red border if comm_id field is blank on blur', function() {

      beforeEach(function() {
            console.log('CLASS b4'+this.committeeName.attr('class'))
            console.log(this.committeeId.val())
            this.committeeId.val('');
            console.log('NEW'+this.committeeId.val())
            this.committeeName.val('ACTBLUE')//.trigger('keyup')
            console.log('b4 val'+this.committeeName.val())
            this.validate.handleBlur({req:this.committeeName})
            //var req = $('#id_committee_name')
            //this.validate.showError($('#id_committee_name'))
        });

      it('changes comm name and-or comm id', function() {
        //$('#id_committee_name').attr('class', 'this')
        console.log('CLASS AFTER'+this.committeeName.attr('class'))
        //$('#id_u_committee').val('C00401224')
        //this.committeeId.val('C00401224');
        //.trigger('input').blur()

        //expect(this.validateCommitteeId).to.have.been.called;
        //var commname = this.committeeName
        //expect(this.committeeName.attr('class')).to.equal(itsClass);
        console.log(this.committeeName.attr('id'))
        console.log('after val'+this.committeeName.val())
        console.log( $('#id_u_committee').val())
        //expect(this.validate.validateCommitteeId).to.have.been.called;
        
        expect(this.committeeName.val()).to.equal('')
        expect(this.committeeName.attr('class')).to.equal('invalid_border')
        
        //expect(this.committeeName).to.have.attribute('class', 'invalid_border')
        //this.committeeName.should.have.class('invalid_border')
        //expect(commname.getCssProperty('borderColor')).to.be.equal('red');
        //expect(commname.value.getCssProperty('color')).to.be('#fff')
       
        //expect(accountText.value.getCssProperty('color')).to.be('#fff')
        //expect(year.getAttribute('disabled', '')).to.equal('disabled');

      })

    })
})


