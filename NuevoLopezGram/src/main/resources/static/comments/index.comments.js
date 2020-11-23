(function() {
	'use strict';

	angular
		.module('app')
		.controller('commentsController', Controller);

	function Controller($scope, $rootScope, $http, $localStorage, $location, $state) {

		$scope.eId = $location.search().event;
		console.log($scope.eId.id);
		$scope.user = $localStorage.currentUser.username;
		console.log($scope.user);
		initController();

		function initController() {
			$http({
				url: '/api/event',
				method: 'GET',
				params: {
					pagenumber: 0, number: 10,
					isComment: true, eventCommented: $scope.eId.id
				}
			})
				.success(function(data) {
					$scope.comments = data;
				})
				.error(function(status) {
					console.log("Failed to get events " + status.status + " " + status.error);
					if (status.status === 401) {
						$localStorage.currentUser = '';
						$location.path('/login');
					}
				});
		}


		$scope.getBack = function() {
			$location.path('/home');
		}

		$scope.formatDates = function(x) {
			return $rootScope.$formatDates(x);
		};

		$scope.eventDetails = function(command, eventId) {
			console.log("eventDetails " + command + " : " + eventId);
			var urlEncodedData = 'command=' + command + '&eventId=' + eventId;
			//FIXME error al borrar comentarios
			$http({
				url: '/api/eventDetails',
				method: 'POST',
				data: urlEncodedData,
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
			})
				.success(function(status) {
					console.log("Sent" + status.status + " " + status.message);
					$scope.refresh();
				})
				.error(function(status) {
					console.log("Failed to Upload event " + status.status + " " + status.message);
					if (status.status === 401) {
						console.log('Unauthorized');
						$localStorage.removeItem('currentUser');
						$location.path('/login');
					}
				});
		}


	};


})();