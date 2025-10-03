import { useState } from 'react';
import { Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const testConnections = async () => {
    setTesting(true);
    const results: any = {
      supabaseConnection: 'Unknown',
      ltaBusStops: 'Unknown',
      ltaBusArrival: 'Unknown',
      timestamp: new Date().toISOString()
    };

    try {
      // Test Supabase connection
      const { data: healthCheck } = await supabase.functions.invoke('lta-bus-stops', {
        body: { searchQuery: 'test', skip: 0 }
      });
      results.supabaseConnection = 'Connected';
      
      // Test LTA bus stops API
      if (healthCheck?.error) {
        results.ltaBusStops = `Error: ${healthCheck.error}`;
      } else if (healthCheck?.busStops) {
        results.ltaBusStops = `Success: ${healthCheck.busStops.length} stops returned`;
      } else {
        results.ltaBusStops = 'No data returned';
      }

      // Test LTA bus arrival API with a known stop code
      const { data: arrivalData } = await supabase.functions.invoke('lta-bus-arrival', {
        body: { busStopCode: '01012' } // Orchard Road stop
      });
      
      if (arrivalData?.error) {
        results.ltaBusArrival = `Error: ${arrivalData.error}`;
      } else if (arrivalData?.services) {
        results.ltaBusArrival = `Success: ${arrivalData.services.length} services returned`;
      } else {
        results.ltaBusArrival = 'No data returned';
      }

    } catch (error: any) {
      results.supabaseConnection = `Error: ${error.message}`;
    }

    setTestResults(results);
    setTesting(false);
  };

  const getStatusColor = (status: string) => {
    if (status.includes('Success') || status === 'Connected') return 'bg-green-100 text-green-800';
    if (status.includes('Error')) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <Card className="mb-6 border-orange-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
            <Bug className="w-5 h-5" />
            Debug Panel
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={testConnections} 
              disabled={testing}
              className="w-full"
            >
              {testing ? 'Testing Connections...' : 'Test API Connections'}
            </Button>

            {testResults && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Test Results:</p>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Supabase Connection:</span>
                    <Badge className={getStatusColor(testResults.supabaseConnection)}>
                      {testResults.supabaseConnection}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">LTA Bus Stops API:</span>
                    <Badge className={getStatusColor(testResults.ltaBusStops)}>
                      {testResults.ltaBusStops}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">LTA Bus Arrival API:</span>
                    <Badge className={getStatusColor(testResults.ltaBusArrival)}>
                      {testResults.ltaBusArrival}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Last tested: {new Date(testResults.timestamp).toLocaleString()}
                </p>
              </div>
            )}

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-2">Setup Instructions:</p>
              <ol className="text-xs text-blue-700 space-y-1">
                <li>1. Go to your Supabase project dashboard</li>
                <li>2. Navigate to Edge Functions → Manage Secrets</li>
                <li>3. Add secret: Key = "LTA_API_KEY", Value = your LTA DataMall API key</li>
                <li>4. Get your API key from: <a href="https://datamall.lta.gov.sg/content/datamall/en/request-for-api.html" target="_blank" className="underline">LTA DataMall</a></li>
              </ol>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default DebugPanel;