define([
	'exports',
	'./tailor',
	'./lib/core/aspect',
	'./lib/core/dom',
	'./lib/core/on',
	'./lib/core/properties',
	'./lib/core/when'
], function (exports, tailor, aspect, dom, on, properties) {
	'use strict';

	/**
	 * Widget Class
	 * @class pidgin/Widget
	 * @constructor
	 */

		// Creates a "shadow" property on the target, which is a non-enumerable value that has '_' appended to the
		// front of it
	var shadow = properties.shadow;

	/**
	 * The base 'class' for Widgets
	 * @param  {Object}         properties   Initial properties which should be mixed into the widget during creation
	 * @param  {DOMNode|String} [sourceNode] The node that should be used to build the widget on top of
	 * @return {pidgin/Widget}               The instance
	 */
	var Widget = tailor(HTMLElement, {
		/**
		 * The declared class
		 * @type {String}
		 */
		declaredClass: 'pidgin/Widget',

		/**
		 * The custom tag this widget will be registered with
		 * @type {String}
		 */
		customTag: 'pd-widget',

		/**
		 * The template for the widget
		 * @type {pidgin/tmpl}
		 */
		template: null,

		/**
		 * Called when the Custom Element is ready.
		 */
		readyCallback: function () {
			shadow(this, 'dom', dom(this.ownerDocument || document));
			if (this.template) {
				this.template.stamp(this);
			}
		},

		/**
		 * Called when inserted into the document flow
		 */
		insertedCallback: function () {

		},

		/**
		 * Called when removed from the document flow
		 */
		removedCallback: function () {

		},

		/**
		 * Called when an attribute is changed
		 */
		attributeChangedCallback: function (/*attributeName*/) {

		},

		/**
		 * Place the widget somewhere in the DOM.  Defaults to appending a child of the referenced node.
		 * @param  {HTMLElement|String} reference  The reference node or ID of the node
		 * @param  {String}             [selector] The optional selector for inserting the node (e.g. '>' for child or
		 *                                         '+' as next sibling)
		 */
		place: function (reference, selector) {
			this._dom.add(this._dom.get(reference), selector || '>', this);
		},

		/**
		 * Assign a listener to events on the widget.
		 * @param  {String}   type     The event type to listen for
		 * @param  {Function} listener The function to invoke when an event is received
		 * @return {Object}			   A handle object that contains a `.remove()` method to remove the listener
		 */
		on: function (type, listener) {
			return this.own(on.parse(this, type, listener, function (target, type) {
				return aspect.after(target, 'on' + type, listener, true);
			}));
		},

		/**
		 * Emit a synthetic event on the widget
		 * @return {Boolean} If the event is cancelable and the event is not cancelled, emit will return true. If the
		 *                   event is cancelable and the event is cancelled, emit will return false.
		 */
		emit: function (/*type, event*/) {
			var args = [ this ];
			args.push.apply(args, arguments);
			return on.emit.apply(on, args);
		},

		/**
		 * Take ownership of a handle that will then be removed when the widget is destroyed
		 * @param {Object...} handle Any number of handles to take ownership of
		 */
		own: function () {
			var i,
				handle,
				destroyMethodName,
				odh,
				hdh;

			for (i = 0; i < arguments.length; i++) {
				handle = arguments[i];
				destroyMethodName = 'destroy' in handle ? 'destroy' : 'remove';
				odh = aspect.before(this, 'destroy', function (preserveDom) {
					handle[destroyMethodName](preserveDom);
				});
				hdh = aspect.after(handle, destroyMethodName, function () {
					odh.remove();
					hdh.remove();
				}, true);
			}

			return arguments;
		},

		/**
		 * Provides a string representation of the Widget
		 * @return {String} The string that represents the Widget
		 */
		toString: function () {
			return '[Widget ' + this.declaredClass + ', ' + (this.id || 'NO ID') + ']';
		}
	});

	/* jshint boss:true */
	return exports = Widget;
});