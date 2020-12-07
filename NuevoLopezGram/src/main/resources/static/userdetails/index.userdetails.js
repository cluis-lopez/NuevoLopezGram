(function() {
	'use strict';

	angular
		.module('app')
		.controller('UserDetailsController', Controller);

	function Controller($scope, $rootScope, $location, $http, $uibModal, $sce) {
		var vm = this;
		$scope.loading = false;
		$scope.data = {};

		initController();

		function initController() {
			$scope.loading = true;
			$http({
				url: '/api/userdetails',
				method: 'GET'
			}).success(function(data) {
				$scope.data = data;

				var jsdata = Date.parse(data.lastPost);
				if (jsdata == 0)
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
				}
			});
		}

		$scope.logout = function() {
			console.log("logout");
			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: 'Logout',
				ariaDescribedBy: 'modal-body',
				templateUrl: 'userdetails/userDetailModal.html',
				controller: 'userDetailLogoutController',
				controllerAs: 'pc',
				size: 'l',
				resolve: {
					data: function() {
						var varHtml = $sce.trustAsHtml("");
						var title = $sce.trustAsHtml("&iquest;Seguro que quieres cerrar esta sesi&oacute;n?")
						return { title: title, varHtml: varHtml };
					}
				}
			});
			modalInstance.result.then(function() {
			});
		}

		$scope.removeUser = function() {
			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: 'Logout',
				ariaDescribedBy: 'modal-body',
				templateUrl: 'userdetails/userDetailModal.html',
				controller: 'userDetailRemoveController',
				controllerAs: 'pc',
				size: 'l',
				resolve: {
					data: function() {
						var varHtml = $sce.trustAsHtml("<i class='icon-attention-filled' style='font-size: 24px'></i> Atencion !!!");
						var title = $sce.trustAsHtml("Si borras tu usuario se perder&aacute;n todos tus posts y comentarios")
						return { title: title, varHtml: varHtml };
					}
				}
			});
			modalInstance.result.then(function() {
			});

		}

		$scope.changePassword = function() {
			changePasswordModal();
		}

	}

	angular.module('app').controller('userDetailLogoutController', function($uibModalInstance, $localStorage, $location, data) {
		var pc = this;
		pc.data = data;

		pc.confirmModal = function() {
			$localStorage.currentUser = null;
			$location.path("/");

		}

		pc.cancelModal = function() {
			$uibModalInstance.close();
		}

	});

	angular.module('app').controller('userDetailRemoveController', function($uibModalInstance, $localStorage, $location, data) {
		var pc = this;
		pc.data = data;

		pc.confirmModal = function() {
			$http({
				url: '/api/userdetails',
				method: 'DELETE'
			}).success(function(data) {
				window.alert("Ha sido un placer\n"+data.message);
				$scope.loading = false;
				$localStorage.currentUser = null;
				$uibModalInstance.close();
				$location.path("/");
			}).error(function(status) {
				console.log("Failed to ger User Details " + status.status + " " + status.message);
				if (status.status === 401) {
					console.log('Unauthorized');
				}
			});
		}

		pc.cancelModal = function() {
			$uibModalInstance.close();
		}

	});
})();