# pidgin/_Widget

**_Widget** is an abstract class/mixin that provides basic widget like functionality to Custom Elements.  It is designed
to be mixed into a class that is either `HTMLElement` or has `HTMLElement` in its prototype chain.  It is the foundation
of functionality for pidgin widgets.

## Usage

It should be used via the `pidgin/widgets` module to create new classes of widgets.  Basic usage would look something
like:

```js
require(['pidgin/widgets', 'pidgin/_Widget'], function (widgets, _Widget) {
	var MyWidget = widgets.register('my-widget', HTMLElement, _Widget, {
		foo: 'bar'
	});

	/* creating an instance */
	var mywidget1 = new MyWidget();
	/* or */
	var mywidget1 = document.create('my-widget');
});
```

You can also create an instance declaratively:

```
<my-widget></my-widget>
```

## Lifecycle

There are currently three lifecycle methods which can be extended on the widget:

* `.created()` - This occurs after instantiation, after initial attributes have been copied to properties, but before
  any template has been stamped out and events attached.  This is called synchronously.

* `.inserted()` - Called asynchronously whenever the widget is inserted into the DOM.

* `.removed()` - Called asynchronously whenever the widget is removed from the DOM.

All of these functions can manage asynchronous return values.  This is most useful with `.created()`, where if the value
returned is a promise, it will wait until that promise is fulfilled before proceeding with stamping out at template.

In order to enhance the behaviour of these methods, you should utilise the aspect oriented programming decorators that
are available via the `pidgin/widgets` module.  For example to do something after the inherited `.created()` methods
have executed, utilise the `widgets.after()` decorator:

```js
require(['pidgin/widgets', 'pidgin/_Widget'], function (widgets, _Widget) {
	var MyWidget = widgets.register('my-widget', HTMLElement, _Widget, {
		created: aspect.after(function () {
			console.log('I was created!');
		});
	});
});
```

## Placement

Pidgin widgets are DOM Custom Elements.  That means they can be placed and manipulated just like other DOM elements.
Any DOM manipulation library should work well with instances of the widgets, but there is a helper function for
placing the widget in the DOM named `.place()`.  This function takes one or two arguments.  The first argument is
node being referenced or the string ID of the node and the second optional argument is a CSS type selector indicating
where the widget should be positioned.  If there is no selector supplied, it is assumed to be the child selector (`>`)
and the widget will be appended as a child to the node referenced:

```js
require(['pidgin/widgets', 'pidgin/_Widget'], function (widgets, _Widget) {
	var MyWidget = widgets.register('my-widget', HTMLElement, _Widget);

	var mywidget = new MyWidget();

	mywidget.place('someNode');
	/* which is the same as */
	mywidget.place('someNode', '>');
});
```

## Events

Assigning listeners to widget events is accomplished via the `.on()` function.  This function takes a configuration
object which specifies the details of the event being listened for.  The configuration object requires two properties
and has an optional third:

* `type` - The type of event being listened for.  (e.g. `'click'`)

* `listener` - The listener function to be called when the event is detected.

* `selector` - This optional property specifies the CSS selector that identifies a widget's sub node that the listener
  should be attached to.  For example, if the widget contains a child node that was a `<span>` tag, then the selector
  of `'span'` would select that node.  If the property is omitted, the target will be the widget itself.

Listeners, even those attached with a selector, will be scoped so that `this` refers to the widget instance when called.
If you need to know specifically the target of the event, the listener should introspect the event object passed as an
argument to the listener.

Events can be auto-attached during the insertion lifecycle.  There is a property of `.events`, which supplies a hash of
events to listen for and their listeners.  The each property key identifies the event type (and optionally the
selector).  The value of the property is the listener or the name of the listener in the class.  For example, if you
wanted to log click events to the console, you would do something like:

```js
{
	events: {
		'click': function (e) {
			console.log(e);
		}
	}
}
```

If your widget had a sub-element of a button, which you wanted to listen to on a method named `_onClick` you would want
to do something like:

```js
{
	events: {
		'button:click': '_onClick'
	},
	_onClick: function (e) {
		console.log(e);
	}
}
```

Synthetic events can be emitted on the widget or its sub-nodes via the `.emit()` function.  The function takes a
configuration object which specifies the details of the event to be emitted.  The configuration object requires two
properties and has an optional third:

* `type` - The type of the event being emitted. (e.g. `'click'`)

* `event` - The synthetic event object.

* `selector` - This optional property specifies the CSS selector that identifies a sub-node of the current widget that
  is the target of the event.  For example, if the widget contains a child node that was a `<span>` tag, then the
  selector of `'span'` would target the event on that node.  If the property is omitted, the target will be the widget
  itself.

## Hiding and Showing

There are two convenience methods which make hiding and showing a widget easy.  There is the `.hide()` method which
hides the widget and `.show()` which shows the widget.  The read-only property `.isHidden` will return `true` if the
widget is currently hidden and `false` if the widget is currently visible.
