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
