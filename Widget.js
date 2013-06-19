define([
	'exports',
	'./lib/dcl/dcl'
], function (exports, dcl) {
	'use strict';

	var Widget = dcl(null, {
		declaredClass: 'Widget'
	});

	/* jshint boss:true */
	return exports = Widget;
});