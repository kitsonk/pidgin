define([
	'intern!tdd',
	'intern/chai!assert',
	'../tailor'
], function (test, assert, tailor) {

	test.suite('tailor', function () {
		test.test('basic', function () {
			var XWidget = tailor(HTMLElement, {
				customTag: 'x-widget',
				foo: 'bar'
			});

			var YWidget = tailor(XWidget, {
				customTag: 'y-widget',
				bar: 'qat'
			});

			var y = new YWidget();
			console.log(y.foo, y.bar);
			document.body.appendChild(y);
		});
	});

});