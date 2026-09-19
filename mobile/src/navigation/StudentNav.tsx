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

// Écrans Étudiant
import { HomeScreen } from '../screens/HomeScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { AcademicsScreen } from '../screens/AcademicsScreen';
import { GradesScreen } from '../screens/GradesScreen';
import { LostFoundScreen } from '../screens/LostFoundScreen';
import { DeclareLostFoundScreen } from '../screens/DeclareLostFoundScreen';
import { AIAssistantScreen } from '../screens/AIAssistantScreen';
import { AnnouncementsScreen } from '../screens/AnnouncementsScreen';
import { AbsenceRequestScreen } from '../screens/AbsenceRequestScreen';
import { MessagingScreen } from '../screens/MessagingScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

import {
  Home,
  Calendar,
  ClipboardList,
  Award,
  Search,
  Sparkles,
  User as UserIcon,
  Newspaper,
  MessageSquare,
} from 'lucide-react-native';

type StudentTab = 'home' | 'schedule' | 'academics' | 'grades' | 'lost' | 'assistant' | 'profile';

interface StudentNavProps {
  onLogout: () => void;
}

export const StudentNav: React.FC<StudentNavProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<StudentTab>('home');

  // Modales
  const [showDeclareModal, setShowDeclareModal] = useState(false);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [showAbsencesModal, setShowAbsencesModal] = useState(false);
  const [showMessagingModal, setShowMessagingModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgSurface} />

      {/* En-tête Étudiant */}
      <Header
        onNotificationPress={() => setShowNotificationsModal(true)}
        unreadNotifications={2}
        onRolePress={() => setActiveTab('profile')}
      />

      {/* Barre d'accès rapide Étudiant (Pas de bouton admin) */}
      <View style={styles.utilityBar}>
        <TouchableOpacity
          style={styles.utilityItem}
          onPress={() => setShowAnnouncementsModal(true)}
        >
          <Newspaper size={13} color={Colors.primary} />
          <Text style={styles.utilityText}>Annonces Campus</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.utilityItem}
          onPress={() => setShowAbsencesModal(true)}
        >
          <ClipboardList size={13} color={Colors.danger} />
          <Text style={styles.utilityText}>Mes Absences</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.utilityItem}
          onPress={() => setShowMessagingModal(true)}
        >
          <MessageSquare size={13} color={Colors.primaryLight} />
          <Text style={styles.utilityText}>Messages & Groupes</Text>
        </TouchableOpacity>
      </View>

      {/* Contenu principal de l'onglet actif */}
      <View style={styles.content}>
        {activeTab === 'home' && (
          <HomeScreen
            onNavigate={(target) => {
              if (target === 'absences') setShowAbsencesModal(true);
              else if (target === 'announcements') setShowAnnouncementsModal(true);
              else if (target === 'lost') setActiveTab('lost');
              else if (target === 'assistant') setActiveTab('assistant');
              else if (target === 'academics') setActiveTab('academics');
              else if (target === 'schedule') setActiveTab('schedule');
              else if (target === 'grades') setActiveTab('grades');
            }}
            onOpenNotifications={() => setShowNotificationsModal(true)}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleScreen
            onDeclareAbsenceForSchedule={() => setShowAbsencesModal(true)}
          />
        )}

        {activeTab === 'academics' && <AcademicsScreen />}

        {activeTab === 'grades' && <GradesScreen />}

        {activeTab === 'lost' && (
          <LostFoundScreen onOpenDeclareModal={() => setShowDeclareModal(true)} />
        )}

        {activeTab === 'assistant' && (
          <AIAssistantScreen onNavigateTab={(tab) => setActiveTab(tab as StudentTab)} />
        )}

        {activeTab === 'profile' && (
          <ProfileScreen
            onLogout={onLogout}
            onOpenAdmin={() => {}}
          />
        )}
      </View>

      {/* Barre d'onglets inférieure dédiée Étudiant */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navTab, activeTab === 'home' && styles.navTabActive]}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.7}
        >
          <Home size={18} color={activeTab === 'home' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>
            Accueil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'schedule' && styles.navTabActive]}
          onPress={() => setActiveTab('schedule')}
          activeOpacity={0.7}
        >
          <Calendar size={18} color={activeTab === 'schedule' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.navLabel, activeTab === 'schedule' && styles.navLabelActive]}>
            Planning
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'academics' && styles.navTabActive]}
          onPress={() => setActiveTab('academics')}
          activeOpacity={0.7}
        >
          <ClipboardList size={18} color={activeTab === 'academics' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.navLabel, activeTab === 'academics' && styles.navLabelActive]}>
            Devoirs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'grades' && styles.navTabActive]}
          onPress={() => setActiveTab('grades')}
          activeOpacity={0.7}
        >
          <Award size={18} color={activeTab === 'grades' ? Colors.accentGoldDark : Colors.textMuted} />
          <Text
            style={[
              styles.navLabel,
              activeTab === 'grades' && { color: Colors.accentGoldDark, fontWeight: '800' },
            ]}
          >
            Notes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'lost' && styles.navTabActive]}
          onPress={() => setActiveTab('lost')}
          activeOpacity={0.7}
        >
          <Search size={18} color={activeTab === 'lost' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.navLabel, activeTab === 'lost' && styles.navLabelActive]}>
            Objets
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'assistant' && styles.navTabActive]}
          onPress={() => setActiveTab('assistant')}
          activeOpacity={0.7}
        >
          <Sparkles size={18} color={activeTab === 'assistant' ? Colors.aiPurple : Colors.textMuted} />
          <Text
            style={[
              styles.navLabel,
              activeTab === 'assistant' && { color: Colors.aiPurple, fontWeight: '800' },
            ]}
          >
            IA
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'profile' && styles.navTabActive]}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <UserIcon size={18} color={activeTab === 'profile' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.navLabel, activeTab === 'profile' && styles.navLabelActive]}>
            Profil
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modale Déclaration d'objet */}
      <Modal visible={showDeclareModal} animationType="slide">
        <DeclareLostFoundScreen
          onBack={() => setShowDeclareModal(false)}
          onSuccess={() => {
            setShowDeclareModal(false);
            setActiveTab('lost');
          }}
        />
      </Modal>

      {/* Modale Annonces */}
      <Modal visible={showAnnouncementsModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgLight }}>
          <View style={styles.modalHeaderBar}>
            <Text style={styles.modalHeaderTitle}>Annonces du Campus</Text>
            <TouchableOpacity onPress={() => setShowAnnouncementsModal(false)}>
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <AnnouncementsScreen />
        </SafeAreaView>
      </Modal>

      {/* Modale Absences */}
      <Modal visible={showAbsencesModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgLight }}>
          <View style={styles.modalHeaderBar}>
            <Text style={styles.modalHeaderTitle}>Mes Justificatifs d’Absence</Text>
            <TouchableOpacity onPress={() => setShowAbsencesModal(false)}>
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <AbsenceRequestScreen />
        </SafeAreaView>
      </Modal>

      {/* Modale Messagerie */}
      <Modal visible={showMessagingModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgLight }}>
          <View style={styles.modalHeaderBar}>
            <Text style={styles.modalHeaderTitle}>Messagerie Promotion & Enseignants</Text>
            <TouchableOpacity onPress={() => setShowMessagingModal(false)}>
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <MessagingScreen />
        </SafeAreaView>
      </Modal>

      {/* Modale Notifications */}
      <Modal visible={showNotificationsModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgLight }}>
          <View style={styles.modalHeaderBar}>
            <Text style={styles.modalHeaderTitle}>Centre de Notifications</Text>
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
    paddingHorizontal: 2,
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
