export const NOTIFICATION_MESSAGES = {
  SMOKE_DETECTED: (location: string) => `Smoke detected in: ${location}`,
  SMOKE_CLEARED: (location: string) => `Smoke cleared in: ${location}`,
  ALARM_ACTIVATED: (location: string) => `Alarm activated in: ${location}`,
  ALARM_DEACTIVATED: (location: string) => `Alarm deactivated in: ${location}`,
  DEFAULT_EVENT: (location: string) => `New event in: ${location}`,
  UNKNOWN_LOCATION: 'Unknown location',
};
