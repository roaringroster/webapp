<template>
  <div v-if="contact">
    <q-resize-observer @resize="onResize" />
    <div class="readable-line-length">
      <div v-if="!isEditing || isDisabled" >
        <div class="row justify-end">
          <q-btn 
            v-if="!isDisabled"
            icon="edit"
            round
            outline
            color="primary"
            size="10.5px"
            @click="isEditing = true"
            :title="$t('editContact')"
            :class="['shadow-1', $q.screen.gt.xs ? '' : 'q-mr-sm']"
          />
        </div>

        <div :class="['text-h4 text-center', !name ? 'text-italic text-weight-light text-grey-7' : '']">
          {{ name || $t("withoutNames") }}
        </div>
        <div 
          v-if="contact.relationship && !noRelationship" 
          class="text-body1 text-grey-7 text-center"
        >
          {{ localizeLabel(contact.relationship) }}
        </div>
        <div 
          v-if="professionalSubtitle" 
          class="text-body1 text-grey-7 text-center"
        >
          {{ professionalSubtitle }}
        </div>

        <div class="row justify-center q-my-md non-selectable">
          <div 
            v-if="contact.phoneNumbers.length"
            class="q-mx-sm column items-center"
          >
            <q-btn
              icon="fas fa-phone"
              round
              unelevated
              color="primary"
              class="q-mb-xs"
              @click="call(contact.phoneNumbers[0])"
            />
            <div class="text-caption text-primary contact-button-label ellipsis">
              {{ localizeLabel(contact.phoneNumbers[0].label) }}
            </div>
          </div>
          <div 
            v-if="contact.emailAddresses.length"
            class="q-mx-sm column items-center"
          >
            <q-btn
              icon="fas fa-envelope"
              round
              unelevated
              color="primary"
              class="q-mb-xs"
              @click="email(contact.emailAddresses[0])"
            />
            <div class="text-caption text-primary contact-button-label ellipsis">
              {{ localizeLabel(contact.emailAddresses[0].label) }}
            </div>
          </div>
        </div>

        <q-list class="text-size-adjust-md q-mb-md">
          <no-data-item
            v-if="!contactDetails.length"
            :text-label="$t('noContactDetails')"
            button-classes="text-weight-regular"
            :hide-button="isDisabled"
            @click="isEditing = true"
          />
          <labeled-item
            v-for="(item, index) in contactDetails"
            :key="'contactItem' + index"
            :item="item"
            :compactLayout="compactLayout"
            class="text-primary"
          />
        </q-list>
      </div>

      <div v-else>
        <div v-if="!editOnly" class="q-mb-sm row justify-end">
          <q-btn 
            :label="$t('done')"
            rounded
            no-caps
            dense
            color="primary"
            @click="isEditing = false"
            class="q-px-sm"
          />
        </div>

        <div class="column text-size-adjust-md">
          <div class="mb-row-dense">
            <q-toggle 
              v-if="!noOrganization"
              :model-value="contact.isOrganization" 
              @update:model-value="saveContact({isOrganization: $event})"
              :label="$t('contactIsAnOrganization') + ':'"
              left-label
            />
            <!-- <reveal-button
              v-if="!noDegree && !contact.isOrganization"
              :label="$t('addAcademicTitleButton')"
              :reveal-immediately="contact.degree.length > 0"
              button-class="q-py-sm"
            >
              <q-input
                :model-value="contact.degree"
                @update:model-value="updateContact({degree: $event?.toString()})"
                @change="save"
                :label="$t('degree')"
              />
            </reveal-button> -->
            <q-input
              v-if="!contact.isOrganization"
              :model-value="contact.firstName"
              @update:model-value="saveContact({firstName: $event?.toString()})"
              :debounce="debounce"
              :label="$t('firstName')"
            />
            <q-input
              v-if="!contact.isOrganization"
              :model-value="contact.lastName"
              @update:model-value="saveContact({lastName: $event?.toString()})"
              :debounce="debounce"
              :label="$t('lastName')"
            />
            <!-- <selectable-input
              v-if="!noRelationship && !contact.isOrganization"
              :model-value="contact.relationship"
              :label="$t('relationship')"
              :options="relationshipLabels"
              clearable
              @update:model-value="saveContact({relationship: $event})"
            /> -->
            <date-time-input
              v-if="!noBirthday && !contact.isOrganization"
              :model-value="contact.birthday"
              @update:model-value="saveContact({birthday: $event || null})"
              :label="$t('birthday') + ' (' + $t('dateFormatPlaceholder') + ')'"
              :format="$t('dateFormat')"
            />
            <selectable-input
              v-if="!noProfession && !contact.isOrganization"
              :model-value="contact.profession"
              :label="$t('profession')"
              :options="professionLabels"
              clearable
              @update:model-value="saveContact({profession: $event})"
            />
            <q-input
              v-if="!noOrganization"
              :model-value="contact.organization"
              @update:model-value="saveContact({organization: $event?.toString()})"
              :debounce="debounce"
              :label="$t('organizationName')"
            />
            <selectable-input
              v-if="!noProfession && contact.isOrganization"
              :model-value="contact.profession"
              :label="$t('profession')"
              :options="professionLabels"
              clearable
              @update:model-value="saveContact({profession: $event})"
            />
          </div>

          <labeled-value-editor
            :items="contact.phoneNumbers"
            :labels="phoneLabels"
            :add-button-label="$t('addPhoneNumber')"
            @add="addPhoneNumber"
            @remove="removePhoneNumber($event)"
            @input:label="saveContact(contact => 
              contact.phoneNumbers[$event.index].label = $event.value
            )"
            class="mb-row-dense"
            v-slot="{ item, index }"
          >
            <q-input
              :model-value="item.value"
              @update:model-value="saveContact(contact => 
                contact.phoneNumbers[index].value = $event?.toString() || ''
              )"
              :debounce="debounce"
              :placeholder="$t('phone')"
              dense
              type="tel"
              inputmode="tel"
            />
          </labeled-value-editor>
          <labeled-value-editor
            :items="contact.emailAddresses"
            :labels="emailLabels"
            :add-button-label="$t('addEmailAddress')"
            @add="addEmailAddress"
            @remove="removeEmailAddress($event)"
            @input:label="saveContact(contact => 
              contact.emailAddresses[$event.index].label = $event.value
            )"
            class="mb-row-dense"
            v-slot="{ item, index }"
          >
            <q-input
              :model-value="item.value"
              @update:model-value="saveContact(contact => 
                contact.emailAddresses[index].value = $event?.toString() || ''
              )"
              :debounce="debounce"
              :placeholder="$t('email')"
              dense
              type="email"
              inputmode="email"
            />
          </labeled-value-editor>
          <labeled-value-editor
            v-if="!noUrl"
            :items="contact.urls"
            :labels="urlLabels"
            :add-button-label="$t('addUrl')"
            @add="addUrl"
            @remove="removeUrl($event)"
            @input:label="saveContact(contact => 
              contact.urls[$event.index].label = $event.value
            )"
            class="mb-row-dense"
            v-slot="{ item, index }"
          >
            <q-input
              :model-value="item.value"
              @update:model-value="saveContact(contact => 
                contact.urls[index].value = $event?.toString() || ''
              )"
              :debounce="debounce"
              :placeholder="$t('url')"
              dense
              type="url"
              inputmode="url"
            />
          </labeled-value-editor>
          <labeled-value-editor
            :items="contact.postalAddresses"
            :labels="postalLabels"
            :add-button-label="$t('addPostalAddress')"
            @add="addPostalAddress"
            @remove="removePostalAddress($event)"
            @input:label="saveContact(contact => 
              contact.postalAddresses[$event.index].label = $event.value
            )"
            class="mb-row-dense"
            v-slot="{ item, index }"
          >
            <div class="column">
              <q-input
                :model-value="item.value.street1"
                @update:model-value="saveContact(contact => 
                  contact.postalAddresses[index].value.street1 = $event?.toString() || ''
                )"
                :debounce="debounce"
                :placeholder="$t('street')"
                dense
                autogrow
              />
              <div class="row">
                <q-input
                  :model-value="item.value.postalCode"
                  @update:model-value="saveContact(contact => 
                    contact.postalAddresses[index].value.postalCode = $event?.toString() || ''
                  )"
                  :debounce="debounce"
                  :placeholder="$t('postalCode')"
                  dense
                  class="col"
                />
                <q-input
                  :model-value="item.value.city"
                  @update:model-value="saveContact(contact => 
                    contact.postalAddresses[index].value.city = $event?.toString() || ''
                  )"
                  :debounce="debounce"
                  :placeholder="$t('city')"
                  dense
                  class="col"
                />
              </div>
              <q-input
                :model-value="item.value.country"
                @update:model-value="saveContact(contact => 
                  contact.postalAddresses[index].value.country = $event?.toString() || ''
                )"
                :debounce="debounce"
                :placeholder="$t('country')"
                dense
              />
            </div>
          </labeled-value-editor>

          <q-input
            :model-value="contact.notes"
            @update:model-value="saveContact({notes: $event?.toString()})"
            :debounce="debounce"
            autogrow
            :label="$t('contactNotes')"
            class="mb-row-dense"
          />

          <div 
            v-if="!noDelete"
            class="row justify-center q-mb-xl"
          >
            <q-btn
              :label="$t('deleteContact')"
              rounded
              outline
              no-caps
              color="negative"
              dense
              class="q-px-sm shadow-1 bg-white"
              @click="deleteContact"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="sass">
.contact-button-label
  text-align: center
  max-width: 8em
</style>

<script lang="ts">
import { Component, Model, Prop, Watch, Vue } from "vue-facing-decorator";
import { LabeledValue } from "src/models/generic";
import { Contact, ContactKeys, PostalAddress, emailLabels, getName, makeEmailAddress, makePhoneNumber, makePostalAddress, makeUrl, phoneLabels, postalAddressAsSearchString, postalLabels, predefinedLabels, urlLabels } from "src/models/contact";
import NoDataItem from "src/components/NoDataItem.vue";
import LabeledItem, { LabeledItemType } from "src/components/LabeledItem.vue";
import SelectableInput from "src/components/SelectableInput.vue";
import LabeledValueEditor from "src/components/LabeledValueEditor.vue";
import DateTimeInput from "src/components/DateTimeInput.vue";
import { didExpire } from "src/helper/expiration";
// import { useAPI } from "src/api";
import { useChangeHistory, useDocument } from "src/api/repo";

// const api = useAPI();

function getLabels(
  defaultLabels: string[],
  contacts: Contact[], 
  key: "phoneNumbers" | "emailAddresses" | "postalAddresses" | "urls"
) {
  return [... new Set(
    defaultLabels.concat(
      contacts
        .flatMap(contact => contact[key] as LabeledValue<any>[])
        .flatMap(item => item.label ? [item.label] : [])
    )
  )]
}

@Component({
  components: {
    NoDataItem,
    LabeledItem,
    SelectableInput,
    LabeledValueEditor,
    DateTimeInput
  },
  emits: ["delete", "save"]
})
class ContactView extends Vue {
  @Model({ type: String }) docUrl!: string;
  @Prop({ type: Array, default: () => [] }) readonly includeFields!: ContactKeys[];
  @Prop({ type: Array, default: () => [] }) readonly optionalFields!: ContactKeys[];
  @Prop({ type: Array, default: () => [] }) readonly excludeFields!: ContactKeys[];
  @Prop({ type: Boolean }) readonly noDegree!: boolean;
  @Prop({ type: Boolean }) readonly noBirthday!: boolean;
  @Prop({ type: Boolean }) readonly noProfession!: boolean;
  @Prop({ type: Boolean }) readonly noRelationship!: boolean;
  @Prop({ type: Boolean }) readonly noOrganization!: boolean;
  @Prop({ type: Boolean }) readonly noDelete!: boolean;
  @Prop({ type: Boolean }) readonly noUrl!: boolean;
  @Prop({ type: Boolean }) readonly editOnly!: boolean;
  @Prop({ type: String }) readonly preferredLabel?: string;
  @Prop({ type: Array, default: () => [] }) readonly professionLabels!: string[];

  isEditing = this.editOnly;
  addedOptionalFields: ContactKeys[] = [];
  width = Infinity;
  // docHandle: DocHandle<Contact> | null = null;
  // docHandle = useDocument<Contact>(this.docUrl);

  @Watch("docUrl")
  onDocUrlChanged() {
    if (this.editOnly) {
      return;
    }

    if (this.$route.query.edit == "1" && !this.isDisabled) {
      void this.$router.replace({
        name: this.$route.name || undefined,
        params: this.$route.params
      });
      this.isEditing = true;
    } else {
      this.isEditing = false;
    }
  }

  get docHandle() {
    return useDocument<Contact>(this.docUrl);
  }
  get contact() {
    // console.log(this.docHandle.doc.value)
    return this.docHandle.doc.value!;
  }
  get isDisabled() {
    return didExpire()
  }
  get name() {
    return getName(this.contact);
  }
  get professionalSubtitle() {
    const texts: string[] = []

    if (!this.noProfession && this.contact.profession) {
      texts.push(this.localizeLabel(this.contact.profession));
    }
    if (!this.noOrganization && !this.contact.isOrganization && this.contact.organization) {
      texts.push(this.contact.organization);
    }

    return texts.join(", ");
  }
  get contactDetails() {
    const result: LabeledItemType[] = [];

    return result.concat(this.contact.phoneNumbers.map((item, index, list) => {
      return {
        label: this.localizeLabel(item.label),
        value: item.value,
        icon: "fas fa-phone",
        classes: this.contactGroupClassIfNeeded(index, list),
        action: () => this.call(item)
      }
    })).concat(this.contact.emailAddresses.map((item, index, list) => {
      return {
        label: this.localizeLabel(item.label),
        value: item.value,
        icon: "fas fa-envelope",
        classes: this.contactGroupClassIfNeeded(index, list),
        action: () => this.email(item)
      }
    })).concat(this.contact.urls.map((item, index, list) => {
      return {
        label: this.localizeLabel(item.label),
        value: item.value,
        icon: "fas fa-up-right-from-square",
        classes: this.contactGroupClassIfNeeded(index, list),
        action: () => this.openHttpsUrl(item)
      }
    })).concat(this.contact.postalAddresses.map((item, index, list) => {
      return {
        label: this.localizeLabel(item.label),
        value: this.localizeAddress(item.value),
        icon: "fas fa-map-marker",
        classes: this.contactGroupClassIfNeeded(index, list),
        action: () => this.showMap(item)
      }
    })).concat(this.contact.birthday ? [
      {
        label: this.$t("birthday") as string,
        value: this.$d(this.contact.birthday, "DateFull")
      }
    ] : []).concat(this.contact.notes ? [
      {
        label: this.$t("contactNotes") as string,
        value: this.contact.notes
      }
    ] : []);
  }
  get compactLayout() {
    return this.width <= 400
  }
  get windowTarget() {
    return this.$q.platform.is.electron || this.$q.platform.is.cordova
      ? "_blank"
      : "_self";
  }
  get emailLabels() {
    return getLabels(emailLabels, [this.contact], "emailAddresses").map(this.makeOption);
  }
  get phoneLabels() {
    return getLabels(phoneLabels, [this.contact], "phoneNumbers").map(this.makeOption);
  }
  get postalLabels() {
    return getLabels(postalLabels, [this.contact], "postalAddresses").map(this.makeOption);
  }
  get urlLabels() {
    return getLabels(urlLabels, [this.contact], "urls").map(this.makeOption);
  }
  get debounce() {
    return 2000;
  }

  onResize() {
    this.width = (this.$el as HTMLElement).offsetWidth;
  }

  call(phoneNumber: LabeledValue<string>) {
    this.openWindow("tel:" + phoneNumber.value);
  }
  email(email: LabeledValue<string>) {
    this.openWindow("mailto:" + email.value);
  }
  openHttpsUrl(url: LabeledValue<string>) {
    const secureUrl = /^https?:\/\//.test(url.value)
      ? url.value
      : "https://" + url.value
    this.openWindow(secureUrl, "_blank");
  }
  showMap(address: LabeledValue<PostalAddress>) {
    const encodedAddress = postalAddressAsSearchString(address.value);

    if (this.$q.platform.is.mac || this.$q.platform.is.ios) {
      this.openWindow("https://maps.apple.com/?address=" + encodedAddress);
    } else {
      this.openWindow("geo:0,0?q=" + encodedAddress);
    }
  }
  openWindow(url: string, target = this.windowTarget) {
    const win = window.open(url, target);

    if (win) {
      win.opener = null;
    }
  }

  addPhoneNumber() {
    const newValue = makePhoneNumber(this.contact, this.preferredLabel);
    this.saveContact(contact => contact.phoneNumbers.push(newValue));
  }
  removePhoneNumber(index: number) {
    this.saveContact(contact => contact.phoneNumbers.splice(index, 1));
  }
  addEmailAddress() {
    const newValue = makeEmailAddress(this.contact, this.preferredLabel);
    this.saveContact(contact => contact.emailAddresses.push(newValue));
  }
  removeEmailAddress(index: number) {
    this.saveContact(contact => contact.emailAddresses.splice(index, 1));
  }
  addPostalAddress() {
    const newValue = makePostalAddress(this.contact, "", this.preferredLabel);
    this.saveContact(contact => contact.postalAddresses.push(newValue));
  }
  removePostalAddress(index: number) {
    this.saveContact(contact => contact.postalAddresses.splice(index, 1));
  }
  addUrl() {
    const newValue = makeUrl(this.contact);
    this.saveContact(contact => contact.urls.push(newValue));
  }
  removeUrl(index: number) {
    this.saveContact(contact => contact.urls.splice(index, 1));
  }

  localizeLabel(label: string) {
    return predefinedLabels.includes(label) ? 
      this.$t(label) as string : 
      label;
  }
  localizeAddress(address: PostalAddress) {
    return (this.$t("postalAddressFormat", address) as string)
      .replace(/(\\n)+/g, "\n");
  }
  contactGroupClassIfNeeded(index: number, list: any[]) {
    return index == list.length - 1 ? "border-bottom-grey" : "";
  }
  makeOption(label: string) {
    return {
      label: this.localizeLabel(label),
      value: label
    }
  }

  // async updateContact(changes: ChangeFn<Contact> | Partial<Contact>) {
  //   console.log(1, this.contact);
  //   this.contact = await api.updateDocument(this.contact, changes);
  //   console.log(2, this.contact);
  // }
  saveContact(changes: ((doc: Contact) => void) | Partial<Contact>) {
    const changeFn = typeof changes == "function"
      ? changes
      : (doc: Contact) => Object.assign(doc, changes)

    this.docHandle.changeDoc(changeFn);
    // await this.updateContact(changes);
    // this.save();
  }
  deleteContact() {
    this.$q.dialog({
      title: this.$t("confirmDeletionTitle") as string,
      message: this.$t("confirmContactDeletionMessage", {
        name: this.name || this.$t("withoutNames")
      }) as string,
      persistent: true,
      ok: {
        label: this.$t("delete"),
        rounded: true,
        flat: true,
        noCaps: true,
        color: "negative"
      },
      cancel: {
        rounded: true,
        flat: true,
        noCaps: true
      }
    }).onOk(() => {
      this.$emit("delete", this.contact.id);
    });
  }
  change(changes: Partial<Contact>) {
    this.docHandle.changeDoc(doc => Object.assign(doc, changes));
  }

  mounted() {
    this.onDocUrlChanged();
    useChangeHistory(() => this.contact, "contact");
  }

  unmounted() {
    this.docHandle.cleanup();
  }
}

export default ContactView;
</script>
