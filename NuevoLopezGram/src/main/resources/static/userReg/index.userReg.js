(function () {
    'use strict';

    angular
        .module('app')
        .controller('UserRegController', Controller);

    function Controller($http, $location) {
        var vm = this;
		
		vm.register = register;
		
        initController();

        function initController() {
			console.log("inicializado");
        }

		function register(){
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
						$location.path('/login');
						})
					.error(function(status){
						vm.error = "algo ha fallado " + status.message;
						vm.loading = false;
					});
		}
	};
	
})();