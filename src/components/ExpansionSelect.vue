<template>
  <q-expansion-item
    v-if="items.length > 1"
    v-model="isOpen"
    :label="label + (isOpen ? ':' : '')"
    switch-toggle-side
    :header-class="isOpen ? 'text-weight-medium' : ''"
  >
    <q-item
      v-for="(item, index) in items"
      :key="index"
      clickable
      @click="$emit('update:model-value', item.value); isOpen = false"
    >
      <q-item-section side>
        <q-icon 
          :name="item.value == modelValue ? 'fas fa-check' : ''" 
          size="xs"
          class="q-px-xs"
        />
      </q-item-section>
      <q-item-section>
        <q-item-label>{{ item.label }}</q-item-label>
      </q-item-section>
    </q-item>
  </q-expansion-item>
</template>

<script setup lang="ts">
import { PropType, ref } from "vue";

export type ExpansionSelectOption = {
  label: string;
  value: string | number;
}

defineProps({
  modelValue: {
    type: [String, Number],
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  items: {
    type: Array as PropType<ExpansionSelectOption[]>,
    default: () => ([]),
  }
});

const isOpen = ref(false);

</script>