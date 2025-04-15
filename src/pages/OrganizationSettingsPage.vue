<template>
  <q-page
    padding
    class="limit-page-width width-xs"
  >
    <q-input
      :label="$t('organizationName2')"
      v-model="organizationName"
      :debounce="debounce"
      class="q-mb-lg"
    />
    <div ref="el">
      <q-resize-observer @resize="onResize" />
      <labeled-item
        v-for="(item, index) in items"
        :key="'item' + index"
        :item="item"
        :compactLayout="compactLayout"
        class="text-primary"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { getShareId } from "@localfirst/auth-provider-automerge-repo";
import { useAccountStore } from "src/stores/accountStore";
import { debounce, alwaysString } from "src/helper/input";
import { isDev } from "src/helper/appInfo";
import LabeledItem, { numberToItem, stringArrayToItem, stringToItem } from "src/components/LabeledItem.vue";

const { t } = useI18n();
const accountStore = useAccountStore();

const organizationName = computed({
  get: () => accountStore.organization?.name || "",
  set: value => accountStore.organizationHandle?.changeDoc(org => 
    org.name = alwaysString(value)
  )
});

const items = computed(() => [
  ...stringToItem(t("organizationShortIdentifier"), () => 
    accountStore.authTeam ? getShareId(accountStore.authTeam) : ""
  ),
  ...stringToItem(t("organizationIdentifier"), () => 
    isDev && accountStore.authTeam ? accountStore.authTeam.id : ""
  ),
  ...stringArrayToItem("All document IDs", () => allDocuments.value),
  ...numberToItem("All documents count", () => isDev ? allDocuments.value.length : null),
]);
const compactLayout = ref(false);
const el = useTemplateRef("el");

function onResize() {
  const width = el.value?.offsetWidth || 0;
  compactLayout.value = width <= 400;
}

const allDocuments = computed(() => isDev 
  ? [
      accountStore.organizationHandle?.docId || "",
      ...accountStore.allTeams.flatMap(team => [
        team.id,
        team.rosterId,
      ]),
      ...Object.values(accountStore.organization?.members || {}).flatMap(member => [
        member.contactId,
        member.workAgreementsId,
        member.availabilityId,
        member.absencesId,
      ]),
    ]
  : []
);

</script>
