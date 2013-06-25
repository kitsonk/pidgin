define([
	'./lib/core/doc'
], function (doc) {

	/**
	 * A hash of various queues
	 * @type {Object}
	 */
	var queues = {},

	/**
	 * A hash of known event, their target element and a test to see if they have already fired
	 * @type {Object}
	 */
		targets = {
			DOMContentLoaded: {
				target: doc,
				ready: function () {
					return doc.readyState === 'complete' || doc.readyState === 'loaded';
				}
			},
			WebComponentsReady: {
				target: doc,
				ready: function () {
					/* global CustomElements */
					return CustomElements && CustomElements.ready;
				}
			}
		};

	/**
	 * Process the FIFO queue of callbacks
	 * @param  {String} name The event name to identify the queue
	 */
	function processQueue(name) {
		var q = queues[name];
		if (q) {
			if (q.guard) {
				return;
			}
			q.guard = true;
			while (q.items.length) {
				try {
					(q.items.shift())(doc);
				}
				catch (e) {
					console.error('Error on ' + name + ' callback.');
					console.error(e);
				}
			}
			q.guard = false;
		}
	}

	/**
	 * Enqueue a callback in the named event queue
	 * @param  {String}   name     The event name
	 * @param  {Function} callback The callback function
	 */
	function queue(name, callback) {
		queues[name].items.push(callback);
		if (queues[name].ready) {
			processQueue(name);
		}
	}

	/**
	 * Detect a state or install a listener for an event that will then cause the queued callbacks to be called
	 * @param  {Element} target The target DOM object to potentially install the event on
	 * @param  {String}  name   The name of the event
	 */
	function on(target, name) {
		function listener() {
			target.removeEventListener(name, listener, false);
			queues[name].ready = true;
			processQueue(name);
		}

		if (queues[name]) {
			return;
		}
		queues[name] = {
			items: []
		};

		if (targets[name] && targets[name].ready) {
			queues[name].ready = targets[name].ready();
			if (queues[name].ready) {
				return;
			}
		}

		target.addEventListener(name, listener, false);
	}

	/**
	 * The base function that adds a callback to the FIFO queue for that event
	 * @param  {String}   name     The name of the event to queue the callback for
	 * @param  {Function} callback The callback function to be queued
	 */
	function ready(name, callback) {
		if (!queues[name]) {
			on((targets[name] && targets[name].target) || window, name);
		}
		queue(name, callback);
		if (queues[name].ready) {
			processQueue(name);
		}
	}

	/**
	 * The AMD loader function that allows an event to be specified as plugin argument
	 * @param  {String} id      The id that was passed to the loader
	 * @param  {Function} require The context aware `require()`
	 * @param  {Function} load    The callback to be called when the plugin is ready
	 */
	ready.load = function (id, require, load) {
		var name = id.split('!')[0] || 'DOMContentLoaded';
		ready(name, load);
	};

	return ready;
});