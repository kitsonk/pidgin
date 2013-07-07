require({
	baseUrl: '../..',
	packages: [{
		name: 'core',
		location: 'lib/core'
	}, {
		name: 'pidgin',
		location: '.'
	}]
}, [
	'pidgin/_Widget',
	'pidgin/widgets',
	'pidgin/tmpl',
	'pidgin/tmpl!examples/todomvc/resources/todolist.html',
], function (_Widget, widgets, tmpl, listTemplate) {
	'use strict';

	var after = widgets.after,
		property = widgets.property,
		itemCount = 0;

	/* Here we register the custom pidgin widgets utilised in the application */

	/* This widget essentially appends a new todo on the list when enter is pressed */
	widgets.register('pd-new-todo', HTMLInputElement, _Widget, {
		events: {
			'keypress': function (e) {
				if ((e.keyCode || e.which) === 13) {
					if (main && main.list) {
						main.list.unshift({
							text: this.value,
							status: '',
							index: ++itemCount
						});
						footer.checkDisplay();
						main.checkDisplay();
						clearComplete.checkDisplay();
						this.value = '';
					}
				}
			}
		}
	});

	/* This is the main list widget, which the template will instantiate a set of children widgets that represent each
	 * todo */
	widgets.register('pd-todo-list', HTMLElement, _Widget, {
		/**
		 * The widgets template
		 * @type {pidgin/tmpl}
		 */
		template: listTemplate,

		/**
		 * This is the array of todos.
		 * @type {Array}
		 */
		list: [],

		/**
		 * Calculated property that provides a flag if all the todos are complete or not;
		 * @type {Boolean}
		 */
		allComplete: property({
			get: function () {
				return this.list.length && (this.complete === this.list.length);
			},
			set: function () {},
			enumerable: true,
			configruable: true
		}),

		/**
		 * Calculated property the returns the number of completed todos
		 * @type {Number}
		 */
		complete: property({
			get: function () {
				return this.list.reduce(function (previous, item) {
					return item.status === 'completed' ? ++previous : previous;
				}, 0);
			},
			enumerable: true,
			configruable: true
		}),

		/**
		 * Method that verifies if the widget should be displayed or not
		 */
		checkDisplay: function () {
			if (this.list.length && this.isHidden) {
				this.show();
				if (!this._toggleHandle) {
					this._toggleHandle = this.on({
						selector: '#toggle-all',
						type: 'click',
						listener: function (e) {
							e.preventDefault();
							var allComplete = this.allComplete;
							this.list.forEach(function (item) {
								item.status = allComplete ? '' : 'completed';
							});
							clearComplete.checkDisplay();
						}
					});
				}
			}
			else if (!this.list.length) {
				if (this._toggleHandle) {
					this._toggleHandle[0].remove();
					delete this._toggleHandle;
				}
				this.hide();
			}
		}
	});

	/* This widget provides the footer, which should only be displayed when there are todo items */
	widgets.register('pd-footer', HTMLElement, _Widget, {
		checkDisplay: function () {
			if (main.list.length && this.isHidden) {
				this.show();
			}
			else if (!main.list.length) {
				this.hide();
			}
		}
	});

	/* Since this template is so small we will just create it on the fly */
	var incompleteTemplate = tmpl('tmpl/pd-incomplete', '<strong>{{ incomplete }}</strong> item left');

	/* global HTMLSpanElement */
	/* This widget provides how many todos there are left to do */
	widgets.register('pd-incomplete', HTMLSpanElement, _Widget, {
		/**
		 * The widget's template
		 * @type {pidgin/tmpl}
		 */
		template: incompleteTemplate,

		/**
		 * Provide the number of incomplete todos
		 * @type {Number}
		 */
		incomplete: property({
			get: function () {
				return main && main.list && main.list.reduce(function (previous, item) {
					return item.status !== 'completed' ? ++previous : previous;
				}, 0);
			},
			enumerable: true,
			configruable: true
		})
	});

	/* Since this template is so small we will just creat it on the fly */
	var clearTemplate = tmpl('tmpl/pd-clear', 'Clear completed ({{ complete }})');

	/* This widget provides the ability to remove all of the completed todos */
	widgets.register('pd-clear', HTMLButtonElement, _Widget, {
		/**
		 * The widget's template
		 * @type {pidgin/tmpl}
		 */
		template: clearTemplate,

		/**
		 * The events that should be mapped for the widget
		 * @type {Object}
		 */
		events: {
			'click': function () {
				main.list = main.list.filter(function (item) {
					return item.status !== 'completed';
				});
				this.hide();
				main.checkDisplay();
				footer.checkDisplay();
			}
		},

		/**
		 * Returns the number of complete todos
		 * @type {Number}
		 */
		complete: property({
			get: function () {
				return main.complete;
			},
			enumerable: true,
			configruable: true
		}),

		/**
		 * A method that determines if the widget should be displayed or not
		 */
		checkDisplay: function () {
			if (this.complete) {
				this.show();
			}
			else {
				this.hide();
			}
		}
	});

	/* Each ToDo Item is an instance of the ToDoItem Widget.  The template for the TodoList generates the instances
	 * and its sub-nodes. */
	widgets.register('pd-todo-item', HTMLLIElement, _Widget, {

		/**
		 * Fired after attributes changed, we are interested only in 'class' changing and moving into editing mode
		 * where we then want to focus and select our edit boxes input node.
		 * @param  {String} name The name of the attribute that has changed
		 */
		attributeChanged: after(function (name) {
			if (name === 'class') {
				var value = this.getAttribute(name);
				if (value === 'editing') {
					var edit = this.query('input.edit')[0];
					edit.focus();
					edit.select();
				}
			}
		}),

		/**
		 * The attributes we want copied from the DOM node upon insertion into the document.  We are only interested
		 * in `index`, which will be set by the template to indicate which todo item we are bound to.
		 * @type {Array}
		 */
		attributeMap: [ 'index' ],

		/**
		 * The index this todo item is bound to
		 * @type {Number}
		 */
		index: 0,

		/**
		 * These are events that automatically get attached when this widget gets inserted into the DOM.
		 * @type {Object}
		 */
		events: {
			/**
			 * When the tick mark is clicked, toggle the 'completed' status.
			 */
			'input.toggle:click': function (e) {
				e.preventDefault();
				var idx = this.index;
				main.list.some(function (item) {
					if (item.index === idx) {
						item.status = (item.status === 'completed' || item.status === false) ? '' : 'completed';
						clearComplete.checkDisplay();
						return true;
					}
				});
			},

			/**
			 * When the todo item's label is double clicked, change to a status of 'editing'
			 * @param  {Event} e The event object
			 */
			'label:dblclick': function (e) {
				e.preventDefault();
				var idx = this.index;
				main.list.some(function (item) {
					if (item.index === idx) {
						item.status = 'editing';
						clearComplete.checkDisplay();
						return true;
					}
				});
			},

			/**
			 * Look for carriage return while keys are being pressed within the edit input and then change item to
			 * 'incomplete' mode
			 * @param  {Event} e The event object
			 */
			'input.edit:keypress': function (e) {
				if ((e.keycode || e.which) === 13) {
					var idx = this.index;
					main.list.some(function (item) {
						if (item.index === idx) {
							item.status = '';
							clearComplete.checkDisplay();
							return true;
						}
					});
				}
			},

			/**
			 * Look for when a todo being edited is blurred and set it to not completed
			 */
			'input.edit:blur': function () {
				var idx = this.index;
				main.list.some(function (item) {
					if (item.index === idx) {
						item.status = '';
						clearComplete.checkDisplay();
						return true;
					}
				});
			},

			/**
			 * This event will remove the todo from the list
			 * @param  {Event} e The event object
			 */
			'button:click': function (e) {
				e.preventDefault();
				var idx = this.index,
					arrayIdx;
				if (main.list.some(function (item, i) {
					if (item.index === idx) {
						arrayIdx = i;
						return true;
					}
				})) {
					main.list.splice(arrayIdx, 1);
					footer.checkDisplay();
					main.checkDisplay();
					clearComplete.checkDisplay();
				}
			}
		}
	});

	var main = document.getElementById('main'),
		footer = document.getElementById('footer'),
		clearComplete = document.getElementById('clear-completed');

	/* global Platform */
	Platform.performMicrotaskCheckpoint();
});
