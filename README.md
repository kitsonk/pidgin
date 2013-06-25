# pidgin #

**pidgin** is a prototype widget based system for Dojo 2.  It relies upon another key technology:

* [Polymer/platform][] - A polyfill of next generation browser technologies

The main design goals of this prototype are:

* Leverage the next generation browser technologies
* Leverage AMD
* Fit well into Dojo 2

## pidgin/Widget ##

`Widget` is very roughly a [Dijit][] like AMD Widget that leverages the next generation of browser technologies,
including [Custom Elements][], [Pointer Events][] and [Model Driven Views][MDV].  While it tries to be like Dijit where
it can, there are some fundamental concept shifts:

* The node is the widget and the widget is the node.  By using Custom Elements, the constructor for all widgets is based
  off of the `HTMLElement` DOM object.This has several advantages, in that as you manipulate the DOM nodes, you are also
  dealing with the widget instances.This also means there is no widget registry, because the document is effectively the
  registry.You can use whatever DOM manipulation API you want to move the widget around.

* It leverages ES5 accessor properties instead of using the discreet accessors.  This means there is no `widget.get()`
  and `widget.set()`.  You can affect the widget directly.

* It directly supports reactive templating (based on `pidgin/tmpl` and MDV) directly in the base Widget.

It does support the same instantiation API though that you are familiar with from Dijit:

```js
require(['pidgin/Widget'], function (Widget) {
	// Create a widget which replaces an existing DOM node identified by an ID
	var myWidget = new Widget({
		foo: 'bar'
	}, 'someNode');
});

*Note* Because of the way the Custom Elements works, the existing Dijit lifecycle doesn't map very well, since a lot of
the "grunt work" is done by the underlying technologies.  Currently there are only the four methods identified in the
working specification for Custom Elements: `readyCallback`, `insertedCallback`, `removedCallback` and
`attributeChangedCallback`.  This may change in the future.

## pidgin/tailor ##

`tailor` is a specialised object compositor that is similar to ComposeJS, Dojo's declare or dcl.  It is specifically
designed to create and register [Custom Elements][].  If for example you wanted to create a new widget class, you would
do something like:

```js
require(['pidgin/tailor', 'pidgin/Widget'], function (tailor, Widget) {
	var XWidget = tailor(Widget, {
		declaredClass: 'x/Widget',
		customTag: 'x-widget'
	});

	// create a widget instance
	var x1 = new XWidget();

	// or create it via its tag
	var x2 = document.createElement('x-widget');
});
```

## pidgin/tmpl ##

`tmpl` is an AMD plugin for loading and referencing [MDV][] templates.  It is specifically designed to work well with
`Widget`.

## Examples ##

In order to create a widget that dynamically provided a list of users in an unordered-list, I would create a template
file named `UserNameList.html`:

```html
<ul>
	<template repeat="{{ data }}">
		<li>{{ name }}</li>
	</template>
</ul>
```

I would then want to load and create my widget:

```js
require(['pidgin/Widget', 'pidgin/tmpl!./UserNameList.html'], function (Widget, template) {
	var widget = new Widget({
		template: template,
		data: [{
			name: 'Bob'
		}, {
			name: 'Bill'
		}, {
			name: 'Ben'
		}]
	});

	// Add the widget to the DOM
	widget.place(document.body);

	// Needed when using Polymer/platform on non-Object.observe platforms
	Platform.performMicrotaskCheckpoint();
});
```

This would then generate a widget which presents itself as an unordered list with three list items of "Bob", "Bill" and
"Ben".  Adding or removing items from data would cause the DOM presentation to change accordingly.

[Polymer/platform]: https://github.com/Polymer/platform
[Dijit]: https://github.com/dojo/dijit
[MDV]: http://www.polymer-project.org/platform/mdv.html
[Custom Elements]: http://www.polymer-project.org/platform/custom-elements.html
[Pointer Events]: http://www.polymer-project.org/platform/pointer-events.html