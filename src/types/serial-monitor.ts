export type SerialMonitorError = string | null;

export type SerialMonitorTabProps = {
  monitorText?: string;
  monitorActive?: boolean;
  monitorError?: SerialMonitorError;
  canStart?: boolean;
  canCommand?: boolean;
  monitorStarting?: boolean;
};

export type SerialMonitorTabEmits = {
  (e: 'start-monitor'): void;
  (e: 'stop-monitor'): void;
  (e: 'clear-monitor'): void;
  (e: 'reset-board'): void;
  (e: 'send-monitor-text', value: string): void;
};
