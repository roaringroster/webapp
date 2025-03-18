<template>
  <SplitView
    class="min-height member-split-view tabview-padding"
    ref="splitView"
    :scrollOffsetTop="-60"
    @did-show-before="didShowBefore"
    @update:is-collapsed="isCollapsed = $event"
  >
    <template v-slot:before>
      <q-list 
        class="text-size-adjust-md q-mb-xl"
      >

        <q-item class="q-mt-sm q-px-sm q-pb-none text-subtitle1 text-weight-bold">
          <q-item-section>
            <q-item-label class="ellipsis">{{ t("teamMembers") }}</q-item-label>
          </q-item-section>
        </q-item>
        <navigation-items
          :items="memberItems"
          type="splitview"
        />
      </q-list>
    </template>

    <template v-slot:after>
      <slot v-if="route.params.memberId" />
    </template>
  </SplitView>
</template>

<style lang="sass">
.member-split-view
  @media print
    .q-splitter__separator
      display: none
    .q-splitter__before
      width: 0 !important
</style>

<script setup lang="ts">
import { computed, onUnmounted, ref, useTemplateRef } from "vue";
import { RouteRecordName, useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { DocumentId } from "@automerge/automerge-repo";
import { cleanupAll, getDocumentsWhenReady, getHandles, getOrganization } from "src/api/repo";
import { useAccountStore } from "src/stores/accountStore";
import { HasDocumentId } from "src/models/base";
import { Contact, ContactProps, getUsername } from "src/models/contact";
import SplitView from "src/components/SplitView.vue";
import NavigationItems, { NavigationItem } from "src/components/NavigationItems.vue";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const accountStore = useAccountStore();

const isCollapsed = ref(false);

const organizationMembers = computed(() => accountStore.organization?.members || {});
const contactHandles = getHandles<Contact>(() => 
  accountStore.team?.members
    .map(userId => organizationMembers.value[userId]?.contactId)
    .filter(Boolean)
);
onUnmounted(() => cleanupAll(contactHandles.value));
const contacts = getDocumentsWhenReady(contactHandles);
const contactById = computed(() => contacts.value.reduce(
  (result, contact) => {
    result[contact.id] = contact;
    return result;
  },
  {} as Record<DocumentId, (ContactProps & HasDocumentId)>
));
const contactByUserId = computed(() => Object.entries(organizationMembers.value).reduce(
  (result, [id, { contactId }]) => {
    result[id] = contactById.value[contactId] || null
    return result;
  },
  {} as Record<string, (ContactProps & HasDocumentId) | null>
));
const members = computed(() => {
  const authTeam = getOrganization();

  if (authTeam) {
    return accountStore.team?.members.map(memberId => ({
      memberId,
      username: getUsername(contactByUserId.value[memberId]) 
        || authTeam.members(memberId).userName,
    })) || [];
  } else {
    return [];
  }
});
const memberItems = computed(() => members.value.map(({memberId, username}) => ({
  label: username || t("withoutNames"),
  labelClass: !username ? "text-italic" : "",
  action: () => showRoute(route.name || "", { memberId }),
  active: memberId === route.params.memberId
} as NavigationItem)));

const splitView = useTemplateRef("splitView");

function showRoute(
  name: RouteRecordName, 
  params: Record<string, string> = {}, 
  query: Record<string, string> = {}, 
) {
  splitView.value?.showAfter();

  if (!isCurrentRoute(name, params)) {
    void router.push({ name, params, query });
  }
}

function isCurrentRoute(name: RouteRecordName, params: Record<string, string>) {
  return (name == route.name) &&
      (Object.keys(params).filter(key => params[key] != route.params[key]).length == 0);
};

const didShowBefore = () => console.log("didShowBefore");

</script>
