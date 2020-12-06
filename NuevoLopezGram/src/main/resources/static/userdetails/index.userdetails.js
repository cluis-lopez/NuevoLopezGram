(function () {
    'use strict';

    angular
        .module('app')
        .controller('UserDetailsController', Controller);

    function Controller($scope, $rootScope, $location, $http) {
        var vm = this;
		$scope.loading;
		$scope.data = {};
		
        initController();

        function initController() {
		$http({
			url: '/api/userdetails',
			method: 'GET'
			}).success(function (data){
				$scope.data= data;

				var jsdata = Date.parse(data.lastPost);
				if (jsdata == 0)
					$scope.data.lastPost = 'N.A.';
				else
					$scope.data.lastPost = $rootScope.$formatDates(data.lastPost);
			
			}).error(function(status){
				console.log("Failed to ger User Details " + status.status + " " + status.message);
				if (status.status === 401) {
					console.log('Unauthorized');
					$localStorage.removeItem('currentUser');
					$location.path('/login');
				}
			});
        }

    }
})();