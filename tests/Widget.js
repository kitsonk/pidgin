define([
	'intern!tdd',
	'intern/chai!assert',
	'../Widget',
	'../lib/core/doc',
	'../lib/core/on'
], function (test, assert, Widget, doc, on) {
	'use strict';

	/* jshint evil:true */
	doc.write('<script src="../../lib/platform/platform.js" type="text/javascript"></script>');
	if (!doc.body) {
		doc.body = doc.createElement('body');
	}

	test.suite('Widget', function () {
		test.test('basic', function () {
			var node = doc.createElement('button');
			var widget = new Widget({
				id: 'test',
				baseClass: 'pidginWidget'
			}, node);
			widget.place(doc.body);
			widget.start();
			var handle = widget.on('click', function (e) {
				console.log(e);
			});
			widget.emit('click', {});
			assert(widget);
		});
	});
});