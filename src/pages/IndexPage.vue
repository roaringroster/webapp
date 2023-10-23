<template>
  <q-page class="row items-center justify-evenly">
    <div class="column items-center q-gutter-y-sm">
      <simplified-markdown :text="$t('accountWelcomeMessage', {name: username})" />
      <q-btn
        :label="$t('logout')"
        color="primary"
        rounded
        outline
        no-caps
        @click="logout"
      />
      <q-btn
        :label="$t('CheckForUpdates')"
        color="primary"
        rounded
        outline
        no-caps
        @click="checkForUpdates"
      />
      <q-btn
        :label="$t('license')"
        color="primary"
        rounded
        flat
        no-caps
        :to="{name: 'license'}"
      />
      <q-btn
        :label="$t('acknowledgements')"
        color="primary"
        rounded
        flat
        no-caps
        :to="{name: 'acknowledgements'}"
      />
      <q-btn
        :label="$t('privacyPolicy')"
        color="primary"
        rounded
        flat
        no-caps
        :to="{name: 'privacyPolicy'}"
      />
      <q-btn
        :label="$t('legalNotice')"
        color="primary"
        rounded
        flat
        no-caps
        :to="{name: 'legalNotice'}"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, Ref, ref } from "vue";
import { useAPI } from "src/api";
import { checkForUpdates } from "src/boot/updater";
import { Contact, getUsername } from "src/models/contact";
import SimplifiedMarkdown from "src/components/SimplifiedMarkdown.vue";
import { useRouter } from "vue-router";
import { useRedirectStore } from "src/stores/redirectStore";

const api = useAPI();
const router = useRouter();
const redirectStore = useRedirectStore();

const contact: Ref<Contact | null> = ref(null);

(async () => {
  contact.value = (await api.getCurrentUser())?.contact ?? null;
})()

const username = computed(() => {
  return getUsername(contact.value || undefined) || api.username;
})

async function logout() {
  // first logout, then navigate to login page so that the state change in $ccapi.isLoggedIn is detected, 
  // e.g. in MainLayout for updating the toolbar buttons
  await api.logout();
  void await router.replace({name: "login"});
  // prevent redirectPath being set to the current path before logout
  redirectStore.redirectPath = "";
}

</script>
