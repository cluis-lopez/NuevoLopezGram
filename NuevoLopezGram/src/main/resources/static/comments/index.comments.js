(function() {
	'use strict';

	angular
		.module('app')
		.controller('commentsController', Controller);

	function Controller($scope, $rootScope, $http, $localStorage, $location, $state, $uibModal, $sce) {

		$scope.eId = $location.search().event;
		$scope.parentId = $scope.eId.id;
		console.log($scope.parentId);
		$scope.user = $localStorage.currentUser.username;
		console.log($scope.user);
		$scope.comments = [];
		$scope.loading = false;
		
		var offset = 0;
		var numEvents = 5;
		var unBlock = true;
		var endOfData = false;
		
		initController();

		function initController() {
			if (endOfData)
				return;
			$scope.loading = true;
			
			$http({
				url: '/api/event',
				method: 'GET',
				params: {
					offset: offset, numEvents: numEvents,
					isComment: true, eventCommented: $scope.parentId
				}
			}).success(function(data) {
				var alt = document.getElementById("comments").clientHeight - 110;
				offset += data.length;
				$scope.comments = $scope.comments.concat(data);
				document.getElementById("commentsContainer").style.paddingTop = alt + 'px';
				$scope.loading = false;
				$scope.unBlock = true;
				if (data.length<numEvents)
					endOfData = true;
			}).error(function(status) {
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

		$scope.newComment = function() {
			openModal($scope.parentId);
		}

		$scope.deleteComment = function(id) {
			confirmModal(id);
		}

		$scope.loadMore = function() {
			$scope.unBlock = false;
			initController();
		}
		
		$scope.refresh = function() {
			$scope.comments = [];
			$scope.unBlock = false;
			endOfData = false;
			offset = 0;
			initController();
		}


		function openModal(eId) {
			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: 'User Reg',
				ariaDescribedBy: 'modal-body',
				templateUrl: 'home/eventModal.html',
				controller: 'ModalEventCtrl',
				controllerAs: 'pc',
				size: 'l',
				resolve: {
					data: function() {
						return eId;
					}
				}
			});

			modalInstance.result.then(function() {
			});
		};

		function confirmModal(id) {
			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: 'User Reg',
				ariaDescribedBy: 'modal-body',
				templateUrl: 'comments/commentsModal.html',
				controller: 'commentsConfirmCtrl',
				controllerAs: 'pc',
				size: 'l',
				resolve: {
					data: function() {
						var varHtml = $sce.trustAsHtml("");
						var title = $sce.trustAsHtml("&iquest;Seguro que quieres borrar este comentario?")
						return { title: title, varHtml: varHtml, eventId: id, parentId: $scope.parentId };
					}
				}
			})
			modalInstance.result.then(function() {
			})
		}
	};

	angular.module('app').controller('commentsConfirmCtrl', function($uibModalInstance, $http, data) {
		var pc = this;
		pc.data = data;

		pc.cancelModal = function() {
			$uibModalInstance.close();
		}

		pc.confirmModal = function() {
			var urlEncodedData = 'eventId=' + encodeURIComponent(data.eventId);
			urlEncodedData += '&parentId=' + encodeURIComponent(data.parentId);
			$http({
				url: '/api/event',
				method: 'DELETE',
				data: urlEncodedData,
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
			}).success(function(status) {
				console.log("Deleted event " + status.status + " : " + status.message);
				angular.element(document.getElementById('comments')).scope().refresh();
			}).error(function(status) {
				console.log("Failed to Delete event " + status.status + " " + status.message);
				if (status.status === 401) {
					console.log('Unauthorized');
					$localStorage.removeItem('currentUser');
					$location.path('/login');
				}
			});
			$uibModalInstance.close();
		}
	});


})();