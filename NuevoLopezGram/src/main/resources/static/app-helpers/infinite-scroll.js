var mod;

mod = angular.module('infinite-scroll', []);

mod.directive('infiniteScroll', function() {
	return function(scope, elm, attr) {
		var raw = elm[0];

		elm.bind('scroll', function() {
			if (scope.unBlock && raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
				scope.$apply(attr.infiniteScroll);
			}
		});
	};
});