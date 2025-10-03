import { useState, useEffect } from 'react';
import { TestTube } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showSuccess, showError } from '@/utils/toast';

interface MockDataToggleProps {
  onToggle: (useMockData: boolean) => void;
}

const MockDataToggle = ({ onToggle }: MockDataToggleProps) => {
  const [useMockData, setUseMockData] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('useMockData');
    if (saved) {
      const shouldUseMock = JSON.parse(saved);
      setUseMockData(shouldUseMock);
      onToggle(shouldUseMock);
    }
  }, [onToggle]);

  const handleToggle = (checked: boolean) => {
    setUseMockData(checked);
    localStorage.setItem('useMockData', JSON.stringify(checked));
    onToggle(checked);
    
    if (checked) {
      showSuccess('Switched to mock data mode');
    } else {
      showSuccess('Switched to live LTA data');
    }
  };

  return (
    <Card className="mb-6 border-purple-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
          <TestTube className="w-5 h-5" />
          Development Mode
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Use Mock Data</p>
            <p className="text-xs text-gray-500">
              Enable this if LTA API is not configured yet
            </p>
          </div>
          <Switch
            checked={useMockData}
            onCheckedChange={handleToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MockDataToggle;