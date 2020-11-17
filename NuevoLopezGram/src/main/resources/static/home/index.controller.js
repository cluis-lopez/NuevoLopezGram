(function() {
	'use strict';

	angular
		.module('app')
		.controller('Home.IndexController', Controller);

	function Controller($scope, $http, $localStorage, $location) {

		var pageNumber = 0;
		initController();

		function initController() {
			$http.get('/api/event', { pagenumber: pageNumber, number: 5 })
				.success(function(data) {
					$scope.events = data;
				})
				.error(function(status) {
					console.log("Failed to get events " + status.status + " " + status.error);
					if (status.status === 401) {
						$localStorage.currentUser = '';
						$location.path('/login');
					}
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
				//Aqui refresh de la página
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
		$scope.data.creatorName = $localStorage.currentUser.username;
		$scope.data.text = '';
		$scope.data.multiMedia = '';
		$scope.data.location = {};

		pc.ok = function() {
			
			if ($scope.foto != ''){
				// Upload picture
				$scope.multiMedia = uploadPicture();
			}
			urlEncodedData = 'creatorName=' + encodeURIComponent($scope.data.creatorName);
			urlEncodedData += '&text=' + encodeURIComponent($scope.data.text);
			urlEncodedData += '&multiMedia=' + encodeURIComponent($scope.data.multiMedia);
			urlEncodedData += '&location=' + encodeURIComponent(JSON.stringify($scope.data.location));

			$http({
				url: '/api/event',
				method: 'POST',
				data: urlEncodedData,
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
			})
				.success(function(data) {
					console.log("Sent");
				})
				.error(function(status) {
					console.log("Failed to Upload event " + status.status + " " + status.error);
					if (status.status === 401) {
						$localStorage.removeItem('currentUser');
						$location.path('/login');
					}
				});
			$uibModalInstance.close();
		};

		pc.cancel = function() {
			$uibModalInstance.dismiss('cancel');
		};
		
		pc.removeFoto = function() {
			$scope.foto = '';
			$scope.textRows = 5;
			$scope.cameraState = false;
		}

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
						// resize the image before using the resolved dataURL
						resize(evt.target.result, 1024, 1024, function(dataURL) {
							//$("#foto").attr("src", dataURL) //Convertir a Angular
							$scope.foto = dataURL;
							$scope.textRows = 2;
							$scope.$apply();
						});
					}
				})(input.files[0]);
				reader.readAsDataURL(input.files[0]);
			};
		};
		
		function uploadPicture(){
			
		}

		function resize(src, maxWidth, maxHeight, callback) {
			var img = document.createElement('img');
			img.src = src;
			img.onload = () => {
				var oc = document.createElement('canvas');
				var ctx = oc.getContext('2d');
				// resize to maxWidth px (either width or height)
				var width = img.width;
				var height = img.height;
				if (width > height) {
					if (width > maxWidth) {
						height *= maxWidth / width;
						width = maxWidth;
					}
				} else {
					if (height > maxHeight) {
						width *= maxHeight / height;
						height = maxHeight;
					}
				}
				oc.width = width;
				oc.height = height;
				ctx.drawImage(img, 0, 0, oc.width, oc.height);
				var resizedImage = dataURLToBlob(oc.toDataURL());
				// convert canvas back to dataurl
				callback(oc.toDataURL());
			}
		}

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
})();