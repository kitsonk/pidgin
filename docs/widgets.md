# pidgin/widgets

**widgets** is a utility module for Pidgin Widgets.  It allows for the registration of widgets as well as has some
class decorators for creating properties.

## Usage

The main usage is to register a new widget with the current document which is based off a DOM object that either is
`HTMLElement` or implements `HTMLElement`.  To register the most basic of widgets, you would do the following:

```js
require(['pidgin/widgets', 'pidgin/_Widget'], function (widgets, _Widget) {
	var MyWidget = widgets.register('my-widget', HTMLElement, _Widget, {
		foo: 'bar'
	});

	var mywidget1 = new MyWidget();
	/* or */
	var mywidget2 = document.createElement('my-widget');
});
```

You can also instantiate widgets using the custom tag in your HTML as well, for example, to instantiate the above
widget, you could have used the following:

```html
<my-widget></my-widget>
```

`.register()` requires at least two arguments and then as many other arguments as desired:

* `tag` - Is a string that provides the custom element tag name which can be used to instantiate the widget.  The string
  should be unique for the document and should contain at least one dash (`-`).  If there is already a widget
  registered with that tag name, `.register()` will throw an exception.

* `base` - This is a class/constructor function that has `HTMLElement` in its prototype chain.  This serves as the
  foundation for the widget.

* `extensions...` - These are other classes, constructor functions or objects which are mixed into the `base` and used
  to create the prototype of the widget class.  They are mixed in left to right.

## Bases

As mentioned above, the second argument must be a class/constructor function that has `HTMLElement` in its prototype
chain.  This will serve as the base element for the custom element that is part of your widget.  `HTMLElement` has an
interface that is roughly equivalent to the `<div>` tag and is the ancestor of all the HTML* DOM Elements.  If your
widget doesn't need any special features offered by other tags, `HTMLElement` is likely your best base for your widget.

If your widget through is designed to be an "extension" of another HTML element, like for example a `<button>`, then you
should consider utilising a different base for your widget.  This will ensure your widget will "behave" like that other
root HTML element.  For example, to create something that extends a `<button>`, you would do something like this:

```js
require(['pidgin/widgets', 'pidgin/_Widget'], function (widgets, _Widget) {
	var MyButton = widgets.register('my-button', HTMLButtonElement, _Widget, {
		foo: 'bar'
	});

	var mybutton1 = new MyButton();
	/* or */
	var mybutton2 = new document.createElement('button', 'my-button');
});
```

And if you then wanted to instantiate this widget in HTML, you would use the following in:

```html
<button is="my-button"></button>
```

Notice how both the `document.createElement` and the HTML instantiation change when you aren't using just HTMLElement as
the base.

You can also descend from other Pidgin widgets, except for `pidgin/_Widget` which doesn't have HTMLElement in its
prototype chain.  If you are descending from another widget, you should just use that as the base instead of one of the
`HTML*` elements.  For example, to create your own descendent of `pidgin/Button`:

```js
require(['pidgin/widgets', 'pidgin/Button'], function (widgets, Button) {
	var MyButton = widgets.register('my-button', Button, {
		foo: 'bar'
	});

	var mybutton1 = new MyButton();
	/* or */
	var mybutton2 = new document.createElement('button', 'my-button');
});
```

And in instantiating via HTML:

```html
<button is="my-button"></button>
```

Because `pidgin/Button` has `HTMLButtonElement` as its base, it means that any descendants need to utilise that root
tag when instantiating via element creation.  This means you should know if the widget you are descending from builds
on top of a base other than `HTMLElement`.
