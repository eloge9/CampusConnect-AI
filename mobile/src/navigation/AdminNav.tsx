import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';

// Écrans Administrateur
import { AdminScreen } from '../screens/AdminScreen';
import { AbsenceRequestScreen } from '../screens/AbsenceRequestScreen';
import { LostFoundScreen } from '../screens/LostFoundScreen';
import { DeclareLostFoundScreen } from '../screens/DeclareLostFoundScreen';
import { AnnouncementsScreen } from '../screens/AnnouncementsScreen';
import { MessagingScreen } from '../screens/MessagingScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

import {
  Shield,
  ClipboardList,
  Search,
  Newspaper,
  MessageSquare,
  User as UserIcon,
  AlertTriangle,
} from 'lucide-react-native';

type AdminTab = 'supervision' | 'absences' | 'lost' | 'announcements' | 'messages' | 'profile';

interface AdminNavProps {
  onLogout: () => void;
}

export const AdminNav: React.FC<AdminNavProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('supervision');

  // Modales
  const [showDeclareModal, setShowDeclareModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgSurface} />

      {/* En-tête Administration */}
      <Header
        onNotificationPress={() => setShowNotificationsModal(true)}
        unreadNotifications={3}
        onRolePress={() => setActiveTab('profile')}
      />

      {/* Barre d'accès rapide Administration */}
      <View style={styles.utilityBar}>
        <View style={styles.adminBadgeBox}>
          <Shield size={12} color={Colors.danger} />
          <Text style={styles.adminBadgeText}>CONSOLE SUPERVISION SYSTÈME</Text>
        </View>

        <TouchableOpacity
          style={styles.utilityItem}
          onPress={() => setActiveTab('absences')}
        >
          <AlertTriangle size={13} color={Colors.warningText} />
          <Text style={styles.utilityText}>2 Justificatifs à valider</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.utilityItem}
          onPress={() => setActiveTab('announcements')}
        >
          <Newspaper size={13} color={Colors.primary} />
          <Text style={styles.utilityText}>Diffuser une alerte</Text>
        </TouchableOpacity>
      </View>

      {/* Contenu principal Administrateur */}
      <View style={styles.content}>
        {activeTab === 'supervision' && (
          <AdminScreen onBack={() => {}} />
        )}

        {activeTab === 'absences' && <AbsenceRequestScreen />}

        {activeTab === 'lost' && (
          <LostFoundScreen onOpenDeclareModal={() => setShowDeclareModal(true)} />
        )}

        {activeTab === 'announcements' && <AnnouncementsScreen />}

        {activeTab === 'messages' && <MessagingScreen />}

        {activeTab === 'profile' && (
          <ProfileScreen
            onLogout={onLogout}
            onOpenAdmin={() => setActiveTab('supervision')}
          />
        )}
      </View>

      {/* Barre d'onglets inférieure dédiée Administrateur */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navTab, activeTab === 'supervision' && styles.navTabActive]}
          onPress={() => setActiveTab('supervision')}
          activeOpacity={0.7}
        >
          <Shield
            size={18}
            color={activeTab === 'supervision' ? Colors.danger : Colors.textMuted}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === 'supervision' && { color: Colors.danger, fontWeight: '800' },
            ]}
          >
            Supervision
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'absences' && styles.navTabActive]}
          onPress={() => setActiveTab('absences')}
          activeOpacity={0.7}
        >
          <ClipboardList
            size={18}
            color={activeTab === 'absences' ? Colors.primary : Colors.textMuted}
          />
          <Text style={[styles.navLabel, activeTab === 'absences' && styles.navLabelActive]}>
            Absences
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'lost' && styles.navTabActive]}
          onPress={() => setActiveTab('lost')}
          activeOpacity={0.7}
        >
          <Search
            size={18}
            color={activeTab === 'lost' ? Colors.primary : Colors.textMuted}
          />
          <Text style={[styles.navLabel, activeTab === 'lost' && styles.navLabelActive]}>
            Objets
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'announcements' && styles.navTabActive]}
          onPress={() => setActiveTab('announcements')}
          activeOpacity={0.7}
        >
          <Newspaper
            size={18}
            color={activeTab === 'announcements' ? Colors.primary : Colors.textMuted}
          />
          <Text style={[styles.navLabel, activeTab === 'announcements' && styles.navLabelActive]}>
            Annonces
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'messages' && styles.navTabActive]}
          onPress={() => setActiveTab('messages')}
          activeOpacity={0.7}
        >
          <MessageSquare
            size={18}
            color={activeTab === 'messages' ? Colors.primary : Colors.textMuted}
          />
          <Text style={[styles.navLabel, activeTab === 'messages' && styles.navLabelActive]}>
            Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'profile' && styles.navTabActive]}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <UserIcon
            size={18}
            color={activeTab === 'profile' ? Colors.primary : Colors.textMuted}
          />
          <Text style={[styles.navLabel, activeTab === 'profile' && styles.navLabelActive]}>
            Profil
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modale Déclaration d'objet trouvé côté accueil */}
      <Modal visible={showDeclareModal} animationType="slide">
        <DeclareLostFoundScreen
          onBack={() => setShowDeclareModal(false)}
          onSuccess={() => {
            setShowDeclareModal(false);
            setActiveTab('lost');
          }}
        />
      </Modal>

      {/* Modale Notifications */}
      <Modal visible={showNotificationsModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgLight }}>
          <View style={styles.modalHeaderBar}>
            <Text style={styles.modalHeaderTitle}>Centre de Notifications Système</Text>
            <TouchableOpacity onPress={() => setShowNotificationsModal(false)}>
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <NotificationsScreen />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgLight,
  },
  utilityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  adminBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.dangerText,
    letterSpacing: 0.3,
  },
  utilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.bgLight,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  utilityText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textDark,
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSurface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 6,
    paddingHorizontal: 4,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  navTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 8,
    flex: 1,
  },
  navTabActive: {
    backgroundColor: '#EFF6FF',
  },
  navLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  navLabelActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  modalHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textDark,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});
