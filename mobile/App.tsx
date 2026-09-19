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
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { Colors } from './src/theme/colors';
import { Header } from './src/components/Header';

// Screens
import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ScheduleScreen } from './src/screens/ScheduleScreen';
import { AcademicsScreen } from './src/screens/AcademicsScreen';
import { LostFoundScreen } from './src/screens/LostFoundScreen';
import { DeclareLostFoundScreen } from './src/screens/DeclareLostFoundScreen';
import { AIAssistantScreen } from './src/screens/AIAssistantScreen';
import { AnnouncementsScreen } from './src/screens/AnnouncementsScreen';
import { AbsenceRequestScreen } from './src/screens/AbsenceRequestScreen';
import { MessagingScreen } from './src/screens/MessagingScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AdminScreen } from './src/screens/AdminScreen';

import {
  Home,
  Calendar,
  ClipboardList,
  Search,
  Sparkles,
  User as UserIcon,
  Bell,
  MessageSquare,
  Newspaper,
  Shield,
} from 'lucide-react-native';

type AppScreenState = 'splash' | 'login' | 'register' | 'main';
type MainTab = 'home' | 'schedule' | 'academics' | 'lost' | 'assistant' | 'profile';

function MainAppContent() {
  const { user, role, switchDemoRole } = useAuth();
  const [screenState, setScreenState] = useState<AppScreenState>('splash');
  const [activeTab, setActiveTab] = useState<MainTab>('home');

  // Modal Overlays
  const [showDeclareModal, setShowDeclareModal] = useState(false);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [showAbsencesModal, setShowAbsencesModal] = useState(false);
  const [showMessagingModal, setShowMessagingModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  if (screenState === 'splash') {
    return (
      <SplashScreen
        onLoginPress={() => setScreenState('login')}
        onRegisterPress={() => setScreenState('register')}
        onContinueAsGuest={() => setScreenState('main')}
      />
    );
  }

  if (screenState === 'login') {
    return (
      <LoginScreen
        onSuccess={() => setScreenState('main')}
        onRegisterPress={() => setScreenState('register')}
      />
    );
  }

  if (screenState === 'register') {
    return (
      <RegisterScreen
        onSuccess={() => setScreenState('main')}
        onLoginPress={() => setScreenState('login')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgSurface} />

      {/* Top Application Header */}
      <Header
        onNotificationPress={() => setShowNotificationsModal(true)}
        unreadNotifications={2}
        onRolePress={() => setActiveTab('profile')}
      />

      {/* Quick Access Utility Bar */}
      <View style={styles.utilityBar}>
        <TouchableOpacity
          style={styles.utilityItem}
          onPress={() => setShowAnnouncementsModal(true)}
        >
          <Newspaper size={14} color={Colors.primary} />
          <Text style={styles.utilityText}>Annonces (4)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.utilityItem}
          onPress={() => setShowAbsencesModal(true)}
        >
          <ClipboardList size={14} color={Colors.danger} />
          <Text style={styles.utilityText}>Absences</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.utilityItem}
          onPress={() => setShowMessagingModal(true)}
        >
          <MessageSquare size={14} color={Colors.primaryLight} />
          <Text style={styles.utilityText}>Messages</Text>
        </TouchableOpacity>

        {role === 'ADMIN' && (
          <TouchableOpacity
            style={[styles.utilityItem, { backgroundColor: '#FEE2E2' }]}
            onPress={() => setShowAdminModal(true)}
          >
            <Shield size={14} color={Colors.danger} />
            <Text style={[styles.utilityText, { color: Colors.dangerText }]}>Admin</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Tab Screen Content */}
      <View style={styles.contentContainer}>
        {activeTab === 'home' && (
          <HomeScreen
            onNavigate={(target) => {
              if (target === 'absences') setShowAbsencesModal(true);
              else if (target === 'announcements') setShowAnnouncementsModal(true);
              else if (target === 'lost') setActiveTab('lost');
              else if (target === 'assistant') setActiveTab('assistant');
              else if (target === 'academics') setActiveTab('academics');
              else if (target === 'schedule') setActiveTab('schedule');
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

        {activeTab === 'lost' && (
          <LostFoundScreen onOpenDeclareModal={() => setShowDeclareModal(true)} />
        )}

        {activeTab === 'assistant' && (
          <AIAssistantScreen onNavigateTab={(tab) => setActiveTab(tab as MainTab)} />
        )}

        {activeTab === 'profile' && (
          <ProfileScreen
            onLogout={() => setScreenState('splash')}
            onOpenAdmin={() => setShowAdminModal(true)}
          />
        )}
      </View>

      {/* Bottom Floating Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navTab, activeTab === 'home' && styles.navTabActive]}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.7}
        >
          <Home
            size={20}
            color={activeTab === 'home' ? Colors.primary : Colors.textMuted}
          />
          <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>
            Accueil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'schedule' && styles.navTabActive]}
          onPress={() => setActiveTab('schedule')}
          activeOpacity={0.7}
        >
          <Calendar
            size={20}
            color={activeTab === 'schedule' ? Colors.primary : Colors.textMuted}
          />
          <Text
            style={[styles.navLabel, activeTab === 'schedule' && styles.navLabelActive]}
          >
            Planning
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'academics' && styles.navTabActive]}
          onPress={() => setActiveTab('academics')}
          activeOpacity={0.7}
        >
          <ClipboardList
            size={20}
            color={activeTab === 'academics' ? Colors.primary : Colors.textMuted}
          />
          <Text
            style={[styles.navLabel, activeTab === 'academics' && styles.navLabelActive]}
          >
            Devoirs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'lost' && styles.navTabActive]}
          onPress={() => setActiveTab('lost')}
          activeOpacity={0.7}
        >
          <Search
            size={20}
            color={activeTab === 'lost' ? Colors.primary : Colors.textMuted}
          />
          <Text style={[styles.navLabel, activeTab === 'lost' && styles.navLabelActive]}>
            Objets
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'assistant' && styles.navTabActive]}
          onPress={() => setActiveTab('assistant')}
          activeOpacity={0.7}
        >
          <Sparkles
            size={20}
            color={activeTab === 'assistant' ? Colors.aiPurple : Colors.textMuted}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === 'assistant' && { color: Colors.aiPurple, fontWeight: '800' },
            ]}
          >
            IA Campus
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'profile' && styles.navTabActive]}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <UserIcon
            size={20}
            color={activeTab === 'profile' ? Colors.primary : Colors.textMuted}
          />
          <Text
            style={[styles.navLabel, activeTab === 'profile' && styles.navLabelActive]}
          >
            Profil
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODAL: Declare Lost/Found Object */}
      <Modal visible={showDeclareModal} animationType="slide">
        <DeclareLostFoundScreen
          onBack={() => setShowDeclareModal(false)}
          onSuccess={() => {
            setShowDeclareModal(false);
            setActiveTab('lost');
          }}
        />
      </Modal>

      {/* MODAL: Campus Announcements */}
      <Modal visible={showAnnouncementsModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgLight }}>
          <View style={styles.modalHeaderBar}>
            <Text style={styles.modalHeaderTitle}>Annonces du Campus</Text>
            <TouchableOpacity
              onPress={() => setShowAnnouncementsModal(false)}
              style={styles.modalCloseBtn}
            >
              <Text style={styles.modalCloseBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <AnnouncementsScreen />
        </SafeAreaView>
      </Modal>

      {/* MODAL: Absence Declarations */}
      <Modal visible={showAbsencesModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgLight }}>
          <View style={styles.modalHeaderBar}>
            <Text style={styles.modalHeaderTitle}>Démarches d’Absence</Text>
            <TouchableOpacity
              onPress={() => setShowAbsencesModal(false)}
              style={styles.modalCloseBtn}
            >
              <Text style={styles.modalCloseBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <AbsenceRequestScreen />
        </SafeAreaView>
      </Modal>

      {/* MODAL: Messaging & Groups */}
      <Modal visible={showMessagingModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgLight }}>
          <View style={styles.modalHeaderBar}>
            <Text style={styles.modalHeaderTitle}>Messagerie & Groupes</Text>
            <TouchableOpacity
              onPress={() => setShowMessagingModal(false)}
              style={styles.modalCloseBtn}
            >
              <Text style={styles.modalCloseBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <MessagingScreen />
        </SafeAreaView>
      </Modal>

      {/* MODAL: Notifications Center */}
      <Modal visible={showNotificationsModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgLight }}>
          <View style={styles.modalHeaderBar}>
            <Text style={styles.modalHeaderTitle}>Centre de Notifications</Text>
            <TouchableOpacity
              onPress={() => setShowNotificationsModal(false)}
              style={styles.modalCloseBtn}
            >
              <Text style={styles.modalCloseBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <NotificationsScreen />
        </SafeAreaView>
      </Modal>

      {/* MODAL: Admin Console */}
      <Modal visible={showAdminModal} animationType="slide">
        <AdminScreen onBack={() => setShowAdminModal(false)} />
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
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
  contentContainer: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSurface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
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
    paddingHorizontal: 6,
    borderRadius: 8,
    minWidth: 50,
  },
  navTabActive: {
    backgroundColor: '#EFF6FF',
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 3,
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
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textDark,
  },
  modalCloseBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});
