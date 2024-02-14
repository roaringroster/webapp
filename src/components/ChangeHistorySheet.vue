<template>
  <editing-sheet
    ref="dialogRef"
    :title="tv(title)"
    :hasPendingChanges="hasModifications"
    :hasDoneButton="hasModifications()"
    :doneButtonLabel="$t('applyChanges')"
    @ok="onDone"
    @hide="$emit('hide')"
    is-data-available
    class="changehistory-sheet"
  >
    <div class="row justify-center q-mb-sm">
      <text-with-tooltip
        :text="$t('ChangeHistory')"
        :tooltip="$t('ChangeHistoryTooltip')"
        width="300px"
        class="text-subtitle1 text-weight-medium q-mr-sm"
      />
      <div class="text-caption self-end q-mb-xs">({{ $t('changesCount', changes.length) }}, {{ fileSize(sizeWithHistory) }})</div>
    </div>
    <q-splitter
      v-model="splitterModel"
      horizontal
      style="height: calc(100% - 42px)"
      separator-class="bg-primary"
    >
      <template v-slot:before>
        <q-table
          v-model:selected="selectedRows"
          selection="single"
          :columns="columns"
          :rows="rows"
          row-key="hash"
          virtual-scroll
          :virtual-scroll-sticky-size-start="28"
          :rows-per-page-options="[0]"
          dense
          hide-bottom
          class="changehistory-table ellipsis non-selectable"
          @row-click="(_, row) => selectedRows = [row]"
        >
          <template v-slot:header-selection />
          <template v-slot:body-selection />
        </q-table>
      </template>

      <template v-slot:after>
        <q-tree
          :nodes="tree"
          node-key="id"
          :no-nodes-label="$t('noData')"
          v-model:expanded="expanded"
          default-expand-all
          dense
          class="changehistory-tree q-pa-sm"
        >
          <template v-slot:default-header="prop">
            <div :style="prop.node.labelStyle">{{ prop.node.label }}:</div>
            <div class="col">{{ prop.node.value }}</div>
          </template>
        </q-tree>
        <!-- <div class="q-pa-md">
          <pre class="text-caption">{{ content }}</pre>
        </div> -->
      </template>

    </q-splitter>
  </editing-sheet>
</template>

<style lang="sass">
.changehistory-sheet .modal-view-section
  padding: 0
.changehistory-table
  height: 100%

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th
    background-color: #ffffff

  thead tr th
    position: sticky
    z-index: 1
  thead tr:first-child th
    top: 0

  &.q-table--loading thead tr:last-child th
    top: 32px

  .selected
    color: #ffffff
    
  tbody td:after
    background: transparent
  
  .selected
    background: $primary

  .q-table tr :first-child
    padding-left: 0
.changehistory-tree
  .q-tree__node-header
    border-bottom: 1px solid #dddddd
  .q-tree__node-header-content
    align-items: start
</style>

<script setup lang="ts">
import { computed, isProxy, onMounted, PropType, Ref, ref, toRaw, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useQuasar, useDialogPluginComponent, QTableProps, QTreeNode } from "quasar";
import * as Automerge from "@automerge/automerge";
import { fileSize, tv } from "src/boot/i18n";
import { IdentifiableType } from "src/models/identifiable";
import EditingSheet from "src/components/EditingSheet.vue";
import TextWithTooltip from "src/components/TextWithTooltip.vue";

type Row = {
  hash: string;
  time: number;
  modifiedBy: string;
  message: string;
};

/* ToDo:
 - learn about diff functions, JSON Patch: https://github.com/automerge/automerge/issues/286, https://www.npmjs.com/package/fast-json-patch, https://www.npmjs.com/package/deep-object-diff
 - test: how is an insert into a list detected?
 - highlight diff, https://extendsclass.com/json-diff.html, https://json-diff.com
 - user name for user ID
 - label for keys, maybe hide irrelevant keys
 - derive title for document IDs in data
 - test: handle non-linear change graph with concurrent changes?
 - highlight conflicts and the overwritten alternative
 - actions: undo change, reapply change, restore snapshot
 - if needed: git branching diagram, e.g. https://www.bryanbraun.com/2020/04/24/drawing-git-branching-diagrams/
 */

const { screen } = useQuasar();
const { t, d } = useI18n();

const props = defineProps({
  document: {
    type: Object as PropType<Automerge.Doc<IdentifiableType>>,
    required: true
  },
  title: {
    type: String as PropType<string>,
    default: "withoutDesignation"
  }
});

const emit = defineEmits([
  ...useDialogPluginComponent.emits
]);

const { dialogRef } = useDialogPluginComponent();

const splitterModel = ref(50);
const selectedRows: Ref<Row[]> = ref([]);
const content = ref("");
const modifications: Ref<Record<string, any>> = ref({});

watch(
  () => selectedRows.value,
  (newValue) => {
    const hash = newValue[0]?.hash;
    const index = changes.value.findIndex(item => item.change.hash == hash);
    const item = changes.value[index];
    const current = structuredClone(item.snapshot || {});
    // const previous = structuredClone(this.changes[index + 1]?.snapshot || {});
    // const previous = this.changes[index + 1];
    console.dir(item);
    content.value = JSON.stringify(current, undefined, 2);
    tree.value = toNode(current);
  }
);

const doc = computed(() => 
  isProxy(props.document)
    ? toRaw(props.document)
    : props.document
);

const changes = computed(() => Automerge.getHistory(doc.value).reverse());

const sizeWithHistory = computed(() => Automerge.save(doc.value).length);

const rows = computed(() => changes.value.map(({change}, index) => ({
  hash: change.hash || "",
  time: (index < changes.value.length - 1) || !!change.time
    ? change.time
    : changes.value.at(index - 1)?.change.time,
  modifiedBy: (index < changes.value.length - 1) || !!change.message
    ? getModifiedBy(change.message)
    : getModifiedBy(changes.value.at(index - 1)?.change.message || null),
  message: getDescription(change.message),
})));

const columns: Ref<QTableProps["columns"]> = computed(() => [{
  name: "time",
  label: t("date"),
  field: "time",
  align: "left",
  style: "width: 33%",
  sortable: true,
  format: (value: number) => value
    ? d(value * 1000, screen.gt.xs ? "DateTimeShortSecondsWeekday" : "DateTimeShortSeconds")
    : t("unknownUser")
},{
  name: "modifiedBy",
  label: t("modifiedBy"),
  field: "modifiedBy",
  align: "left",
  style: "width: 33%",
},{
  name: "message",
  label: t("description"),
  field: "message",
  align: "left",
  style: "width: 33%",
}]);


function hasModifications(): boolean {
  return Object.keys(modifications.value).length > 0;
};

function getModifiedBy(message: string | null, ) {
  const by = JSON.parse(message || "{}")?.by;
  return by || t("unknownUser") // + ` (${by?.slice(0, 6)}…)`
};

function getDescription(message: string | null, ) {
  return JSON.parse(message || "{}")?.desc || "";
};

// - Tree

const tree: Ref<QTreeNode[]> = ref([]);
const expanded: Ref<string[]> = ref([]);

function toNode(item: any, path: string[] = []): QTreeNode[] {
  return Object.entries(item).map(([key, value]) => ({
      label: tv(key),
      value: nodeValue(value),
      id: path.concat(key).join("."),
      depth: path.length,
      labelStyle: `width: calc(50% - ${path.length * 8}px)`,
      children: isListOrMap(value)
        ? toNode(value, path.concat(key))
        : undefined
    }))
}

function nodeValue(value: any) {
  if (Array.isArray(value)) {
    return value.length + " " + t("item", value.length);
  } else if (value instanceof Date) {
    return d(value, "DateTimeShortSecondsWeekday");
  } else if (value == null || value == undefined || typeof value == "object") {
    return "";
  } else {
    return value.toString();
  }
}

function isListOrMap(value: any) {
  return Array.isArray(value) 
    || (!!value && typeof value == "object" && !(value instanceof Date));
}

// - Sheet

async function onDone () {
  if (hasModifications()) {
    // ToDo: apply changes in this.modifications;
  }

  (dialogRef.value as EditingSheet | undefined)?.confirm();
  emit("ok");
};

onMounted(() => selectedRows.value = [rows.value[0] as Row]);

</script>
