import {kingdom} from './kingdom';

// The public application link supplied by kingdom leadership.
// Set formUrl to null to use the website's Supabase-backed transfer form.
export const transferSettings: {formUrl: string | null} = {
  formUrl: null,
};

export function getExternalTransferUrl() {
  return kingdom.transfersOpen ? transferSettings.formUrl : null;
}
