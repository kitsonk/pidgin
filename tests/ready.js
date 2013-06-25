define([
	'intern!tdd',
	'intern/chai!assert',
	'require'
], function (test, assert, require) {
	test.suite('ready', function () {
		test.test('basic', function () {
			var dfd = this.async(500);
			require(['../ready!'], dfd.callback(function () {
				console.log('callback');
			}));
		});
	});
});