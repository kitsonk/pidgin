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
  registry. You can use whatever DOM manipulation API you want to move the widget around.

* One of the benefits of Custom Elements is that the specification allows you to create your own "valid" attributes.
  A developer can specify attributes to be copied to properties during initialisation of the widget.  Combined with the 
  ability to declare an instance of a widget via its custom tag, this effectively means there is no need for a
  dojo/parser to be able to provide the "declarative syntax".

* It leverages ES5 accessor properties instead of using the discreet accessors.  This means there is no `widget.get()`
  and `widget.set()`.  You can affect the widget directly.

* It directly supports reactive templating (based on `pidgin/tmpl` and MDV) directly in the base Widget.

For more information on `_Widget` see the [_Widget](docs/widget.md) documentation.

## pidgin/Button ##

This is a widget that extends the HTMLButtonElement interface.  Its custom tag is `pd-button`.  To instantiate it
declaratively, you would do this:

```html
<pd-button>Click Me!</pd-button>
<!-- or -->
<pd-button label="Click Me!"></pd-button>
```

Do instantiate it programmatically you would do something like this:

```js
require(['pidgin/Button'], function (Button) {
	var button1 = new Button();
	button1.label = 'Click Me!';
	button1.place(document.body);

	/* Or create it via its tag */
	var button2 = document.createElement('pd-button');
	button2.label = 'Click me Instead!';
	document.body.appendNode(button2);
});
```

## pidgin/widgets ##

`widgets` is the utility module of pidgin.  Currently its only purpose is to register widgets with the current document.

For example, to create and register a new type of widget you would do something like:

```js
require(['pidgin/widgets', 'pidgin/_Widget'], function (widgets, _Widget) {
	var MyWidget = widget.register('x-my-widget', HTMLElement, _Widget, {
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

[Polymer/platform]: https://github.com/Polymer/platform
[Dijit]: https://github.com/dojo/dijit
[MDV]: http://www.polymer-project.org/platform/mdv.html
[Custom Elements]: http://www.polymer-project.org/platform/custom-elements.html
[Pointer Events]: http://www.polymer-project.org/platform/pointer-events.html