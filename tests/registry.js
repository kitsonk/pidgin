define([
	'intern!tdd',
	'intern/chai!assert',
	'../registry'
], function (test, assert, registry) {
	test.suite('pidgin/registry', function () {
		test.test('basic', function () {
			assert(registry);
		});
	});
});