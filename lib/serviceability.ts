export const ASSESSMENT_AVAILABILITY_COPY = "Mason is currently available in Goa.";

export type LocationMarket = "GOA" | "BANGALORE" | "OTHER" | "UNKNOWN";
export type ServiceabilityStatus = "SERVICEABLE" | "OUT_OF_AREA" | "UNKNOWN";
export type ServiceabilitySource = "GOOGLE_PLACES" | "GOOGLE_GEOCODING" | "MANUAL_ENTRY";

export type GoogleAddressComponent = {
  long_name?: string;
  short_name?: string;
  types?: string[];
};

/**
 * Historical API compatibility name. This object is location-classification
 * metadata only; assessment lead capture must never be gated by its values.
 */
export type ServiceabilityMetadata = {
  status: ServiceabilityStatus;
  locationMarket: LocationMarket;
  marketLabel: "Goa" | "Bangalore" | "Other location" | "Unknown location";
  country: string | null;
  administrativeAreaLevel1: string | null;
  locality: string | null;
  postalCode: string | null;
  formattedAddress: string | null;
  placeId: string | null;
  latitude: number | null;
  longitude: number | null;
  classifiedAt: string;
  source: ServiceabilitySource;
};

type ClassificationContext = {
  formattedAddress?: string | null;
  placeId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  source: ServiceabilitySource;
  classifiedAt?: string;
};

const BANGALORE_TOKENS = ["bangalore", "bengaluru"];
const BANGALORE_COMPONENT_TYPES = new Set([
  "locality",
  "administrative_area_level_2",
  "administrative_area_level_3",
  "sublocality",
  "sublocality_level_1"
]);

function componentByType(components: GoogleAddressComponent[], type: string) {
  return components.find((component) => component.types?.includes(type));
}

function normalized(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase("en-IN") || "";
}

function isBangaloreComponent(component: GoogleAddressComponent) {
  if (!component.types?.some((type) => BANGALORE_COMPONENT_TYPES.has(type))) {
    return false;
  }
  const values = [component.long_name, component.short_name].map(normalized);
  return values.some((value) => BANGALORE_TOKENS.some((token) => value.includes(token)));
}

export function locationMarketLabel(market: LocationMarket): ServiceabilityMetadata["marketLabel"] {
  if (market === "GOA") return "Goa";
  if (market === "BANGALORE") return "Bangalore";
  if (market === "OTHER") return "Other location";
  return "Unknown location";
}

function legacyStatusFor(market: LocationMarket): ServiceabilityStatus {
  if (market === "GOA" || market === "BANGALORE") return "SERVICEABLE";
  if (market === "OTHER") return "OUT_OF_AREA";
  return "UNKNOWN";
}

export function unknownServiceability(
  context: Omit<ClassificationContext, "source"> & { source?: ServiceabilitySource } = {}
): ServiceabilityMetadata {
  const locationMarket: LocationMarket = "UNKNOWN";
  return {
    status: legacyStatusFor(locationMarket),
    locationMarket,
    marketLabel: locationMarketLabel(locationMarket),
    country: null,
    administrativeAreaLevel1: null,
    locality: null,
    postalCode: null,
    formattedAddress: context.formattedAddress?.trim() || null,
    placeId: context.placeId?.trim() || null,
    latitude: Number.isFinite(context.latitude) ? context.latitude ?? null : null,
    longitude: Number.isFinite(context.longitude) ? context.longitude ?? null : null,
    classifiedAt: context.classifiedAt || new Date().toISOString(),
    source: context.source || "MANUAL_ENTRY"
  };
}

export function classifyGoogleAddress(
  components: GoogleAddressComponent[],
  context: ClassificationContext
): ServiceabilityMetadata {
  const countryComponent = componentByType(components, "country");
  const stateComponent = componentByType(components, "administrative_area_level_1");
  const localityComponent =
    componentByType(components, "locality") ||
    componentByType(components, "administrative_area_level_2") ||
    componentByType(components, "sublocality");
  const postalCodeComponent = componentByType(components, "postal_code");

  const country = countryComponent?.long_name?.trim() || null;
  const countryCode = countryComponent?.short_name?.trim().toUpperCase() || null;
  const administrativeAreaLevel1 = stateComponent?.long_name?.trim() || null;

  let locationMarket: LocationMarket = "UNKNOWN";
  if (countryCode === "IN" && normalized(administrativeAreaLevel1) === "goa") {
    locationMarket = "GOA";
  } else if (countryCode === "IN" && components.some(isBangaloreComponent)) {
    locationMarket = "BANGALORE";
  } else if (countryCode) {
    locationMarket = "OTHER";
  }

  return {
    status: legacyStatusFor(locationMarket),
    locationMarket,
    marketLabel: locationMarketLabel(locationMarket),
    country,
    administrativeAreaLevel1,
    locality: localityComponent?.long_name?.trim() || null,
    postalCode: postalCodeComponent?.long_name?.trim() || null,
    formattedAddress: context.formattedAddress?.trim() || null,
    placeId: context.placeId?.trim() || null,
    latitude: Number.isFinite(context.latitude) ? context.latitude ?? null : null,
    longitude: Number.isFinite(context.longitude) ? context.longitude ?? null : null,
    classifiedAt: context.classifiedAt || new Date().toISOString(),
    source: context.source
  };
}
