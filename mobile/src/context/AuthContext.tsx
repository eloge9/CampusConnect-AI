import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types';
import { api } from '../api/client';
import { DEMO_USERS } from '../data/mockData';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  token: string | null;
  isLoading: boolean;
  isBackendConnected: boolean;
  serverUrl: string;
  login: (email: string, pass: string) => Promise<void>;
  register: (body: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    class_id?: number | null;
  }) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
  updateServerUrl: (url: string) => Promise<void>;
  checkBackendHealth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [serverUrl, setServerUrlState] = useState<string>(api.getBaseUrl());

  const checkBackendHealth = async (): Promise<boolean> => {
    try {
      const resp = await fetch(`${api.getBaseUrl()}/sante`, { method: 'GET' });
      const ok = resp.ok;
      setIsBackendConnected(ok);
      return ok;
    } catch {
      setIsBackendConnected(false);
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        await api.loadToken();

        // 1. Restaurer le profil utilisateur sauvegardé s'il existe
        const savedProfileStr = await AsyncStorage.getItem('@campus_user_profile');
        if (savedProfileStr) {
          try {
            const savedProfile = JSON.parse(savedProfileStr);
            setUser(savedProfile);
            setRole(savedProfile.role);
          } catch {}
        } else {
          // Aucun profil personnalisé : vérifier si un rôle démo est enregistré
          const savedRole = await AsyncStorage.getItem('@campus_active_role');
          if (savedRole && (savedRole === 'STUDENT' || savedRole === 'TEACHER' || savedRole === 'ADMIN')) {
            setRole(savedRole as UserRole);
            if (savedRole === 'TEACHER') setUser(DEMO_USERS.teacher);
            else if (savedRole === 'ADMIN') setUser(DEMO_USERS.admin);
            else setUser(DEMO_USERS.student);
          } else {
            setUser(DEMO_USERS.student);
          }
        }

        // 2. Tenter de synchroniser en direct avec le backend
        const isOnline = await checkBackendHealth();
        if (isOnline) {
          try {
            const me = await api.getMe();
            setUser(me);
            setRole(me.role);
            await AsyncStorage.setItem('@campus_user_profile', JSON.stringify(me));
            await AsyncStorage.setItem('@campus_active_role', me.role);
          } catch {
            // Token expiré ou absent : conserver profil en cache
          }
        }
      } catch (e) {
        console.warn('Erreur initialisation AuthContext:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const resp = await api.login(email, pass);
      setTokenState(resp.access_token);
      const me = await api.getMe();
      setUser(me);
      setRole(me.role);
      await AsyncStorage.setItem('@campus_user_profile', JSON.stringify(me));
      await AsyncStorage.setItem('@campus_active_role', me.role);
      setIsBackendConnected(true);
    } catch (e: any) {
      // Si backend inaccessible, seulement si c'est un compte démo officiel
      const em = email.toLowerCase().trim();
      if (em.includes('admin@campusconnect.dev')) {
        setUser(DEMO_USERS.admin);
        setRole('ADMIN');
      } else if (em.includes('enseignant@campusconnect.dev')) {
        setUser(DEMO_USERS.teacher);
        setRole('TEACHER');
      } else if (em.includes('etudiant@campusconnect.dev')) {
        setUser(DEMO_USERS.student);
        setRole('STUDENT');
      }
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (body: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    class_id?: number | null;
  }) => {
    setIsLoading(true);
    try {
      await api.register(body);
      // Auto login après inscription avec les vraies données du nouvel utilisateur
      await login(body.email, body.password);
    } catch (e) {
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await api.setToken(null);
    setTokenState(null);
    setUser(null);
    await AsyncStorage.removeItem('@campus_token');
    await AsyncStorage.removeItem('@campus_user_profile');
    await AsyncStorage.removeItem('@campus_active_role');
  };

  const switchDemoRole = async (newRole: UserRole) => {
    setRole(newRole);
    let demoProfile = DEMO_USERS.student;
    if (newRole === 'TEACHER') demoProfile = DEMO_USERS.teacher;
    else if (newRole === 'ADMIN') demoProfile = DEMO_USERS.admin;

    setUser(demoProfile);
    await AsyncStorage.setItem('@campus_user_profile', JSON.stringify(demoProfile));
    await AsyncStorage.setItem('@campus_active_role', newRole);

    // Tenter de se connecter avec le compte démo réel si le backend est actif
    try {
      let email = 'etudiant@campusconnect.dev';
      let pass = 'StudentDemo123!';
      if (newRole === 'TEACHER') {
        email = 'enseignant@campusconnect.dev';
        pass = 'TeacherDemo123!';
      } else if (newRole === 'ADMIN') {
        email = 'admin@campusconnect.dev';
        pass = 'AdminDemo123!';
      }
      const data = await api.login(email, pass);
      setTokenState(data.access_token);
      const me = await api.getMe();
      setUser(me);
      setIsBackendConnected(true);
    } catch {
      // Conserver les données locales
    }
  };

  const updateServerUrl = async (url: string) => {
    await api.setBaseUrl(url);
    setServerUrlState(url);
    await checkBackendHealth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isLoading,
        isBackendConnected,
        serverUrl,
        login,
        register,
        logout,
        switchDemoRole,
        updateServerUrl,
        checkBackendHealth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
