import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  User as UserIcon,
  Shield,
  GraduationCap,
  Sparkles,
  Server,
  LogOut,
  ChevronRight,
  RefreshCw,
  Award,
} from 'lucide-react-native';

interface ProfileScreenProps {
  onLogout: () => void;
  onOpenAdmin: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout, onOpenAdmin }) => {
  const {
    user,
    role,
    switchDemoRole,
    serverUrl,
    updateServerUrl,
    checkBackendHealth,
    isBackendConnected,
    logout,
  } = useAuth();

  const [inputUrl, setInputUrl] = useState(serverUrl);
  const [checking, setChecking] = useState(false);

  const handleRoleSwitch = async (newRole: UserRole) => {
    await switchDemoRole(newRole);
    Alert.alert(
      'Rôle actif modifié',
      `Vous utilisez maintenant l’interface en tant que ${
        newRole === 'STUDENT' ? 'Étudiant' : newRole === 'TEACHER' ? 'Enseignant' : 'Administrateur'
      }.`
    );
  };

  const handleHealthCheck = async () => {
    setChecking(true);
    const ok = await checkBackendHealth();
    setChecking(false);
    Alert.alert(
      ok ? 'Connexion réussie !' : 'Serveur inaccessible',
      ok
        ? `Le backend FastAPI répond correctement à l'adresse : ${serverUrl}`
        : `Impossible de contacter le serveur sur ${serverUrl}. Vérifiez que uvicorn est lancé.`
    );
  };

  const handleSaveUrl = async () => {
    await updateServerUrl(inputUrl);
    await handleHealthCheck();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* User Info Card */}
      <Card style={styles.profileCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user ? `${user.first_name[0]}${user.last_name[0]}` : 'CC'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>
              {user ? `${user.first_name} ${user.last_name}` : 'Utilisateur'}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.roleBadgeRow}>
              <Badge
                label={role === 'STUDENT' ? 'ÉTUDIANT' : role === 'TEACHER' ? 'ENSEIGNANT' : 'ADMINISTRATEUR'}
                tone={role === 'ADMIN' ? 'danger' : role === 'TEACHER' ? 'warning' : 'info'}
                size="sm"
              />
              {role === 'STUDENT' && (
                <Badge label={user?.classe?.code || (user?.class_id === 2 ? 'M1-GL' : 'L3-INFO')} tone="neutral" size="sm" />
              )}
            </View>
          </View>
        </View>

        {role === 'STUDENT' && (
          <View style={styles.studentDetailsRow}>
            <View style={styles.studentDetailItem}>
              <Text style={styles.detailLabel}>N° Étudiant</Text>
              <Text style={styles.detailVal}>{user?.id ? `ETU-${user.id + 202400}` : 'ETU-2024042'}</Text>
            </View>
            <View style={styles.studentDetailItem}>
              <Text style={styles.detailLabel}>Filière</Text>
              <Text style={styles.detailVal}>{user?.classe?.code || (user?.class_id === 2 ? 'M1 Génie Log.' : 'L3 Info.')}</Text>
            </View>
            <View style={styles.studentDetailItem}>
              <Text style={styles.detailLabel}>Promotion</Text>
              <Text style={styles.detailVal}>2025 / 2026</Text>
            </View>
          </View>
        )}
      </Card>

      {/* Fast Demo Role Switcher */}
      <Text style={styles.sectionHeading}>Changer d'espace utilisateur (Démo)</Text>
      <Card style={styles.rolesCard}>
        <TouchableOpacity
          style={[styles.roleOption, role === 'STUDENT' && styles.roleOptionActive]}
          onPress={() => handleRoleSwitch('STUDENT')}
        >
          <GraduationCap size={20} color={role === 'STUDENT' ? Colors.primary : Colors.textMuted} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.roleOptionTitle, role === 'STUDENT' && styles.roleOptionTitleActive]}>
              Espace Étudiant (Alexandre Dubois)
            </Text>
            <Text style={styles.roleOptionSub}>
              Emploi du temps, devoirs, examens, déclarations d’objets et aide IA
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleOption, role === 'TEACHER' && styles.roleOptionActive]}
          onPress={() => handleRoleSwitch('TEACHER')}
        >
          <Sparkles size={20} color={role === 'TEACHER' ? Colors.accentGoldDark : Colors.textMuted} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.roleOptionTitle, role === 'TEACHER' && styles.roleOptionTitleActive]}>
              Espace Enseignant (Prof. Jean-Marc Lecoq)
            </Text>
            <Text style={styles.roleOptionSub}>
              Publication d'annonces, gestion des devoirs et séances
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleOption, role === 'ADMIN' && styles.roleOptionActive]}
          onPress={() => handleRoleSwitch('ADMIN')}
        >
          <Shield size={20} color={role === 'ADMIN' ? Colors.danger : Colors.textMuted} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.roleOptionTitle, role === 'ADMIN' && styles.roleOptionTitleActive]}>
              Espace Administration (Stéphane Duchêne)
            </Text>
            <Text style={styles.roleOptionSub}>
              Supervision des absences, modération des objets, métriques
            </Text>
          </View>
        </TouchableOpacity>

        {role === 'ADMIN' && (
          <Button
            title="Ouvrir le tableau de bord Administrateur"
            onPress={onOpenAdmin}
            variant="danger"
            size="sm"
            style={{ marginTop: 10 }}
          />
        )}
      </Card>

      {/* Backend API Configuration & Status */}
      <Text style={styles.sectionHeading}>Connexion au Backend FastAPI</Text>
      <Card style={styles.serverCard}>
        <View style={styles.serverStatusHeader}>
          <View style={styles.serverDotRow}>
            <View
              style={[
                styles.healthDot,
                { backgroundColor: isBackendConnected ? Colors.success : Colors.danger },
              ]}
            />
            <Text style={styles.healthStatusText}>
              {isBackendConnected ? 'Backend FastAPI connecté' : 'Mode local / Serveur déconnecté'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleHealthCheck} disabled={checking}>
            <RefreshCw size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.urlLabel}>URL de l'API :</Text>
        <TextInput
          style={styles.urlInput}
          value={inputUrl}
          onChangeText={setInputUrl}
          autoCapitalize="none"
        />
        <Button
          title="Appliquer l'URL et tester"
          onPress={handleSaveUrl}
          variant="outline"
          size="sm"
        />
      </Card>

      {/* Logout Button */}
      <Button
        title="Se déconnecter"
        onPress={async () => {
          await logout();
          onLogout();
        }}
        variant="ghost"
        icon={<LogOut size={16} color={Colors.danger} />}
        textStyle={{ color: Colors.danger, fontWeight: '700' }}
        style={{ marginTop: 10 }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgLight,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    marginBottom: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textDark,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  roleBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  studentDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  studentDetailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textDark,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 6,
  },
  rolesCard: {
    gap: 10,
    marginBottom: 16,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgLight,
  },
  roleOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  roleOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textDark,
  },
  roleOptionTitleActive: {
    color: Colors.primary,
  },
  roleOptionSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  serverCard: {
    marginBottom: 16,
  },
  serverStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  serverDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textDark,
  },
  urlLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  urlInput: {
    backgroundColor: Colors.bgLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: Colors.textDark,
    marginBottom: 10,
  },
});
