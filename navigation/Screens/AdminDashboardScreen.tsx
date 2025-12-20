import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import {
  Text,
  Card,
  ActivityIndicator,
  Chip,
  SegmentedButtons,
  Surface,
  useTheme,
} from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../AppNavigation';
import AdminService from '../../services/AdminService';
import { Emergency } from '../../types/types';
import type { AppTheme } from '../../theme/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type AdminDashboardScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AdminDashboard'
>;

interface Props {
  navigation: AdminDashboardScreenNavigationProp;
}

const AdminDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme<AppTheme>();
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  useFocusEffect(
    useCallback(() => {
      fetchEmergencies();
    }, []),
  );

  const fetchEmergencies = async () => {
    setIsLoading(true);
    try {
      const data = await AdminService.getAllEmergencies();
      setEmergencies(
        data.sort(
          (a, b) =>
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
        ),
      );
    } catch (error: any) {
      console.error('Fetch emergencies error:', error);
      Alert.alert('Error', 'Failed to load emergencies');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredEmergencies = () => {
    if (filter === 'ALL') return emergencies;
    return emergencies.filter(e => e.status === filter);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return theme.colors.error;
      case 'ESCALATED':
        return theme.colors.warning;
      case 'RESOLVED':
        return theme.colors.success;
      default:
        return theme.colors.secondary;
    }
  };

  const renderEmergency = ({ item }: { item: Emergency }) => (
    <Card
      style={[styles.emergencyCard, { backgroundColor: theme.colors.surface }]}
      mode="elevated"
    >
      <Card.Content>
        <View style={styles.emergencyHeader}>
          <View>
            <Text
              variant="titleMedium"
              style={{ color: theme.colors.onSurface }}
            >
              Emergency #{item.id}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
              User ID: {item.userId}
            </Text>
          </View>
          <Chip
            mode="flat"
            style={{ backgroundColor: `${getStatusColor(item.status)}20` }}
            textStyle={{
              color: getStatusColor(item.status),
              fontWeight: 'bold',
            }}
          >
            {item.status}
          </Chip>
        </View>

        <View style={styles.emergencyDetails}>
          <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
            <Icon
              name="clock-outline"
              size={14}
              color={theme.colors.secondary}
            />{' '}
            Started: {new Date(item.startTime).toLocaleString()}
          </Text>
          {item.endTime && (
            <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
              <Icon name="check" size={14} color={theme.colors.secondary} />{' '}
              Ended: {new Date(item.endTime).toLocaleString()}
            </Text>
          )}
          {item.location && (
            <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
              <Icon
                name="map-marker"
                size={14}
                color={theme.colors.secondary}
              />{' '}
              Location: {item.location.latitude.toFixed(6)},{' '}
              {item.location.longitude.toFixed(6)}
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const filteredEmergencies = getFilteredEmergencies();
  const activeCount = emergencies.filter(e => e.status === 'ACTIVE').length;
  const escalatedCount = emergencies.filter(
    e => e.status === 'ESCALATED',
  ).length;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Filters */}
      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={filter}
          onValueChange={setFilter}
          buttons={[
            { value: 'ALL', label: 'All' },
            { value: 'ACTIVE', label: 'Active' },
            { value: 'ESCALATED', label: 'Escalated' },
            { value: 'RESOLVED', label: 'Resolved' },
          ]}
          style={{ backgroundColor: theme.colors.surface }}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Surface
          style={[styles.statCard, { backgroundColor: theme.colors.surface }]}
          elevation={2}
        >
          <Text
            variant="headlineMedium"
            style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}
          >
            {emergencies.length}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
            Total
          </Text>
        </Surface>
        <Surface
          style={[
            styles.statCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.error,
              borderWidth: 2,
            },
          ]}
          elevation={2}
        >
          <Text
            variant="headlineMedium"
            style={{ color: theme.colors.error, fontWeight: 'bold' }}
          >
            {activeCount}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
            Active
          </Text>
        </Surface>
        <Surface
          style={[
            styles.statCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.warning,
              borderWidth: 2,
            },
          ]}
          elevation={2}
        >
          <Text
            variant="headlineMedium"
            style={{ color: theme.colors.warning, fontWeight: 'bold' }}
          >
            {escalatedCount}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
            Escalated
          </Text>
        </Surface>
      </View>

      {/* Emergency List */}
      {filteredEmergencies.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon
            name="clipboard-list-outline"
            size={50}
            color={theme.colors.secondary}
          />
          <Text
            variant="titleMedium"
            style={{ color: theme.colors.onBackground }}
          >
            No emergencies found
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEmergencies}
          renderItem={renderEmergency}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={isLoading}
          onRefresh={fetchEmergencies}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  emergencyCard: {
    marginBottom: 12,
    borderRadius: 16,
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  emergencyDetails: {
    gap: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AdminDashboardScreen;
