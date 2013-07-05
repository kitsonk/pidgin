define([
	'intern!tdd',
	'intern/chai!assert',
	'require',
	'../lib/core/aspect',
	'../widgets',
	'../_Widget'
], function (test, assert, require, aspect, widgets, _Widget) {
	'use strict';

	var after = aspect.after;

	test.suite('pidgin/_Widget', function () {
		var Test, t;

		var createdCalled = false,
			insertedCalled = false,
			removedCalled = false,
			attributesChanged = [];

		test.test('created', function () {
			Test1 = widgets.register('pd-test1', HTMLElement, _Widget, {
				created: function () {
					createdCalled = true;
				},
				inserted: function () {
					insertedCalled = true;
				},
				removed: function () {
					removedCalled = true;
				},
				attributeChanged: function (attr) {
					attributesChanged.push(attr);
				}
			});

			t = new Test();

			assert.isTrue(t.isPidginWidget);
			assert.isTrue(createdCalled, 'startup called');
		});

		test.test('inserted', function () {
			var dfd = this.async(250);
			assert.isFalse(insertedCalled);

			after(t, 'insertedCallback', dfd.callback(function () {
				assert.isTrue(insertedCalled);
			}));

			document.body.appendChild(t);
		});

		test.test('removed', function () {
			var dfd = this.async(250);
			assert.isFalse(removedCalled);

			after(t, 'removedCallback', dfd.callback(function () {
				assert.isTrue(removedCalled);
			}));

			document.body.removeChild(t);
		});

		test.test('attributeChanged', function () {
			var dfd = this.async(250);
			assert.equal(0, attributesChanged.length);

			after(t, 'attributeChangedCallback', dfd.callback(function () {
				assert.equal(1, attributesChanged.length);
				assert.equal('foo', attributesChanged[0]);
			}));

			t.setAttribute('foo', 'bar');
		});
	});
});