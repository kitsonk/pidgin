define([
	'intern!tdd',
	'intern/chai!assert',
	'../Widget'
], function (test, assert, Widget) {
	'use strict';

	/* jshint evil:true */
	document.write('<script src="../../lib/platform/platform.js" type="text/javascript"></script>');

	test.suite('Widget', function () {
		test.test('basic', function () {
			var widget = new Widget();
			assert(widget);
		});
	});
});