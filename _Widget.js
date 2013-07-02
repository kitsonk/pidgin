define([
	'exports',
	'./lib/core/aspect',
	'./lib/core/compose',
	'./lib/core/dom',
	'./lib/core/lang',
	'./lib/core/on',
	'./lib/core/properties'
], function (exports, aspect, compose, dom, lang, on, properties) {
	'use strict';

	/**
	 * Widget Mixin/Class
	 * @class pidgin/_Widget
	 * @constructor
	 */

	// Creates a "shadow" property on the target, which is a non-enumerable value that has '_' appended to the
	// front of it
	var shadow = properties.shadow;

	/**
	 * Map attributes from the item into properties of the item. The items to be mapped are defined within
	 * item.attributeMap
	 * @param  {pidgin/_Widget} item The target item to be mapped
	 */
	function mapAttributes(item) {
		var attributeMap = typeof item.attributeMap === 'string' ? item.attributeMap.split(/\s+/) : item.attributeMap,
			type, value;

		function stringToObject(value) {
			var obj;

			try {
				/* jshint evil:true */
				obj = eval('(' + (value[0] === '{' ? '' : '{') + value + (value[0] === '{' ? '' : '}') + ')');
			}
			catch (e) {
				throw new SyntaxError('Error in attribute conversion to object: ' + e.message + '\nAttribute Value: "' +
					value + '"');
			}
			return obj;
		}

		attributeMap.forEach(function (name) {
			if (item.hasAttribute(name)) {
				value = item.getAttribute(name);
				type = typeof item[name];
				switch (type) {
				case 'string':
					item[name] = value;
					break;
				case 'number':
					item[name] = value - 0;
					break;
				case 'boolean':
					item[name] = value !== 'false';
					break;
				case 'object':
					if (item[name] instanceof Array) {
						item[name] = value ? value.split(/\s+/) : [];
					}
					else {
						item[name] = stringToObject(value);
					}
					break;
				case 'function':
					/* jshint evil:true */
					item[name] = lang.getObject(value, false) || new Function(value);
					break;
				}
			}
		});
	}

	/**
	 * The base 'class' for Widgets
	 * @param  {Object}         properties   Initial properties which should be mixed into the widget during creation
	 * @param  {DOMNode|String} [sourceNode] The node that should be used to build the widget on top of
	 * @return {pidgin/Widget}               The instance
	 */
	var _Widget = compose({
		/**
		 * A flag that identifies this is a pidgin widget
		 * @type {Boolean}
		 */
		isPidginWidget: true,

		/**
		 * A list of attributes that mirror properties on the widget which is either an array of strings or a string
		 * where the attribute names are separated by spaces
		 * @type {Array|String}
		 */
		attributeMap: null,

		/**
		 * The template for the widget
		 * @type {pidgin/tmpl}
		 */
		template: null,

		/**
		 * Called when the Custom Element is ready.
		 */
		readyCallback: function () {
			// Shadows the dom manipulation library for this widget
			shadow(this, 'dom', dom(this.ownerDocument || document));

			// If there are any attributes to be mapped, map them
			if (this.attributeMap) {
				mapAttributes(this);
			}

			// Call startup method if present
			if (this.startup) {
				this.startup.call(this);
			}

			// If there is a template, stamp it out.
			if (this.template) {
				this.template.stamp(this);
			}
		},

		/**
		 * Called during readyCallback.  This can be defined downstream to do any custom functionality to initialise
		 * the instance.  It occurs between any attributes being mapped from the widget and before the template gets
		 * stamped out.
		 */
		startup: function () {

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
	return exports = _Widget;
});