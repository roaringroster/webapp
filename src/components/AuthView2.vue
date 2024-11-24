<template>
  <q-card
    v-if="$route.name != 'auth'"
    style="min-width: 280px; max-width: 328px; width: 100%"
  >
    <q-card-section>
      <router-view 
        @done="routeAfterLogin"
        @update:accountlist="didUpdateAccountList"
      />

      <div 
        class="q-mt-sm"
      >
        <q-btn
          v-if="$route.name == 'login' && !didExpire()"
          :label="$t('addNewDevice')"
          no-caps
          rounded
          flat
          color="primary"
          class="full-width"
          @click="$router.push({name: 'addMemberDevice'})"
        />
        <q-btn
          v-if="isOrganisationCreationEnabled && !didExpire() 
            && ($route.name == 'login' || ($route.name == 'addMemberDevice' && !hasAccounts))"
          :label="$t('addNewOrganization')"
          no-caps
          rounded
          flat
          color="primary"
          class="full-width"
          @click="$router.push({name: 'addOrganization'})"
        />
        <q-btn
          v-if="($route.name == 'addMemberDevice' && hasAccounts) || $route.name == 'addOrganization'"
          :label="$t('cancel')"
          no-caps
          rounded
          flat
          color="primary"
          class="full-width"
          @click="$router.push({name: hasAccounts ? 'login' : 'addMemberDevice' })"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useRedirectStore } from "src/stores/redirectStore";
import { useAccount } from "src/api/local2";
import { didExpire } from "src/helper/expiration";

const router = useRouter();
const redirectStore = useRedirectStore();
const { allUsernames } = useAccount();

const isOrganisationCreationEnabled = !!process.env.DEV && !didExpire();

const hasAccounts = ref(false);

function didUpdateAccountList(value: string[]) {
  hasAccounts.value = value.length > 0;
}

(async () => didUpdateAccountList(await allUsernames()))();

async function routeAfterLogin() {
  const location = await redirectStore.locationAfterLogin();
  void router.push(location);
}

</script>
