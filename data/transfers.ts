import {kingdom} from './kingdom';

// The public application link supplied by kingdom leadership.
// Set formUrl to null to use the website's Supabase-backed transfer form.
export const transferSettings: {formUrl: string | null} = {
  formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScuFJOddEfslPCGMfBoHtIcoJ-pR6M_t9sy9jMwgF7Eg97jtQ/viewform',
};

export function getExternalTransferUrl() {
  return kingdom.transfersOpen ? transferSettings.formUrl : null;
}
