<template>
  <div class="disconnected-state" :style="{ minHeight: normalizedMinHeight }">
    <v-card class="disconnected-card" variant="tonal">
      <v-card-text class="disconnected-card__body">
        <v-avatar class="disconnected-card__avatar" :size="avatarSize">
          <v-icon :size="iconSize">{{ icon }}</v-icon>
        </v-avatar>
    <div class="disconnected-card__text">
      <div class="disconnected-card__title">{{ computedTitle }}</div>
      <div class="disconnected-card__subtitle">
        {{ computedSubtitle }}
      </div>
    </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

type SizeValue = number | string;

const props = withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    icon?: string;
    minHeight?: SizeValue;
    avatarSize?: SizeValue;
    iconSize?: SizeValue;
  }>(),
  {
    icon: 'mdi-usb-port',
    minHeight: 320,
    avatarSize: 70,
    iconSize: 34,
  },
);

const { t } = useI18n();
const computedTitle = computed(() => props.title ?? t('disconnected.defaultTitle'));
const computedSubtitle = computed(() => props.subtitle ?? t('disconnected.defaultSubtitle'));

const normalizedMinHeight = computed<string | undefined>(() => {
  const value = props.minHeight;
  if (value == null || value === '') {
    return undefined;
  }
  return typeof value === 'number' ? `${value}px` : value;
});
</script>

<style scoped>
.disconnected-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 0;
}

.disconnected-card {
  border-radius: 18px;
  padding: 32px 36px;
  border: 1px solid color-mix(in srgb, var(--v-theme-error) 40%, transparent);
  background: color-mix(in srgb, var(--v-theme-error) 14%, var(--v-theme-surface) 92%);
  text-align: center;
  max-width: 420px;
  width: 100%;
}

.disconnected-card__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.disconnected-card__avatar {
  background: color-mix(in srgb, var(--v-theme-error) 26%, transparent);
  color: color-mix(in srgb, var(--v-theme-error) 85%, var(--v-theme-on-surface) 10%);
}

.disconnected-card__title {
  font-size: 1.05rem;
  font-weight: 600;
  color: color-mix(in srgb, var(--v-theme-on-surface) 92%, transparent);
}

.disconnected-card__subtitle {
  font-size: 0.92rem;
  color: color-mix(in srgb, var(--v-theme-on-surface) 65%, transparent);
}
</style>
