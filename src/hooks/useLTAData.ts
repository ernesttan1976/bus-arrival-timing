import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

interface BusService {
  busNumber: string;
  operator: string;
  nextBus: {
    arrivalTime: number | null;
    load: string;
    feature: string;
    type: string;
  };
  nextBus2: {
    arrivalTime: number | null;
    load: string;
    feature: string;
    type: string;
  };
  nextBus3: {
    arrivalTime: number | null;
    load: string;
    feature: string;
    type: string;
  };
}

interface BusArrivalData {
  stopCode: string;
  services: BusService[];
}

interface BusStopInfo {
  stopCode: string;
  stopName: string;
  roadName: string;
  latitude: number;
  longitude: number;
}

export const useLTAData = () => {
  const [loading, setLoading] = useState(false);

  const getBusArrival = async (busStopCode: string): Promise<BusArrivalData | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('lta-bus-arrival', {
        body: { busStopCode }
      });

      if (error) {
        showError('Failed to fetch bus arrival data');
        return null;
      }

      return data;
    } catch (error) {
      showError('Network error while fetching bus data');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const searchBusStops = async (searchQuery: string): Promise<BusStopInfo[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('lta-bus-stops', {
        body: { searchQuery, skip: 0 }
      });

      if (error) {
        showError('Failed to search bus stops');
        return [];
      }

      return data.busStops || [];
    } catch (error) {
      showError('Network error while searching bus stops');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getCrowdLevel = (load: string): 'low' | 'medium' | 'high' => {
    switch (load) {
      case 'SEA': return 'low';
      case 'SDA': return 'medium';
      case 'LSD': return 'high';
      default: return 'low';
    }
  };

  return {
    loading,
    getBusArrival,
    searchBusStops,
    getCrowdLevel
  };
};