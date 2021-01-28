const filesToCache = [
	'index.html',
	'app.js',
	'eventManager.js',
	'app-content/app.css',
	'app-content/error.css',
	'/app-helpers/angular-pull-to-refresh.css',
	'/app-helpers/angular-pull-to-refresh.js',
	'/app-helpers/infinite-scroll.js',
	'/app-helpers/ng-croppie.js',
	'/app-helpers/exif.js',
	'/app-helpers/ng-croppie.css',
	'/app-services/authentication.service.js',
	'/home/eventModal.html',
	'/home/homeModal.html',
	'/home/home.view.html',
	'/home/index.controller.js',
	'/userdetails/avatarModal.html',
	'/userdetails/userDetailModal.html',
	'/userdetails/index.userdetails.js',
	'/userdetails/userDetails.view.html',
	'/comments/commentsModal.html',
	'/comments/comments.view.html',
	'/comments/index.comments.js',
	'/icons/Logo.png',
	'/icons/spinner.gif',
	'/icons/noAvatar.jpg',
	'/icons/fontello/css/fontello.css',
	'/login/index.controller.js',
	'/login/login.view.html',
	'/userReg/index.userReg.js',
	'/userReg/OKModal.html',
	'/userReg/userReg.view.html'
];

const staticCacheName = 'LopezGramPages-v1';
const mediaCacheName = 'LopezGramMedia';
const dataCacheName = 'LopezGramData';

self.addEventListener('install', event => {
	console.log('Service worker installing...');
	self.skipWaiting();
	console.log('Attempting to install service worker and cache static assets');
	event.waitUntil(
		caches.open(staticCacheName)
			.then(cache => {
				return cache.addAll(filesToCache);
			})
	);
});

self.addEventListener('activate', event => {
	console.log('Activating new service worker...');

	const cacheAllowlist = [staticCacheName, dataCacheName];

	event.waitUntil(
		caches.keys().then(cacheNames => {
			return Promise.all(
				cacheNames.map(cacheName => {
					if (cacheAllowlist.indexOf(cacheName) === -1) {
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
});

self.addEventListener('fetch', function(e) {
	console.log('[Service Worker] Fetch', e.request.url);
	if (e.request.url.indexOf('/lgram/o/') > -1) {
		/*
		 * When the request URL contains dataUrl, the app is asking for fresh
		 * weather data. In this case, the service worker always goes to the
		 * network and then caches the response. This is called the "Cache then
		 * network" strategy:
		 * https://jakearchibald.com/2014/offline-cookbook/#cache-then-network
		 */
		console.log("Cacheando fotos o Videos");
		e.respondWith(
			caches.open(mediaCacheName).then(function(cache) {
				return fetch(e.request).then(function(response) {
					cache.put(e.request.url, response.clone());
					return response;
				});
			})
		);
	} else {
		/*
		 * The app is asking for app shell files. In this scenario the app uses the
		 * "Cache, falling back to the network" offline strategy:
		 * https://jakearchibald.com/2014/offline-cookbook/#cache-falling-back-to-network
		 */
		console.log("Not data or media");
		e.respondWith(
			caches.match(e.request).then(function(response) {
				return response || fetch(e.request);
			})
		);
	}
});

