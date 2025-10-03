import { useState, useEffect } from "react";
import BusStop from "@/components/BusStop";
import BusStopSearch from "@/components/BusStopSearch";
import RefreshButton from "@/components/RefreshButton";
import { useLTAData } from "@/hooks/useLTAData";
import { showSuccess, showError } from "@/utils/toast";

interface BusArrival {
  busNumber: string;
  destination: string;
  arrivalTime: number;
  crowdLevel: 'low' | 'medium' | 'high';
}

interface BusStopData {
  stopName: string;
  stopCode: string;
  arrivals: BusArrival[];
}

interface BusStopInfo {
  stopCode: string;
  stopName: string;
  roadName: string;
  latitude: number;
  longitude: number;
}

const Index = () => {
  const [selectedStops, setSelectedStops] = useState<BusStopInfo[]>([]);
  const [busStopsData, setBusStopsData] = useState<BusStopData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { loading, getBusArrival, getCrowdLevel } = useLTAData();

  const handleSelectStop = (stop: BusStopInfo) => {
    if (!selectedStops.find(s => s.stopCode === stop.stopCode)) {
      setSelectedStops(prev => [...prev, stop]);
      fetchBusArrival(stop);
    }
  };

  const fetchBusArrival = async (stop: BusStopInfo) => {
    const arrivalData = await getBusArrival(stop.stopCode);
    
    if (arrivalData && arrivalData.services) {
      const arrivals: BusArrival[] = [];
      
      arrivalData.services.forEach(service => {
        // Add next bus if available
        if (service.nextBus.arrivalTime !== null) {
          arrivals.push({
            busNumber: service.busNumber,
            destination: "Various", // LTA doesn't provide destination in arrival API
            arrivalTime: service.nextBus.arrivalTime,
            crowdLevel: getCrowdLevel(service.nextBus.load)
          });
        }
        
        // Add second bus if available
        if (service.nextBus2.arrivalTime !== null) {
          arrivals.push({
            busNumber: service.busNumber,
            destination: "Various",
            arrivalTime: service.nextBus2.arrivalTime,
            crowdLevel: getCrowdLevel(service.nextBus2.load)
          });
        }
        
        // Add third bus if available
        if (service.nextBus3.arrivalTime !== null) {
          arrivals.push({
            busNumber: service.busNumber,
            destination: "Various",
            arrivalTime: service.nextBus3.arrivalTime,
            crowdLevel: getCrowdLevel(service.nextBus3.load)
          });
        }
      });

      // Sort by arrival time
      arrivals.sort((a, b) => a.arrivalTime - b.arrivalTime);

      const busStopData: BusStopData = {
        stopName: stop.stopName,
        stopCode: stop.stopCode,
        arrivals: arrivals
      };

      setBusStopsData(prev => {
        const filtered = prev.filter(s => s.stopCode !== stop.stopCode);
        return [...filtered, busStopData];
      });

      showSuccess(`Updated arrivals for ${stop.stopName}`);
    } else {
      showError(`No bus data available for ${stop.stopName}`);
    }
  };

  const handleRefresh = async () => {
    if (selectedStops.length === 0) {
      showError("Please select a bus stop first");
      return;
    }

    for (const stop of selectedStops) {
      await fetchBusArrival(stop);
    }
    
    setLastUpdated(new Date());
    showSuccess("All bus timings updated");
  };

  const removeStop = (stopCode: string) => {
    setSelectedStops(prev => prev.filter(s => s.stopCode !== stopCode));
    setBusStopsData(prev => prev.filter(s => s.stopCode !== stopCode));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bus Arrival Timing</h1>
          <p className="text-gray-600">Real-time bus arrival information from LTA DataMall</p>
        </div>

        <BusStopSearch onSelectStop={handleSelectStop} />

        {selectedStops.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
            <RefreshButton onRefresh={handleRefresh} />
          </div>
        )}

        <div className="space-y-4">
          {busStopsData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No bus stops selected</p>
              <p className="text-gray-400 text-sm mt-2">Search and select a bus stop to see real-time arrivals</p>
            </div>
          ) : (
            busStopsData.map((stop) => (
              <div key={stop.stopCode} className="relative">
                <button
                  onClick={() => removeStop(stop.stopCode)}
                  className="absolute top-2 right-2 z-10 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
                <BusStop
                  stopName={stop.stopName}
                  stopCode={stop.stopCode}
                  arrivals={stop.arrivals}
                />
              </div>
            ))
          )}
        </div>

        {loading && (
          <div className="text-center py-4">
            <p className="text-gray-500">Loading bus data...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;