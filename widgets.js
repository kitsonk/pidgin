define([
	'exports',
	'./lib/core/aspect',
	'./lib/core/compose',
	'./lib/core/doc',
	'./lib/core/properties',
	'./lib/dcl/dcl',
	'./ready!WebComponentsReady'
], function (exports, aspect, compose, doc, properties, dcl) {
	'use strict';

	var shadow = properties.shadow;

	var registry = {};

	/**
	 * Registers a widget with the current document.
	 * @param  {String} tag       The custom element tag to associate with this widget
	 * @param  {Function|Array} bases     A base "class" or classes to utilise
	 * @param  {[type]} extension [description]
	 * @return {[type]}           [description]
	 */
	function register(tag, bases, extension) {
		// Check to see if the custom tag is already registered
		if (tag in registry) {
			throw new TypeError('A widget is already registered with tag "' + tag + '".');
		}

		function restore(base) {
			return base && base.prototype && base.prototype._ctor ? base.prototype._ctor : base;
		}

		bases = typeof bases === 'object' && bases instanceof Array ? bases.map(restore) : restore(bases);

		var ctor = dcl(bases, extension);
		if (!(ctor.prototype instanceof HTMLElement)) {
			throw new TypeError('Only classes with HTMLElement in the prototype chain can be registered.');
		}

		shadow(ctor.prototype, 'ctor', ctor);

		/* jshint boss:true */
		return registry[tag] = doc.register(tag, {
			prototype: ctor.prototype
		});
	}

	var widgets = {
		register: register
	};

	/* jshint boss:true */
	return exports = widgets;
});