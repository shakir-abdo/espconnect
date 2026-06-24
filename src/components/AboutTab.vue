<template>
  <div :class="['about-tab', isDark ? 'about-tab--dark' : 'about-tab--light']">
    <v-card variant="tonal" class="mb-4">
      <v-card-title class="text-h6 d-flex align-center ga-2">
        <v-icon color="primary">mdi-chip</v-icon>
        {{ t('about.title') }}
      </v-card-title>
      <v-card-text class="text-body-2">
        <p>
          {{ t('about.description.intro') }}
        </p>
        <p>
          {{ t('about.description.details') }}
          <a
            href="https://github.com/Jason2866/WebSerial_ESPTool/tree/development"
            target="_blank"
            rel="noreferrer noopener"
          >
            {{ t('about.description.reference') }}
          </a>.
        </p>
      </v-card-text>
    </v-card>

    <v-card variant="tonal" class="mb-4">
      <v-card-title class="text-subtitle-1">
        <v-icon start color="primary">mdi-folder-star-multiple</v-icon>
        {{ t('about.filesystems.title') }}
      </v-card-title>
      <v-card-text class="text-body-2">
        <ul class="about-list">
          <li>
            <strong>{{ t('about.filesystems.spiFFS.label') }}:</strong>
            {{ t('about.filesystems.spiFFS.description') }}
          </li>
          <li>
            <strong>{{ t('about.filesystems.littleFS.label') }}:</strong>
            {{ t('about.filesystems.littleFS.description') }}
          </li>
          <li>
            <strong>{{ t('about.filesystems.fatFS.label') }}:</strong>
            {{ t('about.filesystems.fatFS.description') }}
          </li>
          <li>
            {{ t('about.filesystems.summary') }}
          </li>
        </ul>
      </v-card-text>
    </v-card>

    <v-card variant="tonal" class="mb-4">
      <v-card-title class="text-subtitle-1">
        <v-icon start color="primary">mdi-flash</v-icon>
        {{ t('about.firmware.title') }}
      </v-card-title>
      <v-card-text class="text-body-2">
        <ul class="about-list">
          <li>{{ t('about.firmware.flash') }}</li>
          <li>{{ t('about.firmware.inspect') }}</li>
          <li>{{ t('about.firmware.monitor') }}</li>
        </ul>
      </v-card-text>
    </v-card>

    <v-card variant="tonal">
      <v-card-title class="text-subtitle-1">
        <v-icon start color="primary">mdi-shield-check</v-icon>
        {{ t('about.safety.title') }}
      </v-card-title>
      <v-card-text class="text-body-2">
        <p>
          {{ t('about.safety.body') }}
        </p>
      </v-card-text>
    </v-card>

    <v-card variant="tonal">
      <v-card-title class="text-subtitle-1">
        <v-icon start color="primary">mdi-lock-check</v-icon>
        {{ t('about.privacy.title') }}
      </v-card-title>
      <v-card-text class="text-body-2">
        <p>
          {{ t('about.privacy.body') }}
        </p>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTheme } from 'vuetify';

const theme = useTheme();
const isDark = computed(() => theme.global.current.value.dark);
const { t } = useI18n();
</script>

<style scoped>
.about-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 16px;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  min-height: 100%;
}

.about-tab--light {
  background-image: url('/assets/images/about_back_light.png');
}

.about-tab--dark {
  background-image: url('/assets/images/about_back_dark.png');
}

.about-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.about-list strong {
  font-weight: 600;
}
</style>
