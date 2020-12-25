(function() {
	'use strict';

	angular
		.module('app')
		.controller('Home.IndexController', Controller);

	function Controller($scope, $http, $localStorage, $location, $rootScope, $uibModal, $sce, $q) {

		var offset = 0;
		var numEvents = 5;
		var endOfData = false;
		$scope.loading = false;
		$scope.events = [];
		$scope.unBlock = true;

		initController();

		function initController() {
			if (endOfData)
				return;
			$scope.loading = true;
			$http({
				url: '/api/event',
				method: 'GET',
				params: {offset: offset, numEvents: numEvents}
			}).success(function(data) {
					offset += data.length;
					$scope.events = $scope.events.concat(data);
					$scope.user = $localStorage.currentUser.username;
					$scope.loading = false;
					$scope.unBlock = true;
					if (data.length<numEvents)
						endOfData = true;
				})
				.error(function(status) {
					console.log("Failed to get events " + status.status + " " + status.error);
					if (status.status === 401) {
						$localStorage.currentUser = '';
						$location.path('/login');
					}
				});
		}

		$scope.trustURL = function(src) {
			return $sce.trustAsResourceUrl(src);
		}

		$scope.loadMore = function() {
			$scope.unBlock = false;
			initController();
		}

		$scope.refresh = function() {
			endOfData = false;
			offset = 0;
			$scope.events = [];
			initController();
		}

		$scope.eventComments = function(event) {
			console.log("Vamos a comentarios..." + event.id);
			$location.path('/comments').search({ event: event });
		}

		$scope.userDetails = function() {
			console.log("Detalles de usuario");
			$location.path("/userDetails");
			console.log($location.path());
		}

		$scope.deleteEvent = function(eventId) {
			console.log("Borrando evento " + eventId);
			confirmModal(eventId);

		};

		$scope.eventDetails = function(command, eventId) {
			console.log("eventDetails " + command + " : " + eventId);
			$scope.loading = true;
			var urlEncodedData = 'command=' + encodeURIComponent(command)
				+ '&eventId=' + encodeURIComponent(eventId);

			$http({
				url: '/api/eventDetails',
				method: 'POST',
				data: urlEncodedData,
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
			})
				.success(function(status) {
					console.log("Sent" + status.status + " " + status.message);
					$scope.loading = false;
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

		$scope.formatDates = function(x) {
			return $rootScope.$formatDates(x);
		};


		var confirmModal = function(eventId) {
			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: 'modal-title',
				ariaDescribedBy: 'modal-body',
				templateUrl: 'home/homeModal.html',
				controller: 'homeConfirmCtrl',
				controllerAs: 'pc',
				size: 'l',
				resolve: {
					data: function() {
						var varHtml = $sce.trustAsHtml("<p>Al borrar este post borrar&aacute;s tambi&eacute;n todos sus comentarios</p>");
						var title = $sce.trustAsHtml("&iquest;Seguro que quieres borrar este post?")
						return { title: title, varHtml: varHtml, eventId: eventId };
					}
				}
			});

			modalInstance.result.then(function() {
			});
		}
	};

	angular.module('app').controller('homeConfirmCtrl', function($uibModalInstance, $http, data) {
		var pc = this;
		pc.data = data;
		var loading = false;

		pc.cancelModal = function() {
			$uibModalInstance.close();
		}

		pc.confirmModal = function() {
			if (loading == true)
				return;
			var urlEncodedData = 'eventId=' + encodeURIComponent(data.eventId);
			pc.loading = true;
			$http({
				url: '/api/event',
				method: 'DELETE',
				data: urlEncodedData,
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
			}).success(function(status) {
				console.log("Deleted event " + status.status + " : " + status.message);
				pc.loading = false;
				angular.element(document.getElementById('events')).scope().refresh();
			}).error(function(status) {
				console.log("Failed to Upload event " + status.status + " " + status.message);
				if (status.status === 401) {
					console.log('Unauthorized');
					pc.loading = false;
					$localStorage.removeItem('currentUser');
					$location.path('/login');
				}
			});
			$uibModalInstance.close();
		}
	});

	angular.module('app').controller('EventController', function($uibModal, $log) {
		var pc = this;

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
						return;
					}
				}
			});

			modalInstance.result.then(function() {
			});
		};
	});

})();


