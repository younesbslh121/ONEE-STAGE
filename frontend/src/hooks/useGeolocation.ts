import { useState, useEffect } from 'react';

interface Position {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface GeolocationState {
  position: Position | null;
  error: string | null;
  loading: boolean;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

const useGeolocation = (options: GeolocationOptions = {}) => {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        position: null,
        error: 'Geolocation is not supported by this browser.',
        loading: false,
      });
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      setState({
        position: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        },
        error: null,
        loading: false,
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      let errorMessage = 'An unknown error occurred.';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'User denied the request for geolocation.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable.';
          break;
        case error.TIMEOUT:
          errorMessage = 'The request to get user location timed out.';
          break;
      }

      setState({
        position: null,
        error: errorMessage,
        loading: false,
      });
    };

    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: options.enableHighAccuracy || true,
        timeout: options.timeout || 5000,
        maximumAge: options.maximumAge || 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [options.enableHighAccuracy, options.timeout, options.maximumAge]);

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      return Promise.reject(new Error('Geolocation is not supported'));
    }

    return new Promise<Position>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: options.enableHighAccuracy || true,
          timeout: options.timeout || 5000,
          maximumAge: options.maximumAge || 0,
        }
      );
    });
  };

  return {
    ...state,
    getCurrentPosition,
  };
};

export default useGeolocation;
