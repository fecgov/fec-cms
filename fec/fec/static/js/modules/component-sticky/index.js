var on = require('emmy/on');
var off = require('emmy/off');

module.exports = Sticky;

/**
 * @constructor
 */
function Sticky(el, options){
	if (el.getAttribute('data-sticky-id') === undefined) {
		return console.log('Sticky already exist');
	}

	this.el = el;
	this.parent = this.el.parentNode;

	//recognize attributes
	var dataset = el.dataset;
	if (!dataset){
		dataset = {};
		if (el.getAttribute('data-within')) dataset['within'] = el.getAttribute('data-within');
		if (el.getAttribute('data-offset')) dataset['offset'] = el.getAttribute('data-offset');
		if (el.getAttribute('data-stack')) dataset['stack'] = el.getAttribute('data-stack');
		if (el.getAttribute('data-sticky-class')) dataset['stickyClass'] = el.getAttribute('data-sticky-class');
	}
	this.options = Object.assign({}, this.options, dataset, options);

	//query selector, if passed one
	if ( typeof this.options['within'] === 'string' && this.options['within'].trim() ){
		this.within = document.body.querySelector(this.options['within']);
	} else {
		this.within = this.options['within'];
	}

	//keep list
	this.el.setAttribute('data-sticky-id', Sticky.list.length);
	this.id = Sticky.list.length;
	Sticky.list.push(this);

	//state
	this.isFixed = false;
	this.isBottom = false;
	this.isTop = true;
	this.updateClasses();

	//boundaries to strict within
	this.restrictBox = {
		top: 0,
		bottom: 9999
	};

	//self position & size
	this.height = 0;
	this.isDisabled = false;

	//parent position & size
	this.parentBox = {
		top: 0,
		height: 0
	}

	//mind gap from bottom & top in addition to restrictBox (for stacks)
	this.options.offset = parseFloat(this.options['offset']) || 0;
	this.offset = {
		top: 0,
		bottom: 0
	};

	//additional gap if item being scrolled
	this.scrollOffset = 0;

	//Detect whether stacking is needed
	var prevEl = this.el;
	this.stackId = [];
	this.stack = [];
	if (this.options['stack']) {
		var stack = this.options['stack'].split(',');
		for (var i = stack.length; i--;){
			stack[i] = stack[i].trim();
			if (!Sticky.stack[stack[i]]) Sticky.stack[stack[i]] = [];
			this.stackId[i] = Sticky.stack[stack[i]].length;
			this.stack.push(stack[i]);
			Sticky.stack[stack[i]].push(this)
		}
	} else {
		this.stackId[0] = Sticky.noStack.length;
		Sticky.noStack.push(this);
	}


	//stub is a spacer filling space when element is stuck
	this.stub = this.el.cloneNode();
	this.stub.classList.add(this.options['stubClass']);
	this.stub.style.visibility = 'hidden';
	this.stub.style.display = 'none';
	this.stub.removeAttribute('hidden');

	//save initial inline style
	this.initialStyle = this.el.style.cssText;
	this.initialDisplay = getComputedStyle(this.el)['display'];

	//ensure parent's container relative coordinates
	var pStyle = getComputedStyle(this.parent);
	if (pStyle.position == 'static') this.parent.style.position = 'relative';

	//bind methods
	this.check = this.check.bind(this);
	this.recalc = this.recalc.bind(this);
	this.disable = this.disable.bind(this);
	this.enable = this.enable.bind(this);
	this.bindEvents = this.bindEvents.bind(this);
	this.adjustSizeAndPosition = this.adjustSizeAndPosition.bind(this);
	this.park = this.park.bind(this);
	this.stick = this.stick.bind(this);
	this.parkStack = this.parkStack.bind(this);
	this.stickStack = this.stickStack.bind(this);
	this.captureScrollOffset = this.captureScrollOffset.bind(this);
	this.observeStackScroll = this.observeStackScroll.bind(this);
	this.stopObservingStackScroll = this.stopObservingStackScroll.bind(this);

	if (this.initialDisplay === 'none') {
		this.initialDisplay = 'block';
		this.disable();
	}
	else this.enable();
}

//list of instances
Sticky.list = [];
//mutually exclusive items
Sticky.noStack = [];
//stacks of items
Sticky.stack = {};
//heights of stacks
Sticky.stackHeights = {};


/** Update all sticky instances */
Sticky.recalc = function () {
	Sticky.list.forEach(function (instance) {
		instance.recalc();
	});
};


/** API events */
on(document, 'sticky:recalc', Sticky.recalc);


var proto = Sticky.prototype;


proto.options = {
	'offset': 0,
	'within': null, //element or bounding box
	'stubClass': 'sticky-stub',
	'stickyClass': 'is-stuck',
	'bottomClass': 'is-bottom',
	'topClass': 'is-top',
	'stack': null,
	'collapse': true,
	'recalcInterval': 20
};


/** when element removed or made hidden. */
proto.disable = function(){
	if (this.stub.parentNode) this.parent.removeChild(this.stub);
	this.unbindEvents();
	this.isDisabled = true;
	Sticky.recalc();
};


/** enables previously disabled element */
proto.enable = function(){
	if (!this.stub.parentNode) this.parent.insertBefore(this.stub, this.el);
	this.isDisabled = false;
	this.bindEvents();
	Sticky.recalc();
};


proto.bindEvents = function(){
	on(document, 'scroll', this.check);
	on(window, 'resize', this.recalc);
	on(this.el, 'mouseover', this.observeStackScroll);
	on(this.el, 'mouseout', this.stopObservingStackScroll);
};


proto.unbindEvents = function(){
	off(document, 'scroll', this.check);
	off(window, 'resize', this.recalc);
	off(this.el, 'mouseover', this.observeStackScroll);
	off(this.el, 'mouseout', this.stopObservingStackScroll);
};


/** changing state necessity checker */
proto.check = function(){
	var vpTop = window.pageYOffset || document.documentElement.scrollTop;
	//console.log('check:' + this.el.dataset['stickyId'], 'isFixed:' + this.isFixed, this.restrictBox)
	if (this.isFixed){
		if (!this.isTop && vpTop + this.offset.top + this.options.offset + this.height + this.mt + this.mb + this.scrollOffset >= this.restrictBox.bottom - this.offset.bottom){
			//check bottom parking needed
			this.parkBottom();
		}
		if (!this.isBottom && vpTop + this.offset.top + this.options.offset + this.mt + this.scrollOffset <= this.restrictBox.top){
			//check top parking needed
			this.parkTop();
		}
	} else {
		if (this.isTop || this.isBottom){
			if (vpTop + this.offset.top + this.options.offset + this.mt > this.restrictBox.top){
				//fringe violation from top
				if (vpTop + this.offset.top + this.options.offset + this.height + this.mt + this.mb < this.restrictBox.bottom - this.offset.bottom){
					//fringe violation from top or bottom to the sticking zone
					this.stick();
				} else if (!this.isBottom) {
					//fringe violation from top lower than bottom
					this.stick();
					this.parkBottom();
				}
			} else if(this.isBottom){
				//fringe violation from bottom to higher than top
				this.stick();
				this.parkTop();
			}
		}
	}
};


/**
 * sticking inner routines
 * when park top needed
 */
proto.parkTop = function(){
	//this.el = this.parent.removeChild(this.el);
	this.el.style.cssText = this.initialStyle;
	//this.stub = this.parent.replaceChild(this.el, this.stub);
	this.stub.style.display = 'none';

	this.scrollOffset = 0;

	this.isFixed = false;
	this.isTop = true;
	this.isBottom = false;
	this.updateClasses();

	this.isStackParked = true;

	// console.log('parkTop', this.id)
};


/** when stop needed somewhere in between top and bottom */
proto.park = function(){
	// console.log('parkMiddle', this.id)

	this.isFixed = false;
	this.isTop = false;
	this.isBottom = false;
	this.updateClasses();

	this.isStackParked = true;

	var offset = (window.pageYOffset || document.documentElement.scrollTop) + this.offset.top - this.parentBox.top + this.scrollOffset;
	this.makeParkedStyle(offset);
};

/**
 * to make fixed
 * enhanced replace: faked visual stub is fastly replaced with natural one
 */
proto.stick = function(){
	//this.el = this.parent.replaceChild(this.stub, this.el);
	this.stub.style.display = this.initialDisplay;
	this.makeStickedStyle();
	//this.parent.insertBefore(this.el, this.stub);

	this.isFixed = true;
	this.isTop = false;
	this.isBottom = false;
	this.updateClasses();

	this.isStackParked = false;

	// console.log('stick', this.id)
};


/** when bottom land needed */
proto.parkBottom = function(){
	this.makeParkedBottomStyle();

	this.scrollOffset = 0;

	this.isFixed = false;
	this.isBottom = true;
	this.isTop = false;
	this.updateClasses();

	this.isStackParked = true;

	// console.log('parkBottom', this.id)
};


/**
 * park all items within stack passed/all stacks of this
 * used when item was scrolled on
 */
proto.parkStack = function(){
	var stack = Sticky.stack[this.stack[0]];

	for (var i = 0; i < stack.length; i++){
		var item = stack[i]
		item.park();
	}
};


/** unpark all items of stack passed */
proto.stickStack = function(){
	var stack = Sticky.stack[this.stack[0]]
	var first = stack[0], last = stack[stack.length - 1];

	for (var i = 0; i < stack.length; i++){
		var item = stack[i]
		item.stick();
	}
};

/**
 * begin observing scroll to park stack
 */
proto.observeStackScroll = function(){
	var stack = Sticky.stack[this.stack[0]]
	if (!stack) return;

	var first = stack[0], last = stack[stack.length - 1];

	//if stack is parked top or parked bottom - ignore
	if (first.isTop || last.isTop) return;

	//if stack isn’t higher than window height - ignore
	if (Sticky.stackHeights[this.stack[0]] <= window.innerHeight && this.scrollOffset >= 0) return;

	//capture stack’s scroll
	this.scrollStartOffset = (window.pageYOffset || document.documentElement.scrollTop) + this.scrollOffset;

	on(document, 'scroll', this.captureScrollOffset);

	return this;
};

/** stop observing scroll */
proto.stopObservingStackScroll = function(){
	var stack = Sticky.stack[this.stack[0]];
	if (!stack) return;

	var last = stack[stack.length-1], first = stack[0];

	off(document, 'scroll', this.captureScrollOffset);

	if (first.isTop || first.isBottom || last.isTop || last.isBottom) {
		return;
	}
	if (this.isStackParked) this.stickStack();
};

/** when item was scrolled on - capture how much it is scrolled */
proto.captureScrollOffset = function(e){

	var scrollOffset = this.scrollStartOffset - (window.pageYOffset || document.documentElement.scrollTop);
	var stack = Sticky.stack[this.stack[0]];
	var last = stack[stack.length-1], first = stack[0];

	//ignore outside sticking
	if (first.isTop || first.isBottom || last.isTop || last.isBottom) {
		return;
	}

	var stickNeeded = false, parkNeeded = false;

	//if bottom is higher or equal than viewport’s bottom - stick within viewport
	if ( scrollOffset < window.innerHeight - (Sticky.stackHeights[this.stack[0]]) ){
		scrollOffset = window.innerHeight - (Sticky.stackHeights[this.stack[0]]);
		this.scrollStartOffset = (window.pageYOffset || document.documentElement.scrollTop) + scrollOffset;
		stickNeeded = true;
	}

	//if top is lower or equal to the viewport’s top - stick within viewport
	else if ( scrollOffset > 0){
		scrollOffset = 0;
		this.scrollStartOffset = (window.pageYOffset || document.documentElement.scrollTop);
		stickNeeded = true;
	}

	//if stack items is somewhere in between
	else if (!this.isStackParked ){
		parkNeeded = true;
	}

	for (var i = 0; i < stack.length; i++){
		var item = stack[i]
		item.scrollOffset = scrollOffset
	}

	if (stickNeeded && this.isStackParked) return this.stickStack();
	else if (parkNeeded && !this.isStackParked) return this.parkStack();
};

/** set up style of element as if it is parked somewhere / at the bottom */
proto.makeParkedStyle = function(top){
	this.el.style.cssText = this.initialStyle;
	this.el.style.position = 'absolute';
	this.el.style.top = top + 'px';
	mimicStyle(this.el, this.stub);
	this.el.style.left = this.stub.offsetLeft + 'px';
};

proto.makeParkedBottomStyle = function(){
	this.makeParkedStyle(this.restrictBox.bottom - this.offset.bottom - this.parentBox.top - this.height - this.mt - this.mb);
};

proto.makeStickedStyle = function(){
	this.el.style.cssText = this.initialStyle;
	this.el.style.position = 'fixed';
	this.el.style.top = this.offset.top + this.options.offset + this.scrollOffset + 'px';
	mimicStyle(this.el, this.stub);
};

//makes element classes reflecting it's state (this.isTop, this.isBottom, this.isFixed)
proto.updateClasses = function(){
	if (this.isTop){
		this.el.classList.add(this.options['topClass']);
	} else {
		this.el.classList.remove(this.options['topClass']);
	}

	if (this.isFixed){
		this.el.classList.add(this.options['stickyClass']);
	} else {
		this.el.classList.remove(this.options['stickyClass']);
	}

	if (this.isBottom){
		this.el.classList.add(this.options['bottomClass']);
	} else {
		this.el.classList.remove(this.options['bottomClass']);
	}
};


proto.recalc = function(){
	//console.group('recalc:' + this.el.dataset['stickyId'])
	//element to mimic visual properties from
	var measureEl = (this.isTop ? this.el : this.stub);

	//update stub content
	this.stub.innerHTML = this.el.innerHTML;
	cleanNode(this.stub);

	//update parent container size & offsets
	this.parentBox = getOffset(this.parent);

	//update self size & position
	this.height = this.el.offsetHeight;
	var mStyle = getComputedStyle(measureEl);
	this.ml = ~~mStyle.marginLeft.slice(0,-2);
	this.mr = ~~mStyle.marginRight.slice(0,-2);
	this.mt = ~~mStyle.marginTop.slice(0,-2);
	this.mb = ~~mStyle.marginBottom.slice(0,-2);

	this.scrollOffset = 0;

	//update restrictions
	this.restrictBox = this.getRestrictBox(this.within, measureEl);

	//make restriction up to next sibling within one container
	var prevSticky;
	this.offset.bottom = 0;
	this.offset.top = 0;
	if (this.stack.length){
		for (var i = this.stack.length; i--;){
			if (prevSticky = Sticky.stack[this.stack[i]][this.stackId[i] - 1]){
				//make offsets for stacked mode
				var prevMeasurer = (prevSticky.isTop ? prevSticky.el : prevSticky.stub);
				this.offset.top = prevSticky.offset.top + prevSticky.options.offset;
				if (!(this.options['collapse'] && !isOverlap(measureEl, prevMeasurer))) {
					this.offset.top += prevSticky.height + Math.max(prevSticky.mt, prevSticky.mb)//collapsed margin
					var nextSticky = Sticky.stack[this.stack[i]][this.stackId[i]];
					//multistacking-way of correcting bottom offsets
					for( var j = this.stackId[i] - 1; (prevSticky = Sticky.stack[this.stack[i]][j]); j--){
						prevSticky.offset.bottom = Math.max(prevSticky.offset.bottom, nextSticky.offset.bottom + nextSticky.height + nextSticky.mt + nextSticky.mb);
						nextSticky = prevSticky;
					}
				}
			}

			//track stack heights;
			Sticky.stackHeights[this.stack[i]] = this.offset.top + this.height + this.mt + this.mb;
		}
	} else if (prevSticky = Sticky.noStack[this.stackId[0] - 1]){
		prevSticky.restrictBox.bottom = this.restrictBox.top - this.mt;
	}

	clearTimeout(this._updTimeout);
	this._updTimeout = setTimeout(this.adjustSizeAndPosition, 0);
};


/**
 * return box with sizes based on any restrictwithin object passed
 */
proto.getRestrictBox = function(within, measureEl){
	var restrictBox = {
		top: 0,
		bottom: 0
	};
	if (within instanceof Element){
		var offsetRect = getOffset(within)
		restrictBox.top = Math.max(offsetRect.top, getOffset(measureEl).top);
		//console.log(getOffset(this.stub))
		restrictBox.bottom = within.offsetHeight + offsetRect.top;
	} else if (within instanceof Object) {
		if (within.top instanceof Element) {
			var offsetRect = getOffset(within.top)
			restrictBox.top = Math.max(offsetRect.top, getOffset(measureEl).top);
		} else {
			restrictBox.top = within.top;
		}
		if (within.bottom instanceof Element) {
			var offsetRect = getOffset(within.bottom)
			restrictBox.bottom = within.bottom.offsetHeight + offsetRect.top;
			//console.log(offsetRect)
		} else {
			restrictBox.bottom = within.bottom;
		}
	} else {
		//case of parent container
		restrictBox.top = getOffset(measureEl).top;
		restrictBox.bottom = this.parentBox.height + this.parentBox.top;
	}
	//console.log('Restrictbox', restrictBox)
	return restrictBox;
};


proto.adjustSizeAndPosition = function(){
	if (this.isTop){
		this.el.style.cssText = this.initialStyle;
	} else if (this.isBottom){
		this.makeParkedBottomStyle();
	} else {
		this.makeStickedStyle();
	}

	this.check();
};




/** removes iframe, objects etc shit */
var badTags = ['object', 'iframe', 'embed', 'img'];
function cleanNode(node){
	node.removeAttribute('id');
	var idTags = node.querySelectorAll('[id]');
	for (var k = 0; k < idTags.length; k++){
		idTags[k].removeAttribute('id'); //avoid any uniqueness
		idTags[k].removeAttribute('name'); //avoid any uniqueness
	}
	for (var i = 0; i < badTags.length; i++){
		var tags = node.querySelectorAll(badTags[i]);
		for (var j = tags.length; j--; ){
			if (tags[j].tagName === 'SCRIPT') tags[j].parentNode.replaceChild(tags[j])
			tags[j].removeAttribute('src');
			tags[j].removeAttribute('href');
			tags[j].removeAttribute('rel');
			tags[j].removeAttribute('srcdoc');
		}
	}
}


var directions = ['left', 'top', 'right', 'bottom'],
	mimicProperties = ['padding-', 'border-'];


/** copies size-related style of stub */
function mimicStyle(to, from){
	var stubStyle = getComputedStyle(from),
		stubOffset = getOffset(from),
		pl = 0, pr = 0, ml = 0;

	if (stubStyle['box-sizing'] !== 'border-box'){
		pl = ~~stubStyle.paddingLeft.slice(0,-2)
		pr = ~~stubStyle.paddingRight.slice(0,-2)
	}
	to.style.width = (stubOffset.width - pl - pr) + 'px';
	to.style.left = stubOffset.left + 'px';
	to.style.marginLeft = 0;
	for (var i = 0; i < mimicProperties.length; i++){
		for (var j = 0; j < directions.length; j++){
			var prop = mimicProperties[i] + directions[j];
			to.style[prop] = stubStyle[prop];
		}
	}
}


/** checks overlapping widths */
function isOverlap(left, right){
	var lLeft = left.offsetLeft,
		lRight = left.offsetLeft + left.offsetWidth,
		rLeft = right.offsetLeft,
		rRight = right.offsetWidth + right.offsetLeft;
	if (lRight < rLeft && lLeft < rLeft
		|| lRight > rRight && lLeft > rRight){
		return false;
	}
	return true;
}


function getOffset(el) {
	let rect = el.getBoundingClientRect()

	//whether element is or is in fixed
	var fixed = isFixed(el);
	var xOffset = fixed ? 0 : window.pageXOffset;
	var yOffset = fixed ? 0 : window.pageYOffset;

	return {
		left: rect.left + xOffset,
		top: rect.top + yOffset,
		width: rect.width,
		height: rect.height
	};
}

function isFixed (el) {
	var parentEl = el;

	//window is fixed, btw
	if (el === window) return true;

	//unlike the doc
	if (el === document) return false;

	while (parentEl) {
		if (getComputedStyle(parentEl).position === 'fixed') return true;
		parentEl = parentEl.offsetParent;
	}
	return false;
}
