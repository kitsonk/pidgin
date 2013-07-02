define([
	'exports',
	'./lib/core/aspect',
	'./lib/core/compose',
	'./lib/core/doc',
	'./lib/core/properties',
	'./ready!WebComponentsReady'
], function (exports, aspect, compose, doc, properties) {
	'use strict';

	/**
	 * A convenience variable to a function that adds a "shadow" property and value to the destination object.
	 * @type {Function}
	 */
	var shadow = properties.shadow;

	/**
	 * Convert a string with dashes to a string that is camelCased
	 * @param  {String} str The input string
	 * @return {String}     The camelCased string
	 */
	function toCamelCase(str) {
		return str.toLowerCase().replace(/-([a-z])/g, function (m, w) {
			return w.toUpperCase();
		});
	}

	/**
	 * Internal registry of custom tags
	 * @type {Object}
	 */
	var registry = {};

	/**
	 * Register a custom element with the current document
	 * @param  {String}               tag             The custom element's tag name
	 * @param  {HTMLElement}          baseElement     A constructor function that has HTMLElement in the prototype
	 * @param  {Objects|Functions...} [extensions...] Any number of extensions to be built into the custom element
	 *                                                constructor
	 * @return {Function}                             A constructor function that will create an instance of the custom
	 *                                                element
	 */
	function register(tag, baseElement/*, extensions...*/) {
		var bases = Array.prototype.slice.call(arguments, 1),
			baseName;

		/**
		 * Hash mapping of HTMLElement interfaces to tag names
		 * @type {Object}
		 */
		var tags = {
			HTMLAnchorElement: 'a',
			HTMLAppletElement: 'applet',
			HTMLAreaElement: 'area',
			HTMLAudioElement: 'audio',
			HTMLBaseElement: 'base',
			HTMLBRElement: 'br',
			HTMLButtonElement: 'button',
			HTMLCanvasElement: 'canvas',
			HTMLDataElement: 'data',
			HTMLDataListElement: 'datalist',
			HTMLDivElement: 'div',
			HTMLDListElement: 'dl',
			HTMLDirectoryElement: 'directory',
			HTMLEmbedElement: 'embed',
			HTMLFieldSetElement: 'fieldset',
			HTMLFontElement: 'font',
			HTMLFormElement: 'form',
			HTMLHeadElement: 'head',
			HTMLHeadingElement: 'h1',
			HTMLHtmlElement: 'html',
			HTMLHRElement: 'hr',
			HTMLIFrameElement: 'iframe',
			HTMLImageElement: 'img',
			HTMLInputElement: 'input',
			HTMLKeygenElement: 'keygen',
			HTMLLabelElement: 'label',
			HTMLLegendElement: 'legend',
			HTMLLIElement: 'li',
			HTMLLinkElement: 'link',
			HTMLMapElement: 'map',
			HTMLMediaElement: 'media',
			HTMLMenuElement: 'menu',
			HTMLMetaElement: 'meta',
			HTMLMeterElement: 'meter',
			HTMLModElement: 'ins',
			HTMLObjectElement: 'object',
			HTMLOListElement: 'ol',
			HTMLOptGroupElement: 'optgroup',
			HTMLOptionElement: 'option',
			HTMLOutputElement: 'output',
			HTMLParagraphElement: 'p',
			HTMLParamElement: 'param',
			HTMLPreElement: 'pre',
			HTMLProgressElement: 'progress',
			HTMLQuoteElement: 'quote',
			HTMLScriptElement: 'script',
			HTMLSelectElement: 'select',
			HTMLSourceElement: 'source',
			HTMLSpanElement: 'span',
			HTMLStyleElement: 'style',
			HTMLTableElement: 'table',
			HTMLTableCaptionElement: 'caption',
			HTMLTableDataCellElement: 'td',
			HTMLTableHeaderCellElement: 'th',
			HTMLTableColElement: 'col',
			HTMLTableRowElement: 'tr',
			HTMLTableSectionElement: 'tbody',
			HTMLTextAreaElement: 'textarea',
			HTMLTimeElement: 'time',
			HTMLTitleElement: 'title',
			HTMLTrackElement: 'track',
			HTMLUListElement: 'ul',
			HTMLUnknownElement: 'blink',
			HTMLVideoElement: 'video'
		};

		/**
		 * For a constructor function, attempt to determine name of the "class"
		 * @param  {Function} base The constructor function to identify
		 * @return {String}	       The string name of the class
		 */
		function getBaseName(base) {
			// Try to use Function.name if available
			if (base && base.name) {
				return base.name;
			}
			var matches;
			// Attempt to determine the name of the "class" by either getting it from the "function Name()" or the
			// .toString() of the constructor function.  This is required on IE due to the fact that function.name is
			// not a standard property and is not implemented on IE
			if ((matches = base.toString().match(/^(?:function\s(\S+)\(\)\s|\[\S+\s(\S+)\])/))) {
				return matches[1] || matches[2];
			}
		}

		/**
		 * Registers the tag with the current document, handling situations where the base constructor inherits from
		 * HTMLElement but is not HTMLElement
		 * @param  {String}   tag      The custom tag name for the element
		 * @param  {String}   baseName The base "class" name that this custom element is being built on
		 * @param  {Function} baseCtor The constructor function
		 * @return {Function}          The "new" constructor function that can create instances of the custom element
		 */
		function getTagConstructor(tag, baseName, baseCtor) {
			var config = {
				prototype: baseCtor.prototype
			};
			if (baseName !== 'HTMLElement') {
				config.extends = tags[baseName];
			}
			return doc.register(tag, config);
		}

		/**
		 * Restore the "true" constructor when trying to recombine custom elements
		 * @param  {Function} extension A constructor function that might have a shadow property that contains the
		 *                              original constructor
		 * @return {Function}           The original construction function or the existing function/object
		 */
		function restore(extension) {
			return extension && extension.prototype && extension.prototype._ctor ?
				extension.prototype._ctor : extension;
		}

		// Check to see if the custom tag is already registered
		if (tag in registry) {
			throw new TypeError('A widget is already registered with tag "' + tag + '".');
		}
		// Check to see if baseElement is appropriate
		if (!(baseElement === HTMLElement || baseElement.prototype instanceof HTMLElement)) {
			throw new TypeError('baseElement must have HTMLElement in its prototype chain');
		}
		// Check to see if the "class" name can be determined for baseElement
		if (!(baseName = getBaseName(baseElement))) {
			throw new TypeError('Cannot determine class of baseElement');
		}
		// Check to see if baseElement is a valid HTMLElement or we can identify the tag it is extending
		if ((baseElement !== HTMLElement) && !(baseName in tags)) {
			throw new TypeError('baseElement of class "' + baseName + '" is not a recognised descendent of HTMLElement');
		}

		// Make sure all the bases have their proper constructors for being composited
		bases = typeof bases === 'object' && bases instanceof Array ? bases.map(restore) : restore(bases);

		// Get a composited constructor
		var ctor = compose.apply(null, bases);

		// "Hide" the original constructor
		shadow(ctor.prototype, 'ctor', ctor);

		// Assign the proper constructor to the registry and return its value
		/* jshint boss:true */
		return registry[tag] = getTagConstructor(tag, baseName, ctor);
	}

	/**
	 * Returns an accessor property descriptor that is linked to an attribute of a DOM Node
	 * @param  {String}  nodeName      The property name of `this` that has the node
	 * @param  {String}  attributeName The attribute name that the descriptor relates to
	 * @param  {Boolean} [enumerable]  If the property should be enumerable or not, defaults to `true`
	 * @return {Object}                The property descriptor
	 */
	function getDomAttributeDescriptor(nodeName, attributeName, enumerable) {
		return {
			get: function () {
				return this[nodeName] ? this[nodeName].getAttribute(attributeName) : null;
			},
			set: function (value) {
				if (this[nodeName]) {
					if (value) {
						this[nodeName].setAttribute(attributeName, value);
					}
					else {
						this[nodeName].removeAttribute(attributeName);
					}
				}
				else {
					throw new Error('Cannot set value of attribute "' + attributeName + '" on undefined node.');
				}
			},
			enumerable: enumerable === undefined ? true : enumerable,
			configurable: true
		};
	}

	/**
	 * Returns an accessor property descriptor that is linked to an attribute of a DOM node but will also shadow the
	 * value so that it can be accessed even when the linked node is not present
	 * @param  {String}  nodeName      The porperty name of `this` that has the node
	 * @param  {String}  attributeName The attribute name that the descriptor relates to
	 * @param  {Boolean} [enumerable]  If the property should be enumerable or not, defaults to `true`
	 * @return {Object}                The property descriptor
	 */
	function getShadowDomAttributeDescriptor(nodeName, attributeName, enumerable) {
		var shadowName = nodeName + '_' + toCamelCase(attributeName),
			shadowPropertyName = '_' + shadowName;
		return {
			get: function () {
				var value = this[nodeName] ? this[nodeName].getAttribute(attributeName) :
					this[shadowPropertyName] || null;
				return value !== this[shadowPropertyName] ?
					(value === null && shadowPropertyName in this) ? this[shadowPropertyName] :
					shadow(this, shadowName, value) : value;
			},
			set: function (value) {
				if (value !== this[shadowPropertyName]) {
					shadow(this, shadowName, value);
				}
				if (this[nodeName]) {
					if (value) {
						this[nodeName].setAttribute(attributeName, value);
					}
					else {
						this[nodeName].removeAttribute(attributeName);
					}
				}
			},
			enumerable: enumerable === undefined ? true : enumerable,
			configurable: true
		};
	}

	/**
	 * Returns an accessor property descriptor that attempts to call a getter and setter function that can be used to
	 * calaculate complex derived values.
	 * @param  {String}   name       The property name
	 * @param  {Function} getter     The getter function to be called when the value needs to be calculated
	 * @param  {Function} setter     The setter function to be called when the value nees to be set
	 * @param  {Boolean}  enumerable Determines if the resulting property should be enumerable
	 * @return {Object}              The generated property descriptor
	 */
	function getShadowCalculatedDescriptor(name, getter, setter, enumerable) {
		var shadowName = '_' + name;
		return {
			get: function () {
				var value = getter.call(this, name, this[shadowName]);
				return value !== this[shadowName] ? shadow(this, name, value): value;
			},
			set: function (value) {
				value = setter.call(this, name, value);
				shadow(this, name, value);
			},
			enumerable: enumerable === undefined ? true : enumerable,
			configurable: true
		};
	}

	/**
	 * Returns an accessor property descriptor that delegates the value to a sub property
	 * @param  {String}  delegateName The name of the property of `this` that the property should be derived from
	 * @param  {String}  propertyName The name of the property of the delegate property
	 * @param  {Boolean} [enumerable] If the property should be enumerable or not
	 * @return {Object}               The property descriptor
	 */
	function getDelegateDescriptor(delegateName, propertyName, enumerable) {
		return {
			get: function () {
				return this[delegateName] ? this[delegateName][propertyName] : undefined;
			},
			set: function (value) {
				if (this[delegateName]) {
					this[delegateName][propertyName] = value;
				}
				else {
					throw new Error('Cannot set value of property "' + propertyName + '" on undefined delegate.');
				}
			},
			enumerable: enumerable === undefined ? true : enumerable,
			configurable: true
		};
	}

	var widgets = {
		register: register,
		property: compose.property,
		after: compose.after,
		before: compose.before,
		around: compose.around,
		getDomAttributeDescriptor: getDomAttributeDescriptor,
		getShadowDomAttributeDescriptor: getShadowDomAttributeDescriptor,
		getShadowCalculatedDescriptor: getShadowCalculatedDescriptor,
		getDelegateDescriptor: getDelegateDescriptor
	};

	/* jshint boss:true */
	return exports = widgets;
});