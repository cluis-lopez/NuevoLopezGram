(function() {
	'use strict';

	angular
		.module('app')
		.controller('UserDetailsController', Controller);

	function Controller($scope, $rootScope, $location, $http, $uibModal, $sce, $window) {
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

		$scope.back = function(event) {
			$location.path('/home');
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
						var title = $sce.trustAsHtml("<i class='icon-attention-filled' style='font-size: 24px'></i> Atencion !!!");
						var varHtml = $sce.trustAsHtml("Si borras tu usuario se perder&aacute;n todos tus posts y comentarios")
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

		$scope.avatarChange = function() {
			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: 'Logout',
				ariaDescribedBy: 'modal-body',
				templateUrl: 'userdetails/avatarModal.html',
				controller: 'avatarController',
				controllerAs: 'pc',
				size: 'l',
				resolve: {
					data: function() {
						if ($scope.data.avatar === '')
							return 'icons/noAvatar.jpg';
						else
							return $scope.data.avatar;
					}
				}
			});
			modalInstance.result.then(function() {
				initController();
			});
		}

	}

	angular.module('app').controller('userDetailLogoutController', function($uibModalInstance, AuthenticationService, $location, data) {
		var pc = this;
		pc.data = data;

		pc.confirmModal = function() {
			AuthenticationService.Logout();
			$uibModalInstance.close();
			$location.path("/login");
		}

		pc.cancelModal = function() {
			$uibModalInstance.close();
		}

	});

	angular.module('app').controller('userDetailRemoveController', function($uibModalInstance, $localStorage, $location, $http, $scope, data) {
		var pc = this;
		pc.data = data;

		pc.confirmModal = function() {
			$http({
				url: '/api/userdetails',
				method: 'DELETE'
			}).success(function(data) {
				window.alert("Ha sido un placer\n" + data.message);
				$scope.loading = false;
				$localStorage.currentUser = null;
				$location.path("/login");
				$uibModalInstance.close();
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

	angular.module('app').controller('avatarController', function($uibModalInstance, AuthenticationService, $location, $sce, $scope, $http, data) {
		var pc = this;
		pc.inImage = data;
		pc.outImage = '';
		$scope.loading = false;

		pc.removeFoto = function() {
			pc.inImage = 'icons/noAvatar.jpg';
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

		pc.upload = function() {
			$scope.loading = true;
			var fd = new FormData();
			if (pc.inImage === '' || pc.inImage === 'icons/noAvatar.jpg') {
				fd.append("file", dataURLToBlob('data:image/jpeg;base64,MA=='));
			} else {
				fd.append("file", dataURLToBlob(pc.outImage));
			}

			$http({
				url: '/api/changeavatar',
				method: 'POST',
				data: fd,
				headers: { 'Content-Type': undefined }
			}).success(function(dataReturned) {
				if (dataReturned.status === 'OK') {
					if (dataReturned.message === 'Removed')
						pc.inImage = 'icons/noAvatar.jpg';
					else
						pc.inImage = dataReturned.key;
				} else {
					pc.inImage = 'icons/noAvatar.jpg';
				}
				$scope.loading = false;
				$uibModalInstance.close();
				$location.path("/userDetails")
			}).error(function(status) {
				console.log("Failed to Upload picture " + status.status + " " + status.message);
				window.alert("Error al subir contenido al servidor " + status.message);
				$scope.loading = false;
				$uibModalInstance.close();
				$location.path("/userDetails")
			})
		}

		pc.cancel = function() {
			$uibModalInstance.close();
			$location.path("/userDetails")
		}

		//Codigo importado (JQuery) para tratamiento de las fotos

		pc.readURL = function(input) {
			// var ctx = document.getElementById("foto").getContext("2d");
			$scope.loading = true;
			if (input.files && input.files[0]) {
				var reader = new FileReader();
				reader.onload = (function(tf) {
					return function(evt) {
						//pc.inImage = $sce.trustAsResourceUrl(evt.target.result);
						pc.inImage = evt.target.result;
					}
				})(input.files[0]);
				reader.readAsDataURL(input.files[0]);
			};
			$scope.loading = false;
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
})();