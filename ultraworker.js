
importScripts('https://cdn.jsdelivr.net/gh/Bromine-Labs/cdn/uv/uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw);
importScripts("https://cdn.jsdelivr.net/gh/Bromine-Labs/cdn/scram/scramjet.shared.js", "https://cdn.jsdelivr.net/gh/Bromine-Labs/cdn/scram/scramjet.worker.js");

const uv = new UVServiceWorker();
const scramjet = new ScramjetServiceWorker();



async function handleRequest(event) {

  await scramjet.loadConfig();
  if (scramjet.route(event)) {
    return scramjet.fetch(event);
  }
  if (uv.route(event)) {
    return await uv.fetch(event);
  }

  return await fetch(event.request)
}

self.addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event));
});




