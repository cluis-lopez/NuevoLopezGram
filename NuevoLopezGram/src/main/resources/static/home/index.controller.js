(function() {
	'use strict';

	angular
		.module('app')
		.controller('Home.IndexController', Controller);

	function Controller($scope, $http, $localStorage, $location, $state, $rootScope, $uibModal, $sce) {

		var pageNumber = 0;

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

		$scope.refresh = function() {
			$state.reload();
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
			templateUrl: 'home/confirmModal.html',
			controller: 'ModalConfirmCtrl',
			controllerAs: 'pc',
			size: 'l',
			resolve: {
				data: function() {
					var varHtml = $sce.trustAsHtml("<p>Al borrar este post borrarás también todos sus comentarios</p>");
					return {title: '¿Seguro que quieres borrar este post?', varHtml: varHtml, eventId: eventId};
				}
			}
		});

		modalInstance.result.then(function() {
		});
	}
};

angular.module('app').controller('ModalConfirmCtrl', function($uibModalInstance, $http, data) {
		var pc = this;
		pc.data = data;

		 pc.cancelModal = function () {
			$uibModalInstance.close();
		}
		
		pc.confirmModal = function () {
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

angular.module('app').controller('ModalEventCtrl', function($uibModalInstance, $http, $localStorage, $scope, $location) {
	var pc = this;
	var urlEncodedData;

	$scope.cameraState = false;
	$scope.textRows = 5;
	$scope.foto = '';
	$scope.data = {};
	$scope.data.creatorMail = $localStorage.currentUser.username;
	$scope.data.text = '';
	$scope.data.multiMedia = '';
	$scope.data.location = {};

	pc.send = function() {
		if ($scope.text == '' && $scope.foto == '') {
			window.alert("Nada que enviar");
			return;
		}

		if ($scope.foto != '') {
			// Upload picture
			var fd = new FormData();
			fd.append("file", dataURLToBlob($scope.foto), $scope.data.creatorMail + ":");
			$http({
				url: '/api/upload',
				method: 'POST',
				data: fd,
				headers: { 'Content-Type': undefined }
			})
				.success(function(data) {
					console.log("Uploaded: " + data.key);
					$scope.data.multiMedia = data.key;

					//Now upload the event

					urlEncodedData = 'creatorMail=' + encodeURIComponent($scope.data.creatorMail);
					urlEncodedData += '&text=' + encodeURIComponent($scope.data.text);
					urlEncodedData += '&multiMedia=' + encodeURIComponent($scope.data.multiMedia);
					urlEncodedData += '&location=' + encodeURIComponent(JSON.stringify($scope.data.location));

					$http({
						url: '/api/event',
						method: 'POST',
						data: urlEncodedData,
						headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
					})
						.success(function(status) {
							console.log("Sent " + status.status + " " + status.message);
							angular.element(document.getElementById('events')).scope().refresh();
						})
						.error(function(status) {
							console.log("Failed to Upload event " + status.status + " " + status.message);
							if (status.status === 401) {
								$localStorage.removeItem('currentUser');
								$location.path('/login');
							}
						});

				})
				.error(function(status) {
					console.log("Failed to Upload picture " + status.status + " " + status.message);
				});
		} else { //No hay foto que subir, solo subimos el texto

			urlEncodedData = 'creatorMail=' + encodeURIComponent($scope.data.creatorMail);
			urlEncodedData += '&text=' + encodeURIComponent($scope.data.text);
			urlEncodedData += '&multiMedia=' + encodeURIComponent($scope.data.multiMedia);
			urlEncodedData += '&location=' + encodeURIComponent(JSON.stringify($scope.data.location));

			$http({
				url: '/api/event',
				method: 'POST',
				data: urlEncodedData,
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
			})
				.success(function(status) {
					console.log("Sent" + status.status + " " + status.message);
					angular.element(document.getElementById('events')).scope().refresh();
				})
				.error(function(status) {
					console.log("Failed to Upload event " + status.status + " " + status.message);
					if (status.status === 401) {
						$localStorage.removeItem('currentUser');
						$location.path('/login');
					}
				});
		}
		$uibModalInstance.close();
	};

	pc.cancel = function() {
		$uibModalInstance.dismiss('cancel');
	};

	pc.removeFoto = function() {
		$scope.foto = '';
		$scope.textRows = 5;
		$scope.cameraState = false;
	};

	pc.camera = function() {
		//Plain vanila JS to generate a click in the File input form
		var elem = document.getElementById('hiddeninput');
		if (elem && document.createEvent) {
			var evt = document.createEvent("MouseEvents");
			evt.initEvent("click", true, false);
			elem.dispatchEvent(evt);
		}
	}

	pc.location = function() {
		navigator.geolocation.getCurrentPosition(function(pos) {
			$scope.data.location.lat = pos.coords.latitude;
			$scope.data.location.long = pos.coords.longitude;
		});
	}

	//Codigo importado (JQuery) para tratamiento de las fotos

	pc.readURL = function(input) {
		// var ctx = document.getElementById("foto").getContext("2d");
		if (input.files && input.files[0]) {
			var reader = new FileReader();
			reader.onload = (function(tf) {
				return function(evt) {
					$scope.foto = evt.target.result;
					$scope.textRows = 2;
					$scope.$apply();
				}
			})(input.files[0]);
			reader.readAsDataURL(input.files[0]);
		};
	};

	/* Utility function to convert a canvas to a BLOB */
	var dataURLToBlob = function(dataURL) {
		var BASE64_MARKER = ';base64,';
		if (dataURL.indexOf(BASE64_MARKER) == -1) {
			var parts = dataURL.split(',');
			var contentType = parts[0].split(':')[1];
			var raw = parts[1];

			return new Blob([raw], { type: contentType });
		}

		var parts = dataURL.split(BASE64_MARKER);
		var contentType = parts[0].split(':')[1];
		var raw = window.atob(parts[1]);
		var rawLength = raw.length;

		var uInt8Array = new Uint8Array(rawLength);

		for (var i = 0; i < rawLength; ++i) {
			uInt8Array[i] = raw.charCodeAt(i);
		}

		return new Blob([uInt8Array], { type: contentType });
	}

});
}) ();

