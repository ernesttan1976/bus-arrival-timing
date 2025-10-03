import { useState, useEffect } from "react";
import BusStop from "@/components/BusStop";
import BusStopSearch from "@/components/BusStopSearch";
import RefreshButton from "@/components/RefreshButton";
import { FavoriteStops } from "@/components/FavoriteStops";
import NearbyStops from "@/components/NearbyStops";
import BusServiceFilter from "@/components/BusServiceFilter";
import DebugPanel from "@/components/DebugPanel";
import MockDataToggle from "@/components/MockDataToggle";
import { useLTAData } from "@/hooks/useLTAData";
import { showSuccess, showError } from "@/utils/toast";

interface BusArrival {
  busNumber: string;
  destination: string;
  arrivalTime: number;
  crowdLevel: 'low' | 'medium' | 'high';
  busType: string;
  isDecker: 'single' | 'double' | 'unknown';
  isWheelchairAccessible: boolean;
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
  const [busFilters, setBusFilters] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [useMockData, setUseMockData] = useState(false);
  const { loading, getBusArrival, getCrowdLevel } = useLTAData(useMockData);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || selectedStops.length === 0) return;

    const interval = setInterval(() => {
      handleRefresh(false); // Silent refresh
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, selectedStops]);

  const handleSelectStop = (stop: BusStopInfo) => {
    if (!selectedStops.find(s => s.stopCode === stop.stopCode)) {
      setSelectedStops(prev => [...prev, stop]);
      fetchBusArrival(stop);
    } else {
      showError("Bus stop already added");
    }
  };

  const fetchBusArrival = async (stop: BusStopInfo) => {
    const arrivalData = await getBusArrival(stop.stopCode);
    
    if (arrivalData && arrivalData.services) {
      const arrivals: BusArrival[] = [];
      
      // Sort services alphabetically by bus number
      const sortedServices = arrivalData.services.sort((a, b) => {
        // Handle numeric sorting properly (e.g., 2 comes before 14)
        const aNum = parseInt(a.busNumber);
        const bNum = parseInt(b.busNumber);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        
        // Fallback to string comparison for non-numeric bus numbers
        return a.busNumber.localeCompare(b.busNumber);
      });

      sortedServices.forEach(service => {
        // Skip if bus service is filtered out
        if (busFilters.length > 0 && !busFilters.includes(service.busNumber)) {
          return;
        }

        // Add next bus if available
        if (service.nextBus.arrivalTime !== null) {
          arrivals.push({
            busNumber: service.busNumber,
            destination: "Various", // LTA doesn't provide destination in arrival API
            arrivalTime: service.nextBus.arrivalTime,
            crowdLevel: getCrowdLevel(service.nextBus.load),
            busType: service.nextBus.typeDescription,
            isDecker: service.nextBus.isDecker,
            isWheelchairAccessible: service.nextBus.feature === 'WAB'
          });
        }
        
        // Add second bus if available
        if (service.nextBus2.arrivalTime !== null) {
          arrivals.push({
            busNumber: service.busNumber,
            destination: "Various",
            arrivalTime: service.nextBus2.arrivalTime,
            crowdLevel: getCrowdLevel(service.nextBus2.load),
            busType: service.nextBus2.typeDescription,
            isDecker: service.nextBus2.isDecker,
            isWheelchairAccessible: service.nextBus2.feature === 'WAB'
          });
        }
        
        // Add third bus if available
        if (service.nextBus3.arrivalTime !== null) {
          arrivals.push({
            busNumber: service.busNumber,
            destination: "Various",
            arrivalTime: service.nextBus3.arrivalTime,
            crowdLevel: getCrowdLevel(service.nextBus3.load),
            busType: service.nextBus3.typeDescription,
            isDecker: service.nextBus3.isDecker,
            isWheelchairAccessible: service.nextBus3.feature === 'WAB'
          });
        }
      });

      const busStopData: BusStopData = {
        stopName: stop.stopName,
        stopCode: stop.stopCode,
        arrivals: arrivals
      };

      setBusStopsData(prev => {
        const filtered = prev.filter(s => s.stopCode !== stop.stopCode);
        return [...filtered, busStopData];
      });

      if (!autoRefresh) {
        showSuccess(`Updated arrivals for ${stop.stopName}`);
      }
    } else {
      if (!autoRefresh) {
        showError(`No bus data available for ${stop.stopName}`);
      }
    }
  };

  const handleRefresh = async (showToast = true) => {
    if (selectedStops.length === 0) {
      if (showToast) showError("Please select a bus stop first");
      return;
    }

    for (const stop of selectedStops) {
      await fetchBusArrival(stop);
    }
    
    setLastUpdated(new Date());
    if (showToast) showSuccess("All bus timings updated");
  };

  const removeStop = (stopCode: string) => {
    setSelectedStops(prev => prev.filter(s => s.stopCode !== stopCode));
    setBusStopsData(prev => prev.filter(s => s.stopCode !== stopCode));
  };

  // Re-fetch data when filters change
  useEffect(() => {
    if (selectedStops.length > 0) {
      selectedStops.forEach(stop => fetchBusArrival(stop));
    }
  }, [busFilters]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bus Arrival Timing</h1>
          <p className="text-gray-600">Real-time bus arrival information from LTA DataMall</p>
        </div>

        <FavoriteStops onSelectStop={handleSelectStop} />
        <NearbyStops onSelectStop={handleSelectStop} />
        <BusStopSearch onSelectStop={handleSelectStop} />

        {selectedStops.length > 0 && (
          <>
            <BusServiceFilter 
              onFilterChange={setBusFilters}
              activeFilters={busFilters}
            />
            
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded"
                  />
                  Auto-refresh (30s)
                </label>
              </div>
              <RefreshButton onRefresh={() => handleRefresh()} />
            </div>
          </>
        )}

        <div className="space-y-4">
          {busStopsData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No bus stops selected</p>
              <p className="text-gray-400 text-sm mt-2">Search and select a bus stop to see real-time arrivals</p>
              {!useMockData && (
                <p className="text-orange-500 text-sm mt-2">
                  💡 Try enabling "Use Mock Data" above if you haven't set up the LTA API key yet
                </p>
              )}
            </div>
          ) : (
            busStopsData.map((stop) => (
              <div key={stop.stopCode} className="relative">
                <button
                  onClick={() => removeStop(stop.stopCode)}
                  className="absolute top-2 right-2 z-10 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
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

        {/* Developer Tools - Moved to bottom and collapsed by default */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <MockDataToggle onToggle={setUseMockData} />
          <DebugPanel />
        </div>
      </div>
    </div>
  );
};

export default Index;