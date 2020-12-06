(function() {
	'use strict';

	angular
		.module('app')
		.controller('Home.IndexController', Controller);

	function Controller($scope, $http, $localStorage, $location, $state, $rootScope, $uibModal, $sce, $q) {

		var pageNumber = 0;
		$scope.loading = false;

		initController();

		function initController() {
			$scope.loading = true;
			$http.get('/api/event', { pagenumber: pageNumber, number: 10 })
				.success(function(data) {
					$scope.events = data;
					$scope.user = $localStorage.currentUser.username;
					$scope.loading = false;
				})
				.error(function(status) {
					console.log("Failed to get events " + status.status + " " + status.error);
					if (status.status === 401) {
						$localStorage.currentUser = '';
						$location.path('/login');
					}
				});
		}
		
		$scope.trustURL = function (src){
			return $sce.trustAsResourceUrl(src);
		}

		$scope.onReload = function() {
			console.warn('reload');
			window.alert("swipe");
			var deferred = $q.defer();
			setTimeout(function() {
				deferred.resolve(true);
			}, 1000);
			$state.reload();
			return deferred.promise;
		};

		$scope.refresh = function() {
			initController();
			//$state.reload();
		}

		$scope.eventComments = function(event) {
			console.log("Vamos a comentarios..." + event.id);
			$location.path('/comments').search({ event: event });
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

		pc.cancelModal = function() {
			$uibModalInstance.close();
		}

		pc.confirmModal = function() {
			var urlEncodedData = 'eventId=' + encodeURIComponent(data.eventId);
			$http({
				url: '/api/event',
				method: 'DELETE',
				data: urlEncodedData,
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
			}).success(function(status) {
				console.log("Deleted event " + status.status + " : " + status.message);
				angular.element(document.getElementById('events')).scope().refresh();
			}).error(function(status) {
				console.log("Failed to Upload event " + status.status + " " + status.message);
				if (status.status === 401) {
					console.log('Unauthorized');
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

