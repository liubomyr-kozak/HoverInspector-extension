import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { MapPin, Navigation, X } from 'lucide-react';

interface LocationPickerProps {
  location: string;
  onChange: (location: string) => void;
}

const commonLocations = [
  'Home',
  'Office',
  'Coffee Shop',
  'Library',
  'Meeting Room',
  'Travel',
  'Campus',
  'Downtown',
  'Park',
  'Gym'
];

export function LocationPicker({ location, onChange }: LocationPickerProps) {
  const [customLocation, setCustomLocation] = useState('');
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocoding using a mock implementation
        // In a real app, you'd use a service like Google Maps API
        try {
          const locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setCurrentLocation(locationName);
          setIsGettingLocation(false);
        } catch (error) {
          setCurrentLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsGettingLocation(false);
        alert('Unable to get your location. Please enter it manually.');
      }
    );
  };

  const handleLocationSelect = (selectedLocation: string) => {
    onChange(selectedLocation);
  };

  const handleCustomLocationSubmit = () => {
    if (customLocation.trim()) {
      onChange(customLocation.trim());
      setCustomLocation('');
    }
  };

  const clearLocation = () => {
    onChange('');
  };

  return (
    <div className="space-y-4">
      {/* Current selection */}
      {location && (
        <div className="flex items-center gap-2 p-2 bg-accent rounded-lg">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-sm">{location}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearLocation}
            className="p-1 h-auto"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Get current location */}
      <div>
        <Button
          variant="outline"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="w-full justify-start gap-2"
        >
          <Navigation className="h-4 w-4" />
          {isGettingLocation ? 'Getting location...' : 'Use current location'}
        </Button>
        
        {currentLocation && (
          <div className="mt-2 p-2 bg-muted rounded text-sm">
            <div className="flex items-center justify-between">
              <span>Found: {currentLocation}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleLocationSelect(currentLocation)}
              >
                Use
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Common locations */}
      <div>
        <h4 className="mb-2 text-sm font-medium">Quick select</h4>
        <div className="flex flex-wrap gap-1">
          {commonLocations.map((commonLocation) => (
            <Badge
              key={commonLocation}
              variant="outline"
              className="cursor-pointer hover:bg-accent"
              onClick={() => handleLocationSelect(commonLocation)}
            >
              {commonLocation}
            </Badge>
          ))}
        </div>
      </div>

      {/* Custom location */}
      <div>
        <h4 className="mb-2 text-sm font-medium">Custom location</h4>
        <div className="flex gap-2">
          <Input
            placeholder="Enter location..."
            value={customLocation}
            onChange={(e) => setCustomLocation(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCustomLocationSubmit();
              }
            }}
          />
          <Button 
            onClick={handleCustomLocationSubmit}
            disabled={!customLocation.trim()}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}