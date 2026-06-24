import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';

export function useDialogs() {
  const { t } = useI18n();
  const connectDialog = reactive({
    visible: false,
    label: t('dialogs.connecting'),
    message: '',
  });

  const toast = reactive({
    visible: false,
    message: '',
    color: 'warning',
    timeout: 4000,
  });

  return {
    connectDialog,
    toast,
  };
}
