import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { MOCK_NOTIFICATIONS } from '../data/mockData';
import { Notification } from '../types';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Sparkles,
  FileCheck,
  Calendar,
} from 'lucide-react-native';

export const NotificationsScreen: React.FC = () => {
  const { user } = useAuth();
  const isDemoStudent = user?.email === 'etudiant@campusconnect.dev';
  const [notifications, setNotifications] = useState<Notification[]>(isDemoStudent ? MOCK_NOTIFICATIONS : []);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      if (data && data.length > 0) {
        setNotifications(data);
      } else {
        setNotifications(isDemoStudent ? MOCK_NOTIFICATIONS : []);
      }
    } catch {
      if (isDemoStudent) setNotifications(MOCK_NOTIFICATIONS);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user?.id]);

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
    } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    Alert.alert('Succès', 'Toutes les notifications ont été marquées comme lues.');
  };

  const markSingleAsRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
    } catch {}
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'CHANGEMENT_SEANCE':
        return <AlertTriangle size={16} color={Colors.warningText} />;
      case 'CORRESPONDANCE_OBJET':
        return <Sparkles size={16} color={Colors.aiPurple} />;
      case 'REPONSE_ABSENCE':
        return <FileCheck size={16} color={Colors.success} />;
      default:
        return <Bell size={16} color={Colors.primary} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.heading}>Centre de Notifications</Text>
        <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}>
          <CheckCheck size={14} color={Colors.primary} />
          <Text style={styles.markAllText}>Tout marquer comme lu</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadNotifications} />}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <Card style={{ padding: 24, alignItems: 'center' }}>
            <Bell size={32} color={Colors.textMuted} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textDark, marginTop: 10 }}>
              Aucune notification
            </Text>
            <Text style={{ fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 4 }}>
              Vous êtes à jour ! Les alertes de cours et rappels s'afficheront ici.
            </Text>
          </Card>
        ) : (
          notifications.map((notif) => (
            <TouchableOpacity
              key={notif.id}
              style={[styles.notifCard, !notif.is_read && styles.notifUnread]}
              onPress={() => markSingleAsRead(notif.id)}
              activeOpacity={0.8}
            >
              <View style={styles.iconCircle}>{getNotificationIcon(notif.type)}</View>

              <View style={{ flex: 1 }}>
                <View style={styles.notifTopRow}>
                  <Text style={styles.notifTitle}>{notif.title}</Text>
                  <Text style={styles.notifTime}>{notif.created_at}</Text>
                </View>
                <Text style={styles.notifMsg}>{notif.message}</Text>
              </View>

              {!notif.is_read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgLight,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  heading: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textDark,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 10,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  notifUnread: {
    borderColor: '#93C5FD',
    backgroundColor: '#F0F7FF',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textDark,
  },
  notifTime: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  notifMsg: {
    fontSize: 12,
    color: Colors.textMedium,
    lineHeight: 16,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
