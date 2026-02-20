import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { theme } from '../../theme/theme';
import apiClient from '../../services/ApiClient';

interface LocationData {
  id: number;
  latitude: number;
  longitude: number;
  address: string;
  locationUrl: string;
  createdAt: string;
}

const LocationHistoryScreen: React.FC = () => {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const fetchLocationHistory = async () => {
    try {
      console.log('📍 Fetching location history...');
      const response = await apiClient.get('/location/latest');
      console.log('📍 Location history response:', response);
      
      // For now, we'll handle single latest location
      // In future, you might want to create an endpoint for full history
      if (response) {
        setLocations([response]);
      }
    } catch (error) {
      console.error('❌ Error fetching location history:', error);
      Alert.alert('Error', 'Failed to fetch location history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLocationHistory();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLocationHistory();
  };

  const renderLocationItem = ({ item }: { item: LocationData }) => (
    <TouchableOpacity
      style={[styles.locationItem, { backgroundColor: theme.colors.surface }]}
      onPress={() => {
        if (item.locationUrl) {
          console.log('🗺️ Opening location URL:', item.locationUrl);
          // You might want to open this in a map view
        }
      }}
    >
      <View style={styles.locationHeader}>
        <Text style={[styles.locationTime, { color: theme.colors.onSurface }]}>
          {formatDate(item.createdAt)}
        </Text>
        <Text style={[styles.locationId, { color: theme.colors.onSurfaceVariant }]}>
          ID: {item.id}
        </Text>
      </View>
      
      <Text style={[styles.locationAddress, { color: theme.colors.onSurface }]}>
        📍 {item.address || 'Address not available'}
      </Text>
      
      <Text style={[styles.locationCoords, { color: theme.colors.onSurfaceVariant }]}>
        🌐 {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
      </Text>
      
      {item.locationUrl && (
        <Text style={[styles.locationUrl, { color: theme.colors.primary }]}>
          🔗 View on Map
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={[styles.emptyState, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.emptyStateText, { color: theme.colors.onBackground }]}>
        📍 No location history available
      </Text>
      <Text style={[styles.emptyStateSubtext, { color: theme.colors.onSurfaceVariant }]}>
        Your location history will appear here once you start using SOS feature
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
          Loading location history...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={locations}
        renderItem={renderLocationItem}
        keyExtractor={(item) => item.id.toString()}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  locationItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTime: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationId: {
    fontSize: 12,
    opacity: 0.7,
  },
  locationAddress: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  locationCoords: {
    fontSize: 12,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  locationUrl: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});

export default LocationHistoryScreen;
