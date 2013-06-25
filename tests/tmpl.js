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
	});
});