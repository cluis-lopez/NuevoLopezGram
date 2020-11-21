(function () {
    'use strict';

    angular
        .module('app', ['ui.router', 'ngMessages', 'ngStorage','ngAnimate', 'ngSanitize', 'ui.bootstrap'])
        .config(config)
        .run(run);

    function config($stateProvider, $urlRouterProvider) {
        // default route
        $urlRouterProvider.otherwise("/");

        // app routes
        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: 'home/home.view.html',
                controller: 'Home.IndexController',
                controllerAs: 'vm'
            })
            .state('login', {
                url: '/login',
                templateUrl: 'login/login.view.html',
                controller: 'Login.IndexController',
                controllerAs: 'vm'
            })
			.state('userReg', {
				url: '/userReg',
				templateUrl: 'userReg/userReg.view.html',
				controller: 'UserRegController',
				controllerAs: 'vm'
				})
			.state('userDetails', {
				url: '/userDetails',
				templateUrl: 'userDetails/userDetails.view,html',
				controller: 'UserDetails.IndexController',
				controllerAs: 'vm'
				});
    }

    function run($rootScope, $http, $location, $localStorage) {
        // keep user logged in after page refresh
        if ($localStorage.currentUser) {
            $http.defaults.headers.common.Authorization = 'Bearer ' + $localStorage.currentUser.token;
        }

        // redirect to login page if not logged in and trying to access a restricted page
        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            var publicPages = ['/login', '/userReg'];
            var restrictedPage = publicPages.indexOf($location.path()) === -1;
            if (restrictedPage && !$localStorage.currentUser) {
                $location.path('/login');
            }
        });
    }
})();