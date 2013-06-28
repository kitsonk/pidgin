define([
	'intern!tdd',
	'intern/chai!assert',
	'../widgets'
], function (test, assert, widgets) {

	test.suite('pidgin/widgets', function () {
		test.test('basic', function () {
			var Widget = widgets.register('x-widget', HTMLElement, {
				declaredClass: 'pidgin/tests/Widget',
				foo: 'foo'
			});
			var w = new Widget();
			w.id = 'w';
			document.body.appendChild(w);
			var SubWidget = widgets.register('sub-widget', Widget, {
				declaredClass: 'pidgin/tests/SubWidget',
				bar: 'qat'
			});

			var s = new SubWidget();
			s.id = 's';
			document.body.appendChild(s);
		});
	});

});