<template>
  <q-drawer
    v-model="isVisible"
    class="no-scroll non-selectable bg-grey-2 dense-avatar navigation-drawer print-hide"
    show-if-above
    :breakpoint="1020"
  >
    <div class="fit column no-wrap q-pt-sm scroll q-gutter-y-lg">
      <q-expansion-item
        v-model="isUserExpanded"
        :label="username"
        switch-toggle-side
        :header-class="headerClass(isUserExpanded, userItems)"
      >
        <q-list>
          <navigation-section :items="userItems" />
        </q-list>
      </q-expansion-item>
      <q-expansion-item
        v-if="accountStore.teams.length > 0"
        v-model="isTeamExpanded"
        :label="accountStore.team?.name || $t('noTeamSelected')"
        :caption="$t('team')"
        switch-toggle-side
        :header-class="headerClass(isTeamExpanded, teamItems)"
      >
        <q-list>
          <expansion-select
            :model-value="teamId || ''"
            @update:model-value="teamId = $event"
            :label="$t('selectTeam')"
            :items="teams"
          />
          <navigation-section :items="teamItems" />
        </q-list>
      </q-expansion-item>
      <q-expansion-item
        v-if="organizations.length > 0"
        v-model="isOrganizationExpanded"
        :label="organizations.at(organization)"
        :caption="$t('organization')"
        switch-toggle-side
       :header-class="headerClass(isOrganizationExpanded, organizationItems)"
      >
        <q-list>
          <expansion-select
            v-model="organization"
            :label="$t('selectOrganization')"
            :items="organizations.map((label, value) => ({label, value}))"
          />
          <navigation-section :items="organizationItems" />
        </q-list>
      </q-expansion-item>
      <q-expansion-item
        v-model="isAppExpanded"
        :label="$t('AboutApp', { appname })"
        :caption="isAppExpanded ? appVersion : ''"
        switch-toggle-side
        :header-class="headerClass(isAppExpanded, appItems)"
      >
        <q-list>
          <q-item>
            <q-item-section>
              <q-item-label caption style="line-height: 1rem !important">
                <simplified-markdown :text="expirationWarning"/>
              </q-item-label>
            </q-item-section>
          </q-item>
          <navigation-section :items="appItems" />
        </q-list>
      </q-expansion-item>
      <q-space @click="closeDrawer"/>
    </div>
  </q-drawer>
</template>

<style lang="sass">
.navigation-drawer
  .q-item
    min-height: 40px
    .q-item__section--side
      padding-right: 12px
  .q-expansion-item__content
    .q-item
      padding-left: 52px
      .q-item__section--side
        padding-right: 16px
</style>

<script setup lang="ts">
import { computed, ComputedRef, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useQuasar } from "quasar";
import { bus } from "src/boot/eventBus";
import { checkForUpdates } from "src/boot/updater";
import { logout } from "src/boot/openURL";
import { expirationDate, didExpire } from "src/helper/expiration";
import { appContributingURL, appFeedbackAddress } from "src/helper/appInfo";
import { getUsername } from "src/models/contact";
import SimplifiedMarkdown from "src/components/SimplifiedMarkdown.vue";
import NavigationSection, { NavigationItem } from "src/components/NavigationSection.vue";
import ExpansionSelect from "src/components/ExpansionSelect.vue";
import { useAccountStore } from "src/stores/accountStore";

const { screen } = useQuasar();
const { t, d } = useI18n();
const route = useRoute();
const accountStore = useAccountStore();

const appname = process.env.APP_NAME || "";
const appversion = process.env.APP_VERSION || "0";

const isVisible = ref(screen.gt.sm);
const username = computed(() => 
  getUsername(accountStore.memberContact) 
    || accountStore.userName
);
const appVersion = computed(() => t("currentVersion") + ": " + appversion);
const expirationWarning = computed(() => 
    expirationDate 
      ? t(
          didExpire() ? "betaAppDidExpire" : "betaAppWillExpire", 
          { date: d(expirationDate, "DateMed") }
        )
      : ""
);

const organizationItems = computed(() => [{
  label: t("organizationMembers"),
  icon: "fas fa-people-roof",
  route: "organizationMembers",
},{
  label: t("organizationSettings"),
  icon: "fas fa-gears",
  route: "organizationSettings",
}]);

const teamItems: ComputedRef<NavigationItem[]> = computed(() => [{
  label: t("roster"),
  icon: "fas fa-clipboard-user",
  route: "roster",
},{
  label: t("absences"),
  icon: "fas fa-suitcase",
  route: "absences",
},{
  label: t("contacts"),
  icon: "fas fa-address-book",
  route: "contacts",
  params: { memberId: route.params?.memberId?.toString() }
},{
  label: t("agreements"),
  icon: "fas fa-file-contract",
  route: "agreements",
  params: { memberId: route.params?.memberId?.toString() }
},{
  label: t("teamSettings"),
  icon: "fas fa-users-gear",
  route: "teamSettings",
}]);

const userItems = computed(() => [{
  label: t("overview"),
  icon: "fas fa-star",
  route: "overview",
},{
  label: t("userContact"),
  icon: "fas fa-address-book",
  route: "userContact",
},{
  label: t("userAgreements"),
  icon: "fas fa-file-contract",
  route: "userAgreements",
},{
  label: t("userAvailability"),
  icon: "fas fa-calendar-check",
  route: "userAvailability",
},{
  label: t("userSettings"),
  icon: "fas fa-user-cog",
  route: "userSettings",
},{
  label: t("logout") + "…",
  icon: "fas fa-arrow-right-from-bracket",
  action: logout,
}]);

const appItems = computed(() => [{
  label: t("CheckForUpdates"),
  icon: "fas fa-magnifying-glass",
  action: () => checkForUpdates(true),
},{
  label: t("Feedback") + "…",
  icon: "far fa-comment",
  action: () => location.href = `mailto:${appFeedbackAddress}?subject=Feedback`,
},{
  label: t("Contribute") + "…",
  icon: "fab fa-github",
  action: () => {
    const win = window.open(appContributingURL, "_blank");

    if (win) {
      win.opener = null;
    }
  },
},{
  label: t("license"),
  icon: "fas fa-handshake",
  route: "license",
},{
  label: t("acknowledgements"),
  icon: "far fa-heart",
  route: "acknowledgements",
},{
  label: t("privacyPolicy"),
  icon: "fas fa-shield-alt",
  route: "privacyPolicy",
},{
  label: t("legalNotice"),
  icon: "fas fa-info",
  route: "legalNotice",
}]);

const isUserExpanded = ref(hasActiveItem(userItems.value));
const isTeamExpanded = ref(true);
const isOrganizationExpanded = ref(hasActiveItem(organizationItems.value));
const isAppExpanded = ref(hasActiveItem(appItems.value));

const organizations = computed(() => [accountStore.organization?.name].filter(Boolean) as string[]);
const organization = ref(0);

const teamId = computed({
  get: () => accountStore.account?.activeTeam,
  set: value => accountStore.updateAccount(account => account.activeTeam = value)
});
const teams = computed(() => accountStore.teams.map(({ id, name }) => ({
  label: name,
  value: id
})));

function openDrawer() {
  isVisible.value = true;
}

function closeDrawer() {
  if (!screen.gt.sm) {
    isVisible.value = false;
  }
}

function toggleDrawer() {
  isVisible.value = !isVisible.value;
}

function headerClass(isExpanded: boolean, items: NavigationItem[]) {
  return [
    "q-pb-xs text-subtitle1 text-weight-medium",
    !isExpanded && hasActiveItem(items)
      ? "text-primary"
      : ""
  ]
}

function hasActiveItem(items: NavigationItem[]) {
  return !!items.find(item => !!item.route && !!route.matched.find(route => route.name == item.route));
}

bus.on("toggle-drawer", toggleDrawer);
bus.on("open-drawer", openDrawer);
bus.on("close-drawer", closeDrawer);

onUnmounted(() => {
  bus.off("toggle-drawer", toggleDrawer);
  bus.off("open-drawer", openDrawer);
  bus.off("close-drawer", closeDrawer);
});

</script>