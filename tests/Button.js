define([
	'intern!tdd',
	'intern/chai!assert',
	'require'
], function (test, assert, require) {

	function emptyDom(root) {
		root = root || document.body;
		while (root.firstChild) {
			root.removeChild(root.firstChild);
		}
		return root;
	}

	test.suite('pidgin/Button', function () {
		test.test('basic', function () {
			var dfd = this.async(1000);
			emptyDom();
			require([ '../Button' ], function (Button) {
				assert(Button);
				var button1 = new Button();
				button1.label = 'test';
				document.body.appendChild(button1);
				button1.insertedCallback = dfd.callback(function () {
					console.log(button1.innerHTML);
				});
			});
		});
	});

});