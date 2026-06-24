<template>
  <div class="nvs-inspector">
    <v-alert v-if="error" type="error" variant="tonal" density="comfortable" border="start" class="mb-3">
      {{ error }}
    </v-alert>

    <v-card variant="tonal" prepend-icon="mdi-database-search">
      <template v-slot:title>
        <div class="d-flex align-center gap-2 flex-wrap">
          <span class="font-weight-black">{{ t('nvsInspector.title') }}</span>
          <v-tooltip :text="t('nvsInspector.experimentalTooltip')" location="bottom">
            <template #activator="{ props: tooltipProps }">
              <v-chip v-bind="tooltipProps" color="warning" variant="tonal">
                {{ t('nvsInspector.experimentalBadge') }}
              </v-chip>
            </template>
          </v-tooltip>
        </div>
      </template>

      <v-card-text class="d-flex flex-column gap-4">
          <v-select
            :items="partitions"
            item-title="label"
            item-value="id"
            density="comfortable"
            :label="t('nvsInspector.partitionSelectLabel')"
            :model-value="selectedPartitionId"
            :disabled="loading || !partitions.length"
          @update:model-value="value => emit('select-partition', value)"
        />

        <div class="nvs-inspector__controls">
          <v-btn color="primary" variant="tonal" :disabled="loading || !hasPartitionSelected" @click="emit('read-nvs')">
            <v-icon start>mdi-database-sync</v-icon>
            {{ t('nvsInspector.readButton') }}
          </v-btn>

          <v-spacer />

          <div v-if="result" class="nvs-inspector__summary">
            <v-chip size="small" variant="outlined" color="primary">
              <v-icon start size="18">mdi-information-outline</v-icon>
              {{ t('nvsInspector.versionLabel', { version: result.version }) }}
            </v-chip>

            <v-tooltip
              :text="t('nvsInspector.pageStatsTooltip', {
                total: pageStats.total.toLocaleString(),
                inUse: pageStats.inUse.toLocaleString(),
                blank: pageStats.blank.toLocaleString(),
                bad: pageStats.bad.toLocaleString(),
              })"
              location="bottom"
            >
              <template #activator="{ props: tooltipProps }">
                <v-chip v-bind="tooltipProps" size="small" variant="outlined" color="secondary">
                  <v-icon start size="18">mdi-book-open-page-variant</v-icon>
                  {{ t('nvsInspector.pagesCount', { count: result.pages.length.toLocaleString() }) }}
                </v-chip>
              </template>
            </v-tooltip>

            <v-chip size="small" variant="outlined" color="secondary">
              <v-icon start size="18">mdi-folder-key-outline</v-icon>
                {{ t('nvsInspector.namespacesCount', { count: result.namespaces.length.toLocaleString() }) }}
            </v-chip>

            <v-chip size="small" variant="outlined" color="secondary">
              <v-icon start size="18">mdi-key-outline</v-icon>
                {{ t('nvsInspector.entriesCount', { count: result.entries.length.toLocaleString() }) }}
            </v-chip>

            <v-tooltip
              v-if="nvsUsage"
              :text="t('nvsInspector.usage.tooltip', {
                percent: nvsUsage.partitionPercentText,
                written: nvsUsage.writtenBytesText,
                erased: nvsUsage.erasedBytesText,
                free: nvsUsage.freeBytesText,
                illegal: nvsUsage.illegalBytesText,
                capacity: nvsUsage.entryCapacityBytesText,
              })"
              location="bottom"
            >
              <template #activator="{ props: tooltipProps }">
                <v-chip v-bind="tooltipProps" size="small" variant="outlined" color="success">
                  <v-icon start size="18">mdi-database-eye-outline</v-icon>
                  {{ t('nvsInspector.usage.label', {
                    used: nvsUsage.writtenBytesText,
                    total: nvsUsage.partitionBytesText,
                  }) }}
                </v-chip>
              </template>
            </v-tooltip>
          </div>
        </div>

        <v-progress-linear v-if="loading" height="10" indeterminate color="primary" rounded />

      </v-card-text>
    </v-card>

    <div class="mt-6 d-flex flex-column gap-4">
        <v-tabs v-model="activeTab" density="comfortable" color="primary">
          <v-tab value="keys">{{ t('nvsInspector.tabs.keys') }}</v-tab>
          <v-tab value="pages">{{ t('nvsInspector.tabs.pages') }}</v-tab>
        </v-tabs>

        <v-window v-model="activeTab">
          <v-window-item value="keys">
            <div class="d-flex flex-column gap-4">
              <v-alert v-if="!result" type="info" variant="tonal" border="start">
                {{ t('nvsInspector.keys.emptyState') }}
              </v-alert>

            <template v-else>
              <v-card variant="tonal">
        <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-2 flex-wrap">
              <v-chip
                v-if="pageFilter !== null"
                size="small"
                color="secondary"
                variant="tonal"
                closable
                @click:close="clearPageFilter"
              >
                {{ t('nvsInspector.keys.pageFilter', { page: pageFilter }) }}
              </v-chip>
            </div>
          <v-chip size="large" variant="outlined" color="primary">
            {{ t('nvsInspector.filteredCount', { count: filteredEntries.length.toLocaleString() }) }}
          </v-chip>
        </v-card-title>

        <v-card-text>
          <div class="nvs-inspector__filters">
            <v-select
              v-model="namespaceFilter"
              :items="namespaceFilterOptions"
              item-title="title"
              item-value="value"
              density="comfortable"
              :label="t('nvsInspector.keys.filters.namespace')"
              variant="outlined"
              hide-details
              class="nvs-inspector__filter"
            />
            <v-text-field
              v-model="keyFilter"
              density="comfortable"
              :label="t('nvsInspector.keys.filters.key')"
              variant="outlined"
              clearable
              hide-details
              prepend-inner-icon="mdi-magnify"
              class="nvs-inspector__filter"
            />
            <v-select
              v-model="typeFilter"
              :items="typeFilterOptions"
              density="comfortable"
              :label="t('nvsInspector.keys.filters.type')"
              variant="outlined"
              hide-details
              class="nvs-inspector__filter"
              item-title="label"
              item-value="value"
            />
            <v-text-field
              v-model="valueFilter"
              density="comfortable"
              :label="t('nvsInspector.keys.filters.value')"
              variant="outlined"
              clearable
              hide-details
              class="nvs-inspector__filter"
            />
          </div>

            <v-data-table
              :headers="entryHeaders"
            :items="filteredEntries"
            item-key="__key"
            density="compact"
            class="nvs-inspector__table mt-4"
          >
            <template #item.namespace="{ item }">
              <code>{{ unwrapItem(item).namespace }}</code>
            </template>

            <template #item.key="{ item }">
              <code>{{ unwrapItem(item).key }}</code>
            </template>

            <template #item.type="{ item }">
              <v-chip size="small" variant="tonal" color="secondary">{{ unwrapItem(item).type }}</v-chip>
            </template>

            <template #item.valuePreview="{ item }">
              <code>{{ unwrapItem(item).valuePreview }}</code>
            </template>

            <template #item.length="{ item }">
              <span v-if="typeof unwrapItem(item).length === 'number'">
                {{ unwrapItem(item).length.toLocaleString() }}
              </span>
              <span v-else class="text-medium-emphasis">&mdash;</span>
            </template>

              <template #item.crcOk="{ item }">
                <v-chip v-if="unwrapItem(item).crcOk === true" size="small" color="success" variant="tonal">
                  {{ t('nvsInspector.status.ok') }}
                </v-chip>
                <v-chip
                  v-else-if="unwrapItem(item).crcOk === false"
                  size="small"
                  color="error"
                  variant="tonal"
                >
                  {{ t('nvsInspector.status.bad') }}
                </v-chip>
                <span v-else class="text-medium-emphasis">&mdash;</span>
              </template>

            <!-- FIX: parser now uses `location`, not `raw` -->
            <template #item.location="{ item }">
              <span v-if="unwrapItem(item).location" class="text-caption">
                <code>p{{ unwrapItem(item).location.pageIndex }}:e{{ unwrapItem(item).location.entryIndex }}</code>
              </span>
              <span v-else class="text-medium-emphasis">&mdash;</span>
            </template>

            <template #item.issues="{ item }">
              <v-chip v-if="unwrapItem(item).warnings?.length" size="small" color="warning" variant="tonal">
                {{ unwrapItem(item).warnings.length }}
              </v-chip>
              <span v-else class="text-medium-emphasis">&mdash;</span>
            </template>

              <template #no-data>
                <v-alert type="info" variant="tonal" border="start">
                  {{ t('nvsInspector.keys.noMatches') }}
                </v-alert>
              </template>
          </v-data-table>
        </v-card-text>
      </v-card>

      <v-expansion-panels v-if="result.errors.length || result.warnings.length" variant="accordion">
        <v-expansion-panel>
            <v-expansion-panel-title>
              {{ t('nvsInspector.warningsErrors.title') }}
              <v-spacer />
              <v-chip v-if="result.errors.length" size="small" color="error" variant="tonal" class="ml-2">
                {{ result.errors.length }}
              </v-chip>
              <v-chip v-if="result.warnings.length" size="small" color="warning" variant="tonal" class="ml-2">
                {{ result.warnings.length }}
              </v-chip>
            </v-expansion-panel-title>

          <v-expansion-panel-text>
            <div v-if="result.errors.length" class="mb-4">
                <div class="text-overline text-medium-emphasis mb-2">{{ t('nvsInspector.warningsErrors.errors') }}</div>
              <ul class="nvs-inspector__list">
                <li v-for="(line, idx) in result.errors" :key="'e-' + idx"><code>{{ line }}</code></li>
              </ul>
            </div>

            <div v-if="result.warnings.length">
                <div class="text-overline text-medium-emphasis mb-2">{{ t('nvsInspector.warningsErrors.warnings') }}</div>
              <ul class="nvs-inspector__list">
                <li v-for="(line, idx) in result.warnings" :key="'w-' + idx"><code>{{ line }}</code></li>
              </ul>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
            </template>
          </div>
        </v-window-item>

        <v-window-item value="pages">
          <div class="d-flex flex-column gap-4">
              <v-alert v-if="!result" type="info" variant="tonal" border="start">
                {{ t('nvsInspector.pages.emptyState') }}
              </v-alert>

            <v-card v-else variant="tonal">
                <v-card-title class="nvs-inspector__pages-title">
                  <span>{{ t('nvsInspector.pages.title') }}</span>
                  <v-chip size="small" variant="tonal" color="primary" class="nvs-inspector__pages-summary">
                    {{ t('nvsInspector.pages.summary', {
                      total: pageStats.total.toLocaleString(),
                      inUse: pageStats.inUse.toLocaleString(),
                      blank: pageStats.blank.toLocaleString(),
                      bad: pageStats.bad.toLocaleString(),
                    }) }}
                  </v-chip>
                </v-card-title>

              <v-card-text>
                <v-table density="compact" class="nvs-inspector__pages-table">
                  <thead>
                    <tr>
                        <th class="text-start">{{ t('nvsInspector.pages.table.page') }}</th>
                        <th class="text-start">{{ t('nvsInspector.pages.table.state') }}</th>
                        <th class="text-end">{{ t('nvsInspector.pages.table.seq') }}</th>
                        <th class="text-center">{{ t('nvsInspector.pages.table.status') }}</th>
                        <th class="text-start">{{ t('nvsInspector.pages.table.map') }}</th>
                        <th class="text-end">{{ t('nvsInspector.pages.table.errors') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="page in result.pages" :key="page.index">
                      <td><code>{{ page.index }}</code></td>
                      <td><code>{{ page.state }}</code></td>
                      <td class="text-end">
                        <span
                          v-if="
                            page.state !== 'UNINITIALIZED' &&
                            typeof page.seq === 'number' &&
                            page.seq !== 0xffffffff
                          "
                        >
                          {{ page.seq.toLocaleString() }}
                        </span>
                        <span v-else class="text-medium-emphasis">&mdash;</span>
                      </td>
                        <td class="text-center">
                          <v-chip
                            v-if="page.state === 'UNINITIALIZED'"
                            size="small"
                            color="grey-darken-1"
                            variant="tonal"
                          >
                            {{ t('nvsInspector.status.blank') }}
                          </v-chip>
                          <v-chip v-else-if="page.valid" size="small" color="success" variant="tonal">
                            {{ t('nvsInspector.status.ok') }}
                          </v-chip>
                          <v-chip v-else size="small" color="error" variant="tonal">
                            {{ t('nvsInspector.status.bad') }}
                          </v-chip>
                        </td>
                      <td class="nvs-inspector__map-cell">
                        <div class="nvs-inspector__map-widget">
                          <div v-if="page.entryStates?.length === PAGE_ENTRY_COUNT" class="nvs-inspector__entry-map">
                            <button
                              v-for="(state, entryIndex) in page.entryStates"
                              :key="entryIndex"
                              type="button"
                              class="nvs-inspector__entry-cell"
                              :class="entryCellClass(state)"
                              :title="entryCellTitle(entryIndex, state)"
                              @click="handlePageMapClick(page.index)"
                            />
                          </div>
                          <span v-else class="text-medium-emphasis">&mdash;</span>

                          <v-tooltip
                            location="bottom"
                            content-class="nvs-inspector__map-tooltip"
                            :text="pageMapTooltip(page, pageEntryCounts[page.index] ?? null)"
                          >
                            <template #activator="{ props: tooltipProps }">
                              <div v-bind="tooltipProps" class="nvs-inspector__map-metrics">
                                <div class="nvs-inspector__map-counts">
                                  <v-chip size="x-small" color="success" variant="tonal">
                                    W:{{ pageEntryCounts[page.index]?.written ?? '\u2014' }}
                                  </v-chip>
                                  <v-chip size="x-small" color="warning" variant="tonal">
                                    E:{{ pageEntryCounts[page.index]?.erased ?? '\u2014' }}
                                  </v-chip>
                                  <v-chip size="x-small" color="grey-darken-1" variant="tonal">
                                    O:{{ pageEntryCounts[page.index]?.empty ?? '\u2014' }}
                                  </v-chip>
                                  <v-chip
                                    size="x-small"
                                    color="error"
                                    :variant="pageEntryCounts[page.index]?.illegal ? 'elevated' : 'outlined'"
                                  >
                                    I:{{ pageEntryCounts[page.index]?.illegal ?? '\u2014' }}
                                  </v-chip>
                                </div>

                                <v-progress-linear
                                  height="7"
                                  rounded
                                  :model-value="
                                    pageEntryCounts[page.index]
                                      ? (pageEntryCounts[page.index].written / PAGE_ENTRY_COUNT) * 100
                                      : 0
                                  "
                                  :color="pageEntryCounts[page.index]?.illegal ? 'error' : 'success'"
                                  class="nvs-inspector__map-bar"
                                />
                              </div>
                            </template>
                          </v-tooltip>
                        </div>
                      </td>
                      <td class="text-end">
                        <v-chip v-if="page.errors.length" size="small" color="error" variant="tonal">
                          {{ page.errors.length }}
                        </v-chip>
                        <span v-else class="text-medium-emphasis">0</span>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card-text>
            </v-card>
          </div>
        </v-window-item>
      </v-window>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { DataTableHeader } from 'vuetify';

type PartitionOption = {
  id: number | string;
  label: string;
  offset: number;
  size: number;
  sizeText?: string;
};

type NvsLocation = {
  pageIndex: number;
  entryIndex: number;
  spanCount?: number;
  nsIndex?: number;
  typeCode?: number;
  chunkIndex?: number;
  declaredDataSize?: number;
  headerCrcOk?: boolean;
  itemCrcOk?: boolean;
  dataCrcOk?: boolean;
};

type NvsEntry = {
  namespace: string;
  key: string;
  type: string;
  valuePreview: string;
  length?: number;
  crcOk?: boolean;
  location?: NvsLocation; // FIX: matches parser output
  warnings?: string[];
};

type NvsNamespaceInfo = {
  id: number;
  name: string;
};

type EntryStateLabel = 'EMPTY' | 'WRITTEN' | 'ERASED' | 'ILLEGAL';
type NamespaceFilterValue = 'All' | number;
type NamespaceFilterOption = { title: string; value: NamespaceFilterValue };
type TypeFilterOption = { label: string; value: string };

type NvsPageEntryCounts = {
  written: number;
  erased: number;
  empty: number;
  illegal: number;
};

type NvsPage = {
  index: number;
  state: string;
  seq: number | null;
  valid: boolean;
  errors: string[];
  entryStates?: EntryStateLabel[];
  entryCounts?: NvsPageEntryCounts;
};

type NvsResult = {
  version: number;
  pages: NvsPage[];
  namespaces: NvsNamespaceInfo[];
  entries: Array<NvsEntry>;
  warnings: string[];
  errors: string[];
};

const props = defineProps<{
  partitions: PartitionOption[];
  selectedPartitionId: number | string | null;
  loading: boolean;
  status: string;
  error: string | null;
  result: NvsResult | null;
  hasPartition: boolean;
}>();

const emit = defineEmits<{
  (e: 'select-partition', value: number | string | null): void;
  (e: 'read-nvs'): void;
}>();

const { t } = useI18n();

const PAGE_ENTRY_COUNT = 126;
const ENTRY_SIZE_BYTES = 32;
const NVS_PAGE_SIZE_BYTES = 0x1000;

type ResultTab = 'keys' | 'pages';
const activeTab = ref<ResultTab>('pages');
watch(
  () => props.result,
  result => {
    activeTab.value = result?.entries?.length ? 'keys' : 'pages';
  },
  { immediate: true },
);

const autoReadRequested = ref(false);
watch(
  [() => props.partitions.length, () => props.loading, () => props.result],
  ([partitionCount, loading, result]) => {
    if (autoReadRequested.value) return;
    if (loading) return;
    if (result) {
      autoReadRequested.value = true;
      return;
    }
    if (partitionCount <= 0) return;
    autoReadRequested.value = true;
    emit('read-nvs');
  },
  { immediate: true },
);

const pageFilter = ref<number | null>(null);
watch(
  () => props.result,
  () => {
    pageFilter.value = null;
  },
);

const pageEntryCounts = computed<Record<number, NvsPageEntryCounts>>(() => {
  const out: Record<number, NvsPageEntryCounts> = {};
  const pages = props.result?.pages ?? [];
  for (const page of pages) {
    if (!page || typeof page.index !== 'number') continue;
    if (page.entryCounts) {
      out[page.index] = page.entryCounts;
      continue;
    }
    const states = page.entryStates;
    if (!Array.isArray(states) || states.length !== PAGE_ENTRY_COUNT) continue;
    const counts: NvsPageEntryCounts = { written: 0, erased: 0, empty: 0, illegal: 0 };
    for (const state of states) {
      if (state === 'WRITTEN') counts.written += 1;
      else if (state === 'ERASED') counts.erased += 1;
      else if (state === 'EMPTY') counts.empty += 1;
      else counts.illegal += 1;
    }
    out[page.index] = counts;
  }
  return out;
});

const selectedPartition = computed(() => {
  const selectedId = props.selectedPartitionId;
  return (
    props.partitions.find(partition => partition.id === selectedId || String(partition.id) === String(selectedId)) ??
    props.partitions[0] ??
    null
  );
});

function formatBytes(bytes: number | null | undefined) {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes < 0) {
    return null;
  }
  if (bytes === 0) {
    return '0 bytes';
  }
  const units = ['bytes', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const rounded = unitIndex === 0 ? value.toFixed(0) : value.toFixed(value >= 10 ? 1 : 2);
  return `${rounded.replace(/\.0+$/, '')} ${units[unitIndex]}`;
}

const nvsUsage = computed(() => {
  if (!props.result) {
    return null;
  }
  const counts = Object.values(pageEntryCounts.value);
  if (!counts.length) {
    return null;
  }

  const entryTotals = counts.reduce(
    (totals, count) => ({
      written: totals.written + count.written,
      erased: totals.erased + count.erased,
      empty: totals.empty + count.empty,
      illegal: totals.illegal + count.illegal,
    }),
    { written: 0, erased: 0, empty: 0, illegal: 0 },
  );

  const writtenBytes = entryTotals.written * ENTRY_SIZE_BYTES;
  const erasedBytes = entryTotals.erased * ENTRY_SIZE_BYTES;
  const freeBytes = entryTotals.empty * ENTRY_SIZE_BYTES;
  const illegalBytes = entryTotals.illegal * ENTRY_SIZE_BYTES;
  const entryCapacityBytes =
    (entryTotals.written + entryTotals.erased + entryTotals.empty + entryTotals.illegal) * ENTRY_SIZE_BYTES;
  const partitionBytes = selectedPartition.value?.size ?? props.result.pages.length * NVS_PAGE_SIZE_BYTES;
  const partitionPercent = partitionBytes > 0 ? (writtenBytes / partitionBytes) * 100 : 0;

  return {
    writtenBytesText: formatBytes(writtenBytes) ?? `${writtenBytes.toLocaleString()} bytes`,
    erasedBytesText: formatBytes(erasedBytes) ?? `${erasedBytes.toLocaleString()} bytes`,
    freeBytesText: formatBytes(freeBytes) ?? `${freeBytes.toLocaleString()} bytes`,
    illegalBytesText: formatBytes(illegalBytes) ?? `${illegalBytes.toLocaleString()} bytes`,
    entryCapacityBytesText: formatBytes(entryCapacityBytes) ?? `${entryCapacityBytes.toLocaleString()} bytes`,
    partitionBytesText: formatBytes(partitionBytes) ?? `${partitionBytes.toLocaleString()} bytes`,
    partitionPercentText: partitionPercent.toFixed(1),
  };
});

function clearPageFilter() {
  pageFilter.value = null;
}

function handlePageMapClick(pageIndex: number) {
  pageFilter.value = pageIndex;
  activeTab.value = 'keys';
}

function entryCellClass(state: EntryStateLabel) {
  return `nvs-inspector__entry-cell--${state.toLowerCase()}`;
}

function entryCellTitle(entryIndex: number, state: EntryStateLabel) {
  const wordIndex = Math.floor(entryIndex / 16);
  const bitOffset = (entryIndex % 16) * 2;
  return t('nvsInspector.entryCellTitle', {
    entry: entryIndex,
    word: wordIndex,
    bitStart: bitOffset,
    bitEnd: bitOffset + 1,
    state,
  });
}

function pageMapTooltip(page: NvsPage, counts: NvsPageEntryCounts | null) {
  const lines: string[] = [
    t('nvsInspector.pageTooltipTitle', {
      index: page.index,
      state: page.state,
    }),
  ];

  if (counts) {
    const percentUsed = (counts.written / PAGE_ENTRY_COUNT) * 100;
    lines.push(
      t('nvsInspector.pageTooltipWritten', {
        written: counts.written.toLocaleString(),
        total: PAGE_ENTRY_COUNT.toLocaleString(),
        percent: percentUsed.toFixed(1),
      }),
    );
    lines.push(
      t('nvsInspector.pageTooltipDistribution', {
        erased: counts.erased.toLocaleString(),
        empty: counts.empty.toLocaleString(),
        illegal: counts.illegal.toLocaleString(),
      }),
    );
  } else {
    lines.push(t('nvsInspector.entryMapUnavailable'));
  }

  const errorCount = page.errors?.length ?? 0;
  if (errorCount > 0) {
    lines.push(
      t('nvsInspector.pageTooltipErrors', {
        count: errorCount.toLocaleString(),
      }),
    );
    if (page.errors[0]) lines.push(page.errors[0]);
  }

  return lines.join('\n');
}

const namespaceFilter = ref<NamespaceFilterValue>('All');
const keyFilter = ref('');
const typeFilter = ref('All');
const valueFilter = ref('');

const entryHeaders = computed<DataTableHeader[]>(() => [
    { title: t('nvsInspector.keys.table.namespace'), key: 'namespace' },
    { title: t('nvsInspector.keys.table.key'), key: 'key' },
    { title: t('nvsInspector.keys.table.type'), key: 'type' },
    { title: t('nvsInspector.keys.table.value'), key: 'valuePreview' },
    { title: t('nvsInspector.keys.table.length'), key: 'length', align: 'end' },
    { title: t('nvsInspector.keys.table.crc'), key: 'crcOk', align: 'center' },
    { title: t('nvsInspector.keys.table.location'), key: 'location' },
    { title: t('nvsInspector.keys.table.issues'), key: 'issues', align: 'center' },
  ]);

// FIX: avoid shadowing props.hasPartition with a computed of the same name
const hasPartitionSelected = computed(() => props.hasPartition && Boolean(props.selectedPartitionId));

const pageStats = computed(() => {
  const pages = props.result?.pages ?? [];

  let blank = 0;
  let bad = 0;
  for (const page of pages) {
    if (!page) continue;
    if (page.state === 'UNINITIALIZED') {
      blank += 1;
      continue;
    }
    if (!page.valid) {
      bad += 1;
    }
  }

  const total = pages.length;
  const inUse = Math.max(total - blank, 0);
  return { total, inUse, blank, bad };
});

function unwrapItem(item: unknown) {
  // Vuetify wraps items; keep defensive to avoid UI crashes on malformed data.
  // In Vuetify 3, item may be either the raw object or a wrapper with `.raw`.
  return ((item as any)?.raw ?? item) as any;
}

const namespaceFilterOptions = computed(() => {
  const byId = new Map<number, string>();

  for (const ns of props.result?.namespaces ?? []) {
    if (typeof ns?.id === 'number' && ns.name) byId.set(ns.id, ns.name);
  }

  for (const entry of props.result?.entries ?? []) {
    const nsIndex = entry.location?.nsIndex;
    if (typeof nsIndex !== 'number') continue;
    if (!byId.has(nsIndex) && entry.namespace) byId.set(nsIndex, entry.namespace);
  }

  const nameCounts = new Map<string, number>();
  for (const name of byId.values()) {
    nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
  }

  const items: NamespaceFilterOption[] = Array.from(byId.entries())
    .sort(([aId, aName], [bId, bName]) => aName.localeCompare(bName) || aId - bId)
    .map(([id, name]) => ({
      value: id,
      title: (nameCounts.get(name) ?? 0) > 1 ? `${name} (#${id})` : name,
    }));

    return [{ title: t('nvsInspector.filters.all'), value: 'All' as const }, ...items];
  });

const typeFilterOptions = computed<TypeFilterOption[]>(() => {
  const items = props.result?.entries ?? [];
  const set = new Set<string>();
  for (const entry of items) {
    if (entry?.type) set.add(entry.type);
  }
  const sorted = Array.from(set).sort((a, b) => a.localeCompare(b));
  return [
    { label: t('nvsInspector.filters.all'), value: 'All' },
    ...sorted.map(value => ({ label: value, value })),
  ];
});

const filteredEntries = computed(() => {
  const result = props.result;
  if (!result) return [];

  const ns = namespaceFilter.value;
  const key = keyFilter.value.trim().toLowerCase();
  const type = typeFilter.value;
  const value = valueFilter.value.trim().toLowerCase();
  const page = pageFilter.value;

  return (result.entries ?? [])
    .map((entry, idx) => ({
      ...entry,
      __key: `${entry.namespace}:${entry.key}:${entry.type}:${idx}`,
    }))
    .filter(entry => {
      if (ns !== 'All' && entry.location?.nsIndex !== ns) return false;
      if (type !== 'All' && entry.type !== type) return false;
      if (key && !String(entry.key ?? '').toLowerCase().includes(key)) return false;
      if (value && !String(entry.valuePreview ?? '').toLowerCase().includes(value)) return false;
      if (page !== null && entry.location?.pageIndex !== page) return false;
      return true;
    });
});
</script>

<style scoped>
.nvs-inspector__controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.nvs-inspector__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
}

.nvs-inspector__filters {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 900px) {
  .nvs-inspector__filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 500px) {
  .nvs-inspector__filters {
    grid-template-columns: 1fr;
  }
}

.nvs-inspector__list {
  margin: 0;
  padding-left: 18px;
}

.nvs-inspector__pages-table code {
  font-size: 0.85rem;
}

.nvs-inspector__pages-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.nvs-inspector__pages-summary {
  max-width: 100%;
}

.nvs-inspector__pages-summary :deep(.v-chip__content) {
  white-space: normal;
}

.nvs-inspector__map-cell {
  vertical-align: top;
  padding-top: 6px;
  padding-bottom: 6px;
}

.nvs-inspector__map-widget {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex-wrap: wrap;
}

.nvs-inspector__map-metrics {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 4px;
  cursor: help;
  max-width: 220px;
}

.nvs-inspector__map-counts {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.nvs-inspector__map-bar {
  max-width: 160px;
}

:global(.nvs-inspector__map-tooltip) {
  white-space: pre-line;
  max-width: 320px;
}

.nvs-inspector__entry-map {
  --cell-size: 7px;
  display: grid;
  grid-template-columns: repeat(18, var(--cell-size));
  gap: 2px;
  align-content: start;
  justify-content: start;
  padding: 4px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--v-theme-on-surface) 7%, transparent);
  width: fit-content;
}

@media (max-width: 900px) {
  .nvs-inspector__entry-map {
    --cell-size: 6px;
    gap: 2px;
  }
}

.nvs-inspector__entry-cell {
  width: var(--cell-size);
  height: var(--cell-size);
  padding: 0;
  border: 0;
  border-radius: 2px;
  cursor: pointer;
  background: color-mix(in srgb, var(--v-theme-on-surface) 10%, transparent);
}

.nvs-inspector__entry-cell:hover {
  filter: brightness(1.12);
  outline: 1px solid color-mix(in srgb, var(--v-theme-on-surface) 26%, transparent);
  outline-offset: 1px;
}

.nvs-inspector__entry-cell:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--v-theme-primary) 75%, transparent);
  outline-offset: 2px;
}

.nvs-inspector__entry-cell--written {
  background: color-mix(in srgb, var(--v-theme-success) 76%, transparent);
}

.nvs-inspector__entry-cell--erased {
  background: color-mix(in srgb, var(--v-theme-warning) 76%, transparent);
}

.nvs-inspector__entry-cell--empty {
  background: color-mix(in srgb, var(--v-theme-on-surface) 12%, transparent);
}

.nvs-inspector__entry-cell--illegal {
  background: color-mix(in srgb, var(--v-theme-error) 76%, transparent);
}
</style>
