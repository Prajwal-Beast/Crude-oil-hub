export interface OilHub {
  id: string;
  name: string;
  type: "production" | "chokepoint" | "opec" | "refinery";
  lat: number;
  lng: number;
  description: string;
  country: string;
  dailyOutput?: string; // barrels/day or transit volume
}

export const OIL_HUBS: OilHub[] = [
  // Major Production Basins
  { id: "permian", name: "Permian Basin", type: "production", lat: 31.9, lng: -102.5, country: "USA", description: "Largest oil-producing region in the USA. ~6M bpd output.", dailyOutput: "6M bpd" },
  { id: "gulf-mexico", name: "Gulf of Mexico", type: "production", lat: 25.5, lng: -90.0, country: "USA", description: "Major offshore US production hub.", dailyOutput: "1.8M bpd" },
  { id: "north-sea", name: "North Sea", type: "production", lat: 57.5, lng: 2.0, country: "UK/Norway", description: "Key European production zone. Brent crude benchmark origin.", dailyOutput: "1.5M bpd" },
  { id: "ghawar", name: "Ghawar Field", type: "production", lat: 24.9, lng: 49.1, country: "Saudi Arabia", description: "World's largest conventional oil field.", dailyOutput: "3.8M bpd" },
  { id: "rumaila", name: "Rumaila Field", type: "production", lat: 30.3, lng: 47.5, country: "Iraq", description: "Largest oil field in Iraq.", dailyOutput: "1.4M bpd" },
  { id: "west-siberia", name: "West Siberia", type: "production", lat: 62.0, lng: 75.0, country: "Russia", description: "Russia's main production heartland.", dailyOutput: "7M bpd" },
  { id: "athabasca", name: "Athabasca Oil Sands", type: "production", lat: 57.2, lng: -111.6, country: "Canada", description: "World's largest oil sand deposits.", dailyOutput: "3.3M bpd" },

  // Critical Chokepoints
  { id: "hormuz", name: "Strait of Hormuz", type: "chokepoint", lat: 26.6, lng: 56.3, country: "Iran/Oman", description: "World's most critical oil chokepoint. ~20M bpd transit.", dailyOutput: "20M bpd transit" },
  { id: "malacca", name: "Strait of Malacca", type: "chokepoint", lat: 2.5, lng: 101.5, country: "Malaysia/Singapore", description: "Asia's key energy artery. ~16M bpd transit.", dailyOutput: "16M bpd transit" },
  { id: "suez", name: "Suez Canal", type: "chokepoint", lat: 30.7, lng: 32.3, country: "Egypt", description: "Critical Europe-Asia shortcut. ~5M bpd transit.", dailyOutput: "5M bpd transit" },
  { id: "bab-el-mandeb", name: "Bab-el-Mandeb", type: "chokepoint", lat: 12.6, lng: 43.3, country: "Yemen/Djibouti", description: "Red Sea gateway. ~6M bpd transit.", dailyOutput: "6M bpd transit" },
  { id: "bosphorus", name: "Turkish Straits", type: "chokepoint", lat: 41.1, lng: 29.1, country: "Turkey", description: "Black Sea oil route to Mediterranean.", dailyOutput: "2.9M bpd transit" },

  // OPEC+ Key Members
  { id: "riyadh", name: "Saudi Aramco HQ", type: "opec", lat: 24.7, lng: 46.7, country: "Saudi Arabia", description: "World's largest oil company. OPEC+ dominant power.", dailyOutput: "12M bpd" },
  { id: "abu-dhabi", name: "ADNOC (Abu Dhabi)", type: "opec", lat: 24.5, lng: 54.4, country: "UAE", description: "ADNOC — UAE's national oil company.", dailyOutput: "4M bpd" },
  { id: "kuwait-city", name: "Kuwait Oil Co.", type: "opec", lat: 29.4, lng: 47.9, country: "Kuwait", description: "Kuwait Petroleum Corporation hub.", dailyOutput: "2.7M bpd" },
  { id: "caracas", name: "PDVSA (Venezuela)", type: "opec", lat: 10.5, lng: -66.9, country: "Venezuela", description: "OPEC member under heavy sanctions.", dailyOutput: "0.7M bpd" },
  { id: "lagos", name: "NNPC (Nigeria)", type: "opec", lat: 6.5, lng: 3.4, country: "Nigeria", description: "Africa's largest oil producer.", dailyOutput: "1.4M bpd" },

  // Key Refineries
  { id: "houston", name: "Houston Refinery Hub", type: "refinery", lat: 29.8, lng: -95.1, country: "USA", description: "US Gulf Coast — world's largest refining hub.", dailyOutput: "5M bpd capacity" },
  { id: "singapore-ref", name: "Singapore Refining Hub", type: "refinery", lat: 1.35, lng: 103.85, country: "Singapore", description: "Asia-Pacific's top refining and trading centre.", dailyOutput: "1.5M bpd capacity" },
  { id: "rotterdam", name: "Rotterdam", type: "refinery", lat: 51.9, lng: 4.5, country: "Netherlands", description: "Europe's largest port and refining hub.", dailyOutput: "1.3M bpd capacity" },
];

// Arc connections for supply routes (globe animation)
export const SUPPLY_ROUTES = [
  { startLat: 24.9, startLng: 49.1, endLat: 26.6, endLng: 56.3, label: "Saudi → Hormuz" },
  { startLat: 26.6, startLng: 56.3, endLat: 2.5, endLng: 101.5, label: "Hormuz → Malacca" },
  { startLat: 2.5, startLng: 101.5, endLat: 35.7, endLng: 139.7, label: "Malacca → Japan" },
  { startLat: 62.0, startLng: 75.0, endLat: 41.1, endLng: 29.1, label: "Siberia → Bosphorus" },
  { startLat: 57.5, startLng: 2.0, endLat: 51.9, endLng: 4.5, label: "North Sea → Rotterdam" },
  { startLat: 31.9, startLng: -102.5, endLat: 29.8, endLng: -95.1, label: "Permian → Houston" },
  { startLat: 29.8, startLng: -95.1, endLat: 51.5, endLng: -0.1, label: "Houston → London" },
  { startLat: 24.7, startLng: 46.7, endLat: 30.7, endLng: 32.3, label: "Saudi → Suez" },
  { startLat: 30.7, startLng: 32.3, endLat: 51.9, endLng: 4.5, label: "Suez → Rotterdam" },
  { startLat: 10.5, startLng: -66.9, endLat: 29.8, endLng: -95.1, label: "Venezuela → Houston" },
];

export const HUB_COLORS: Record<OilHub["type"], string> = {
  production: "#f59e0b",   // amber
  chokepoint: "#ef4444",   // red
  opec: "#3b82f6",         // blue
  refinery: "#10b981",     // green
};
