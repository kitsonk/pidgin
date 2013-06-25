define([
	'exports',
	'./lib/core/has',
	'./lib/core/lang',
	'./lib/core/properties',
	'./lib/core/doc',
	'./lib/core/dom',
	'./ready!WebComponentsReady'
], function (exports, has, lang, properties, doc, dom) {
	'use strict';

	has.add('dom-custom-elements', 'register' in doc);

	if (!has('dom-custom-elements')) {
		throw new Error('DOM Custom Elements support required.');
	}

	var slice = Array.prototype.slice;

	var registry = {};

	/**
	 * Returns if a particular method is found somewhere in an array of prototypes
	 * @param  {Function}  method The method to search for
	 * @param  {String}    name   The name of the method to search for
	 * @param  {Array}     protos An array of prototypes to search
	 * @return {Boolean}          `true` if the method is found, `false` if not found
	 */
	function isInMethodChain(method, name, protos) {
		return protos.some(function (proto) {
			return proto[name] === method;
		});
	}

	/**
	 * Collapse a set of prototypes, resolving diamond inheritance
	 * @param  {Array} items An array of prototypes/constructors to collapse
	 * @return {Array}       The base array of prototypes
	 */
	function getBases(items) {
		var bases = [];

		function iterate(items, checkChildren) {
			outer:
			for (var i = 0; i < items.length; i++) {
				var item = items[i],
					target = typeof item === 'function' ? item.prototype : item;
				if (typeof item === 'function') {
					var itemBases = checkChildren && item._bases;
					if (itemBases) {
						iterate(itemBases);
					}
					else {
						for (var j = 0; j < bases.length; j++) {
							if (target === bases[j]) {
								continue outer;
							}
						}
						bases.push(target);
					}
				}
			}
		}

		iterate(items, true);
		return bases;
	}

	/**
	 * A custom mixin function that mixes properties into the destination, resolving conflicts and installing decorators
	 * @param  {Object} dest    An object, usually a prototype for a constructor
	 * @param  {Array}  sources An array of objects/prototypes or constructor functions to mix into the `dest`
	 * @return {Object}         The resolved prototype
	 */
	function mixin(dest, sources) {
		var source,
			i;

		/**
		 * Assign a value to a property in a destination by either direct assignment if the value is present in the
		 * destination or by defining a property using the supplied descriptor.
		 * @param {Object} dest       The destination object
		 * @param {String} key        The name of the property
		 * @param {Any}    value      The value of the property
		 * @param {Object} descriptor A property descriptor
		 */
		function set(dest, key, value, descriptor) {
			if (key in dest && dest.hasOwnProperty(key)) {
				dest[key] = value;
			}
			else {
				Object.defineProperty(dest, key, descriptor);
			}
		}

		/**
		 * Take a prototype and mix it into an object.  This differs from just mixing in an object due to trying to
		 * resolve the prototype's chain.  It mixes in all the prototype's own properties (including non-enumerable) and
		 * any enumerable properties from the prototype chain.
		 * @param  {Object} dest  The destination object
		 * @param  {Object} proto The source prototype
		 */
		function mixinPrototype(dest, proto) {
			var keys = Object.getOwnPropertyNames(proto),
				key,
				value,
				descriptor,
				own,
				i;

			for (key in proto) {
				if (!~keys.indexOf(key)) {
					keys.push(key);
				}
			}
			for (i = 0; i <= keys.length; i++) {
				key = keys[i];
				descriptor = properties.getDescriptor(proto, key);
				value = proto[key];
				own = proto.hasOwnProperty(key);
				if (typeof value === 'function' && key in dest && value !== dest[key]) {
					if (value === required) {
						descriptor = properties.getDescriptor(dest, key);
						value = dest[key];
					}
					else if (!own) {
						if (isInMethodChain(value, key,
								getBases(slice.call(sources, 0, i + 1), true))) {
							descriptor = properties.getDescriptor(dest, key);
							value = dest[key];
						}
						else if (!isInMethodChain(value, key, getBases([ proto ], true))) {
							console.error('Conflicted method "' + key + '", final constructor must explcity override' +
								' with correct method');
						}
					}
				}
				if (value && value.install && own && !isInMethodChain(dest[key], key, getBases([ proto ], true))) {
					value.install.call(dest, key);
				}
				else {
					set(dest, key, value, descriptor);
				}
			}
		}

		/**
		 * Take an object and mixin the property into the destination.  This will only mixin enumerable own properties
		 * from the source object.
		 * @param  {Object} dest The destination object
		 * @param  {Object} obj  The source object
		 */
		function mixinObject(dest, obj) {
			var keys = Object.keys(obj),
				key, i, value, descriptor;

			for (i = 0; i < keys.length; i++) {
				key = keys[i];
				descriptor = properties.getDescriptor(obj, key);
				value = obj[key];
				if (typeof value === 'function') {
					if (value.install) {
						value.install.call(dest, key);
						continue;
					}
					if ((key in dest) && value === required) {
						continue;
					}
				}
				set(dest, key, value, descriptor);
			}
		}

		// Iterate through the sources
		for (i = 0; i < sources.length; i++) {
			source = sources[i];
			if (typeof source === 'function') {
				mixinPrototype(dest, source.prototype);
			}
			else {
				mixinObject(dest, source);
			}
		}

		// Return the destination object
		return dest;
	}

	/**
	 * A function that composites a Custom Element and registers it with the current document.  The resulting
	 * constructor function must include a property named "customTag" which is used to register the custom tag to
	 * generate the custom element when utilised within the DOM.
	 * @param  {HTMLElement}                      base          The base constructor which must have HTMLElement in its
	 *                                                          prototype chain.
	 * @param  {HTMLElement|CustomElement|Object} extensions... Any number of arguments that are then used to extend
	 *                                                          the base.
	 * @return {HTMLElement}                                    A constructor function that creates a new instance of a
	 *                                                          custom element.
	 */
	function tailor(base/*, extensions...*/) {
		var extensions = slice.call(arguments, 1), // fake the spread operator
			proto = Object.create(base.prototype); // construct a new prototype from base

		// Only objects which have HTMLElement in the prototype chain can be registered as a Custom Element
		if (!(proto instanceof HTMLElement)) {
			throw new SyntaxError('base must include HTMLElement in prototype chain.');
		}

		// mix the extensions into the prototype
		mixin(proto, extensions);

		// 'customTag' should be present in the resulting prototype so we can use it to register the Custom Element
		if (!('customTag' in proto)) {
			throw new SyntaxError('Unable to resolve custom tag.  "customTag" must be specified.');
		}

		// Check to see if this custom tag is already used 
		if (proto.customTag in registry) {
			throw new Error('Custom Element with a tag of "' + proto.customTag + '" already registered.');
		}

		// Generate the Custom Element constructor and register the tag with the document
		var ctor = doc.register(proto.customTag, {
			prototype: proto
		});

		// Keep track of loaded custom tags
		registry[proto.customTag] = ctor;

		// Cache the base properties of the prototypes with the constructor
		Object.defineProperty(ctor, '_bases', {
			value: getBases(slice.call(arguments)),
			configurable: true
		});

		function Tailor(properties, sourceNode) {
			/* jshint newcap:false */
			var instance = new ctor();
			lang.mixin(instance, properties);
			if (sourceNode) {
				sourceNode = dom.get(sourceNode);
				if (sourceNode.parentNode) {
					var parent = sourceNode.parentNode;
					parent.replaceChild(instance, sourceNode);
				}
			}
			return instance;
		}

		Tailor.prototype = ctor.prototype;

		return Tailor;
	}

	/**
	 * A stub function for identifying abstract methods when composing objects.
	 */
	function required() {
		throw new SyntaxError('This method is required and no implementation has been provided');
	}

	/**
	 * A stub object used for determining the end of a chain of aspect advice
	 * @type {Object}
	 */
	var stop = {};

	/**
	 * Generates a constructor function that is used to decorate prototypes generated by tailor
	 * @param  {Function}  install The function that actually installs the decorator
	 * @param  {Function}  direct  
	 * @return {Decorator}         The constructor function
	 */
	function decorator(install, direct) {

		function Decorator() {
			if (direct) {
				return direct.apply(this, arguments);
			}
			throw new Error('Decorator not applied.');
		}

		Object.defineProperty(Decorator, 'install', {
			value: install,
			enumerable: true,
			configurable: true
		});

		return Decorator;
	}

	/**
	 * Generates an aspect decorator
	 * @param  {Function} handler The function that handles the advice
	 * @return {Function}         The aspect decorator
	 */
	function aspect(handler) {
		return function (advice) {
			return decorator(function install(name) {
				var baseMethod = this[name];
				(advice = this[name] = baseMethod ? handler(this, baseMethod, advice) : advice).install = install;
			}, advice);
		};
	}

	Object.defineProperties(tailor, {
		required: {
			value: required,
			enumerable: true
		},
		stop: {
			value: stop,
			enumerable: true
		},
		around: {
			value: aspect(function (target, base, advice) {
				return advice.call(target, base);
			}),
			enumerable: true
		},
		before: {
			value: aspect(function (target, base, advice) {
				return function () {
					var results = advice.apply(this, arguments);
					if (results !== stop) {
						return base.apply(this, results || arguments);
					}
				};
			}),
			enumerable: true
		},
		after: {
			value: aspect(function (target, base, advice) {
				return function () {
					var results = base.apply(this, arguments),
						adviceResults = advice.apply(this, arguments);
					return adviceResults === undefined ? results : adviceResults;
				};
			}),
			enumerable: true
		},
		property: {
			value: function (descriptor) {
				return decorator(function (key) {
					var inheritedDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), key);
					if (inheritedDescriptor) {
						lang.mixin(inheritedDescriptor, descriptor);
					}
					Object.defineProperty(this, key, inheritedDescriptor || descriptor);
				});
			},
			enumerable: true
		},
		from: {
			value: function (trait, fromKey) {
				var descriptor = fromKey ? Object.getOwnPropertyDescriptor((typeof trait === 'function' ?
					trait.prototype : trait), fromKey) : null;
				return decorator(function (key) {
					descriptor = descriptor || (typeof trait === 'string' ? Object.getOwnPropertyDescriptor(this, trait) :
						Object.getOwnPropertyDescriptor((typeof trait === 'function' ? trait.prototype : trait),
							fromKey || key));
					if (descriptor) {
						Object.defineProperty(this, key, descriptor);
					}
					else {
						throw new Error('Source method ' + fromKey + ' was not available to be renamed to ' + key);
					}
				});
			},
			enumerable: true
		}
	});

	/* jshint boss:true */
	return exports = tailor;
});