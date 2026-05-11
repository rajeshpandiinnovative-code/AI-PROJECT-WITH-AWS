/** States, UTs, and district/city lists for login demo context. */

/** All 28 states + 8 union territories + Other. */
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
  "Other",
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];

export const DISTRICTS_BY_STATE: Record<string, string[]> = {
  "Tamil Nadu": [
    "Virudhunagar",
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Tirunelveli",
    "Salem",
    "Tiruchirappalli",
    "Other",
  ],
  Karnataka: ["Bengaluru Urban", "Mysuru", "Dharwad", "Mangaluru", "Belagavi", "Other"],
  Kerala: ["Thiruvananthapuram", "Ernakulam", "Kozhikode", "Thrissur", "Other"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Other"],
  "Andhra Pradesh": ["Visakhapatnam", "Guntur", "Tirupati", "Kurnool", "Other"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Other"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Other"],
  "West Bengal": ["Kolkata", "Howrah", "Siliguri", "Durgapur", "Other"],
  Delhi: ["New Delhi", "North East Delhi", "Dwarka", "Other"],
  "Uttar Pradesh": ["Lucknow", "Varanasi", "Kanpur", "Noida", "Prayagraj", "Other"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Other"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Other"],
  Odisha: ["Bhubaneswar", "Cuttack", "Rourkela", "Other"],
  Assam: ["Guwahati", "Dibrugarh", "Silchar", "Other"],
  Punjab: ["Ludhiana", "Amritsar", "Patiala", "Other"],
  Haryana: ["Gurugram", "Faridabad", "Panipat", "Other"],
  Bihar: ["Patna", "Gaya", "Muzaffarpur", "Other"],
  Jharkhand: ["Ranchi", "Jamshedpur", "Dhanbad", "Other"],
  Chhattisgarh: ["Raipur", "Bilaspur", "Other"],
  Uttarakhand: ["Dehradun", "Haridwar", "Nainital", "Other"],
  "Himachal Pradesh": ["Shimla", "Kangra", "Other"],
  Goa: ["North Goa", "South Goa", "Other"],
  "Arunachal Pradesh": ["Itanagar", "Other"],
  Manipur: ["Imphal", "Other"],
  Meghalaya: ["Shillong", "Other"],
  Mizoram: ["Aizawl", "Other"],
  Nagaland: ["Kohima", "Other"],
  Tripura: ["Agartala", "Other"],
  Sikkim: ["Gangtok", "Other"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Other"],
  Ladakh: ["Leh", "Kargil", "Other"],
  "Andaman and Nicobar Islands": ["South Andaman", "North & Middle Andaman", "Other"],
  Chandigarh: ["Chandigarh", "Other"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Silvassa", "Other"],
  Lakshadweep: ["Kavaratti", "Other"],
  Puducherry: ["Puducherry", "Karaikal", "Other"],
  Other: ["Other"],
};

export function getDistrictsForState(state: string): string[] {
  return DISTRICTS_BY_STATE[state] ?? ["District HQ", "Urban cluster", "Rural block", "Other"];
}

/** Key: `${state}|${district}` — extended for common selections; unknown keys fall back in {@link cityOptionsFor}. */
export const CITIES_BY_STATE_DISTRICT: Record<string, string[]> = {
  "Tamil Nadu|Virudhunagar": ["Srivilliputhur", "Rajapalayam", "Sivakasi", "Aruppukkottai", "Other"],
  "Tamil Nadu|Chennai": ["Chennai", "Tambaram", "Avadi", "Other"],
  "Tamil Nadu|Coimbatore": ["Coimbatore", "Tirupur", "Mettupalayam", "Other"],
  "Tamil Nadu|Madurai": ["Madurai", "Melur", "Usilampatti", "Other"],
  "Tamil Nadu|Tirunelveli": ["Tirunelveli", "Nagercoil", "Tenkasi", "Other"],
  "Tamil Nadu|Salem": ["Salem", "Omalur", "Attur", "Other"],
  "Tamil Nadu|Tiruchirappalli": ["Tiruchirappalli", "Srirangam", "Other"],
  "Tamil Nadu|Other": ["Other"],
  "Karnataka|Bengaluru Urban": ["Bengaluru", "Other"],
  "Karnataka|Mysuru": ["Mysuru", "Nanjangud", "Other"],
  "Karnataka|Dharwad": ["Hubli", "Dharwad", "Other"],
  "Karnataka|Mangaluru": ["Mangaluru", "Udupi", "Other"],
  "Karnataka|Belagavi": ["Belagavi", "Other"],
  "Karnataka|Other": ["Other"],
  "Kerala|Thiruvananthapuram": ["Thiruvananthapuram", "Other"],
  "Kerala|Ernakulam": ["Kochi", "Other"],
  "Kerala|Kozhikode": ["Kozhikode", "Other"],
  "Kerala|Thrissur": ["Thrissur", "Other"],
  "Kerala|Other": ["Other"],
  "Telangana|Hyderabad": ["Hyderabad", "Secunderabad", "Other"],
  "Telangana|Warangal": ["Warangal", "Other"],
  "Telangana|Nizamabad": ["Nizamabad", "Other"],
  "Telangana|Karimnagar": ["Karimnagar", "Other"],
  "Telangana|Other": ["Other"],
  "Andhra Pradesh|Visakhapatnam": ["Visakhapatnam", "Other"],
  "Andhra Pradesh|Guntur": ["Guntur", "Other"],
  "Andhra Pradesh|Tirupati": ["Tirupati", "Other"],
  "Andhra Pradesh|Kurnool": ["Kurnool", "Other"],
  "Andhra Pradesh|Other": ["Other"],
  "Maharashtra|Mumbai": ["Mumbai", "Navi Mumbai", "Other"],
  "Maharashtra|Pune": ["Pune", "Other"],
  "Maharashtra|Nagpur": ["Nagpur", "Other"],
  "Maharashtra|Nashik": ["Nashik", "Other"],
  "Maharashtra|Aurangabad": ["Aurangabad", "Other"],
  "Maharashtra|Other": ["Other"],
  "Delhi|New Delhi": ["Central Delhi", "South Delhi", "Other"],
  "Delhi|North East Delhi": ["North East Delhi", "Other"],
  "Delhi|Dwarka": ["Dwarka", "Other"],
  "Delhi|Other": ["Other"],
  "Other|Other": ["Other"],
};

export function cityOptionsFor(state: string, district: string): string[] {
  const key = `${state}|${district}`;
  const list = CITIES_BY_STATE_DISTRICT[key];
  if (list?.length) {
    return list;
  }
  return ["Urban center", "Town", "Rural cluster", "Other"];
}

/** Map a demo/school district label to its state/UT for nationwide dashboards (best-effort). */
export function inferStateFromDistrict(district: string): string | null {
  const d = district.trim();
  if (!d) return null;
  for (const state of INDIAN_STATES) {
    if (getDistrictsForState(state).includes(d)) {
      return state;
    }
  }
  return null;
}
