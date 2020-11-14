(function () {
    'use strict';

    angular
        .module('app')
        .controller('Home.IndexController', Controller);

    function Controller($scope, $http) {
		
        initController();

        function initController() {
			$http.get('/api/event', {number: 5})
				.success(function (data){
					console.log(data.length);
					$scope.events = data.reverse();
				})
				.error(function (status){
					console.log("Failed to get events " + status);
				});
        }

    }
})();