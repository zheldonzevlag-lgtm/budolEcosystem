import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

export function useMapSettings() {
  const { data, error, isLoading, mutate } = useSWR('/api/system/settings', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
  });

  const settings = data || {};
  
  return {
    mapProvider: settings.mapProvider || 'OSM',
    googleMapsApiKey: settings.googleMapsApiKey,
    geoapifyApiKey: settings.geoapifyApiKey,
    radarApiKey: settings.radarApiKey,
    enabledProviders: settings.enabledMapProviders || ['OSM'],
    isLoading,
    isError: error,
    mutate
  };
}
