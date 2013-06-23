define([
	'intern!tdd',
	'intern/chai!assert',
	'require',
	'../Widget',
	'../lib/core/doc'
], function (test, assert, require, Widget, doc) {

	/* global Platform */
	doc.write('<script src="../../lib/platform/platform.js" type="text/javascript"></script>');
	if (!doc.body) {
		doc.body = doc.createElement('body');
	}

	test.suite('Widget', function () {
		test.test('basic', function () {
			var dfd = this.async(1000);
			require(['../tmpl!./resources/tmpl.html'], dfd.callback(function (template) {
				var widget = new Widget({
					id: 'test',
					template: template,
					label: 'Click Me!',
					data: [{
						name: 'Bill'
					}, {
						name: 'Ben'
					}, {
						name: 'Dylan'
					}, {
						name: 'Eugene'
					}]
				});
				widget.place(doc.body);
				Platform.performMicrotaskCheckpoint();
				widget.data.push({ name: 'Kitson' });
				Platform.performMicrotaskCheckpoint();
			}));
		});
	});
});