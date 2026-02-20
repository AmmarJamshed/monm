/* Contact Picker API - https://wicg.github.io/contact-picker/ */
interface ContactInfo {
  name?: string[];
  email?: string[];
  tel?: string[];
  address?: ContactAddress[];
  icon?: Blob[];
}

interface ContactAddress {
  city?: string;
  country?: string;
  dependentLocality?: string;
  organization?: string;
  phone?: string;
  postalCode?: string;
  recipient?: string;
  region?: string;
  sortingCode?: string;
  addressLine?: string[];
}

interface ContactsManager {
  select(properties: ('name' | 'email' | 'tel' | 'address' | 'icon')[], options?: { multiple?: boolean }): Promise<ContactInfo[]>;
}

declare global {
  interface Navigator {
    contacts?: ContactsManager;
  }
}

export {};
