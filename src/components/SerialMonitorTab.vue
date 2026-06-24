<template>
  <div class="monitor-shell">
    <v-card class="monitor-card" variant="tonal">
      <v-card-title class="monitor-card__title">
        <div class="monitor-card__heading">
          <span class="monitor-card__badge" :class="{ 'monitor-card__badge--live': monitorActive }" />
          <div class="monitor-card__label">
          <v-icon class="me-2" size="20">mdi-monitor</v-icon>
            {{ t('serialMonitor.title') }}
          </div>
          <v-chip
            class="monitor-card__status"
            :color="monitorActive ? 'success' : 'grey-darken-1'"
            size="small"
            density="comfortable"
            label
          >
            <v-icon size="16" start>mdi-circle-medium</v-icon>
            {{ monitorActive ? t('serialMonitor.status.live') : t('serialMonitor.status.stopped') }}
          </v-chip>
        </div>
        <div class="monitor-card__actions">
          <v-btn
            color="primary"
            variant="tonal"
            size="small"
            prepend-icon="mdi-play-circle"
            :disabled="monitorActive || !canStart || monitorStarting"
            :loading="monitorStarting"
            @click="emit('start-monitor')"
          >
            {{ t('serialMonitor.actions.start') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="text"
            size="small"
            prepend-icon="mdi-stop-circle"
            :disabled="!monitorActive"
            @click="emit('stop-monitor')"
          >
            {{ t('serialMonitor.actions.stop') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="text"
            size="small"
            :prepend-icon="paused ? 'mdi-play-circle' : 'mdi-pause-circle'"
            :disabled="!monitorActive"
            @click="togglePause"
          >
            {{ paused ? t('serialMonitor.actions.resume') : t('serialMonitor.actions.pause') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="text"
            size="small"
            prepend-icon="mdi-content-copy"
            :disabled="!hasMonitorOutput || copying"
            :loading="copying"
            @click="copyMonitor"
          >
            {{ t('serialMonitor.actions.copy') }}
          </v-btn>
          <v-btn
            color="secondary"
            variant="text"
            size="small"
            prepend-icon="mdi-eraser"
            :disabled="!hasMonitorOutput"
            @click="emit('clear-monitor')"
          >
            {{ t('serialMonitor.actions.clear') }}
          </v-btn>
          <v-btn
            color="error"
            variant="tonal"
            size="small"
            prepend-icon="mdi-power-cycle"
            :disabled="!canCommand"
            @click="emit('reset-board')"
          >
            {{ t('serialMonitor.actions.reset') }}
          </v-btn>
          <v-text-field
            v-model="filterText"
            density="compact"
            variant="outlined"
            class="monitor-filter"
            hide-details
            :placeholder="t('serialMonitor.filterPlaceholder')"
            clearable
            prepend-inner-icon="mdi-filter"
            @keydown.stop
          />
        </div>
      </v-card-title>
      <v-card-subtitle class="monitor-card__subtitle text-medium-emphasis">
        {{ t('serialMonitor.subtitle') }}
      </v-card-subtitle>
      <v-alert
        type="info"
        variant="tonal"
        class="monitor-card__info"
        icon="mdi-information-outline"
      >
        {{ t('serialMonitor.info') }}
      </v-alert>
      <v-divider />
      <v-card-text ref="terminalEl" class="monitor-terminal">
        <pre class="monitor-terminal__output" v-html="displayHtml"></pre>
        <div
          v-if="!hasMonitorOutput"
          class="monitor-terminal__empty"
        >
          {{ t('serialMonitor.emptyState') }}
        </div>
      </v-card-text>
      <v-divider />
      <div class="monitor-input">
        <v-text-field
          v-model="inputText"
          density="compact"
          variant="outlined"
          class="monitor-input__field"
          hide-details
          :placeholder="t('serialMonitor.inputPlaceholder')"
          :disabled="!canSend"
          prepend-inner-icon="mdi-console-line"
          @keydown="handleInputKeydown"
        />
        <v-btn
          color="primary"
          variant="tonal"
          size="small"
          prepend-icon="mdi-send"
          :disabled="!canSend || !inputText.length"
          @click="sendInput"
        >
          {{ t('serialMonitor.actions.send') }}
        </v-btn>
      </div>
    </v-card>

    <v-alert
      v-if="monitorError"
      type="warning"
      variant="tonal"
      class="monitor-alert"
      icon="mdi-alert-circle-outline"
    >
      {{ monitorError }}
    </v-alert>
    <v-snackbar
      v-model="copyFeedback.visible"
      :color="copyFeedback.color"
      :timeout="2000"
      location="bottom right"
    >
      {{ copyFeedback.message }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
  import { computed, nextTick, onMounted, ref, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import type { SerialMonitorTabEmits, SerialMonitorTabProps } from '../types/serial-monitor';

const props = withDefaults(defineProps<SerialMonitorTabProps>(), {
  monitorText: '',
  monitorActive: false,
  monitorError: null,
  canStart: false,
  canCommand: false,
  monitorStarting: false,
});

  const emit = defineEmits<SerialMonitorTabEmits>();
  const { t } = useI18n();

const terminalEl = ref<unknown>(null);
const filterText = ref('');
const inputText = ref('');
const paused = ref(false);
const pausedSnapshot = ref('');
const copying = ref(false);
const copyFeedback = ref({
  visible: false,
  message: '',
  color: 'success',
});

type AnsiState = {
  fg: number | null;
  bg: number | null;
  bold: boolean;
  dim: boolean;
};

type AnsiSegment = {
  text: string;
  classes: string[];
  key: string;
};

type ParsedLine = {
  segments: AnsiSegment[];
  plain: string;
  plainLower: string;
};

const ANSI_FG_CLASSES: Record<number, string> = {
  30: 'ansi-fg-30',
  31: 'ansi-fg-31',
  32: 'ansi-fg-32',
  33: 'ansi-fg-33',
  34: 'ansi-fg-34',
  35: 'ansi-fg-35',
  36: 'ansi-fg-36',
  37: 'ansi-fg-37',
  90: 'ansi-fg-90',
  91: 'ansi-fg-91',
  92: 'ansi-fg-92',
  93: 'ansi-fg-93',
  94: 'ansi-fg-94',
  95: 'ansi-fg-95',
  96: 'ansi-fg-96',
  97: 'ansi-fg-97',
};

const ANSI_BG_CLASSES: Record<number, string> = {
  40: 'ansi-bg-40',
  41: 'ansi-bg-41',
  42: 'ansi-bg-42',
  43: 'ansi-bg-43',
  44: 'ansi-bg-44',
  45: 'ansi-bg-45',
  46: 'ansi-bg-46',
  47: 'ansi-bg-47',
  100: 'ansi-bg-100',
  101: 'ansi-bg-101',
  102: 'ansi-bg-102',
  103: 'ansi-bg-103',
  104: 'ansi-bg-104',
  105: 'ansi-bg-105',
  106: 'ansi-bg-106',
  107: 'ansi-bg-107',
};

function resolveTerminalElement(target: unknown): HTMLElement | null {
  if (target instanceof HTMLElement) {
    return target;
  }
  if (!target || typeof target !== 'object') {
    return null;
  }
  const el = (target as { $el?: unknown }).$el;
  return el instanceof HTMLElement ? el : null;
}

function scrollToBottom(): void {
  const el = resolveTerminalElement(terminalEl.value);
  if (!el) return;
  el.scrollTop = el.scrollHeight;
}

function togglePause(): void {
  if (!paused.value) {
    pausedSnapshot.value = props.monitorText ?? '';
    paused.value = true;
    return;
  }
  pausedSnapshot.value = '';
  paused.value = false;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildClassList(state: AnsiState): { classes: string[]; key: string } {
  const classes: string[] = [];
  if (state.bold) classes.push('ansi-bold');
  if (state.dim) classes.push('ansi-dim');
  if (state.fg !== null && ANSI_FG_CLASSES[state.fg]) {
    classes.push(ANSI_FG_CLASSES[state.fg]);
  }
  if (state.bg !== null && ANSI_BG_CLASSES[state.bg]) {
    classes.push(ANSI_BG_CLASSES[state.bg]);
  }
  return { classes, key: classes.join('|') };
}

function applyAnsiCodes(codes: number[], state: AnsiState): void {
  for (let index = 0; index < codes.length; index += 1) {
    const code = codes[index];
    if (code === 0) {
      state.fg = null;
      state.bg = null;
      state.bold = false;
      state.dim = false;
      continue;
    }
    if (code === 1) {
      state.bold = true;
      continue;
    }
    if (code === 2) {
      state.dim = true;
      continue;
    }
    if (code === 22) {
      state.bold = false;
      state.dim = false;
      continue;
    }
    if (code === 39) {
      state.fg = null;
      continue;
    }
    if (code === 49) {
      state.bg = null;
      continue;
    }
    if (code === 38 || code === 48) {
      const mode = codes[index + 1];
      if (mode === 5) {
        index += 2;
      } else if (mode === 2) {
        index += 4;
      }
      continue;
    }
    if (ANSI_FG_CLASSES[code]) {
      state.fg = code;
      continue;
    }
    if (ANSI_BG_CLASSES[code]) {
      state.bg = code;
    }
  }
}

function parseAnsiCodes(paramText: string): number[] {
  if (!paramText) {
    return [0];
  }
  return paramText
    .split(';')
    .map(token => {
      if (token === '') return 0;
      if (!/^\d+$/.test(token)) return Number.NaN;
      return Number(token);
    })
    .filter(code => Number.isFinite(code));
}

function findCsiSequenceEnd(text: string, startIndex: number): number {
  for (let index = startIndex; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code >= 0x40 && code <= 0x7e) {
      return index;
    }
  }
  return -1;
}

function parseAnsiLines(text: string): ParsedLine[] {
  if (!text) {
    return [];
  }
  const lines: ParsedLine[] = [];
  let segments: AnsiSegment[] = [];
  let plain = '';
  let buffer = '';
  const state: AnsiState = {
    fg: null,
    bg: null,
    bold: false,
    dim: false,
  };

  const flushBuffer = () => {
    if (!buffer) return;
    const { classes, key } = buildClassList(state);
    const last = segments[segments.length - 1];
    if (last && last.key === key) {
      last.text += buffer;
    } else {
      segments.push({ text: buffer, classes, key });
    }
    plain += buffer;
    buffer = '';
  };

  let index = 0;
  while (index < text.length) {
    const char = text[index];
    if (char === '\x1b' && text[index + 1] === '[') {
      flushBuffer();
      const end = findCsiSequenceEnd(text, index + 2);
      if (end === -1) {
        index += 2;
        continue;
      }
      if (text[end] === 'm') {
        const params = text.slice(index + 2, end);
        const codes = parseAnsiCodes(params);
        applyAnsiCodes(codes, state);
      }
      index = end + 1;
      continue;
    }
    if (char === '\n') {
      flushBuffer();
      lines.push({ segments, plain, plainLower: plain.toLowerCase() });
      segments = [];
      plain = '';
      index += 1;
      continue;
    }
    if (char === '\r' && text[index + 1] === '\n') {
      index += 1;
      continue;
    }
    buffer += char;
    index += 1;
  }

  flushBuffer();
  if (segments.length || plain.length || text.endsWith('\n')) {
    lines.push({ segments, plain, plainLower: plain.toLowerCase() });
  }
  return lines;
}

function buildAnsiHtml(lines: ParsedLine[]): string {
  if (!lines.length) {
    return '';
  }
  const output: string[] = [];
  lines.forEach((line, lineIndex) => {
    line.segments.forEach(segment => {
      const classAttr = segment.classes.length ? ` class="${segment.classes.join(' ')}"` : '';
      output.push(`<span${classAttr}>${escapeHtml(segment.text)}</span>`);
    });
    if (lineIndex < lines.length - 1) {
      output.push('\n');
    }
  });
  return output.join('');
}

const sourceText = computed(() => (paused.value ? pausedSnapshot.value : props.monitorText ?? ''));
const parsedLines = computed(() => parseAnsiLines(sourceText.value));
const filteredLines = computed(() => {
  const filterValue = (filterText.value ?? '').trim().toLowerCase();
  if (!filterValue) return parsedLines.value;
  return parsedLines.value.filter(line => line.plainLower.includes(filterValue));
});
const displayHtml = computed(() => buildAnsiHtml(filteredLines.value));
const displayPlainText = computed(() => filteredLines.value.map(line => line.plain).join('\n'));
const hasMonitorOutput = computed(() => Boolean(displayPlainText.value && displayPlainText.value.length));
const canSend = computed(() => props.monitorActive && props.canCommand);

async function copyMonitor(): Promise<void> {
  const text = displayPlainText.value;
  if (!text || copying.value) {
    return;
  }

  try {
    copying.value = true;
    if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else if (typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } else {
      throw new Error('Clipboard unavailable');
    }
    copyFeedback.value = {
      visible: true,
      message: t('serialMonitor.copySuccess'),
      color: 'success',
    };
  } catch (error: unknown) {
    console.error('Failed to copy serial monitor output', error);
    copyFeedback.value = {
      visible: true,
      message: t('serialMonitor.copyError'),
      color: 'error',
    };
  } finally {
    copying.value = false;
  }
}

function sendInput(): void {
  if (!canSend.value) {
    return;
  }
  const text = inputText.value;
  if (!text) {
    return;
  }
  const lineEnding = text.endsWith('\n') || text.endsWith('\r\n') ? '' : '\n';
  emit('send-monitor-text', `${text}${lineEnding}`);
  inputText.value = '';
}

function sendCtrlC(): void {
  if (!canSend.value) {
    return;
  }
  emit('send-monitor-text', '\x03');
}

function handleInputKeydown(event: KeyboardEvent): void {
  if (!canSend.value) {
    return;
  }
  if (event.ctrlKey && event.key.toLowerCase() === 'c') {
    event.preventDefault();
    event.stopPropagation();
    sendCtrlC();
    return;
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    event.stopPropagation();
    sendInput();
  }
}

watch(
  () => props.monitorText,
  async () => {
    if (paused.value) {
      if (!props.monitorText) {
        pausedSnapshot.value = '';
      }
      return;
    }
    await nextTick();
    scrollToBottom();
  },
);

watch(
  () => props.monitorActive,
  async active => {
    if (!active) {
      paused.value = false;
      pausedSnapshot.value = '';
      return;
    }
    if (paused.value) return;
    await nextTick();
    scrollToBottom();
  },
);

onMounted(() => {
  scrollToBottom();
});
</script>

<style scoped>
.monitor-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.monitor-card {
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--v-theme-primary) 18%, transparent);
  background: color-mix(in srgb, var(--v-theme-surface) 92%, transparent);
  overflow: hidden;
}

.monitor-card__title {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: space-between;
}

.monitor-card__heading {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.monitor-card__badge {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--v-theme-on-surface) 45%, transparent);
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.12);
}

.monitor-card__badge--live {
  background: color-mix(in srgb, var(--v-theme-success) 85%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--v-theme-success) 35%, transparent);
}

.monitor-card__label {
  display: inline-flex;
  align-items: center;
  font-size: 0.95rem;
  font-weight: 600;
}

.monitor-card__status {
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.monitor-card__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.monitor-filter {
  min-width: 220px;
  max-width: 300px;
}

.monitor-card__subtitle {
  font-size: 0.75rem;
  padding: 0 24px 4px;
}

.monitor-card__info {
  margin: 0 24px 12px;
  font-size: 0.8rem;
  line-height: 1.4;
}

.monitor-terminal {
  background: rgba(15, 23, 42, 0.85);
  --ansi-fg-30: #0f172a;
  --ansi-fg-31: #f87171;
  --ansi-fg-32: #4ade80;
  --ansi-fg-33: #facc15;
  --ansi-fg-34: #60a5fa;
  --ansi-fg-35: #c084fc;
  --ansi-fg-36: #22d3ee;
  --ansi-fg-37: #e2e8f0;
  --ansi-fg-90: #94a3b8;
  --ansi-fg-91: #fecaca;
  --ansi-fg-92: #bbf7d0;
  --ansi-fg-93: #fef08a;
  --ansi-fg-94: #bfdbfe;
  --ansi-fg-95: #e9d5ff;
  --ansi-fg-96: #a5f3fc;
  --ansi-fg-97: #f8fafc;
  --ansi-bg-40: #020617;
  --ansi-bg-41: #7f1d1d;
  --ansi-bg-42: #14532d;
  --ansi-bg-43: #78350f;
  --ansi-bg-44: #1e3a8a;
  --ansi-bg-45: #581c87;
  --ansi-bg-46: #155e75;
  --ansi-bg-47: #334155;
  --ansi-bg-100: #1f2937;
  --ansi-bg-101: #991b1b;
  --ansi-bg-102: #166534;
  --ansi-bg-103: #92400e;
  --ansi-bg-104: #1e40af;
  --ansi-bg-105: #6b21a8;
  --ansi-bg-106: #0e7490;
  --ansi-bg-107: #475569;
  border-radius: 12px;
  padding: 14px;
  max-height: 420px;
  overflow-y: auto;
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.monitor-terminal::-webkit-scrollbar {
  width: 8px;
}

.monitor-terminal::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.35);
  border-radius: 999px;
}

.monitor-terminal__output {
  margin: 0;
  font-family: 'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.48;
  white-space: pre-wrap;
  color: rgba(226, 232, 240, 0.9);
  min-height: 260px;
  max-height: 100%;
  pointer-events: none;
}

.monitor-terminal__output :deep(.ansi-bold) {
  font-weight: 600;
}

.monitor-terminal__output :deep(.ansi-dim) {
  opacity: 0.7;
}

.monitor-terminal__output :deep(.ansi-fg-30) {
  color: var(--ansi-fg-30);
}

.monitor-terminal__output :deep(.ansi-fg-31) {
  color: var(--ansi-fg-31);
}

.monitor-terminal__output :deep(.ansi-fg-32) {
  color: var(--ansi-fg-32);
}

.monitor-terminal__output :deep(.ansi-fg-33) {
  color: var(--ansi-fg-33);
}

.monitor-terminal__output :deep(.ansi-fg-34) {
  color: var(--ansi-fg-34);
}

.monitor-terminal__output :deep(.ansi-fg-35) {
  color: var(--ansi-fg-35);
}

.monitor-terminal__output :deep(.ansi-fg-36) {
  color: var(--ansi-fg-36);
}

.monitor-terminal__output :deep(.ansi-fg-37) {
  color: var(--ansi-fg-37);
}

.monitor-terminal__output :deep(.ansi-fg-90) {
  color: var(--ansi-fg-90);
}

.monitor-terminal__output :deep(.ansi-fg-91) {
  color: var(--ansi-fg-91);
}

.monitor-terminal__output :deep(.ansi-fg-92) {
  color: var(--ansi-fg-92);
}

.monitor-terminal__output :deep(.ansi-fg-93) {
  color: var(--ansi-fg-93);
}

.monitor-terminal__output :deep(.ansi-fg-94) {
  color: var(--ansi-fg-94);
}

.monitor-terminal__output :deep(.ansi-fg-95) {
  color: var(--ansi-fg-95);
}

.monitor-terminal__output :deep(.ansi-fg-96) {
  color: var(--ansi-fg-96);
}

.monitor-terminal__output :deep(.ansi-fg-97) {
  color: var(--ansi-fg-97);
}

.monitor-terminal__output :deep(.ansi-bg-40) {
  background-color: var(--ansi-bg-40);
}

.monitor-terminal__output :deep(.ansi-bg-41) {
  background-color: var(--ansi-bg-41);
}

.monitor-terminal__output :deep(.ansi-bg-42) {
  background-color: var(--ansi-bg-42);
}

.monitor-terminal__output :deep(.ansi-bg-43) {
  background-color: var(--ansi-bg-43);
}

.monitor-terminal__output :deep(.ansi-bg-44) {
  background-color: var(--ansi-bg-44);
}

.monitor-terminal__output :deep(.ansi-bg-45) {
  background-color: var(--ansi-bg-45);
}

.monitor-terminal__output :deep(.ansi-bg-46) {
  background-color: var(--ansi-bg-46);
}

.monitor-terminal__output :deep(.ansi-bg-47) {
  background-color: var(--ansi-bg-47);
}

.monitor-terminal__output :deep(.ansi-bg-100) {
  background-color: var(--ansi-bg-100);
}

.monitor-terminal__output :deep(.ansi-bg-101) {
  background-color: var(--ansi-bg-101);
}

.monitor-terminal__output :deep(.ansi-bg-102) {
  background-color: var(--ansi-bg-102);
}

.monitor-terminal__output :deep(.ansi-bg-103) {
  background-color: var(--ansi-bg-103);
}

.monitor-terminal__output :deep(.ansi-bg-104) {
  background-color: var(--ansi-bg-104);
}

.monitor-terminal__output :deep(.ansi-bg-105) {
  background-color: var(--ansi-bg-105);
}

.monitor-terminal__output :deep(.ansi-bg-106) {
  background-color: var(--ansi-bg-106);
}

.monitor-terminal__output :deep(.ansi-bg-107) {
  background-color: var(--ansi-bg-107);
}

.monitor-alert {
  margin-top: 4px;
}

.monitor-terminal__empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 0.9rem;
  color: rgba(226, 232, 240, 0.55);
  pointer-events: none;
  padding: 20px;
}

.monitor-input {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px 16px;
}

.monitor-input__field {
  flex: 1;
}

@media (max-width: 959px) {
  .monitor-card__title {
    flex-direction: column;
    align-items: flex-start;
  }

  .monitor-card__actions {
    width: 100%;
    justify-content: flex-start;
  }

  .monitor-input {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
