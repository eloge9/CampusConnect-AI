import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  Lock,
  GraduationCap,
  Sparkles,
  Shield,
  Server,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';

interface LoginScreenProps {
  onSuccess: () => void;
  onRegisterPress: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess, onRegisterPress }) => {
  const { login, switchDemoRole, serverUrl, updateServerUrl, isBackendConnected } = useAuth();
  const [email, setEmail] = useState('etudiant@campusconnect.dev');
  const [password, setPassword] = useState('StudentDemo123!');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState(serverUrl);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Veuillez renseigner votre email et mot de passe.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (e: any) {
      setErrorMsg(e.message || 'Identifiants invalides ou serveur inaccessible.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: 'STUDENT' | 'TEACHER' | 'ADMIN') => {
    setErrorMsg('');
    if (role === 'STUDENT') {
      setEmail('etudiant@campusconnect.dev');
      setPassword('StudentDemo123!');
    } else if (role === 'TEACHER') {
      setEmail('enseignant@campusconnect.dev');
      setPassword('TeacherDemo123!');
    } else {
      setEmail('admin@campusconnect.dev');
      setPassword('AdminDemo123!');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>
            Accédez à votre espace CampusConnect AI
          </Text>
        </View>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <Text style={styles.inputLabel}>Adresse email universitaire</Text>
          <View style={styles.inputRow}>
            <Mail size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="ex: etudiant@campusconnect.dev"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.inputLabel}>Mot de passe</Text>
          <View style={styles.inputRow}>
            <Lock size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••••••"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <Button
            title="Se connecter"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            variant="primary"
            style={styles.submitBtn}
          />
        </View>

        {/* Demo Accounts Quick-Fill */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>Comptes de démonstration (1-clic) :</Text>
          <View style={styles.demoGrid}>
            <TouchableOpacity
              style={[styles.demoCard, email.includes('etudiant') && styles.demoCardActive]}
              onPress={() => fillDemo('STUDENT')}
            >
              <GraduationCap size={16} color={Colors.primary} />
              <Text style={styles.demoCardText}>Étudiant</Text>
              <Text style={styles.demoSub}>Alexandre</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoCard, email.includes('enseignant') && styles.demoCardActive]}
              onPress={() => fillDemo('TEACHER')}
            >
              <Sparkles size={16} color={Colors.accentGoldDark} />
              <Text style={styles.demoCardText}>Enseignant</Text>
              <Text style={styles.demoSub}>Jean-Marc</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoCard, email.includes('admin') && styles.demoCardActive]}
              onPress={() => fillDemo('ADMIN')}
            >
              <Shield size={16} color={Colors.danger} />
              <Text style={styles.demoCardText}>Admin</Text>
              <Text style={styles.demoSub}>Stéphane</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Server URL Config Toggle */}
        <View style={styles.serverConfigBox}>
          <TouchableOpacity
            style={styles.serverToggleHeader}
            onPress={() => setShowServerConfig(!showServerConfig)}
          >
            <View style={styles.serverStatusRow}>
              <Server size={14} color={Colors.textMuted} />
              <Text style={styles.serverLabel}>Backend FastAPI : {serverUrl}</Text>
            </View>
            {showServerConfig ? (
              <ChevronUp size={16} color={Colors.textMuted} />
            ) : (
              <ChevronDown size={16} color={Colors.textMuted} />
            )}
          </TouchableOpacity>

          {showServerConfig && (
            <View style={styles.serverInputBox}>
              <Text style={styles.serverHint}>
                Pour tester sur smartphone réel, remplacez localhost par l'adresse IP locale de votre PC (ex: http://192.168.1.50:8000).
              </Text>
              <TextInput
                style={styles.serverInput}
                value={customUrl}
                onChangeText={setCustomUrl}
                autoCapitalize="none"
              />
              <Button
                title="Mettre à jour l'URL"
                size="sm"
                variant="outline"
                onPress={async () => {
                  await updateServerUrl(customUrl);
                  Alert.alert('Succès', 'URL du serveur mise à jour.');
                }}
              />
            </View>
          )}
        </View>

        {/* Register navigation link */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Pas encore de compte ? </Text>
          <TouchableOpacity onPress={onRegisterPress}>
            <Text style={styles.registerLink}>Créer un compte</Text>
          </TouchableOpacity>
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
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 14,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textDark,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: Colors.dangerLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: Colors.dangerText,
    fontSize: 12,
    fontWeight: '600',
  },
  form: {
    backgroundColor: Colors.bgSurface,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 6,
    marginTop: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textDark,
  },
  submitBtn: {
    marginTop: 20,
  },
  demoSection: {
    backgroundColor: Colors.bgSurface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  demoGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  demoCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.bgLight,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  demoCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  demoCardText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textDark,
    marginTop: 4,
  },
  demoSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  serverConfigBox: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 20,
  },
  serverToggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serverStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  serverLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  serverInputBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  serverHint: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
    marginBottom: 8,
  },
  serverInput: {
    backgroundColor: Colors.bgLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
});
