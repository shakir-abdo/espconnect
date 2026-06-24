export type SessionLogFeedbackColor = 'success' | 'error';

export type SessionLogCopyFeedback = {
  visible: boolean;
  message: string;
  color: SessionLogFeedbackColor;
};

export type SessionLogTabProps = {
  logText?: string;
};

export type SessionLogTabEmits = {
  (e: 'clear-log'): void;
};

export type SessionLogTabRef = {
  scrollToBottom: () => void;
};
