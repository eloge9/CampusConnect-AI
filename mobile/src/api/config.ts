import { Platform } from 'react-native';

// Par défaut, l'émulateur Android accède à la machine hôte via 10.0.2.2
// Sur le web ou iOS simulator, c'est localhost
const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

export const ApiConfig = {
  baseUrl: DEFAULT_HOST,
  timeout: 10000,
  endpoints: {
    login: '/auth/connexion',
    register: '/auth/inscription',
    me: '/auth/moi',
    classes: '/classes',
    subjects: '/matieres',
    announcements: '/annonces',
    schedules: '/emploi-du-temps',
    assignments: '/devoirs',
    exams: '/examens',
    absences: '/absences',
    lostFound: '/objets-perdus-trouves',
    potentialMatches: '/correspondances',
    notifications: '/notifications',
    conversations: '/conversations',
    assistant: '/assistant/question',
    adminStats: '/administration/statistiques',
  },
};
