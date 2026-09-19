import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { Colors } from './src/theme/colors';

// Écrans d'authentification
import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';

// Navigations isolées par Rôle
import { StudentNav } from './src/navigation/StudentNav';
import { TeacherNav } from './src/navigation/TeacherNav';
import { AdminNav } from './src/navigation/AdminNav';

type AppScreenState = 'splash' | 'login' | 'register' | 'main';

function MainAppContent() {
  const { role } = useAuth();
  const [screenState, setScreenState] = useState<AppScreenState>('splash');

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

  // --- Routage strict par rôle d'accès ---
  if (role === 'TEACHER') {
    return <TeacherNav onLogout={() => setScreenState('splash')} />;
  }

  if (role === 'ADMIN') {
    return <AdminNav onLogout={() => setScreenState('splash')} />;
  }

  // Par défaut : Espace Étudiant
  return <StudentNav onLogout={() => setScreenState('splash')} />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgLight,
  },
});
