define([
	'intern!tdd',
	'intern/chai!assert',
	'../widgets'
], function (test, assert, widgets) {

	test.suite('pidgin/widgets', function () {

		test.beforeEach(function () {
			while (document.body.hasChildNodes()) {
				document.body.removeChild(document.body.childNodes[0]);
			}
		});

		test.test('register - HTMLElement base', function () {
			var Test = widgets.register('w-test1', HTMLElement, {
				foo: 'bar'
			});

			var t1 = new Test();
			assert(t1);
			assert.strictEqual(t1.foo, 'bar');
			assert.instanceOf(t1, Test);
			assert.instanceOf(t1, HTMLElement);
			assert.strictEqual('<w-test1></w-test1>', t1.outerHTML);
			t1.id = 't1';
			assert.strictEqual('<w-test1 id="t1"></w-test1>', t1.outerHTML);
			document.body.appendChild(t1);
			assert.strictEqual(1, document.body.childNodes.length);
			document.body.removeChild(t1);

			var t2 = document.createElement('w-test1');
			assert(t2);
			assert.strictEqual(t2.foo, 'bar');
			assert.instanceOf(t2, Test);
			assert.instanceOf(t2, HTMLElement);
			assert.strictEqual('<w-test1></w-test1>', t2.outerHTML);
			t2.id = 't2';
			assert.strictEqual('<w-test1 id="t2"></w-test1>', t2.outerHTML);
			document.body.appendChild(t2);
			assert.strictEqual(1, document.body.childNodes.length);
			document.body.removeChild(t2);
		});
		test.test('register - HTMLButtonElement base', function () {
			var Test = widgets.register('w-test2', HTMLButtonElement, {
				foo: 'bar'
			});

			var t1 = new Test();
			assert(t1);
			assert.strictEqual(t1.foo, 'bar');
			assert.strictEqual(t1.type, 'submit');
			assert.instanceOf(t1, Test);
			assert.instanceOf(t1, HTMLElement);
			assert.instanceOf(t1, HTMLButtonElement);
			assert.strictEqual('<button is="w-test2"></button>', t1.outerHTML);
			t1.id = 't1';
			assert.strictEqual('<button is="w-test2" id="t1"></button>', t1.outerHTML);
			document.body.appendChild(t1);
			assert.strictEqual(1, document.body.childNodes.length);
			document.body.removeChild(t1);

			// Not currently working: https://github.com/Polymer/CustomElements/issues/48
			// var t2 = document.createElement('button', 'w-test2');
			// assert(t2);
			// assert.strictEqual(t2.foo, 'foo');
			// assert.strictEqual(t2.type, 'submit');
			// assert.instanceOf(t2, Test);
			// assert.instanceOf(t2, HTMLElement);
			// assert.instanceOf(t2, HTMLButtonElement);
			// assert.strictEqual('<button is="w-test2"></button>', t2.outerHTML);
			// t2.id = 't2';
			// assert.strictEqual('<button is="w-test2" id="t2"></button>', t2.outerHTML);
			// document.body.appendChild(t2);
			// assert.strictEqual(1, document.body.childNodes.length);
			// document.body.removeChild(t2);
		});
		test.test('register - 1st gen inheritance', function () {
			var Test = widgets.register('w-test3', HTMLElement, {
				foo: 'bar'
			});

			var Test2 = widgets.register('w-test4', Test, {
				foo: 'qat',
				bar: 'baz'
			});

			var t1 = new Test2();
			assert(t1);
			assert.strictEqual(t1.foo, 'qat');
			assert.strictEqual(t1.bar, 'baz');
			assert.instanceOf(t1, Test2);
			assert.instanceOf(t1, Test);
			assert.instanceOf(t1, HTMLElement);
			assert.strictEqual('<w-test4></w-test4>', t1.outerHTML);
			t1.id = 't1';
			assert.strictEqual('<w-test4 id="t1"></w-test4>', t1.outerHTML);
			document.body.appendChild(t1);
			assert.strictEqual(1, document.body.childNodes.length);
			document.body.removeChild(t1);

			var t2 = document.createElement('w-test4');
			assert(t2);
			assert.strictEqual(t2.foo, 'qat');
			assert.strictEqual(t2.bar, 'baz');
			assert.instanceOf(t2, Test2);
			assert.instanceOf(t2, Test);
			assert.instanceOf(t2, HTMLElement);
			assert.strictEqual('<w-test4></w-test4>', t2.outerHTML);
			t2.id = 't2';
			assert.strictEqual('<w-test4 id="t2"></w-test4>', t2.outerHTML);
			document.body.appendChild(t2);
			assert.strictEqual(1, document.body.childNodes.length);
			document.body.removeChild(t2);
		});
		test.test('register - 1st gen inheritance, non-HTMLElement base', function () {
			var Test = widgets.register('w-test5', HTMLButtonElement, {
				foo: 'bar'
			});

			var Test2 = widgets.register('w-test6', Test, {
				foo: 'qat',
				bar: 'baz'
			});

			var t1 = new Test2();
			assert(t1);
			assert.strictEqual(t1.foo, 'qat');
			assert.strictEqual(t1.bar, 'baz');
			assert.strictEqual(t1.type, 'submit');
			assert.instanceOf(t1, Test2);
			assert.instanceOf(t1, Test);
			assert.instanceOf(t1, HTMLButtonElement);
			assert.instanceOf(t1, HTMLElement);
			assert.strictEqual('<button is="w-test6"></button>', t1.outerHTML);
			t1.id = 't1';
			assert.strictEqual('<button is="w-test6" id="t1"></button>', t1.outerHTML);
			document.body.appendChild(t1);
			assert.strictEqual(1, document.body.childNodes.length);
			document.body.removeChild(t1);
		});
	});

});