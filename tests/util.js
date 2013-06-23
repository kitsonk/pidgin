define([
	'intern!tdd',
	'intern/chai!assert',
	'../util',
	'../lib/core/doc'
], function (test, assert, util, doc) {
	test.suite('pidgin/util', function () {
		test.suite('getDomAttributeDescriptor', function () {
			test.test('basic', function () {
				var div = doc.createElement('div');
				div.setAttribute('foo', 'bar');
				var obj = {};
				Object.defineProperties(obj, {
					foo: util.getDomAttributeDescriptor('node', 'foo'),
					bar: util.getDomAttributeDescriptor('node', 'bar'),
					node: {
						value: div
					}
				});
				assert.strictEqual('bar', obj.foo, 'reading value from node attribute');
				assert.strictEqual(null, obj.bar, 'reading empty value from node attribute');
				assert.strictEqual(null, div.getAttribute('bar'), 'ensure read does not set value');

				div.setAttribute('bar', 'qat');
				assert.strictEqual('qat', div.getAttribute('bar'), 'value has changed');
				assert.strictEqual('qat', obj.bar, 'reading value from node attribute');

				obj.foo = 1;
				assert.strictEqual('1', div.getAttribute('foo'), 'direct assignment works');
				assert.strictEqual('1', obj.foo, 'reading changed property');
				assert.strictEqual('string', typeof obj.foo, 'assignment does type conversion properly');

				obj.foo = false;
				assert.strictEqual(null, div.getAttribute('foo'), 'property removed');
				assert.strictEqual(null, obj.foo, 'value properly read');
			});
			test.test('errors', function () {
				var obj = {};
				Object.defineProperties(obj, {
					foo: util.getDomAttributeDescriptor('node', 'foo'),
					bar: util.getDomAttributeDescriptor('qat', 'bar'),
					node: {
						value: undefined
					}
				});

				assert.throws(function () {
					obj.foo = 'bar';
				}, Error, 'Cannot set value of attribute "foo" on undefined node.');
				assert.throws(function () {
					obj.bar = 'bar';
				}, Error, 'Cannot set value of attribute "bar" on undefined node.');
			});
		});
		test.suite('getShadowDomAttributeDescriptor', function () {
			test.test('basic', function () {
				/* jshint camelcase:false */
				var div = doc.createElement('div');
				div.setAttribute('data-foo', 'bar');
				var obj = {};
				Object.defineProperties(obj, {
					foo: util.getShadowDomAttributeDescriptor('node', 'data-foo'),
					baz: util.getShadowDomAttributeDescriptor('node', 'data-baz'),
					bar: util.getShadowDomAttributeDescriptor('otherNode', 'data-bar'),
					node: {
						value: div
					},
					otherNode: {
						value: null,
						writable: true
					}
				});
				assert.isFalse('_node_dataFoo' in obj, 'shadow property does not exist');
				assert.strictEqual('bar', obj.foo, 'reading value from node attribute');
				assert.isTrue('_node_dataFoo' in obj, 'shadow property exsits');
				assert.strictEqual('bar', obj._node_dataFoo, 'shadow property has proper value');

				assert.strictEqual(null, obj.baz, 'reading value of undefined attributed');
				assert.isTrue('_node_dataBaz' in obj, 'shadow property present');
				assert.strictEqual(null, obj._node_dataBaz, 'shadow property has correct value');
				assert.strictEqual(null, div.getAttribute('data-baz'), 'attribute remains undefined');
				obj.baz = 'qat';
				assert.strictEqual('qat', obj._node_dataBaz, 'shadow property has correct value');
				assert.strictEqual('qat', div.getAttribute('data-baz'), 'attribute has correct value');
				div.setAttribute('data-baz', 'foo');
				assert.strictEqual('foo', obj.baz, 'reading updated attribute value');
				assert.strictEqual('foo', obj._node_dataBaz, 'shadow property updated');

				assert.strictEqual(null, obj.bar, 'lacking associated node reads properly');
				assert.isTrue('_otherNode_dataBar' in obj, 'shadow property present');
				assert.strictEqual(null, obj._otherNode_dataBar, 'shadow property has proper value');
				obj.bar = 'qat';
				assert.strictEqual('qat', obj.bar, 'property value persists');
				assert.strictEqual('qat', obj._otherNode_dataBar, 'shadow property has proper value');

				var div2 = doc.createElement('div');
				obj.otherNode = div2;
				obj.bar = obj.bar;
				assert.strictEqual('qat', div2.getAttribute('data-bar'), 'attribute set');
				obj.bar = false;
				assert.isFalse(div2.hasAttribute('data-bar'), 'attribute removed');
				assert.strictEqual(false, obj.bar, 'value being read properly');
			});
		});
	});
});