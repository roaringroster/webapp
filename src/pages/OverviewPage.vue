<template>
  <q-page class="row q-pt-xl justify-evenly">
    <div class="column items-center q-gutter-y-sm">
      <simplified-markdown :text="$t('accountWelcomeMessage', {name: username})" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, Ref, ref } from "vue";
import { useAPI } from "src/api";
import { Contact, getUsername } from "src/models/contact";
import SimplifiedMarkdown from "src/components/SimplifiedMarkdown.vue";

const api = useAPI();

const contact: Ref<Contact | null> = ref(null);

(async () => {
  contact.value = (await api.getCurrentUser())?.contact ?? null;
})()

const username = computed(() => {
  return getUsername(contact.value || undefined) || api.username;
})

</script>
