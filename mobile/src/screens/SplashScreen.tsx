import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Sparkles,
  Search,
  ShieldCheck,
  ChevronRight,
  GraduationCap,
} from 'lucide-react-native';

interface SplashScreenProps {
  onLoginPress: () => void;
  onRegisterPress: () => void;
  onContinueAsGuest: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onLoginPress,
  onRegisterPress,
  onContinueAsGuest,
}) => {
  const { switchDemoRole } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section with Brand Logo */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandTitle}>CampusConnect</Text>
          <View style={styles.aiTagRow}>
            <LinearGradient
              colors={['#1E3A8A', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.aiGradientBadge}
            >
              <Sparkles size={12} color="#FFF" />
              <Text style={styles.aiBadgeText}>INTELLIGENCE ARTIFICIELLE</Text>
            </LinearGradient>
          </View>
          <Text style={styles.slogan}>Ton campus, plus proche.</Text>
          <Text style={styles.description}>
            Centralisez vos cours, votre emploi du temps, vos démarches administratives et retrouvez vos objets perdus grâce à l'IA.
          </Text>
        </View>

        {/* Feature Highlights Cards */}
        <View style={styles.featuresSection}>
          <View style={styles.featureCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Calendar size={20} color={Colors.primary} />
            </View>
            <View style={styles.featureTextBox}>
              <Text style={styles.featureTitle}>Emploi du Temps Intelligent</Text>
              <Text style={styles.featureDesc}>
                Détection automatique des changements de salle et des horaires modifiés.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Search size={20} color={Colors.accentGoldDark} />
            </View>
            <View style={styles.featureTextBox}>
              <Text style={styles.featureTitle}>Objets Perdus & Trouvés (IA)</Text>
              <Text style={styles.featureDesc}>
                Algorithme de similarité sémantique pour vous alerter dès qu'un objet vous correspondant est trouvé.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#F3E8FF' }]}>
              <Sparkles size={20} color={Colors.aiPurple} />
            </View>
            <View style={styles.featureTextBox}>
              <Text style={styles.featureTitle}>Assistant IA Dédié</Text>
              <Text style={styles.featureDesc}>
                Posez vos questions sur vos cours, devoirs et démarches administratives 24h/24.
              </Text>
            </View>
          </View>
        </View>

        {/* Main Action Buttons */}
        <View style={styles.actionsSection}>
          <Button
            title="Se connecter"
            onPress={onLoginPress}
            size="lg"
            variant="primary"
            style={styles.mainBtn}
          />
          <Button
            title="Créer un compte étudiant"
            onPress={onRegisterPress}
            size="lg"
            variant="outline"
            style={styles.secondaryBtn}
          />

          {/* Quick Demo Access Bar */}
          <View style={styles.demoBar}>
            <Text style={styles.demoLabel}>Accès Démo Rapide (1-clic) :</Text>
            <View style={styles.demoButtonsRow}>
              <TouchableOpacity
                style={styles.demoPill}
                onPress={() => {
                  switchDemoRole('STUDENT');
                  onContinueAsGuest();
                }}
              >
                <GraduationCap size={14} color={Colors.primary} />
                <Text style={styles.demoPillText}>Étudiant</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoPill}
                onPress={() => {
                  switchDemoRole('TEACHER');
                  onContinueAsGuest();
                }}
              >
                <Sparkles size={14} color={Colors.accentGoldDark} />
                <Text style={styles.demoPillText}>Enseignant</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoPill}
                onPress={() => {
                  switchDemoRole('ADMIN');
                  onContinueAsGuest();
                }}
              >
                <ShieldCheck size={14} color={Colors.danger} />
                <Text style={styles.demoPillText}>Admin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgLight,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingVertical: 30,
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 26,
    width: '100%',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: Colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  logoImage: {
    width: 86,
    height: 86,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.primaryDark,
    letterSpacing: -0.5,
  },
  aiTagRow: {
    marginVertical: 6,
  },
  aiGradientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  aiBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  slogan: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryLight,
    marginTop: 4,
  },
  description: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
    paddingHorizontal: 10,
  },
  featuresSection: {
    width: '100%',
    marginBottom: 26,
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextBox: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textDark,
  },
  featureDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  actionsSection: {
    width: '100%',
  },
  mainBtn: {
    width: '100%',
    marginBottom: 10,
  },
  secondaryBtn: {
    width: '100%',
    marginBottom: 20,
  },
  demoBar: {
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
  },
  demoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.bgLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  demoPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textDark,
  },
});
