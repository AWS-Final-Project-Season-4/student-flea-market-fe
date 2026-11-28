interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: Record<string, string | undefined>;
}

function formatPhotonLabel(f: PhotonFeature): string {
  const p = f.properties;
  return [
    ...new Set(
      [
        p.name,
        [p.housenumber, p.street].filter(Boolean).join(' '),
        p.district,
        p.city,
        p.state,
        p.country,
      ].filter(Boolean)
    ),
  ]
    .join(', ')
    .slice(0, 200);
}

/**
 * Search Vietnamese / HCMC-biased addresses via Photon without loading any map UI.
 */
export async function searchPhotonAddresses(
  query: string,
  signal?: AbortSignal
): Promise<string[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', trimmed);
  url.searchParams.set('limit', '5');
  url.searchParams.set('lat', '10.8231');
  url.searchParams.set('lon', '106.6297');
  // Photon has no Vietnamese; without this it follows Accept-Language (e.g. fr -> "Hồ Chí Minh-Ville").
  url.searchParams.set('lang', 'default');

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('Address search failed');
  const data = (await res.json()) as { features?: PhotonFeature[] };

  return [
    ...new Set((data.features ?? []).map(formatPhotonLabel).filter((s) => s.length >= 6)),
  ];
}
