(function() {
	'use strict';

	angular
		.module('app')
		.controller('Home.IndexController', Controller);

	function Controller($scope, $http, $localStorage, $location) {

		var pageNumber = 0;
		const weekdays=["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
		
		initController();

		function initController() {
			$http.get('/api/event', { pagenumber: pageNumber, number: 10 })
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
		
	$scope.refresh = function() {
			//No se como solucionarlo !!
	}
	
	$scope.formatDates = function(x){
		let now = new Date().getTime();
		let dev = Date.parse(x);
		let startOfToday = new Date();
		startOfToday.setHours(0,0,0,0);
		let sot = startOfToday.getTime();
		let timeDiff = Math.round((now-dev)/1000); //Diferencia en segundos
		// let seconds = Math.floor(timeDiff % 60);
		// let secondsAsString = seconds < 10 ? "0" + seconds : seconds;
		timeDiff = Math.floor(timeDiff / 60);
		let minutes = timeDiff % 60;
		// let minutesAsString = minutes < 10 ? "0" + minutes : minutes;
		timeDiff = Math.floor(timeDiff / 60);
		let hours = timeDiff % 24;
			// return "Hace "+hours+ (hours ==1 ? " hora" : " horas")+" y "+minutes+" minutos";
		timeDiff = Math.floor(timeDiff / 24);
		let days = timeDiff;
		if (dev > sot) {
			if (hours == 0)
				if (minutes < 5)
					return "Hace un momento";
				else
					return "Hace "+minutes+ " minutos";
			else
				return "Hace " + hours + (hours<1? " hora ":" horas ") +" y " + minutes + " minutos";
		} else if (days <=7) {
			let d = new Date(dev)
			hours = d.getHours();
			minutes = d.getMinutes();
			return "El " + weekdays[d.getDay()] +" a las " + (hours < 10 ? "0"+hours : hours) + 
			":" + (minutes<10 ? "0"+minutes : minutes);
		} else {
			return new Date(dev).toLocaleDateString('es-ES', 
			{day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: 'numeric'});
		}
		
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
				angular.element(document.getElementById('event')).scope().refresh();
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

			//TODO hay que refrescar después de enviar un post

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

					})
					.error(function(status) {
						console.log("Failed to Upload picture " + status.status + " " + status.error);
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

		function resize(src, maxWidth, maxHeight, callback) {
			//TODO chequear tamaño final foto: no se comprime
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

