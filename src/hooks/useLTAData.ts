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

// Mock data for testing
const mockBusStops: BusStopInfo[] = [
  {
    stopCode: '01012',
    stopName: 'Orchard Road',
    roadName: 'Orchard Road',
    latitude: 1.3048,
    longitude: 103.8318
  },
  {
    stopCode: '02013',
    stopName: 'Marina Bay Sands',
    roadName: 'Bayfront Avenue',
    latitude: 1.2834,
    longitude: 103.8607
  },
  {
    stopCode: '03014',
    stopName: 'Raffles Place MRT',
    roadName: 'Raffles Quay',
    latitude: 1.2837,
    longitude: 103.8516
  },
  {
    stopCode: '04015',
    stopName: 'Bugis Junction',
    roadName: 'Victoria Street',
    latitude: 1.2993,
    longitude: 103.8547
  },
  {
    stopCode: '05016',
    stopName: 'Clarke Quay MRT',
    roadName: 'North Bridge Road',
    latitude: 1.2886,
    longitude: 103.8467
  }
];

const mockBusServices: { [key: string]: BusService[] } = {
  '01012': [
    {
      busNumber: '14',
      operator: 'SBST',
      nextBus: { arrivalTime: 2, load: 'SEA', feature: 'WAB', type: 'SD' },
      nextBus2: { arrivalTime: 12, load: 'SDA', feature: 'WAB', type: 'SD' },
      nextBus3: { arrivalTime: 22, load: 'SEA', feature: 'WAB', type: 'SD' }
    },
    {
      busNumber: '111',
      operator: 'SBST',
      nextBus: { arrivalTime: 5, load: 'SEA', feature: 'WAB', type: 'SD' },
      nextBus2: { arrivalTime: 15, load: 'LSD', feature: 'WAB', type: 'SD' },
      nextBus3: { arrivalTime: 25, load: 'SDA', feature: 'WAB', type: 'SD' }
    }
  ],
  '02013': [
    {
      busNumber: '97',
      operator: 'SBST',
      nextBus: { arrivalTime: 0, load: 'LSD', feature: 'WAB', type: 'SD' },
      nextBus2: { arrivalTime: 10, load: 'SEA', feature: 'WAB', type: 'SD' },
      nextBus3: { arrivalTime: 20, load: 'SDA', feature: 'WAB', type: 'SD' }
    }
  ]
};

export const useLTAData = (useMockData: boolean = false) => {
  const [loading, setLoading] = useState(false);

  const getBusArrival = async (busStopCode: string): Promise<BusArrivalData | null> => {
    setLoading(true);
    
    try {
      if (useMockData) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const services = mockBusServices[busStopCode] || [];
        return {
          stopCode: busStopCode,
          services
        };
      }

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
      if (useMockData) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (!searchQuery.trim()) {
          return mockBusStops;
        }
        
        const query = searchQuery.toLowerCase();
        return mockBusStops.filter(stop => 
          stop.stopName.toLowerCase().includes(query) ||
          stop.stopCode.toLowerCase().includes(query) ||
          stop.roadName.toLowerCase().includes(query)
        );
      }

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