<template>
  <q-btn
    icon="far fa-file-lines"
    flat
    stretch
    style="max-width:44px"
  >
    <q-menu
      max-width="260px"
      max-height="calc(96vh - 50px)"
    >
      <q-list
        class="text-body2"
        style="width: 260px"
      >
        <q-item
          v-for="(document, index) in store.documents"
          :key="index"
          clickable
          v-close-popup
          @click="showChangeHistory(document)"
        >
          <q-item-section side>
            <q-icon name="fas fa-timeline" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ $t("showChangeHistory") }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          v-if="!$q.platform.is.electron"
          clickable
          v-close-popup
          @click="print"
        >
          <q-item-section side>
            <q-icon name="fas fa-print" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ $t("Print") }}</q-item-label>
          </q-item-section>
        </q-item>

        <div v-if="isDev">
          <q-separator />
          <q-item clickable>
            <q-item-section side>
              <q-icon name="fas fa-globe" />
            </q-item-section>
            <q-item-section>{{
              $t("selectLanguage", { language: $t($i18n.locale.toLowerCase()) })
            }}</q-item-section>
            <q-item-section side>
              <q-icon name="fas fa-angle-right" />
            </q-item-section>
            <language-menu
              :anchor="$q.screen.gt.xs ? 'top left' : 'bottom middle'"
              :self="$q.screen.gt.xs ? 'top right' : 'top middle'"
              :fit="true"
            />
          </q-item>
        </div>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import {  } from "vue";
import { useQuasar } from "quasar";
import LanguageMenu from "src/components/LanguageMenu.vue";
import ChangeHistorySheet from "src/components/ChangeHistorySheet.vue";
import { useChangeHistoryStore, NamedDocument } from "src/stores/changeHistoryStore";

const $q = useQuasar();
const store = useChangeHistoryStore();
const isDev = process.env.DEV;

function print() {
  if ($q.platform.is.cordova && (cordova?.plugins as any)?.printer) {
    (cordova?.plugins as any)?.printer?.print?.();
  } else if ($q.platform.is.electron) {
    window.print();
  } else {
    window.print();
  }
}

function showChangeHistory(doc: NamedDocument) {
  const { document, title } = doc;

  $q.dialog({
    component: ChangeHistorySheet,
    componentProps: { document, title }
  });
}

</script>
