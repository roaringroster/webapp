<template>
  <div 
    :class="'signature text-' + (sign ? color : 'grey-4') + ' ' + 
      (hasTooltip && tooltip ? 'cursor-help' : '')"
  >
    {{ sign || " " }}
    <q-tooltip
      v-if="hasTooltip && tooltip"
      anchor="top middle"
      self="bottom middle"
      transition-show="jump-up"
      transition-hide="jump-down"
      :offset="$q.platform.is.mobile ? [0,14] : [0,4]"
      class="signature-tooltip"
    >
      {{ tooltip }}
    </q-tooltip>
  </div>
</template>

<style lang="sass">
.signature
  border-radius: 50%
  padding: 0 .2em 0 0
  text-align: center
  line-height: 2.3em
  width: 2.4em
  height: 2.4em
  font-weight: 500
  font-style: italic
  border: 1px solid
.signature-tooltip
  font-size: .8rem
  padding: 2px 6px
.cursor-help
  cursor: help
</style>

<script lang="ts">
import { Vue, Component, Prop } from "vue-facing-decorator";
import { useAccountStore } from "src/stores/accountStore";
import { Contact, getName } from "src/models/contact";
import { getSignature } from "src/models/organization";
import { useDocument } from "src/api/repo";

const accountStore = useAccountStore();

@Component
export default class SignatureView extends Vue {
  @Prop({ type: Object }) readonly contact?: Contact;
  @Prop({ type: String, default: "" }) readonly signature!: string;
  @Prop({ type: String, default: "" }) readonly userName!: string;
  @Prop({ type: String, default: "" }) readonly userId!: string;
  @Prop({ type: String, default: "" }) readonly fallback!: string;
  @Prop({ type: String, default: "black"}) readonly color!: string;
  @Prop({ type: String, default: ""}) readonly description!: string;
  @Prop({ type: Date}) readonly date?: Date;
  @Prop({ type: Boolean}) readonly hasTooltip!: boolean;

  get sign() {
    if (this.signature) {
      return this.signature;
    } else if (this.contact && this.contact.firstName && this.contact.lastName) {
      return this.contact.firstName.substring(0, 1) + this.contact.lastName.substring(0, 1);
    } else if (this.userName){
      return this.userName.substring(0, 2);
    } else if (this.userId){
      return getSignature(accountStore.organization, this.userId);
    } else {
      return this.fallback || "";
    }
  }
  get contactId() {
    return accountStore.organization?.members[this.userId]?.contactId;
  }
  get contactHandle() {
    return this.contactId ? useDocument<Contact>(this.contactId) : null;
  }
  get tooltip() {
    return [
      getName(this.contact || null, this.userName) 
        || getName(
            this.contactHandle?.doc.value || null, 
            this.userId ? accountStore.authTeam?.members(this.userId).userName : ""
          )
        || this.$t("unknownUser"),
      this.date ? this.$d(this.date, "DateTimeShort") : undefined, 
      this.description
    ].filter(Boolean).join(", ");
  }

  unmounted() {
    this.contactHandle?.cleanup();
  }
}
</script>
