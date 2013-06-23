# pidgin #

**pidgin** is a prototype widget based system for Dojo 2.  It relies upon another key technology:

* [Polymer/platform][] - A polyfill of next generation browser technologies

The main design goals of this prototype are:

* Leverage the next generation browser technologies
* Leverage AMD
* Fit well into Dojo 2

## pidgin/Widget ##

`Widget` is very roughly a [Dijit][] like AMD Widget.  It has a similar lifecycle and API to Dijit 1.X, though it
differs in several significant ways:

* It leverages ES5 accessor properties instead of using the discreet accessors.
* It renames many of the core properties to be more straightforward and clear.  For example, `widget.domNode` is called
  `widget.node`.
* It listens and emits events on the root DOM node of the widget instead of the widget itself.
* The widget lifecycle supports asynchronous/Promise returns during construction.
* It directly supports reactive templating (based on `pidgin/tmpl` and MDV) directly in the base class.

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
[MDV]: https://github.com/Polymer/mdv
