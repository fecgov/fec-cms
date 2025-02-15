// Append jQuery to `window` for use by legacy libraries
if (!window.$) window.$ = window.jQuery = $;

// Add global variables
/*
  // global = Object.assign(global, { // eslint-disable-line no-global-assign
    BASE_PATH: '/',
    API_LOCATION: '',
    API_VERSION: '/v1',
    API_KEY_PUBLIC: '12345',
    API_KEY_PUBLIC_CALENDAR: '67890',
    DEFAULT_TIME_PERIOD: '2016'
  });
*/

let globalVars = {
  BASE_PATH: '/',
  API_LOCATION: '', //http://localhost:5000',
  API_VERSION: 'v1',
  API_KEY_PUBLIC: '12345',
  API_KEY_PUBLIC_CALENDAR: '67890',
  CALENDAR_DOWNLOAD_PUBLIC_API_KEY: '54321',
  DEFAULT_TIME_PERIOD: '2016'
};

for (let n in globalVars) {
  window[n] = globalVars[n];
}
