var profile = (function () {
	var testResourceRe = /^pidgin\/tests\//,

		copyOnly = function (filename, mid) {
			var list = {
				'pidgin/package': 1,
				'pidgin/package.json': 1,
				'pidgin/tests': 1
				// these are test modules that are not intended to ever be built
			};
			return (mid in list) ||
				(/^pidgin\/resources\//.test(mid) && !/\.css$/.test(filename)) ||
				/(png|jpg|jpeg|gif|tiff)$/.test(filename) ||
				/built\-i18n\-test\/152\-build/.test(mid);
		};

	return {
		resourceTags: {
			test: function (filename, mid) {
				return testResourceRe.test(mid) || mid === 'pidgin/tests';
			},

			copyOnly: function (filename, mid) {
				return copyOnly(filename, mid);
			},

			amd: function (filename, mid) {
				return !testResourceRe.test(mid) && !copyOnly(filename, mid) && /\.js$/.test(filename);
			}
		}
	};
})();