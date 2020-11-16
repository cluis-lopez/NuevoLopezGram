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
		var urlEncodedData;
		
		$scope.cameraState = false;
		$scope.textRows = 5;
		$scope.data = {};
		$scope.data.creatorName = $localStorage.currentUser.username;
		$scope.data.text = '';
		$scope.data.multiMedia = '';
		$scope.data.location = {};

		pc.ok = function() {
			urlEncodedData = 'creatorName=' + encodeURIComponent($scope.data.creatorName);
			urlEncodedData += '&text=' + encodeURIComponent($scope.data.text);
			urlEncodedData += '&multiMedia=' + encodeURIComponent($scope.data.multiMedia);
			urlEncodedData += '&location=' + encodeURIComponent(JSON.stringify($scope.data.location));
			
			$http({	url: '/api/event',
					method: 'POST',
					data: urlEncodedData,
					headers: {'Content-Type': 'application/x-www-form-urlencoded'}
					})
				.success(function(data) {
					console.log("Sent");
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
		
		pc.camera = function(){
			if ($scope.cameraState) {
				$scope.cameraState = false;
				$scope.textRows = 5;
			} else {
				$scope.cameraState = true;
				$scope.textRows = 2;		
			}
		}
		
		pc.location = function(){	
			navigator.geolocation.getCurrentPosition(p);
			function p(pos){
				$scope.data.location.lat = pos.coords.latitude;
				$scope.data.location.long = pos.coords.longitude; 
			};
		}
		
		
		
	});
})();