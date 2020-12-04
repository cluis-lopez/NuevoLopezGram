angular.module('app').controller('ModalEventCtrl', function($uibModalInstance, $http, $localStorage, $scope, $location, $sce, data) {
	var pc = this;
	var urlEncodedData;

	console.log(data);

	$scope.textRows = 5;
	$scope.foto = '';
	$scope.mediaType = '';
	$scope.locRaw = [];

	$scope.data = {};
	$scope.data.creatorMail = $localStorage.currentUser.username;
	$scope.data.text = '';
	$scope.data.multiMedia = '';
	$scope.data.mediaType = '';
	$scope.data.location = '';
	$scope.data.isComment = (typeof data === 'undefined' ? false : true);
	$scope.data.eventCommented = (typeof data === 'undefined' ? '' : data);

	$scope.titulo = (typeof data === 'undefined' ? "Nuevo mensaje" : "Nuevo comentario");

	pc.send = function() {
		if ($scope.data.text === '' && $scope.foto === '') {
			window.alert("Mensaje vacío");
			return;
		}

		if ($scope.foto != '')
			uploadMedia();
		else
			uploadEvent();
	}

	function uploadMedia(callback) {
		// Upload picture or video
		var fd = new FormData();
		fd.append("file", dataURLToBlob($scope.foto), $scope.data.creatorMail + ":");
		$http({
			url: '/api/upload',
			method: 'POST',
			data: fd,
			headers: { 'Content-Type': undefined }
		}).success(function(dataReturned) {
			console.log("Uploaded: " + dataReturned.key);
			$scope.data.multiMedia = dataReturned.key;
			$scope.data.mediaType = $scope.mediaType;
			uploadEvent();
		}).error(function(status) {
			console.log("Failed to Upload picture " + status.status + " " + status.message);
			window.alert("Error al subir contenido al servidor " + status);
		})
	}

	function uploadEvent() {
		urlEncodedData = 'creatorMail=' + encodeURIComponent($scope.data.creatorMail);
		urlEncodedData += '&text=' + encodeURIComponent($scope.data.text);
		urlEncodedData += '&multiMedia=' + encodeURIComponent($scope.data.multiMedia);
		urlEncodedData += '&mediaType=' + encodeURIComponent($scope.data.mediaType);
		urlEncodedData += '&location=' + encodeURIComponent($scope.data.location);
		urlEncodedData += '&isComment=' + encodeURIComponent($scope.data.isComment);
		urlEncodedData += '&eventCommented=' + encodeURIComponent($scope.data.eventCommented);

		$http({
			url: '/api/event',
			method: 'POST',
			data: urlEncodedData,
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
		}).success(function(status) {
			console.log("Sent " + status.status + " " + status.message);
			angular.element(document.getElementById('events')).scope().refresh();
			$uibModalInstance.close();
		}).error(function(status) {
			console.log("Failed to Upload event " + status.status + " " + status.message);
			window.alert("Error al subir contenido al servidor " + status);
		})
	}
	

	pc.cancel = function() {
		$uibModalInstance.dismiss('cancel');
	};

	pc.removeFoto = function() {
		$scope.foto = '';
		$scope.textRows = 5;
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
			var latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
			var geocoder = new google.maps.Geocoder();
			geocoder.geocode({ location: latlng }, (results, status) => {
				if (status === "OK") {
					if (results[0]) {
						$scope.locRaw = formatGeo(results[0]);
						$scope.data.location = $scope.locRaw[0] + ', ' + $scope.locRaw[1] + ', ' + $scope.locRaw[2] + ', ' + $scope.locRaw[3];
						$scope.$apply();
						console.log($scope.location);
						return results[0].formatted_address;
					} else {
						window.alert("No results found");
					}
				} else {
					window.alert("Geocoder ha fallado due to: " + status);
				}
			});
		})
	}

	// Funcion de librería para formatear el output de Google Geocoder

	formatGeo = function(add) {
		var compAdd = [];
		for (i of add.address_components) {
			switch (i.types[0]) {
				case 'country':
					compAdd[0] = i.long_name;
					break;
				case 'administrative_area_level_2':
					compAdd[1] = i.long_name;
					break;
				case 'locality':
					compAdd[2] = i.long_name;
					break;
				case 'route':
					compAdd[3] = i.long_name;
					break;
			}
		}
		return compAdd;
	}

	pc.focusLoc = function() {
		$scope.locRaw.pop();
		$scope.data.location = '';
		for (let i = 0; i < $scope.locRaw.length; i++)
			$scope.data.location += $scope.locRaw[i] + ', ';
		$scope.data.location = $scope.data.location.slice(0, -2);
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