angular.module('app').controller('ModalEventCtrl', function($uibModalInstance, $http, $localStorage, $scope, $location, $sce, data) {
	var pc = this;
	var urlEncodedData;
	
	console.log(data);

	$scope.cameraState = false;
	$scope.textRows = 5;
	$scope.foto = '';
	$scope.mediaType = '';
	$scope.data = {};
	$scope.data.creatorMail = $localStorage.currentUser.username;
	$scope.data.text = '';
	$scope.data.multiMedia = '';
	$scope.data.mediaType = '';
	$scope.data.location = {};
	$scope.data.isComment = (typeof data === 'undefined' ? false : true);
	$scope.data.eventCommented = (typeof data === 'undefined' ? '' : data);
	
	$scope.titulo = (typeof data === 'undefined' ? "Nuevo mensaje" : "Nuevo comentario" );

	pc.send = function() {
		if ($scope.text == '' && $scope.foto == '') {
			window.alert("Nada que enviar");
			return;
		}

		if ($scope.foto != '') {
			// Upload picture or video
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
					$scope.data.mediaType = $scope.mediaType;

					//Now upload the event

					urlEncodedData = 'creatorMail=' + encodeURIComponent($scope.data.creatorMail);
					urlEncodedData += '&text=' + encodeURIComponent($scope.data.text);
					urlEncodedData += '&multiMedia=' + encodeURIComponent($scope.data.multiMedia);
					urlEncodedData += '&mediaType=' + encodeURIComponent($scope.data.mediaType);
					urlEncodedData += '&location=' + encodeURIComponent(JSON.stringify($scope.data.location));
					urlEncodedData += '&isComment=' + encodeURIComponent($scope.data.isComment);
					urlEncodedData += '&eventCommented=' + encodeURIComponent($scope.data.eventCommented);

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
			urlEncodedData += '&isComment=' + encodeURIComponent($scope.data.isComment);
			urlEncodedData += '&eventCommented=' + encodeURIComponent($scope.data.eventCommented);

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
					$scope.mediaType = input.files[0]['type'].split('/')[0];
					$scope.foto = $sce.trustAsResourceUrl(evt.target.result);
					$scope.textRows = 2;
					$scope.$apply();
				}
			})(input.files[0]);
			reader.readAsDataURL(input.files[0]);
		};
	};

	/* Utility function to convert a canvas to a BLOB */
	var dataURLToBlob = function(data) {
		var dataURL = $sce.valueOf(data);
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