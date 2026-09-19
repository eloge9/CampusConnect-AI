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
import { User as UserIcon, Mail, Lock, BookOpen, ArrowLeft } from 'lucide-react-native';

interface RegisterScreenProps {
  onSuccess: () => void;
  onLoginPress: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSuccess, onLoginPress }) => {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<number | null>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await register({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        class_id: selectedClassId,
      });
      Alert.alert('Succès', 'Votre compte a été créé avec succès !');
      onSuccess();
    } catch (e: any) {
      setErrorMsg(e.message || 'Erreur lors de la création du compte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={onLoginPress}>
          <ArrowLeft size={20} color={Colors.primary} />
          <Text style={styles.backBtnText}>Retour à la connexion</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>
            Rejoignez CampusConnect AI pour votre promotion
          </Text>
        </View>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Prénom *</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Alexandre"
                  placeholderTextColor={Colors.textMuted}
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Nom *</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Dubois"
                  placeholderTextColor={Colors.textMuted}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>
          </View>

          <Text style={styles.inputLabel}>Email universitaire *</Text>
          <View style={styles.inputRow}>
            <Mail size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="alexandre.dubois@campus.fr"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.inputLabel}>Mot de passe *</Text>
          <View style={styles.inputRow}>
            <Lock size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Minimum 8 caractères"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <Text style={styles.inputLabel}>Classe / Filière</Text>
          <View style={styles.classSelector}>
            <TouchableOpacity
              style={[
                styles.classOption,
                selectedClassId === 1 && styles.classOptionActive,
              ]}
              onPress={() => setSelectedClassId(1)}
            >
              <BookOpen size={16} color={selectedClassId === 1 ? Colors.primary : Colors.textMuted} />
              <View>
                <Text
                  style={[
                    styles.classOptionTitle,
                    selectedClassId === 1 && styles.classOptionTitleActive,
                  ]}
                >
                  L3 Informatique
                </Text>
                <Text style={styles.classOptionSub}>Science des Données & Systèmes</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.classOption,
                selectedClassId === 2 && styles.classOptionActive,
              ]}
              onPress={() => setSelectedClassId(2)}
            >
              <BookOpen size={16} color={selectedClassId === 2 ? Colors.primary : Colors.textMuted} />
              <View>
                <Text
                  style={[
                    styles.classOptionTitle,
                    selectedClassId === 2 && styles.classOptionTitleActive,
                  ]}
                >
                  M1 Génie Logiciel
                </Text>
                <Text style={styles.classOptionSub}>Architectures Logicielles Avancées</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Button
            title="Créer mon compte"
            onPress={handleRegister}
            loading={loading}
            size="lg"
            variant="primary"
            style={styles.submitBtn}
          />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Vous avez déjà un compte ? </Text>
          <TouchableOpacity onPress={onLoginPress}>
            <Text style={styles.loginLink}>Se connecter</Text>
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
    paddingVertical: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 54,
    height: 54,
    borderRadius: 12,
    marginBottom: 10,
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
    textAlign: 'center',
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
  nameRow: {
    flexDirection: 'row',
    gap: 10,
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
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.textDark,
  },
  classSelector: {
    gap: 8,
    marginTop: 4,
  },
  classOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgLight,
  },
  classOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  classOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textDark,
  },
  classOptionTitleActive: {
    color: Colors.primary,
  },
  classOptionSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  submitBtn: {
    marginTop: 20,
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
  loginLink: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
});
