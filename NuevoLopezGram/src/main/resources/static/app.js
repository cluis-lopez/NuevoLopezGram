(function () {
    'use strict';

    angular
        .module('app', ['ui.router', 'ngMessages', 'ngStorage','ngAnimate', 'ngSanitize', 'ui.bootstrap', 'mgcrea.pullToRefresh'])
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
				templateUrl: 'userdetails/userDetails.view.html',
				controller: 'UserDetailsController',
				controllerAs: 'vm'
			})
			.state('comments', {
				url: '/comments',
				templateUrl: 'comments/comments.view.html',
				controller: 'commentsController',
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

		const weekdays = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

		$rootScope.$formatDates = function(x) {
			let now = new Date().getTime();
			let dev = Date.parse(x);
			let startOfToday = new Date();
			startOfToday.setHours(0, 0, 0, 0);
			let sot = startOfToday.getTime();
			let timeDiff = Math.round((now - dev) / 1000); //Diferencia en segundos
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
						return "Hace " + minutes + " minutos";
				else
					return "Hace " + hours + (hours < 1 ? " hora " : " horas ") + " y " + minutes + " minutos";
			} else if (days <= 6) {
				let d = new Date(dev)
				hours = d.getHours();
				minutes = d.getMinutes();
				return "El " + weekdays[d.getDay()] + " a las " + (hours < 10 ? "0" + hours : hours) +
					":" + (minutes < 10 ? "0" + minutes : minutes);
			} else {
				return new Date(dev).toLocaleDateString('es-ES',
					{ day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: 'numeric' });
			}

		}
    }
})();