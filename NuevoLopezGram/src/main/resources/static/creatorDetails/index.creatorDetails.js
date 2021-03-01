(function() {
	'use strict';

	angular
		.module('app')
		.controller('creatorDetailsController', Controller);

	function Controller($scope, $rootScope, $http, $location, $uibModal, $sce) {
		$scope.creatorMail = $location.search().creatorMail;
		$scope.loading = false;
		$scope.data = {};
		console.log($scope.creatorMail);
		var months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
		 'Agosto', 'Septiembre','Octubre','Noviembre', 'Diciembre'];

		initController();

		function initController() {
			$scope.loading = true;
			console.log('/api/userdetails?' + $scope.creatorMail);
			$http({
				url: '/api/userdetails?creatorMail=' + $scope.creatorMail,
				method: 'GET'
			}).success(function(data) {
				console.log(typeof (data) + " Retornado: " + data);
				$scope.data = data;
				var d = new Date(data.userSince);
				$scope.data.year = d.getFullYear();
				$scope.data.month = months[d.getMonth()];
				console.log(data);
				var jsdata = Date.parse(data.lastPost);
				if (jsdata == 0 || isNaN(jsdata))
					$scope.data.lastPost = 'N.A.';
				else
					$scope.data.lastPost = $rootScope.$formatDates(data.lastPost);
				$scope.loading = false;
			}).error(function(status) {
				console.log("Failed to ger User Details " + status.status + " " + status.message);
				if (status.status === 401) {
					console.log('Unauthorized');
					$localStorage.removeItem('currentUser');
					$location.path('/login');
				} else {
					$location.path('/home');
				}
			});
		}

		$scope.back = function(event) {
			$location.path('/home');
		}

		$scope.follow = function() {
			$scope.loading = true;
			var urlEncodedData = 'mailToFollow=' + encodeURIComponent($scope.creatorMail);
			$http({
				url: '/api/follow',
				method: 'POST',
				data: urlEncodedData,
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
			}).success(function(data) {
				console.log(typeof (data) + " Retornado: " + data.status + ":" + data.message);
				if (data.status === "OK") {
					var modalInstance = $uibModal.open({
						animation: true,
						ariaLabelledBy: 'Logout',
						ariaDescribedBy: 'modal-body',
						templateUrl: 'creatorDetails/creatorDetailsModal.html',
						controller: 'creatorConfirmController',
						controllerAs: 'pc',
						size: 'l',
						resolve: {
							data: function() {
								var varHtml = $sce.trustAsHtml("");
								var title = $sce.trustAsHtml("Ahora est&aacute;s siguiendo a <b>" + $scope.data.name + "</b>");
								return { title: title, varHtml: varHtml };
							}
						}
					});
					modalInstance.result.then(function() {
					});
				}
				$scope.loading = false;
			}).error(function(status) {
				console.log("Failed to ger User Details " + status.status + " " + status.message);
				if (status.status === 401) {
					console.log('Unauthorized');
					$localStorage.removeItem('currentUser');
					$location.path('/login');
				}
			});
		}
	}

	angular.module('app').controller('creatorConfirmController', function($uibModalInstance, AuthenticationService, $location, data) {
		var pc = this;
		pc.data = data;

		pc.confirmModal = function() {
			$uibModalInstance.close();
		}

	});

})();