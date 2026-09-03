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

/**
 * The collections a studio shoots.
 *
 * Ordered the way a photographer would list them — the occasions people book
 * first, then the commercial work. The order is the order they appear on the
 * collections page, so it is a decision rather than an accident of the
 * alphabet.
 */
export const KINDS = [
  'wedding', 'birthday', 'company', 'graduation',
  'portrait', 'editorial', 'product', 'landscape',
] as const;
export type Kind = (typeof KINDS)[number];

export const KIND_LABEL: Record<Kind, string> = {
  wedding: 'Wedding',
  birthday: 'Birthday',
  company: 'Company function',
  graduation: 'Graduation',
  portrait: 'Portrait',
  editorial: 'Editorial',
  product: 'Product',
  landscape: 'Landscape',
};

/** One line for the collections page — what the studio is selling, per kind. */
export const KIND_BLURB: Record<Kind, string> = {
  wedding: 'The whole day, from the first detail to the last dance.',
  birthday: 'Parties, cakes and the faces around the table.',
  company: 'Conferences, awards nights and the team who ran them.',
  graduation: 'The gown, the family, and the year it took.',
  portrait: 'Studio and location, for people who need one good picture.',
  editorial: 'Looks, movement and the frame that leaves room for a headline.',
  product: 'On white, in situ, and close enough to see the weave.',
  landscape: 'Light on land, at the hour it is worth getting up for.',
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
  birthday: [
    'The room before the guests — decorations still straight',
    'Arrivals and the first hellos',
    'The cake, lit, before it is cut',
    'Candles: the breath before, and the blow',
    'The singing — wide, to get the whole table in',
    'Presents being opened, hands and faces',
    'Kids table, low angle',
    'One posed group shot, early, while everyone is still tidy',
    'The mess at the end — it tells the story',
  ],
  company: [
    'Signage, lanyards and the registration desk',
    'The room filling up, from the back',
    'Every speaker, at the lectern and gesturing',
    'The audience listening — and one laughing',
    'Panel wide, then each panellist',
    'Breakout conversations and the coffee queue',
    'Sponsor stands, each one legible',
    'Awards: the handshake AND the trophy in hand',
    'Group shot of the organisers — they never get one',
  ],
  graduation: [
    'Portrait in the gown, plain background',
    'Cap detail and the tassel',
    'Crossing the stage, and the handshake',
    'The throw — burst mode, no exceptions',
    'With family, then with friends',
    'Wide of the hall and the procession',
    'Candid on the lawn afterwards',
  ],
  portrait: [
    'Wide, full length, hands relaxed',
    'Three-quarter, eyeline to camera',
    'Tight headshot, catchlight in both eyes',
    'Profile, rim light',
    'Candid between setups — usually the one they pick',
    'Two backgrounds minimum',
  ],
  editorial: [
    'Full look, head to toe, every outfit',
    'Detail: fabric, seam, accessory',
    'Movement frame per look',
    'Beauty close-up',
    'Negative-space frame for the cover crop',
  ],
  product: [
    'Hero on white, dead centre',
    'Three-quarter with soft shadow',
    'Scale reference in frame',
    'Macro on the material',
    'In situ, styled',
  ],
  landscape: [
    'Blue hour, before the light',
    'Wide establishing frame',
    'Long lens compression on the ridge',
    'Foreground interest, near-far',
    'Figure in the frame for scale',
  ],
};
