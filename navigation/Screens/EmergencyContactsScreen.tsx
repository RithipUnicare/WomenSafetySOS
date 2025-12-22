import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  FAB,
  Portal,
  Dialog,
  ActivityIndicator,
  Chip,
  IconButton,
  useTheme,
} from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../AppNavigation';
import EmergencyContactsService from '../../services/EmergencyContactsService';
import { EmergencyContact } from '../../types/types';
import type { AppTheme } from '../../theme/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type EmergencyContactsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'EmergencyContacts'
>;

interface Props {
  navigation: EmergencyContactsScreenNavigationProp;
}

const EmergencyContactsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme<AppTheme>();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [selectedContact, setSelectedContact] =
    useState<EmergencyContact | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [priority, setPriority] = useState('1');

  useFocusEffect(
    useCallback(() => {
      fetchContacts();
    }, []),
  );

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const data = await EmergencyContactsService.getContacts();
      setContacts(data.sort((a, b) => a.priority - b.priority));
    } catch (error: any) {
      console.error('Fetch contacts error:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!name.trim() || !mobile.trim()) {
      Alert.alert('Error', 'Please fill in name and mobile number');
      return;
    }

    if (mobile.length !== 10) {
      Alert.alert('Error', 'Mobile number must be 10 digits');
      return;
    }

    setIsSaving(true);
    try {
      await EmergencyContactsService.addContact({
        name,
        mobile,
        email,
        priority: parseInt(priority),
      });

      Alert.alert('Success', 'Contact added successfully');
      setIsModalVisible(false);
      resetForm();
      fetchContacts();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Failed to add contact';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteContact = (contact: EmergencyContact) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await EmergencyContactsService.deleteContact(contact.id);
              Alert.alert('Success', 'Contact deleted');
              fetchContacts();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete contact');
            }
          },
        },
      ],
    );
  };

  const resetForm = () => {
    setName('');
    setMobile('');
    setEmail('');
    setPriority('1');
  };

  const handleViewContact = (contact: EmergencyContact) => {
    setSelectedContact(contact);
    setIsDetailsVisible(true);
  };

  const renderContact = ({ item }: { item: EmergencyContact }) => (
    <Card
      style={[styles.contactCard, { backgroundColor: theme.colors.surface }]}
      mode="elevated"
      onPress={() => handleViewContact(item)}
    >
      <Card.Content style={styles.contactContent}>
        <Chip
          mode="flat"
          style={[
            styles.priorityChip,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
          textStyle={{ color: theme.colors.primary, fontWeight: 'bold' }}
        >
          #{item.priority}
        </Chip>
        <View style={styles.contactInfo}>
          <Text
            variant="titleMedium"
            style={{ color: theme.colors.onSurface, marginBottom: 4 }}
          >
            {item.name}
          </Text>
          <Text
            variant="bodySmall"
            style={{
              color: theme.colors.secondary,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Icon name="phone" size={14} color={theme.colors.secondary} /> +91{' '}
            {item.mobile}
          </Text>
          {item.email && (
            <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
              <Icon name="email" size={14} color={theme.colors.secondary} />{' '}
              {item.email}
            </Text>
          )}
        </View>
        <IconButton
          icon="delete"
          iconColor={theme.colors.error}
          size={24}
          onPress={() => handleDeleteContact(item)}
        />
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

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {contacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="contacts" size={60} color={theme.colors.secondary} />
          <Text
            variant="titleLarge"
            style={[styles.emptyTitle, { color: theme.colors.onBackground }]}
          >
            No Emergency Contacts
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.emptySubtitle, { color: theme.colors.secondary }]}
          >
            Add trusted contacts who will be notified in case of emergency
          </Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setIsModalVisible(true)}
        color={theme.colors.onPrimary}
      />

      {/* Add Contact Modal */}
      <Portal>
        <Dialog
          visible={isModalVisible}
          onDismiss={() => {
            setIsModalVisible(false);
            resetForm();
          }}
          style={styles.dialog}
        >
          <Dialog.Title>Add Emergency Contact</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <Dialog.Content>
                <TextInput
                  label="Name *"
                  value={name}
                  onChangeText={setName}
                  mode="outlined"
                  style={styles.input}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                  textColor={theme.colors.onSurface}
                />

                <TextInput
                  label="Mobile Number *"
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  maxLength={10}
                  mode="outlined"
                  left={<TextInput.Affix text="+91" />}
                  style={styles.input}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                  textColor={theme.colors.onSurface}
                />

                <TextInput
                  label="Email (Optional)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  mode="outlined"
                  style={styles.input}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                  textColor={theme.colors.onSurface}
                />

                <TextInput
                  label="Priority"
                  value={priority}
                  onChangeText={setPriority}
                  keyboardType="number-pad"
                  maxLength={2}
                  mode="outlined"
                  style={styles.input}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                  textColor={theme.colors.onSurface}
                />
              </Dialog.Content>
            </KeyboardAvoidingView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button
              mode="text"
              onPress={() => {
                setIsModalVisible(false);
                resetForm();
              }}
              textColor={theme.colors.primary}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAddContact}
              loading={isSaving}
              disabled={isSaving}
              buttonColor={theme.colors.primary}
            >
              Add Contact
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Contact Details Dialog */}
        <Dialog
          visible={isDetailsVisible}
          onDismiss={() => setIsDetailsVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Contact Details</Dialog.Title>
          <Dialog.Content>
            {selectedContact && (
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Icon name="account" size={24} color={theme.colors.primary} />
                  <View style={styles.detailText}>
                    <Text
                      variant="labelSmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      Name
                    </Text>
                    <Text
                      variant="bodyLarge"
                      style={{
                        color: theme.colors.onSurface,
                        fontWeight: '600',
                      }}
                    >
                      {selectedContact.name}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Icon name="phone" size={24} color={theme.colors.primary} />
                  <View style={styles.detailText}>
                    <Text
                      variant="labelSmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      Mobile Number
                    </Text>
                    <Text
                      variant="bodyLarge"
                      style={{
                        color: theme.colors.onSurface,
                        fontWeight: '600',
                      }}
                    >
                      +91 {selectedContact.mobile}
                    </Text>
                  </View>
                </View>

                {selectedContact.email && (
                  <View style={styles.detailRow}>
                    <Icon name="email" size={24} color={theme.colors.primary} />
                    <View style={styles.detailText}>
                      <Text
                        variant="labelSmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        Email
                      </Text>
                      <Text
                        variant="bodyLarge"
                        style={{
                          color: theme.colors.onSurface,
                          fontWeight: '600',
                        }}
                      >
                        {selectedContact.email}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Icon name="numeric" size={24} color={theme.colors.primary} />
                  <View style={styles.detailText}>
                    <Text
                      variant="labelSmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      Priority
                    </Text>
                    <Text
                      variant="bodyLarge"
                      style={{
                        color: theme.colors.onSurface,
                        fontWeight: '600',
                      }}
                    >
                      #{selectedContact.priority}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              mode="contained"
              onPress={() => setIsDetailsVisible(false)}
              buttonColor={theme.colors.primary}
            >
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  contactCard: {
    marginBottom: 12,
    borderRadius: 16,
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityChip: {
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  dialog: {
    borderRadius: 16,
  },
  dialogScrollArea: {
    maxHeight: 400,
    paddingHorizontal: 0,
  },
  input: {
    marginBottom: 16,
  },
  detailsContainer: {
    gap: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  detailText: {
    flex: 1,
    gap: 4,
  },
});

export default EmergencyContactsScreen;
