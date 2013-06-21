define([
	'exports',
	'./registry',
	'./lib/core/aspect',
	'./lib/core/compose',
	'./lib/core/dom',
	'./lib/core/lang',
	'./lib/core/on',
	'./lib/core/properties',
	'./lib/core/when'
], function (exports, registry, aspect, compose, dom, lang, on, properties, when) {
	'use strict';

	/**
	 * Widget Class
	 * @class pidgin/Widget
	 * @constructor
	 */

		// Creates a property in the compose prototype that is based off an EF5 descriptor
	var property = compose.property,

		// Creates a "shadow" property on the target, which is a non-enumerable value that has '_' appended to the
		// front of it
		shadow = properties.shadow,

		// Creates a non-writable but enumerable property on the target
		readOnly = properties.readOnly;

	/**
	 * The base 'class' for Widgets
	 * @param  {Object}         properties   Initial properties which should be mixed into the widget during creation
	 * @param  {DOMNode|String} [sourceNode] The node that should be used to build the widget on top of
	 * @return {pidgin/Widget}               The instance
	 */
	var Widget = compose(function (properties, sourceNode) {
		this.create(properties, sourceNode);
	}, {
		/**
		 * The declared class
		 * @type {String}
		 */
		declaredClass: property({
			value: 'pidgin/Widget',
			configurable: true
		}),

		/**
		 * The identifier for the widget
		 * @type {String}
		 */
		id: '',

		/**
		 * The root node for the widget
		 * @type {DOMNode}
		 */
		node: null,

		/**
		 * The original node for the widget
		 * @type {DOMNode}
		 */
		sourceNode: null,

		/**
		 * The function, called by the constructor that creates the widget.
		 * @param  {Object} properties Initial properties of the widget that should be mixed in
		 * @param  {DOMNode} sourceNode The node that should be used to build the widget around
		 */
		create: function (properties, sourceNode) {
			var self = this,
				deleteSourceNode;

			// this likely doesn't handle multi-doc properly
			readOnly(self, 'sourceNode', dom.get(sourceNode));

			// Maybe this mixin should be moved somewhere else in the lifecycle?  It seems early and maybe responsive
			// values should be handled later on
			if (properties) {
				lang.mixin(self, properties);
			}

			// Call `postMixinProperties` but handle potentially deferred returns from the function
			when(self.postMixinProperties()).then(function () {

				// If we don't have an ID, go ahead and assign a unique one
				if (!self.id) {
					self.id = registry.getUID(self.declaredClass.replace(/\//g, '_'));
				}

				// Retrieve the dom manipulation library for the document related to this widget
				shadow(self, 'dom', dom(properties.ownerDocument ||
					(self.sourceNode ? self.sourceNode.ownerDocument : document)));

				// Register the widget with the registry
				registry.add(self);

				// Call build, but again account for potential deferred returns
				return self.build();
			}).then(function () {
				if (self.node) {
					// TODO: apply attributes to node

					// If the node and the sourceNode aren't the same, go ahead and swap them out
					var sourceNode = self.sourceNode;
					if (sourceNode && sourceNode.parentNode && self.node !== sourceNode) {
						sourceNode.parentNode.replaceChild(this.node, sourceNode);
						deleteSourceNode = true;
					}
				}

				// Call `postCreate` and handle a deferred return
				return self.postCreate();
			}).then(function () {
				// We can safely delete the source node
				if (deleteSourceNode) {
					delete self.sourceNode;
				}

				// Set the `_created` flag
				shadow(self, 'created', true);
			});
		},

		/**
		 * Called once the initial properties have been mixed into the widget, but the DOM for the widget has not been
		 * built yet.
		 * @return {Boolean|Promise} If a promise is returned, the widget lifecycle will wait until it is fulfilled
		 */
		postMixinProperties: function () {

		},

		/**
		 * Called once the creation lifecycle is complete, but before the widget is flagged as created.
		 * @return {Boolean|Promise} If a promise is returned, the widget lifecycle will wait until it is fulfilled
		 */
		postCreate: function () {

		},

		/**
		 * Build the initial DOM structure for the widget
		 * @return {Boolean|Promise} If a promise is returned, the widget lifecycle will wait until it is fulfilled
		 */
		build: function () {
			if (!this.node) {
				readOnly(this, 'node', this.sourceNode || this.ownerDocument.createElement('div'));
			}
		},

		/**
		 * Start the widget
		 */
		start: function () {
			if (this._started) {
				return;
			}
			shadow(this, 'started', true);
		},

		/**
		 * Place the widget in the document
		 * @param  {String|pidgen/Widget|DOMNode} reference  The referenced string (which would identify a widget or DOM
		 *                                                   node ID), a Widget instance, or a DOMNode
		 * @param  {String|Number}                [selector] If adding to a widget that handles children, then the
		 *                                                   numerical position of this child, otherwise the dom library
		 *                                                   selector to identify where to place the widget.
		 */
		place: function (reference, selector) {
			var referenceWidget = !reference.tagName && registry.byId(reference);
			if (referenceWidget && referenceWidget.addChild && (!selector || typeof selector !== 'number')) {
				referenceWidget.addChild(this, selector);
			}
			else {
				this._dom.add(this._dom.get(reference), selector || '>', this.node);
			}
		},

		/**
		 * Assign a listener to events on the widget.
		 * @param  {String}   type     The event type to listen for
		 * @param  {Function} listener The function to invoke when an event is received
		 * @return {Object}			   A handle object that contains a `.remove()` method to remove the listener
		 */
		on: function (type, listener) {
			return this.own(on.parse(this.node, type, listener, function (target, type) {
				return aspect.after(target, 'on' + type, listener, true);
			}));
		},

		/**
		 * Emit a synthetic event on the widget
		 * @return {Boolean} If the event is cancelable and the event is not cancelled, emit will return true. If the
		 *                   event is cancelable and the event is cancelled, emit will return false.
		 */
		emit: function (/*type, event*/) {
			var args = [ this.node ];
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
		 * Destroy the widget
		 * @param  {Boolean} [preserveDom] If `true` then do not remove any generated DOM
		 */
		destroy: function (preserveDom) {
			shadow(this, 'destroying', true);

			function destroy(w) {
				if (w.destroyRecursive) {
					w.destroyRecursive(preserveDom);
				}
				else if (w.destroy) {
					w.destory(preserveDom);
				}
			}

			if (this.node) {
				registry.find(this.node, this.containerNode).forEach(destroy);
			}

			this.destroyRendering(preserveDom);
			registry.remove(this.node);
			shadow(this, 'destroyed', true);
		},

		/**
		 * Destroy any of the rendered DOM for the widget
		 * @param  {Boolean} [preserveDom] If `true`, the DOM will actually be removed from the document flow, but only
		 *                                 dereferenced from the widget object
		 */
		destroyRendering: function (preserveDom) {
			if (this.node) {
				if (!preserveDom) {
					this._dom.remove(this.node);
				}
				delete this.node;
			}
			if (this.sourceNode) {
				if (!preserveDom) {
					this._dom.remove(this.sourceNode);
				}
				delete this.sourceNode;
			}
		},

		toString: function () {
			return '[Widget ' + this.declaredClass + ', ' + (this.id || 'NO ID') + ']';
		}
	});

	/* jshint boss:true */
	return exports = Widget;
});