// urlB64ToUint8Array is a magic function that will encode the base64 public key
// to Array buffer which is needed by the subscription option

const staticCacheName = "site-static-v4";
const dynamicCacheName = "site-dynamic-v4";
const assets = [
  "/",
  "/index.html",
  "/genindex.html",
  "/search.html",
  "/csfdoc.html",
  "/_static/custom.css",
  "/_static/alabaster.css",
  "/_static/pygments.css",
  "/_static/jquery.js",
  "/_static/underscore.js",
  "/_static/doctools.js",
  "_static/images/",
  "/_static/materialize.min.js",
  "/_static/styles.css",
  "/_static/materialize.min.css",
  "/fallback.html"
];

// cache size limit function
const limitCacheSize = (name, size) => {
  caches.open(name).then(cache => {
    cache.keys().then(keys => {
      if (keys.length > size) {
        cache.delete(keys[0]).then(limitCacheSize(name, size));
      }
    });
  });
};

const urlB64ToUint8Array = base64String => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const saveSubscription = async subscription => {
  const SERVER_URL = "https://backend-web-push.herokuapp.com/save-subscription";
  const response = await fetch(SERVER_URL, {
    method: "post",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(subscription)
  });
  return response.json();
};

// install event
self.addEventListener("install", evt => {
  //console.log('service worker installed');
  evt.waitUntil(
    caches.open(staticCacheName).then(cache => {
      console.log("caching shell assets");
      //cache.addAll(assets);
      cache
        .addAll(assets)
        .then(() => {})
        .catch(error => console.error(`Oops! ${error}`));
    })
  );
});

self.addEventListener("activate", async evt => {
  // This will be called only once when the service worker is installed for first time.
  try {
    const applicationServerKey = urlB64ToUint8Array(
      "BBNtP1-BBsxSNX40d2jSwNJ851zKMrcvf_Jl7BYXqubbcl2SESC36AvcW-3wYZfzTbddy2hNYZvXtAe9iDgDeOU"
    );
    const options = { applicationServerKey, userVisibleOnly: true };
    const subscription = await self.registration.pushManager.subscribe(options);
    const response = await saveSubscription(subscription);
    console.log(response);

    evt.waitUntil(
      caches.keys().then(keys => {
        //console.log(keys);
        return Promise.all(
          keys
            .filter(key => key !== staticCacheName && key !== dynamicCacheName)
            .map(key => caches.delete(key))
        );
      })
    );
    //console.log(JSON.stringify(subscription))
  } catch (err) {
    console.log("Error", err);
  }
});

// fetch events
self.addEventListener("fetch", evt => {
  if (evt.request.url.indexOf("firestore.googleapis.com") === -1) {
    evt.respondWith(
      caches
        .match(evt.request)
        .then(cacheRes => {
          return (
            cacheRes ||
            fetch(evt.request).then(fetchRes => {
              return caches.open(dynamicCacheName).then(cache => {
                cache.put(evt.request.url, fetchRes.clone());
                // check cached items size
                //limitCacheSize(dynamicCacheName, 15);
                return fetchRes;
              });
            })
          );
        })
        .catch(() => {
          if (evt.request.url.indexOf(".html") > -1) {
            return caches.match("/fallback.html");
          }
        })
    );
  }
});

// self.addEventListener("install", async () => {
//   // This will be called only once when the service worker is installed for first time.
//   try {
//     const applicationServerKey = urlB64ToUint8Array(
//       "BBNtP1-BBsxSNX40d2jSwNJ851zKMrcvf_Jl7BYXqubbcl2SESC36AvcW-3wYZfzTbddy2hNYZvXtAe9iDgDeOU"
//     );
//     const options = { applicationServerKey, userVisibleOnly: true };
//     const subscription = await self.registration.pushManager.subscribe(options);
//     const response = await saveSubscription(subscription);
//     console.log(response);
//   } catch (err) {
//     console.log("Error", err);
//   }
// });
const showLocalNotification = (title, body, swRegistration) => {
  const options = {
    body
    // here you can add more properties like icon, image, vibrate, etc.
  };
  swRegistration.showNotification(title, options);
};

self.addEventListener("push", function(event) {
  if (event.data) {
    console.log("Push event!! ", event.data.text());
    showLocalNotification("Yolo", event.data.text(), self.registration);
  } else {
    console.log("Push event but no data");
  }
});
