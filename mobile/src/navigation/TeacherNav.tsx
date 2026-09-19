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

// Écrans Enseignant
import { TeacherDashboardScreen } from '../screens/TeacherDashboardScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { AcademicsScreen } from '../screens/AcademicsScreen';
import { AnnouncementsScreen } from '../screens/AnnouncementsScreen';
import { MessagingScreen } from '../screens/MessagingScreen';
import { AbsenceRequestScreen } from '../screens/AbsenceRequestScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Newspaper,
  MessageSquare,
  User as UserIcon,
  CheckCircle2,
} from 'lucide-react-native';

type TeacherTab = 'dashboard' | 'schedule' | 'academics' | 'announcements' | 'messages' | 'profile';

interface TeacherNavProps {
  onLogout: () => void;
}

export const TeacherNav: React.FC<TeacherNavProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<TeacherTab>('dashboard');

  // Modales
  const [showAbsencesModal, setShowAbsencesModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgSurface} />

      {/* En-tête Enseignant */}
      <Header
        onNotificationPress={() => setShowNotificationsModal(true)}
        unreadNotifications={1}
        onRolePress={() => setActiveTab('profile')}
      />

      {/* Barre d'accès rapide Enseignant */}
      <View style={styles.utilityBar}>
        <TouchableOpacity
          style={styles.utilityItem}
          onPress={() => setShowAbsencesModal(true)}
        >
          <CheckCircle2 size={13} color={Colors.warningText} />
          <Text style={styles.utilityText}>Absences à consulter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.utilityItem}
          onPress={() => setActiveTab('announcements')}
        >
          <Newspaper size={13} color={Colors.primary} />
          <Text style={styles.utilityText}>Publier une annonce</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.utilityItem}
          onPress={() => setActiveTab('messages')}
        >
          <MessageSquare size={13} color={Colors.aiPurple} />
          <Text style={styles.utilityText}>Discussions Étudiants</Text>
        </TouchableOpacity>
      </View>

      {/* Contenu principal Enseignant */}
      <View style={styles.content}>
        {activeTab === 'dashboard' && (
          <TeacherDashboardScreen
            onNavigate={(target) => {
              if (target === 'schedule') setActiveTab('schedule');
              else if (target === 'academics') setActiveTab('academics');
              else if (target === 'announcements') setActiveTab('announcements');
              else if (target === 'messaging') setActiveTab('messages');
              else if (target === 'absences') setShowAbsencesModal(true);
            }}
            onOpenNotifications={() => setShowNotificationsModal(true)}
          />
        )}

        {activeTab === 'schedule' && <ScheduleScreen />}

        {activeTab === 'academics' && <AcademicsScreen />}

        {activeTab === 'announcements' && <AnnouncementsScreen />}

        {activeTab === 'messages' && <MessagingScreen />}

        {activeTab === 'profile' && (
          <ProfileScreen
            onLogout={onLogout}
            onOpenAdmin={() => {}}
          />
        )}
      </View>

      {/* Barre d'onglets inférieure dédiée Enseignant */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navTab, activeTab === 'dashboard' && styles.navTabActive]}
          onPress={() => setActiveTab('dashboard')}
          activeOpacity={0.7}
        >
          <LayoutDashboard
            size={18}
            color={activeTab === 'dashboard' ? Colors.primary : Colors.textMuted}
          />
          <Text style={[styles.navLabel, activeTab === 'dashboard' && styles.navLabelActive]}>
            Tableau de bord
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'schedule' && styles.navTabActive]}
          onPress={() => setActiveTab('schedule')}
          activeOpacity={0.7}
        >
          <Calendar
            size={18}
            color={activeTab === 'schedule' ? Colors.primary : Colors.textMuted}
          />
          <Text style={[styles.navLabel, activeTab === 'schedule' && styles.navLabelActive]}>
            Mes Cours
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'academics' && styles.navTabActive]}
          onPress={() => setActiveTab('academics')}
          activeOpacity={0.7}
        >
          <ClipboardList
            size={18}
            color={activeTab === 'academics' ? Colors.primary : Colors.textMuted}
          />
          <Text style={[styles.navLabel, activeTab === 'academics' && styles.navLabelActive]}>
            Devoirs
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

      {/* Modale Absences des étudiants */}
      <Modal visible={showAbsencesModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgLight }}>
          <View style={styles.modalHeaderBar}>
            <Text style={styles.modalHeaderTitle}>Absences signalées dans vos cours</Text>
            <TouchableOpacity onPress={() => setShowAbsencesModal(false)}>
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <AbsenceRequestScreen />
        </SafeAreaView>
      </Modal>

      {/* Modale Notifications */}
      <Modal visible={showNotificationsModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgLight }}>
          <View style={styles.modalHeaderBar}>
            <Text style={styles.modalHeaderTitle}>Notifications Enseignant</Text>
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
