(function() {
	'use strict';

	angular
		.module('app')
		.controller('Home.IndexController', Controller);

	function Controller($scope, $http) {

		initController();

		function initController() {
			$http.get('/api/event', { number: 5 })
				.success(function(data) {
					$scope.events = data.reverse();
				})
				.error(function(status) {
					console.log("Failed to get events " + status);
				});
		}
	};

	angular.module('app').controller('EventController', function($uibModal, $log) {
		var pc = this;
		pc.data = "Lorem Name Test";

		pc.openModal = function(size) {
			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: 'modal-title',
				ariaDescribedBy: 'modal-body',
				templateUrl: 'home/eventModal.html',
				controller: 'ModalEventCtrl',
				controllerAs: 'pc',
				size: 'l',
				resolve: {
					data: function() {
						return pc.data;
					}
				}
			});

			modalInstance.result.then(function() {
				alert("now I'll close the modal");
			});
		};
	});

	angular.module('app').controller('ModalEventCtrl', function($uibModalInstance, $http, $localStorage, $scope) {
		var pc = this;
		
		var local = $localStorage.currentUser;
		console.log("variable local :"+local);
		$scope.data = {};
		$scope.data.creatorName = local.username;
		$scope.data.text = '';
		$scope.data.multiMedia = '';

		pc.ok = function() {
			
			$http.post('/api/event', $scope.data)
				.success(function(data) {
					$scope.events = data.reverse();
				})
				.error(function(status) {
					console.log("Failed to get events " + status);
				});
			$uibModalInstance.close();
		};

		pc.cancel = function() {
			//{...}
			alert("You clicked the cancel button.");
			$uibModalInstance.dismiss('cancel');
		};
	});
})();