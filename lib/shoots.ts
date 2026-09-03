/**
 * The vocabulary of a booking, in one place.
 *
 * The status walk is the domain: an enquiry becomes a booking, the booking
 * becomes a shoot day, the shoot becomes an edit, and the edit becomes a
 * delivery. "Advance" means the next of these, and the order is why.
 */
export const STATUSES = ['enquiry', 'booked', 'shot', 'editing', 'delivered'] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<Status, string> = {
  enquiry: 'Enquiry',
  booked: 'Booked',
  shot: 'Shot',
  editing: 'Editing',
  delivered: 'Delivered',
};

export function isStatus(raw: string): raw is Status {
  return (STATUSES as readonly string[]).includes(raw);
}

export function nextStatus(s: Status): Status | null {
  const i = STATUSES.indexOf(s);
  return i >= 0 && i < STATUSES.length - 1 ? STATUSES[i + 1] : null;
}

export const KINDS = ['portrait', 'wedding', 'editorial', 'landscape', 'product'] as const;
export type Kind = (typeof KINDS)[number];
export const KIND_LABEL: Record<Kind, string> = {
  portrait: 'Portrait', wedding: 'Wedding', editorial: 'Editorial',
  landscape: 'Landscape', product: 'Product',
};
export function isKind(raw: string): raw is Kind {
  return (KINDS as readonly string[]).includes(raw);
}

/**
 * The shot list a photographer would otherwise write out again every time.
 *
 * Per kind, because the list for a wedding has nothing in common with the
 * list for a packshot. Seeded on booking so the shoot day starts with a plan.
 */
export const SHOT_LISTS: Record<Kind, string[]> = {
  portrait: [
    'Wide, full length, hands relaxed',
    'Three-quarter, eyeline to camera',
    'Tight headshot, catchlight in both eyes',
    'Profile, rim light',
    'Candid between setups — usually the one they pick',
    'Two backgrounds minimum',
  ],
  wedding: [
    'Details: rings, invitation, shoes, flowers',
    'Getting ready, both parties',
    'The walk in',
    'The vows — long lens, stay back',
    'The kiss, and the turn to the aisle',
    'Group: immediate family, then extended',
    'Couple portraits, golden hour',
    'First dance, and the cake',
    'The room before anyone sits down',
  ],
  editorial: [
    'Full look, head to toe, every outfit',
    'Detail: fabric, seam, accessory',
    'Movement frame per look',
    'Beauty close-up',
    'Negative-space frame for the cover crop',
  ],
  landscape: [
    'Blue hour, before the light',
    'Wide establishing frame',
    'Long lens compression on the ridge',
    'Foreground interest, near-far',
    'Figure in the frame for scale',
  ],
  product: [
    'Hero on white, dead centre',
    'Three-quarter with soft shadow',
    'Scale reference in frame',
    'Macro on the material',
    'In situ, styled',
  ],
};
