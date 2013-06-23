define([
	'exports',
	'require',
	'./util',
	'./lib/core/has!host-browser?./lib/core/request',
	'./lib/core/has!host-node?./lib/core/node!fs',
	'./lib/core/compose',
	'./lib/core/has',
	'./lib/core/doc'
], function (exports, require, util, request, fs, compose, has, doc) {
	'use strict';

	/* global HTMLTemplateElement */

	var property = compose.property,
		getDomAttributeDescriptor = util.getDomAttributeDescriptor;

	var notFound = {},
		pending = {},
		cache = {};

	function decorateTemplates(node) {
		/* jshint camelcase:false */
		HTMLTemplateElement.forAllTemplatesFrom_(node, function (template) {
			HTMLTemplateElement.decorate(template);
		});
	}

	/**
	 * The Template class which is to "wrap" the MDV templates
	 * @param  {String}   id         The unique ID for the plate (usually the MID for the template file)
	 * @param  {String}   text       The MDV template string (not wrapped in `<template>` tags)
	 * @param  {DOMNode}  appendNode A reference node to append the template, defaults to `document.body`
	 * @return {Template}            An instance of Template
	 */
	var Template = compose(function (id, text, appendNode) {
		this.node = doc.createElement('template');
		if (id) {
			this.id = id;
		}
		if (text) {
			this.node.innerHTML = text;
		}
		appendNode = appendNode || doc.body;
		if (appendNode) {
			appendNode.appendChild(this.node);
		}
		decorateTemplates(this.node);
	}, {
		/**
		 * The unique identifier for the template
		 * @type {String}
		 */
		id: property(getDomAttributeDescriptor('node', 'id')),

		/**
		 * The root `<template>` DOMNode for this template
		 * @type {DOMNode}
		 */
		node: null,

		/**
		 * "Stamp out" a MDV template
		 * @param  {Object}  model         The model to set on the instance of this MDV template
		 * @param  {DOMNode} referenceNode The node to use as reference for appending the template
		 * @return {DOMNode}               The MDV template DOM node
		 */
		stamp: function (model, referenceNode) {
			referenceNode = referenceNode || (model && model.node);
			var instance = doc.createElement('template');
			instance.setAttribute('ref', this.id);
			instance.setAttribute('bind', '{{}}');
			if (referenceNode) {
				referenceNode.appendChild(instance);
			}
			decorateTemplates(instance);
			instance.model = model;
			return instance;
		}
	});

	var getText,
		pathUtil;

	// Set `getText` as appropriate per platform to be able to fetch the template
	if (has('host-browser')) {
		getText = function (url, load) {
			request(url).then(load);
		};
	}
	else if (has('host-node')) {
		getText = function (url, load) {
			fs.readFile(url, 'utf8', function (err, text) {
				if (err) {
					throw new Error(err);
				}
				load(text);
			});
		};
		if (require.nodeRequire) {
			pathUtil = require.nodeRequire('path');
		}
		else {
			throw new Error('Plugin failed to load because it cannot find the original Node.js require');
		}
	}
	else {
		throw new Error('Non-supported environment.');
	}

	/**
	 * Generates an MDV template in the current document referenced by the `id` and built with provided `text`.  It
	 * can be used as an AMD plugin, where the AMD plugin argument is the name of a text file that contains the template
	 * text.  It will be added to the current document based on the normalized MID of the plugin argument.
	 * @param  {String}   id   The unique ID for the template
	 * @param  {String}   text An MDV formatted template string, without the enclosing `<template>`
	 * @return {Template}      The appropriate template.
	 */
	function tmpl(id, text) {
		if (id in cache) {
			return cache[id];
		}
		return new Template(id, text);
	}

	Object.defineProperties(tmpl, {
		/**
		 * A reference to the Template constructor
		 * @type {pidgin/tmpl.Template}
		 */
		Template: {
			value: Template
		},

		/**
		 * Identifies to the AMD loader that the plugin is dynamic and manages its own cache.
		 * @type {Boolean}
		 */
		dynamic: {
			value: true
		},

		/**
		 * Normalize the MID based on the environment being loaded in.
		 * @type {Function}
		 */
		normalize: {
			value: function (id, normalize) {
				if (id.charAt(0) === '.') {
					if (has('host-browser')) {
						var parts = id.split('!'),
							url = parts[0];
						id = (/^\./.test(url) ? normalize(url) : url) + (parts[1] ? '!' + parts[1] : '');
					}
					else {
						var referenceModuleDirname = require.toUrl(normalize('.')).replace('/', pathUtil.sep),
							segments = id.split('/');
						segments.unshift(referenceModuleDirname);

						id = pathUtil.join.apply(pathUtil, segments);
					}
				}
				return id;
			}
		},

		/**
		 * Load the referenced template and instantiate a Template based on the loaded template string
		 * @type {Function}
		 */
		load: {
			value: function (id, require, load) {
				var parts = id.split('!'),
					absMid = parts[0],
					url = require.toUrl(absMid),
					requireCacheUrl = 'url:' + url,
					text = notFound,
					template = notFound,
					finish = function (template) {
						load(template);
					},
					pendingList, i;

				if (absMid in cache) {
					template = cache[absMid];
				}
				else if (requireCacheUrl in require.cache) {
					text = require.cache[requireCacheUrl];
				}
				if (text !== notFound && template === notFound) {
					template = new Template(absMid, text);
				}
				if (template === notFound) {
					if (pending[url]) {
						pending[url].push(finish);
					}
					else {
						pendingList = pending[url] = [ finish ];
						getText(url, function (text) {
							template = cache[absMid] = new Template(absMid, text);
							for (i = 0; i < pendingList.length; i++) {
								pendingList[i](template);
							}
							delete pending[url];
						});
					}
				}
				else {
					finish(template);
				}
			}
		}
	});

	/* jshint boss:true */
	return exports = tmpl;
});
