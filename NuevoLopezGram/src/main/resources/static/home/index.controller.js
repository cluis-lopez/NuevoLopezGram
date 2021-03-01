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

		/* Check last visit */
		var lv = $localStorage.lastVisit;
		if (lv != null && typeof (lv) === 'string') {
			console.log("Cheking lastVisit: ", new Date() - new Date(lv));
			if (new Date() - new Date(lv) >  60 * 1000) //Más de un día desde la última visita
				welcomeAgain(lv);
		}

		$localStorage.lastVisit = new Date();

		initController();

		function initController() {
			if (endOfData)
				return;
			$scope.loading = true;
			$http({
				url: '/api/event',
				method: 'GET',
				params: { offset: offset, numEvents: numEvents }
			}).success(function(data) {
				offset += data.length;
				$scope.events = $scope.events.concat(data);
				$scope.user = $localStorage.currentUser.username;
				$scope.loading = false;
				$scope.unBlock = true;
				if (data.length < numEvents)
					endOfData = true;
			}).error(function(status) {
				console.log("Failed to get events " + status.status + " " + status.error);
				if (status.status === 401) {
					$localStorage.currentUser = '';
					$location.path('/login');
				}
			});
		}

		function welcomeAgain(d) {
			// Funcion temporaly cancelled. The Spring backend cannot deal with dates 
			// and brackets in Google Datastore
			return;
/*			$scope.loading = true;
			$http({
				url: '/api/getLastEvents',
				method: 'GET',
				params: { lastVisit: new Date(d).toISOString() }
			}).success(function(data) {
				$scope.loading = false;
				var addText = "";
				if (data.status === 'OK')
					addText = "<p>Desde tu &uacute;ltima conexi&oacte;n se han publicado " +
					data.message + " nuevos mensajes";

				var modalInstance = $uibModal.open({
					animation: true,
					ariaLabelledBy: 'modal-title',
					ariaDescribedBy: 'modal-body',
					templateUrl: 'home/welcomeAgainModal.html',
					controller: 'welcomeAgainCtrl',
					controllerAs: 'pc',
					size: 'l',
					resolve: {
						data: function() {
							var varHtml = $sce.trustAsHtml("<p>Tu &uacute;ltima conexi&oacute;n fue " +
								$rootScope.$formatDates(d) + "</p>");
								varHtml += addText;
							var title = $sce.trustAsHtml("Bienvenido de nuevo")
							return { title: title, varHtml: varHtml };
						}
					}
				});
				modalInstance.result.then(function() {
				});
			}).error(function() {
				$scope.loading = false;
				console.log("Failed to get last events " + status.status + " " + status.error);
				if (status.status === 401) {
					$localStorage.currentUser = '';
					$location.path('/login');
				}
			})*/
		}

		$scope.trustURL = function(src) {
			return $sce.trustAsResourceUrl(src);
		}

		$scope.loadMore = function() {
			$scope.unBlock = false;
			initController();
		}

		$scope.onReload = function() {
			console.warn('reload');
			$scope.loading = true;
			var deferred = $q.defer();
			setTimeout(function() {
				$scope.refresh();
				deferred.resolve(true);
				$scope.loading = false;
			}, 1000);
			return deferred.promise;
		}

		$scope.refresh = function() {
			endOfData = false;
			offset = 0;
			$scope.events = [];
			initController();
		}

		$scope.eventComments = function(event) {
			$location.path('/comments').search({ event: event });
		}

		$scope.userDetails = function() {
			console.log("HOME path: " + $location.path());
			console.log("HOME hash: " + $location.hash());
			$location.path("/userDetails");
		}

		$scope.creatorDetails = function(creatorMail) {
			console.log(creatorMail);
			if (creatorMail != $scope.user)
				$location.path('/creatorDetails').search({ creatorMail: creatorMail });
			else
				return;
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

	angular.module('app').controller('welcomeAgainCtrl', function($uibModalInstance, $http, data) {
		var pc = this;
		pc.data = data;
		var loading = false;

		pc.cancelModal = function() {
			$uibModalInstance.close();
		}
	});

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


