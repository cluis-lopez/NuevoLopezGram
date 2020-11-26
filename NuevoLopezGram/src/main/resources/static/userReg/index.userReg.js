(function() {
	'use strict';

	angular
		.module('app')
		.controller('UserRegController', Controller);

	function Controller($http, $location, $uibModal, $sce) {
		var vm = this;

		vm.register = register;
		vm.openModal = openModal;

		function register() {
			console.log("enviando...");
			vm.loading = true;

			var urlData = 'name=' + vm.username;
			urlData += '&email=' + vm.email;
			urlData += '&password=' + vm.password;
			

			$http({
				url: '/createuser',
				method: 'POST',
				data: urlData,
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
			})
				.success(function(data) {
					console.log("Uploaded: " + data.status + ": " + data.message);
					if (data.status === "OK"){
						var OKhtml = "<p><b>Estás registrado con la dirección de correo: </b>" + vm.email + "</p>"+
						"<p><b>Tu nombre en la red es: </b>" + vm.username + "</p>";
						openModal({title: "Bienvenido a LopezGram", varHtml: $sce.trustAsHtml(OKhtml)});
						$location.path('/login');
					} else {
						var NotOKhtml = "<p><b>Ha ocurrido un error al darte de alta como usuario: </b></p><p>"+
						data.message + "</p>";
						openModal({title: "Se ha producido un error", varHtml: $sce.trustAsHtml(NotOKhtml)});
						vm.loading = false;
					}
				})
				.error(function(status) {
					vm.error = "algo ha fallado " + status.message;
					var NotOKhtml = "<p><b>Error en la conexión el servidor </b></p>";
					openmodal({title: "No se puede conectar con el servidor", varHtml: $sce.trustAsHtml(NotOKhtml)});
					vm.loading = false;
				});
		}

		function openModal (text) {
			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: 'User Reg',
				ariaDescribedBy: 'modal-body',
				templateUrl: 'userReg/OKModal.html',
				controller: 'OKController',
				controllerAs: 'pc',
				size: 'l',
				resolve: {
					data: function() {
						return text;
					}
				}
			});

			modalInstance.result.then(function() {
			});
		};

	};


	angular.module('app').controller('OKController', function($uibModalInstance, data) {
		var pc = this;
		pc.data = data;

		 pc.closeModal = function () {
			$uibModalInstance.close();
		}

	});

})();