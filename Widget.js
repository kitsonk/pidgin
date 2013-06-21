define([
	'exports',
	'./registry',
	'./Destroyable',
	'./lib/core/aspect',
	'./lib/core/compose',
	'./lib/core/dom',
	'./lib/core/lang',
	'./lib/core/on',
	'./lib/core/properties',
	'./lib/core/when'
], function (exports, registry, Destoryable, aspect, compose, dom, lang, on, properties, when) {
	'use strict';

	var property = compose.property,
		shadow = properties.shadow,
		readOnly = properties.readOnly;

	function nonEmptyDomAttributeDescriptor(name) {
		return {
			get: function () {
				return this.node ? this.node[name] : '';
			},
			set: function (value) {
				if (this.node) {
					if (value) {
						this._dom.modify(this.node, '[' + name + '=' + value + ']');
					}
					else {
						this._dom.modify(this.node, '![' + name + ']');
					}
				}
			},
			enumerable: true
		};
	}

	var Widget = compose(Destoryable, function (properties, sourceNode) {
		this.create(properties, sourceNode);
	}, {
		declaredClass: property({
			value: 'pidgin/Widget',
			configurable: true
		}),

		id: '',

		baseClass: '',
		node: null,
		sourceNode: null,

		create: function (properties, sourceNode) {
			var self = this,
				deleteSourceNode;
			// this likely doesn't handle multi-doc properly
			readOnly(self, 'sourceNode', dom.get(sourceNode));
			if (properties) {
				lang.mixin(self, properties);
			}

			when(self.postMixinProperties()).then(function () {
				if (!self.id) {
					self.id = registry.getUID(self.declaredClass.replace(/\//g, '_'));
				}

				shadow(self, 'dom', dom(properties.ownerDocument ||
					(self.sourceNode ? self.sourceNode.ownerDocument : document)));
				registry.add(self);

				return self.build();
			}).then(function () {
				if (self.node) {
					// apply attributes

					var sourceNode = self.sourceNode;
					if (sourceNode && sourceNode.parentNode && self.node !== sourceNode) {
						sourceNode.parentNode.replaceChild(this.node, sourceNode);
						deleteSourceNode = true;
					}
				}
				return self.postCreate();
			}).then(function () {
				if (deleteSourceNode) {
					delete self.sourceNode;
				}
				shadow(self, 'created', true);
			});
		},

		postMixinProperties: function () {

		},

		postCreate: function () {

		},

		build: function () {
			if (!this.node) {
				readOnly(this, 'node', this.sourceNode || this.ownerDocument.createElement('div'));
			}
		},

		start: function () {
			if (this._started) {
				return;
			}
			shadow(this, 'started', true);
		},

		place: function (reference, selector) {
			var referenceWidget = !reference.tagName && registry.byId(reference);
			if (referenceWidget && referenceWidget.addChild && (!selector || typeof selector !== 'number')) {
				referenceWidget.addChild(this, selector);
			}
			else {
				this._dom.add(reference, selector || '>', this.node);
			}
		},

		on: function (type, listener) {
			return on.parse(this.node, type, listener, function (target, type) {
				return aspect.after(target, 'on' + type, listener, true);
			});
		},

		emit: function (/*type, event*/) {
			var args = [ this.node ];
			args.push.apply(args, arguments);
			return on.emit.apply(on, args);
		},

		destory: function (preserveDom) {
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

		destoryRendering: function (preserveDom) {
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

	Widget.nonEmptyDomAttributeDescriptor = nonEmptyDomAttributeDescriptor;

	/* jshint boss:true */
	return exports = Widget;
});