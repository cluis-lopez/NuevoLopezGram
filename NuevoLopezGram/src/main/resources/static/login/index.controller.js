(function () {
    'use strict';

    angular
        .module('app')
        .controller('Login.IndexController', Controller);

    function Controller($location, AuthenticationService, $scope) {
        var vm = this;

        vm.login = login;

        initController();

        function initController() {
            // reset login status
            AuthenticationService.Logout();
        };

        function login() {
            vm.loading = true;
            AuthenticationService.Login(vm.username, vm.password, function (result) {
                if (result === true) {
                    $location.path('/home');
                } else {
                    vm.error = 'Username or password are incorrect';
                    vm.loading = false;
                }
            });
        };

		$scope.userRegistration = function() {
			$location.path('/userReg');
		}
    }
})();