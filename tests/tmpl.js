define([
	'intern!tdd',
	'intern/chai!assert',
	'require'
], function (test, assert, require) {
	'use strict';

	/* global Platform */

	test.suite('tmpl', function () {
		test.test('plugin', function () {
			var dfd = this.async(1000);
			require(['../tmpl!./resources/tmpl.html'], dfd.callback(function (tmpl) {
				var model = {
					id: 'test',
					label: 'Click Me'
				};
				var testDiv = document.createElement('div');
				document.body.appendChild(testDiv);
				var node = tmpl.stamp();
				testDiv.appendChild(node);
				node.model = model;
				Platform.performMicrotaskCheckpoint();
				model.label = 'Changed!';
				Platform.performMicrotaskCheckpoint();
			}));
		});
		test.test('stamp', function () {
			var dfd = this.async(1000);
			var t2 = document.createElement('t2');
			document.body.appendChild(t2);
			t2.id = 't2';
			t2.items = [{
				value: 'foo'
			}, {
				value: 'bar'
			}];
			require(['../tmpl!./resources/tmplStamp.html'], dfd.callback(function (tmpl) {
				tmpl.stamp(t2);
			}));
		});
	});
});