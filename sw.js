console.log('started ServiceWorker');

this.addEventListener('install', event => {
  event.waitUntil(
    caches.open('beatbox-cache').then(cache => {
      return cache.addAll([
        'index.html',
        'style/style.css',
        'script/script.js',
        'sounds/dirty.mp3',
        'sounds/clap-808.mp3',
        'sounds/crash-808.mp3',
        'sounds/hihat-808.mp3',
        'sounds/kick-808.mp3',
        'sounds/openhat-808.mp3',
        'sounds/perc-808.mp3',
        'sounds/cowbell-808.mp3',
        'sounds/snare-808.mp3',
        'sounds/tom-808.mp3'
      ]);
    })
  );
});

this.addEventListener('activate', event => console.log('activated', event));

this.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
      	return response || fetch(event.request)
      })
  );
});

this.addEventListener('push', event => console.log('pushed', event));
this.addEventListener('sync', event => console.log('do sync', event));
this.addEventListener('message', event => console.log('message received', event));