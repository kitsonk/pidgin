define([
	'./lib/core/properties'
], function (properties) {

	var shadow = properties.shadow;

	function toCamelCase(str) {
		return str.toLowerCase().replace(/-([a-z])/g, function (m, w) {
			return w.toUpperCase();
		});
	}

	return {
		/**
		 * Returns an accessor property descriptor that is linked to an attribute of a DOM Node
		 * @param  {String}  nodeName      The property name of `this` that has the node
		 * @param  {String}  attributeName The attribute name that the descriptor relates to
		 * @param  {Boolean} [enumerable]  If the property should be enumerable or not, defaults to `true`
		 * @return {Object}                The property descriptor
		 */
		getDomAttributeDescriptor: function (nodeName, attributeName, enumerable) {
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
		},

		/**
		 * Returns an accessor property descriptor that is linked to an attribute of a DOM node but will also shadow the
		 * value so that it can be accessed even when the linked node is not present
		 * @param  {String}  nodeName      The porperty name of `this` that has the node
		 * @param  {String}  attributeName The attribute name that the descriptor relates to
		 * @param  {Boolean} [enumerable]  If the property should be enumerable or not, defaults to `true`
		 * @return {Object}                The property descriptor
		 */
		getShadowDomAttributeDescriptor: function (nodeName, attributeName, enumerable) {
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
		},

		/**
		 * Returns an accessor property descriptor that delegates the value to a sub property
		 * @param  {String}  delegateName The name of the property of `this` that the property should be derived from
		 * @param  {String}  propertyName The name of the property of the delegate property
		 * @param  {Boolean} [enumerable] If the property should be enumerable or not
		 * @return {Object}               The property descriptor
		 */
		getDelegateDescriptor: function (delegateName, propertyName, enumerable) {
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
	};

});