define([
	'exports',
	'./lib/core/aspect',
	'./lib/core/compose',
	'./lib/core/dom',
	'./lib/core/lang',
	'./lib/core/on',
	'./lib/core/properties',
	'./lib/core/when'
], function (exports, aspect, compose, dom, lang, on, properties, when) {
	'use strict';

	/**
	 * Widget Mixin/Class
	 * @class pidgin/_Widget
	 * @constructor
	 */

		// Creates a "shadow" property on the target, which is a non-enumerable value that has '_' appended to the
		// front of it
	var shadow = properties.shadow,

		// Decorator for ES5 properties
		property = compose.property;

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
	 * Map events from the `item.events`
	 * @param  {pidgin/_Widget} item The target widget that needs its events mapped
	 */
	function mapEvents(item) {
		var events = item.events,
			key, type, selector, value;
		if (events) {
			// Iterate through each event and attach it to the item
			// The key should be in the format of "type" or "selector:type"
			for (key in events) {
				value = events[key];
				key = key.split(':');
				type = key.pop();
				selector = key.join(':');
				if (typeof value === 'string' && value in item) {
					value = item[value];
				}
				item.on(selector ? {
					type: type,
					selector: selector,
					listener: value
				} : {
					type: type,
					listener: value
				});
			}
		}
	}

	/**
	 * Execute the "creation" lifecycle of the widget, where the DOM manipulation library is shadowed, the `.created()`
	 * method is called and if present, the template is stamped out.
	 */
	function createdCallback() {
		var self = this;
		// Shadows the dom manipulation library for this widget
		shadow(self, 'dom', dom(self.ownerDocument || document));

		when(self.created ? self.created.call(self) : false).then(function () {
			if (self.template) {
				return self.template ? self.template.stamp(self) : false;
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
		 * Called when the Custom Element is created.
		 */
		createdCallback: createdCallback,

		/**
		 * The standard has changed from readyCallback to created callback, this is here until Polymer platform
		 * is changed.
		 */
		readyCallback: createdCallback,

		events: {},

		/**
		 * Called during readyCallback.  This can be defined downstream to do any custom functionality to initialise
		 * the instance.  It occurs between any attributes being mapped from the widget and before the template gets
		 * stamped out.
		 */
		created: function () {

		},

		/**
		 * Called when inserted into the document flow
		 */
		insertedCallback: function () {
			var self = this;

			// If there are any attributes to be mapped, map them
			// (This is moved to insertedCallback because MDV doesn't set the bound attributes until sometime
			// between creation and insertion)
			if (self.attributeMap) {
				mapAttributes(self);
			}

			when(self.inserted ? self.inserted.call(self) : false).then(function () {
				mapEvents(self);
			});
		},

		/**
		 * Called during insertedCallback.  This can be defined downstream to do any custom functionality when the
		 * instance is inserted into the document flow.
		 */
		inserted: function () {

		},

		/**
		 * Called when removed from the document flow
		 */
		removedCallback: function () {
			var self = this;

			when(self.removed ? self.removed.call(self) : false);
		},

		/**
		 * Called during removedCallback.  This can be defined downstream to do any custom functionality when the 
		 * instance is inserted into the document flow.
		 */
		removed: function () {

		},

		/**
		 * Called when an attribute is changed
		 */
		attributeChangedCallback: function (/*attributeName*/) {
			var self = this;

			when(self.attributeChanged ? self.attributeChanged.apply(self, arguments) : false);
		},

		/**
		 * Called during attributeChangedCallback.  This can be defined downstream to do any custom functionality when
		 * an attribute has changed on the instance.
		 */
		attributeChanged: function (/*attributeName*/) {

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
		 * Query the sub-DOM of the widget based on the supplied selectors
		 * @return {Array} The selected nodes, if any
		 */
		query: function (/*selectors...*/) {
			return this._dom.query.apply(this, [ this ].concat(Array.prototype.slice.call(arguments)));
		},

		/**
		 * Hide the widget
		 */
		hide: function () {
			this._dom.modify(this, '.pd-hidden');
		},

		/**
		 * Show the widget
		 */
		show: function () {
			this._dom.modify(this, '!.pd-hidden');
		},

		/**
		 * Returns if the widget is currently hidden or not 
		 * @type {Boolean}
		 */
		isHidden: property({
			get: function () {
				return window.getComputedStyle(this, null).getPropertyValue('display') === 'none';
			},
			enumerable: true,
			configurable: true
		}),

		/**
		 * Add a listener for a target
		 * @param  {Object} config A hash that contains the configuration for the listener.  It should contain at least
		 *                         a `type` and `listener` properties.  If it contains a `selector` property, then that
		 *                         will be used to select the node what the listener is on.
		 * @return {Object}        A handle that contains a `remove()` function to remove the listener.
		 */
		on: function (config) {
			var self = this,
				node;

			if (config.selector) {
				node = this.querySelector(config.selector);
				if (!node) {
					console.warn(this.toString() + ' - on() - Did not select any node based on selector: "' +
						config.selector + '"');
				}
			}

			return this.own(on.parse(node || this, config.type, config.listener, function (target, type) {
				return aspect.after(target, 'on' + type, lang.bind(self, config.listener), true);
			}));
		},

		/**
		 * Emits a synthetic event on a target
		 * @param  {[type]} config [description]
		 * @return {[type]}        [description]
		 */
		emit: function (config) {
			var args = [ (config.selector && this.querySelector(config.selector)) || this, config.type, config.event ];
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
			return '[pidgin/Widget, ' + (this.id || 'NO ID') + ']';
		}
	});

	/* jshint boss:true */
	return exports = _Widget;
});