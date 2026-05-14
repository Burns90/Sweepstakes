// ISO 3166-1 alpha-2 country codes for flag images
export const COUNTRY_CODES: Record<string, string> = {
  // World Cup Teams
  Algeria: 'dz',
  Argentina: 'ar',
  Australia: 'au',
  Belgium: 'be',
  Brazil: 'br',
  Cameroon: 'cm',
  Canada: 'ca',
  Chile: 'cl',
  Colombia: 'co',
  'Costa Rica': 'cr',
  Croatia: 'hr',
  'Czech Republic': 'cz',
  Denmark: 'dk',
  Ecuador: 'ec',
  Egypt: 'eg',
  England: 'gb-eng',
  France: 'fr',
  Germany: 'de',
  Ghana: 'gh',
  Greece: 'gr',
  Iran: 'ir',
  Italy: 'it',
  'Ivory Coast': 'ci',
  Japan: 'jp',
  Mexico: 'mx',
  Morocco: 'ma',
  Netherlands: 'nl',
  'New Zealand': 'nz',
  Nigeria: 'ng',
  Norway: 'no',
  Peru: 'pe',
  Poland: 'pl',
  Portugal: 'pt',
  Qatar: 'qa',
  'Saudi Arabia': 'sa',
  Senegal: 'sn',
  Serbia: 'rs',
  'South Africa': 'za',
  'South Korea': 'kr',
  Spain: 'es',
  Sweden: 'se',
  Switzerland: 'ch',
  Tunisia: 'tn',
  Turkey: 'tr',
  Ukraine: 'ua',
  'United Arab Emirates': 'ae',
  Uruguay: 'uy',
  USA: 'us',
  
  // Eurovision Countries
  Finland: 'fi',
  Iceland: 'is',
  Austria: 'at',
  Slovakia: 'sk',
  Hungary: 'hu',
  Romania: 'ro',
  Bulgaria: 'bg',
  Slovenia: 'si',
  Cyprus: 'cy',
  Malta: 'mt',
  Ireland: 'ie',
  'United Kingdom': 'gb',
  Lithuania: 'lt',
  Latvia: 'lv',
  Estonia: 'ee',
  Israel: 'il',
  Albania: 'al',
  Armenia: 'am',
  Azerbaijan: 'az',
  Georgia: 'ge',
  'North Macedonia': 'mk',
  Montenegro: 'me',
  Moldova: 'md',
  'San Marino': 'sm',
};

// Generate flag image URL from country code
export const getFlagImageUrl = (countryCode: string): string => {
  // Using circle-flags CDN for circular flag SVGs
  return `https://hatscripts.github.io/circle-flags/flags/${countryCode.toLowerCase()}.svg`;
};

// Get flag URL directly from country name
export const getFlagUrlByCountry = (countryName: string): string => {
  const code = COUNTRY_CODES[countryName];
  if (!code) {
    return ''; // Return empty if country not found
  }
  return getFlagImageUrl(code);
};
