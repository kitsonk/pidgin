define([
	'./lib/core/compose'
], function (compose) {
	var property = compose.property;

	return compose({
		destroyed: property({
			value: false,
			writable: true,
			enumerable: false,
			configurable: true
		}),

		destroy: function () {
			this.destroyed = true;
		},

		own: function () {
			var i,
				handle,
				destroyMethodName,
				odh,
				hdh;

			for (i = 0; i < arguments.length; i++) {
				handle = arguments[i];
				destroyMethodName = 'destroy' in handle ? 'destroy' : 'remove';
				odh = aspect.before(this, 'destroy', function (preserveDom) {
					handle[destroyMethodName](preserveDom);
				});
				hdh = aspect.after(handle, destroyMethodName, function () {
					odh.remove();
					hdh.remove();
				}, true);
			}

			return arguments;
		}
	});
});