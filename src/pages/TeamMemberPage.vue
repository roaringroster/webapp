<template>
  <split-view
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
            <q-item-label class="ellipsis"></q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn
              v-if="!isDisabled"
              icon="add"
              round
              outline
              size="10.5px"
              color="primary"
              @click.stop="addMember"
              :title="$t('addMember')"
              class="shadow-1"
            />
          </q-item-section>
        </q-item>
        <navigation-items
          :items="memberItems"
          type="splitview"
        />
      </q-list>
    </template>

    <template v-slot:after>
      <team-member-view v-if="route.params.memberId"/>
    </template>
  </split-view>
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
import { computed, onMounted, ref } from "vue";
import { RouteRecordName, useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAPI } from "src/api";
import { didExpire } from "src/helper/expiration";
import { Contact } from "src/models/contact";
import SplitView from "src/components/SplitView.vue";
import NavigationItems, { NavigationItem } from "src/components/NavigationItems.vue";
  import TeamMemberView from "src/components/TeamMemberView.vue";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const api = useAPI();

const isCollapsed = ref(false);
const isDisabled = computed(() => didExpire());

const members = ref([] as {name: string, memberId: string, contact: Contact}[]);
const memberItems = computed(() => members.value.map(({name, memberId}) => ({
  label: name || t("withoutNames"),
  labelClass: !name ? "text-italic" : "",
  action: () => showRoute(route.name || "", { memberId }),
  active: memberId === route.params.memberId
} as NavigationItem)))

function addMember() {
  // const { user, contact } = createUser();
  // const name = getName(contact);
  // const memberId = user.id;
  // members.value.push({ name, memberId, contact });
}

onMounted(async () => {
  const currentUser = await api.getCurrentUser();

  if (currentUser) {
    // const { user, contact } = currentUser;
    // const name = getName(contact);
    // const memberId = user.id;
    // members.value.push({ name, memberId, contact });
  }

  await router.replace({
    name: "memberContact", 
    params: { memberId: members.value.at(0)?.memberId }
  });
});

const splitView = ref(null as SplitView | null);

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
