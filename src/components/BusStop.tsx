import { Clock, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BusArrival {
  busNumber: string;
  destination: string;
  arrivalTime: number; // minutes
  crowdLevel: 'low' | 'medium' | 'high';
}

interface BusStopProps {
  stopName: string;
  stopCode: string;
  arrivals: BusArrival[];
}

const BusStop = ({ stopName, stopCode, arrivals }: BusStopProps) => {
  const getCrowdColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatArrivalTime = (minutes: number) => {
    if (minutes === 0) return 'Arriving';
    if (minutes === 1) return '1 min';
    return `${minutes} mins`;
  };

  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{stopName}</CardTitle>
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="w-4 h-4 mr-1" />
            {stopCode}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {arrivals.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No buses arriving soon</p>
        ) : (
          <div className="space-y-3">
            {arrivals.map((arrival, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 text-white px-2 py-1 rounded font-semibold text-sm">
                    {arrival.busNumber}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{arrival.destination}</p>
                    <Badge className={`text-xs ${getCrowdColor(arrival.crowdLevel)}`}>
                      {arrival.crowdLevel} crowd
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center text-right">
                  <Clock className="w-4 h-4 mr-1 text-gray-500" />
                  <span className="font-semibold text-lg">
                    {formatArrivalTime(arrival.arrivalTime)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BusStop;