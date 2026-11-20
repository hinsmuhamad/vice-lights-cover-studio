// Sample photos wired into the app. Two starter samples ship with the kit
// and four more are made in the build session, all free to use, no real
// person without agreement, no game artwork.
export const SAMPLES = [
  { id: 'boulevard', name: 'Boulevard', file: 'boulevard.jpg', label: 'Palm boulevard at golden hour' },
  { id: 'pier', name: 'Pier', file: 'pier.jpg', label: 'Fishing on the pier' },
  { id: 'convertible', name: 'Convertible', file: 'media-generation-sample-convertible-0-bf473878-9e23-4653-a32a-008c3a8164e4.jpg', label: 'Woman with sunglasses by a convertible' },
  { id: 'rooftop', name: 'Rooftop', file: 'media-generation-sample-rooftop-0-c8119c65-8891-4792-a5e1-ab6e4853ccba.jpg', label: 'Bearded man on a rooftop at dusk' },
  { id: 'neon', name: 'Neon Street', file: 'media-generation-sample-neon-0-7e4b3718-5929-4b45-98c6-8cba2f967963.jpg', label: 'Two friends laughing on a neon street' },
  { id: 'fishing', name: 'Fishing', file: 'media-generation-sample-fishing-0-aa6b082e-5dd7-45ef-ab4e-955358c94d12.jpg', label: 'Older man with a bucket hat fishing' },
];

export function sampleById(id) {
  return SAMPLES.find((s) => s.id === id) || SAMPLES[0];
}

export function sampleUrl(id) {
  return `samples/${sampleById(id).file}`;
}

// Caption and cast presets used by Shuffle.
export const CAPTIONS = [
  'VICE LIGHTS', 'SUNSET HEIST', 'PALM FEVER', 'NEON TIDE', 'HEATWAVE', 'GOLDEN MILE',
  'CORAL HEAT', 'HIGH TIDE', 'AFTER DARK', 'COASTLINE NIGHTS',
];
export const SUBTITLES = [
  'Paid in Sunsets', 'One last summer', 'Salt and Sirens', 'Kings of the Coast',
  'After the Tide', 'Vice Coast', 'Coastline Nights', 'One last ride',
];
export const TAGLINES = [
  ['Seven lives', 'one harbor', 'no way back'],
  ['Five friends', 'one coast', 'no way back'],
  ['One summer', 'no rules', 'all heat'],
  ['Six lives', 'one sunset', 'no tomorrow'],
  ['Everyone wants', 'a cut', 'of the sunset'],
];
export const ROLES = [
  { role: 'THE DRIVER', place: 'Ocean Drive', time: '6:42 PM', note: 'Looking for trouble' },
  { role: 'THE BOSS', place: 'Rooftop Bar', time: '8:05 PM', note: 'Owns the skyline' },
  { role: 'THE RIDER', place: 'Coral Causeway', time: '7:15 PM', note: 'Never slows down' },
  { role: 'THE FIXER', place: 'Back Alley', time: '11:20 PM', note: 'Knows a guy' },
  { role: 'THE CAPTAIN', place: 'The Marina', time: '5:30 PM', note: 'Sails at sunset' },
  { role: 'THE LOOKOUT', place: 'Palm Rooftop', time: '9:40 PM', note: 'Sees everything' },
  { role: 'THE MECHANIC', place: 'Bay Garage', time: '4:10 PM', note: 'Fixes anything' },
  { role: 'THE QUEEN', place: 'Neon Strip', time: '10:05 PM', note: 'Runs the night' },
  { role: 'THE WILDCARD', place: 'Pier 13', time: '12:15 AM', note: 'Nobody knows' },
  { role: 'THE GETAWAY', place: 'Coast Road', time: '6:05 PM', note: 'Always first out' },
];
