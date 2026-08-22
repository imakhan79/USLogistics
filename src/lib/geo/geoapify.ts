interface GeoPoint {
  lat: number;
  lon: number;
}

async function geocode(text: string): Promise<GeoPoint> {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) throw new Error("GEOAPIFY_API_KEY not configured");

  const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(text)}&format=json&limit=1&apiKey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geoapify geocode failed: ${res.status}`);
  const data = await res.json();
  const result = data.results?.[0];
  if (!result) throw new Error(`Could not geocode "${text}"`);
  return { lat: result.lat, lon: result.lon };
}

/** Real driving distance in miles between two addresses, via Geoapify Geocoding + Routing APIs. */
export async function calculateDistanceMiles(originText: string, destinationText: string): Promise<number> {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) throw new Error("GEOAPIFY_API_KEY not configured");

  const [origin, destination] = await Promise.all([geocode(originText), geocode(destinationText)]);

  const waypoints = `${origin.lat},${origin.lon}|${destination.lat},${destination.lon}`;
  const url = `https://api.geoapify.com/v1/routing?waypoints=${encodeURIComponent(waypoints)}&mode=truck&format=json&apiKey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Geoapify routing failed: ${res.status} ${body.slice(0, 200)}`);
  }
  const data = await res.json();

  const meters = data.results?.[0]?.distance ?? data.features?.[0]?.properties?.distance;
  if (meters == null) throw new Error("Geoapify routing response missing distance");

  return Math.round((meters / 1609.344) * 10) / 10;
}

/** Actual road route (as [lat, lng] pairs) through an ordered list of stops, via Geoapify Routing. Free tier, no cost. */
export async function getRouteGeometry(waypoints: GeoPoint[]): Promise<[number, number][]> {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) throw new Error("GEOAPIFY_API_KEY not configured");
  if (waypoints.length < 2) return [];

  const waypointsParam = waypoints.map((p) => `${p.lat},${p.lon}`).join("|");
  const url = `https://api.geoapify.com/v1/routing?waypoints=${encodeURIComponent(waypointsParam)}&mode=truck&format=geojson&apiKey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Geoapify routing failed: ${res.status} ${body.slice(0, 200)}`);
  }
  const data = await res.json();

  const geometry = data.features?.[0]?.geometry;
  if (!geometry) throw new Error("Geoapify routing response missing geometry");

  // GeoJSON is [lng, lat]; Leaflet wants [lat, lng]. Routes with 3+ waypoints
  // come back as MultiLineString (one segment per leg); flatten to a single path.
  const legs: [number, number][][] = geometry.type === "MultiLineString" ? geometry.coordinates : [geometry.coordinates];
  return legs.flat().map(([lng, lat]: [number, number]) => [lat, lng]);
}
