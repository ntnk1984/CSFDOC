const check = () => {
  if (!("serviceWorker" in navigator)) {
    throw new Error("No Service Worker support!");
  }
  if (!("PushManager" in window)) {
    throw new Error("No Push API Support!");
  }
};

const saveSubscription = async subscription => {
  const SERVER_URL = "https://backend-web-push.herokuapp.com/save-subscription";
  const response = await fetch(SERVER_URL, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "https://ntnk1984.github.io",
      "Access-Control-Allow-Methods": "PUT,PATCH,DELETE"
    },
    body: JSON.stringify(subscription)
  });
  return response.json();
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

const registerServiceWorker = async () => {
  const swRegistration = await navigator.serviceWorker.register("service.js");
  return swRegistration;
};

const requestNotificationPermission = async () => {
  const permission = await window.Notification.requestPermission();
  // value of permission can be 'granted', 'default', 'denied'
  // granted: user has accepted the request
  // default: user has dismissed the notification permission popup by clicking on x
  // denied: user has denied the request.
  if (permission !== "granted") {
    throw new Error("Permission not granted for Notification");
  }
};

const main = async () => {
  check();
  const swRegistration = await registerServiceWorker();
  const permission = await requestNotificationPermission();
  
   const applicationServerKey = urlB64ToUint8Array(
    "BBNtP1-BBsxSNX40d2jSwNJ851zKMrcvf_Jl7BYXqubbcl2SESC36AvcW-3wYZfzTbddy2hNYZvXtAe9iDgDeOU"
  );
  const options = { applicationServerKey, userVisibleOnly: true };
  const subscription = await swRegistration.pushManager.subscribe(options);

  const response = await saveSubscription(subscription);
  
  console.log(response);
};
// main(); we will not call main in the beginning.
