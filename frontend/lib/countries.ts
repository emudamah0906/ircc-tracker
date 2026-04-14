// Full country names by ISO 2-letter code (fallback when DB returns just the code)
export const COUNTRY_NAMES: Record<string, string> = {
  AF: "Afghanistan", AL: "Albania", DZ: "Algeria", AR: "Argentina",
  AU: "Australia", AT: "Austria", AZ: "Azerbaijan", BD: "Bangladesh",
  BE: "Belgium", BR: "Brazil", BG: "Bulgaria", KH: "Cambodia",
  CM: "Cameroon", CA: "Canada", CL: "Chile", CN: "China",
  CO: "Colombia", CD: "Congo (DRC)", HR: "Croatia", CY: "Cyprus",
  CZ: "Czech Republic", DK: "Denmark", EG: "Egypt", ET: "Ethiopia",
  FI: "Finland", FR: "France", GE: "Georgia", DE: "Germany",
  GH: "Ghana", GR: "Greece", HU: "Hungary", IN: "India",
  ID: "Indonesia", IR: "Iran", IQ: "Iraq", IE: "Ireland",
  IL: "Israel", IT: "Italy", JM: "Jamaica", JP: "Japan",
  JO: "Jordan", KZ: "Kazakhstan", KE: "Kenya", KR: "South Korea",
  KW: "Kuwait", LB: "Lebanon", LY: "Libya", MY: "Malaysia",
  MX: "Mexico", MA: "Morocco", NP: "Nepal", NL: "Netherlands",
  NZ: "New Zealand", NG: "Nigeria", MK: "North Macedonia", NO: "Norway",
  PK: "Pakistan", PE: "Peru", PH: "Philippines", PL: "Poland",
  PT: "Portugal", QA: "Qatar", RO: "Romania", RU: "Russia",
  SA: "Saudi Arabia", SN: "Senegal", RS: "Serbia", SL: "Sierra Leone",
  ZA: "South Africa", ES: "Spain", LK: "Sri Lanka", SD: "Sudan",
  SE: "Sweden", CH: "Switzerland", SY: "Syria", TW: "Taiwan",
  TZ: "Tanzania", TH: "Thailand", TT: "Trinidad and Tobago",
  TN: "Tunisia", TR: "Turkey", UG: "Uganda", UA: "Ukraine",
  AE: "United Arab Emirates", GB: "United Kingdom", US: "United States",
  UZ: "Uzbekistan", VE: "Venezuela", VN: "Vietnam", YE: "Yemen",
  ZM: "Zambia", ZW: "Zimbabwe",
};

// Convert ISO country code to flag emoji
export function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "🌐";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Phone dial codes for common countries
export const DIAL_CODES = [
  { code: "CA", name: "Canada", dial: "+1" },
  { code: "IN", name: "India", dial: "+91" },
  { code: "PK", name: "Pakistan", dial: "+92" },
  { code: "PH", name: "Philippines", dial: "+63" },
  { code: "CN", name: "China", dial: "+86" },
  { code: "US", name: "United States", dial: "+1" },
  { code: "GB", name: "United Kingdom", dial: "+44" },
  { code: "AU", name: "Australia", dial: "+61" },
  { code: "NG", name: "Nigeria", dial: "+234" },
  { code: "KR", name: "South Korea", dial: "+82" },
  { code: "MX", name: "Mexico", dial: "+52" },
  { code: "BR", name: "Brazil", dial: "+55" },
  { code: "FR", name: "France", dial: "+33" },
  { code: "DE", name: "Germany", dial: "+49" },
  { code: "IT", name: "Italy", dial: "+39" },
  { code: "JP", name: "Japan", dial: "+81" },
  { code: "BD", name: "Bangladesh", dial: "+880" },
  { code: "LK", name: "Sri Lanka", dial: "+94" },
  { code: "NP", name: "Nepal", dial: "+977" },
  { code: "AF", name: "Afghanistan", dial: "+93" },
  { code: "EG", name: "Egypt", dial: "+20" },
  { code: "GH", name: "Ghana", dial: "+233" },
  { code: "KE", name: "Kenya", dial: "+254" },
  { code: "ZA", name: "South Africa", dial: "+27" },
  { code: "UA", name: "Ukraine", dial: "+380" },
  { code: "RO", name: "Romania", dial: "+40" },
  { code: "ES", name: "Spain", dial: "+34" },
  { code: "PT", name: "Portugal", dial: "+351" },
  { code: "VN", name: "Vietnam", dial: "+84" },
  { code: "TH", name: "Thailand", dial: "+66" },
];
