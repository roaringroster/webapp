<template>
  <tab-view
    :key="$route.params.memberId || ''"
    :tabs="tabs"
    :tabCount="4"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import TabView from "src/components/TabView.vue";
import { useRoute } from "vue-router";

const { t } = useI18n();
const route = useRoute();

const routePrefix = computed(() => route.path.split("/").at(1));

const tabs = computed(() => [{
  label: t("contact") as string,
  route: routePrefix.value + "Contact",
  icon: "fas fa-address-book",
},{
  label: t("agreements"),
  route: routePrefix.value + "Agreements",
  icon: "fas fa-file-contract",
}]); 
</script>
