
import { ref, toRef, watch, MaybeRefOrGetter, isRef } from "vue";
import { toDataURL, QRCodeToDataURLOptions } from "qrcode";

export function useQRCode(
  text: MaybeRefOrGetter<string>,
  options?: QRCodeToDataURLOptions,
) {
  const src = isRef(text) ? text : toRef(text);
  const result = ref("")

  watch(
    src,
    async (value) => {
      if (src.value)
        result.value = await toDataURL(value, options)
    },
    { immediate: true },
  )

  return result
}
