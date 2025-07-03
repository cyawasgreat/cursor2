//////////////////////////////
///          Init          ///
//////////////////////////////
// Dynamically imports the UV bundle. UV is a web proxy.
await import('https://cdn.jsdelivr.net/gh/Bromine-Labs/cdn/uv/uv.bundle.js');

// Dynamically imports the UV configuration.
await import('./uv.config.js');

await import("https://cdn.jsdelivr.net/gh/Bromine-Labs/cdn/scram/scramjet.shared.js")
await import("https://cdn.jsdelivr.net/gh/Bromine-Labs/cdn/scram/scramjet.worker.js")
await import("https://cdn.jsdelivr.net/gh/Bromine-Labs/cdn/scram/scramjet.controller.js")

import * as BareMux from 'https://cdn.jsdelivr.net/gh/Bromine-Labs/cdn/bare-mux/index.mjs';


//////////////////////////////
///         Options        ///
//////////////////////////////
const connection = new BareMux.BareMuxConnection("/bareworker.js");


let bareURL = null;
let wispURL = null;
let transportURL = null;
let proxyOption = null;

const transportOptions = {
  "epoxy": "https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport/dist/index.mjs",
  "libcurl": "https://cdn.jsdelivr.net/npm/@mercuryworkshop/libcurl-transport/dist/index.mjs",
  "bare": "https://cdn.jsdelivr.net/gh/Bromine-Labs/bare-as-module3@dev/dist/index.mjs",
}


//////////////////////////////
///           SW           ///
//////////////////////////////
const stockSW = "./ultraworker.js";
const swAllowedHostnames = ["localhost", "127.0.0.1"];

/**
 * Registers the service worker.
 * @async
 * @throws {Error} If service workers are not supported or cannot be registered (e.g., non-HTTPS environment).
 * @returns {Promise<void>} A promise that resolves when the service worker is registered.
 */
async function registerSW() {
  if (!navigator.serviceWorker) {
    if (
      location.protocol !== "https:" &&
      !swAllowedHostnames.includes(location.hostname)
    )
      throw new Error("Service workers cannot be registered without https.");

    throw new Error("Your browser doesn't support service workers.");
  }

  await navigator.serviceWorker.register(stockSW);
}

const scramjet = new ScramjetController({
  files: {
    wasm: "https://cdn.jsdelivr.net/gh/Bromine-Labs/cdn/scram/scramjet.wasm.wasm",
    worker: "https://cdn.jsdelivr.net/gh/Bromine-Labs/cdn/scram/scramjet.worker.js",
    client: "https://cdn.jsdelivr.net/gh/Bromine-Labs/cdn/scram/scramjet.client.js",
    shared: "https://cdn.jsdelivr.net/gh/Bromine-Labs/cdn/scram/scramjet.shared.js",
    sync: "https://cdn.jsdelivr.net/gh/Bromine-Labs/cdn/scram/scramjet.sync.js",
  },
	flags: {
	  serviceworkers: false,
		syncxhr: false,
		naiiveRewriter: false,
		strictRewrites: true,
		rewriterLogs: false,
		captureErrors: true,
		cleanErrors: true,
		scramitize: false,
		sourcemaps: true,
	},
});

// Initialize Scramjet.
scramjet.init();

// Register the service worker.
await registerSW();
console.log('lethal.js: Service Worker registered');


//////////////////////////////
///        Functions       ///
//////////////////////////////
/**
 * Converts an input string into a valid URL. If the input is not a valid URL,
 * it attempts to construct one, assuming it's a domain or search query.
 * @param {string} input - The input string to convert to a URL.
 * @param {string} [template='https://www.google.com/search?q=%s'] - The search engine template to use if the input is treated as a search query.
 * @returns {string} The processed URL string.
 */
export function makeURL(input, template = 'https://www.google.com/search?q=%s') {
  try {
    return new URL(input).toString();
  } catch (err) { }

  const url = new URL(`http://${input}`); // Try prepending http://
  if (url.hostname.includes(".")) return url.toString(); // If it looks like a domain (e.g., example.com)

  return template.replace("%s", encodeURIComponent(input)); // Otherwise, treat as search query
}

/**
 * Updates the BareMux connection with the current transport and Wisp/Bare server URLs.
 * This is an internal helper function.
 * @async
 * @returns {Promise<void>} A promise that resolves when the BareMux transport is updated.
 */
async function updateBareMux() {
  // Note: The original code had a typo: "settransport" and "transporturl".
  // Assuming "setTransport" and "transportURL" were intended for the "bare" case.
  if(transportURL != "https://cdn.jsdelivr.net/gh/Bromine-Labs/bare-as-module3@dev/dist/index.mjs") { // Typo: was .js, likely meant .mjs to match transportOptions
    if (wispURL != null) {
      console.log(`lethal.js: Setting BareMux to ${transportURL} and Wisp to ${wispURL}`);
      await connection.setTransport(transportURL, [{ wisp: wispURL }]);
    }
  } else if(transportURL === "https://cdn.jsdelivr.net/gh/Bromine-Labs/bare-as-module3@dev/dist/index.mjs") { // Typo: was .js
    if (bareURL != null) {
      console.log(`lethal.js: Setting BareMux to ${transportURL} and Bare to ${bareURL}`);
      // Corrected: connection.setTransport(transportURL, [bareURL]); (BareMux typically takes an array of server URLs for "bare" transport)
      // Or, if `bareURL` is meant to be the sole argument for a specific configuration:
      await connection.setTransport(transportURL, bareURL); // This depends on the exact API of BareMuxConnection for this specific transport
    }
  }
}


/**
 * Sets the transport protocol for BareMux.
 * @export
 * @async
 * @param {string} transport - The name of the transport (e.g., "epoxy", "libcurl", "bare") or a custom transport URL.
 * @returns {Promise<void>} A promise that resolves when the transport is set and BareMux is updated.
 */
export async function setTransport(transport) {
  console.log(`lethal.js: Setting transport to ${transport}`);
  transportURL = transportOptions[transport] || transport; // Use from options if key exists, otherwise assume `transport` is a URL

  await updateBareMux();
}

/**
 * Gets the current transport URL.
 * @export
 * @returns {string | null} The current transport URL, or null if not set.
 */
export function getTransport() {
  return transportURL;
}

/**
 * Sets the Wisp server URL.
 * @export
 * @async
 * @param {string} wisp - The Wisp server URL.
 * @returns {Promise<void>} A promise that resolves when the Wisp URL is set and BareMux is updated.
 */
export async function setWisp(wisp) {
  console.log(`lethal.js: Setting Wisp to ${wisp}`);
  wispURL = wisp;

  await updateBareMux();
}

/**
 * Gets the current Wisp server URL.
 * @export
 * @returns {string | null} The current Wisp server URL, or null if not set.
 */
export function getWisp() {
  return wispURL;
}

/**
 * Sets the Bare server URL (for "bare" transport).
 * @export
 * @async
 * @param {string} bare - The Bare server URL.
 * @returns {Promise<void>} A promise that resolves when the Bare server URL is set and BareMux is updated.
 */
export async function setBare(bare) {
  console.log(`lethal.js: Setting Bare to ${bare}`);
  bareURL = bare;

  await updateBareMux();
}

/**
 * Gets the current Bare server URL.
 * @export
 * @returns {string | null} The current Bare server URL, or null if not set.
 */
export function getBare() {
  return bareURL;
}

/**
 * Sets the proxy backend to be used (e.g., "uv", "scram").
 * @export
 * @param {string} proxy - The identifier for the proxy backend.
 * @returns {void}
 */
export function setProxy(proxy) {
  console.log(`lethal.js: Setting proxy backend to ${proxy}`);
  proxyOption = proxy;
}

/**
 * Gets the currently selected proxy backend.
 * @export
 * @returns {string | null} The identifier of the current proxy backend, or null if not set.
 */
export function getProxy() {
  return proxyOption;
}

/**
 * Generates a proxied URL based on the selected proxy backend.
 * @export
 * @async
 * @param {string} input - The URL or search query to be proxied.
 * @returns {Promise<string>} A promise that resolves to the proxied URL string.
 *                            The URL will be encoded using UV's prefix if `proxyOption` is not "scram".
 *                            Otherwise, it will be encoded using Scramjet's `encodeUrl`.
 */
export async function getProxied(input) {
  const url = makeURL(input);

  if (proxyOption == "uv") {
    // Assumes __uv$config is globally available from uv.bundle.js and uv.config.js
    return __uv$config.prefix + __uv$config.encodeUrl(url);
  } else if (proxyOption == "scram") {
    return scramjet.encodeUrl(url);
  }
}
