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
	'pidgin/tmpl!examples/todomvc/resources/todolist.html'
], function (_Widget, widgets, listTemplate) {
	'use strict';

	var after = widgets.after;

	var NewTodo = widgets.register('pd-new-todo', HTMLInputElement, _Widget, {
		created: after(function () {
			console.log(this);
		}),
		events: {
			'keypress': function (e) {
				if ((e.keyCode || e.which) === 13) {
					if (main && main.list) {
						main.list.unshift({
							text: this.value,
							status: ''
						});
						this.value = '';
					}
				}
			}
		}
	});

	var TodoList = widgets.register('pd-todo-list', HTMLElement, _Widget, {
		template: listTemplate,
		list: [],
		created: after(function () {
			this.list = [];
		})
	});

	var Footer = widgets.register('pd-footer', HTMLElement, _Widget, {
		created: after(function () {
			console.log(this);
		})
	});

	var main = document.getElementById('main');
	main.list.push({
		text: 'pidgin Rules',
		status: 'completed'
	});
	main.show();

	/* global Platform */
	Platform.performMicrotaskCheckpoint();
});
