<template>
  <q-page
    padding
    class="limit-page-width width-xs"
  >
    <div class="q-mt-md q-mb-lg text-body2">
      <div class="text-h4 text-weight-medium q-mb-lg">{{ $t("acknowledgements") }} ❤️</div>
      <div>{{ $t("acknowledgementsIntro") }}</div>
    </div>
    <div class="text-body2">
      <div class="text-h5 text-weight-medium q-mb-sm">{{ $t("appIconTitle")}}</div>
      <div class="q-mb-md">
        {{ $t("iconMadeBy") }} 
        <a 
          href="https://lorcblog.blogspot.com"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >Lorc</a>
        {{ $t("underLicense") }} 
        <a
          href="https://creativecommons.org/licenses/by/3.0/"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >CC-BY-3.0</a>.
        {{ $t("changesWereMade") }}
        (<a 
          href="https://game-icons.net/1x1/lorc/lion.html"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >{{ $t("original") }}</a>).
      </div>
    </div>
    <div class="text-body2">
      <div class="text-h5 text-weight-medium q-mb-sm">{{ $t("ossComponents") }}</div>
      <div class="q-mb-md">{{ $t("acknowledgementsOpenSourceIntro", {count: ossLicenses.length}) }}</div>
    </div>
    <div class="q-mb-xl">
      <acknowledgement-dependency
        v-for="(item, index) in ossItems"
        :key="index"
        group="oss-licenses"
        :item="item"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import AcknowledgementDependency from "components/AcknowledgementDependency.vue";
import { useI18n } from "vue-i18n";

type OSSDependency = {
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  license: string;
  licenseText: string;
  name: string;
  repository?: string;
  homepage?: string;
};

const { t } = useI18n();

const ossLicenses = ref<OSSDependency[]>([]);

const ossItems = computed(() => 
  ossLicenses.value.map(item => ({
      label: item.name,
      caption: item.author.name,
      url: item.homepage,
      repository: item.repository,
      captionEmail: item.author.email,
      captionUrl: item.author.url,
      license: item.license,
      licenseCaption: t("license"),
      content: [{
        label: t("license"),
        value: item.licenseText
      }],
    }))
);


async function fetchLicenses() {
  ossLicenses.value = (await fetch("oss-licenses.json")
    .then(async response => {
      if (response.ok) {
          return response.text().then(text => JSON.parse(text));
      } else {
          return [];
      }
    }))
    .sort((a: OSSDependency, b: OSSDependency) => a.name.localeCompare(b.name));
}

onMounted(() => fetchLicenses());

</script>
