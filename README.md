# pidgin #

**pidgin** is a prototype widget based system for Dojo 2.  It relies upon another key technology:

* [Polymer/platform][] - A polyfill of next generation browser technologies

The main design goals of this prototype are:

* Leverage the next generation browser technologies
* Leverage AMD
* Fit well into Dojo 2

## pidgin/_Widget ##

`_Widget` is very roughly a [Dijit][] like AMD abstract class Widget that leverages the next generation of browser
technologies, including [Custom Elements][], [Pointer Events][] and [Model Driven Views][MDV].  While it tries to be
like Dijit where it can, there are some fundamental concept shifts:

* The node is the widget and the widget is the node.  By using Custom Elements, the constructor for all widgets is based
  off of the `HTMLElement` DOM object.This has several advantages, in that as you manipulate the DOM nodes, you are also
  dealing with the widget instances.This also means there is no widget registry, because the document is effectively the
  registry.You can use whatever DOM manipulation API you want to move the widget around.

* It leverages ES5 accessor properties instead of using the discreet accessors.  This means there is no `widget.get()`
  and `widget.set()`.  You can affect the widget directly.

* It directly supports reactive templating (based on `pidgin/tmpl` and MDV) directly in the base Widget.

*Note* Because of the way the Custom Elements works, the existing Dijit lifecycle doesn't map very well, since a lot of
the "grunt work" is done by the underlying technologies.  Currently there are only the four methods identified in the
working specification for Custom Elements: `readyCallback`, `insertedCallback`, `removedCallback` and
`attributeChangedCallback`.  This may change in the future.

## pidgin/widgets ##

`widgets` is the utility module of pidgin.  Currently its only purpose is to register widgets with the current document.

For example, to create and register a new type of widget you would do something like:

```js
require(['pidgin/widgets', 'pidgin/_Widget'], function (widgets, _Widget) {
	var MyWidget = widget.register('x-my-widget', [ HTMLElement, _Widget ], {
		foo: 'bar'
	});

	// new works
	var myWidget1 = new MyWidget();

	// creation by tag works
	var myWidget2 = document.createElement('x-my-widget');
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