(function() {
	'use strict';

	angular
		.module('app')
		.controller('UserDetailsController', Controller);

	function Controller($scope, $rootScope, $location, $http, $uibModal, $sce, $window) {
		var vm = this;
		$scope.loading = false;
		$scope.followingView = false;
		$scope.followersView = false;
		$scope.data = {};
		$scope.followingUsers = [];
		$scope.followersUsers = [];
		var months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
		 'Agosto', 'Septiembre','Octubre','Noviembre', 'Diciembre'];
		
		$scope.trustURL = function(src) {
			return $sce.trustAsResourceUrl(src);
		}

		initController();

		function initController() {
			$scope.loading = true;
			$http({
				url: '/api/userdetails',
				method: 'GET'
			}).success(function(data) {
				$scope.data = data;
				
				var d = new Date(data.userSince);
				$scope.data.year = d.getFullYear();
				$scope.data.month = months[d.getMonth()];

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
		
		$scope.following = function(){
			if ($scope.followingView){
				$scope.followingView = false;
				return;
			}
			$scope.loading = true;
			$http({
				url: '/api/getfollowing',
				method: 'GET'
			}).success(function(data) {
				$scope.followingUsers = data;
				$scope.loading = false;
				$scope.followersView = false;
				$scope.followingView= true;
			}).error(function(status) {
				console.log("Failed to ger Following Users " + status.status + " " + status.message);
				if (status.status === 401) {
					console.log('Unauthorized');
					$localStorage.removeItem('currentUser');
					$location.path('/login');
				}
			});
			}
		
		$scope.unfollow = function(x){
			console.log("unfollow " + x.name);
			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: 'Logout',
				ariaDescribedBy: 'modal-body',
				templateUrl: 'userdetails/userDetailModal.html',
				controller: 'userUnfollowController',
				controllerAs: 'pc',
				size: 'l',
				resolve: {
					data: function() {
						var varHtml = $sce.trustAsHtml("");
						var title = $sce.trustAsHtml("&iquest;Seguro que quieres dejar de seguir a " +
						x.name + "?")
						return { title: title, varHtml: varHtml, user: x };
					}
				}
			});
			modalInstance.result.then(function() {
			});
		}
		
		$scope.followers = function(){
			if ($scope.followersView){
				$scope.followersView = false;
				return;
			}
			$scope.loading = true;
			$http({
				url: '/api/getfollowers',
				method: 'GET'
			}).success(function(data) {
				$scope.followersUsers = data;
				$scope.loading = false;
				$scope.followingView = false;
				$scope.followersView = true;
			}).error(function(status) {
				console.log("Failed to ger Followers Users " + status.status + " " + status.message);
				if (status.status === 401) {
					console.log('Unauthorized');
					$localStorage.removeItem('currentUser');
					$location.path('/login');
				}
			});
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

		
		$scope.changePassword = function(){
				var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: 'Change Password',
				ariaDescribedBy: 'modal-body',
				templateUrl: 'userdetails/changePasswordModal.html',
				controller: 'changePasswordController',
				controllerAs: 'pc',
				size: 'l',
				resolve: {
					data: function() {
						var title = $sce.trustAsHtml("Cambiar Contrase&ntilde;a");
						return { title: title};
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
	
	angular.module('app').controller('userUnfollowController', function($uibModalInstance, $http, $scope, data) {
		var pc = this;
		pc.data = data;

		pc.confirmModal = function() {
			$scope.loading=true;
			var urlEncodedData = 'unFollowId=' + encodeURIComponent(data.user.id);
			$http({
				url: '/api/follow',
				data: urlEncodedData,
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				method: 'DELETE'
			}).success(function(x) {
				if (x.status == "OK"){
					$scope.loading = false;
					$uibModalInstance.close();
					$scope.followingView = false;
				} else {
					window.alert("No se puede dejar de seguir al usuario " + data.user.id +
					'\n' + x.status +' : ' + x.message);
					$scope.loading = false;
					$scope.followingView = false;
					$uibModalInstance.close();
				}
			}).error(function(status) {
				console.log("Failed to get Followers Users " + status.status + " " + status.message);
				if (status.status === 401) {
					console.log('Unauthorized');
					$localStorage.removeItem('currentUser');
					$location.path('/login');
				}
				$uibModalInstance.close();
			});
		}

		pc.cancelModal = function() {
			$uibModalInstance.close();
		}

	});

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
	
	angular.module('app').controller('changePasswordController', function($uibModalInstance, $localStorage, $location, $http, $scope, data, $uibModal, $sce) {
		var pc = this;
		pc.data = data;
		$scope.loading = false;
		$scope.invalidNewPass = true;
		$scope.enterType = 'password';
		$scope.newPassword = "";
		$scope.repeatNewPassword = "";
		
		pc.reveal = function (){
			if ($scope.enterType == 'password')
				$scope.enterType = 'text';
			else
				$scope.enterType = 'password';
		}

		pc.checkValidity = function(x,y) {
			if (x.length > 0 && y.length > 0 && x === y){
				$scope.invalidNewPass = false;
			} else {
				$scope.invalidNewPass = true;
			}
		}
		
		
		pc.confirmModal = function(current, newPass) {
			$scope.loading = true;
			var urlEncodedData = 'oldPassword=' + encodeURIComponent(current);
			urlEncodedData +='&newPassword=' + encodeURIComponent(newPass);
			var mensaje = '';
			$http({
				url: '/api/changepassword',
				data: urlEncodedData,
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				method: 'POST'
			}).success(function(data) {
				if (data.status ==='OK')
					mensaje = "Tu contrase&ntilde;a ha sido actualizada";
				else 
					mensaje = "Ha habido un error<br>" + data.message;
				$scope.loading = false;
				$uibModalInstance.close();
				var modalInstance = $uibModal.open({
					animation: true,
					ariaLabelledBy: 'Change Password',
					ariaDescribedBy: 'modal-body',
					templateUrl: 'userdetails/confirmationModal.html',
					controller: 'confirmationController',
					controllerAs: 'pc',
					size: 'l',
					resolve: {
						data: function() {
							var title = $sce.trustAsHtml("Cambiar Contrase&ntilde;a");
							return { title: title, varHtml: $sce.trustAsHtml(mensaje)};
						}
					}
				});
			}).error(function(status) {
				console.log("Failed to ger User Details " + status.status + " " + status.message);
				if (status.status === 401) {
					console.log('Unauthorized');
				}
				mensaje = "Error en la conexi&oacute;n al servidor";
			});
			
			modalInstance.result.then(function() {
			});
		}

		pc.cancelModal = function() {
			$uibModalInstance.close();
		}

	});
	
	angular.module('app').controller('confirmationController', function($uibModalInstance, $localStorage, $location, $http, $scope, data) {
		var pc = this;
		pc.data = data;

		pc.confirmModal = function() {
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