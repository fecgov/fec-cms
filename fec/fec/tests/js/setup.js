// export default function() {
  // Append jQuery to `window` for use by legacy libraries
  window.$ = window.jQuery = $;

  // Add global variables
  global = Object.assign(global, { // eslint-disable-line no-global-assign
    BASE_PATH: '/',
    API_LOCATION: '',
    API_VERSION: '/v1',
    API_KEY_PUBLIC: '12345',
    API_KEY_PUBLIC_CALENDAR: '67890',
    API_KEY_PUBLIC_SCHEDULE_A: 'test-schedule-a-key',
    DEFAULT_TIME_PERIOD: '2016'
  });

  // Also add to window for browser-like environment
  window.API_KEY_PUBLIC = '12345';
  window.API_KEY_PUBLIC_CALENDAR = '67890';
  window.API_KEY_PUBLIC_SCHEDULE_A = 'test-schedule-a-key';
