(function () {
    'use strict';

    angular
        .module('app')
        .controller('UserDetailsController', Controller);

    function Controller($scope, $location) {
        var vm = this;
		
        initController();

        function initController() {
        }

    }
})();