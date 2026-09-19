import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { AIHighlightBox } from '../components/AIHighlightBox';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  MOCK_SCHEDULES,
  MOCK_ASSIGNMENTS,
  MOCK_ANNOUNCEMENTS,
  MOCK_MATCH,
} from '../data/mockData';
import {
  Clock,
  MapPin,
  User as UserIcon,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Sparkles,
  ChevronRight,
  GraduationCap,
  Calendar,
  MessageSquare,
} from 'lucide-react-native';

interface HomeScreenProps {
  onNavigate: (tab: string, params?: any) => void;
  onOpenNotifications: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, onOpenNotifications }) => {
  const { user, role } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [claimState, setClaimState] = useState<'idle' | 'mine' | 'no'>('idle');

  const [nextCourse, setNextCourse] = useState(MOCK_SCHEDULES[0]);
  const [assignments, setAssignments] = useState(MOCK_ASSIGNMENTS);
  const [announcements, setAnnouncements] = useState(MOCK_ANNOUNCEMENTS);
  const [potentialMatch, setPotentialMatch] = useState(MOCK_MATCH);

  const loadData = async () => {
    try {
      const sch = await api.getSchedules();
      if (sch && sch.length > 0) {
        setNextCourse({
          ...sch[0],
          course_title: sch[0].affectation?.subject?.name || 'Intelligence Artificielle',
          teacher_name: sch[0].affectation?.teacher
            ? `Prof. ${sch[0].affectation.teacher.first_name} ${sch[0].affectation.teacher.last_name}`
            : 'Prof. Jean-Marc Lecoq',
          course_type: 'CM',
        });
      }
    } catch {
      // Offline fallback
    }

    try {
      const asgn = await api.getAssignments();
      if (asgn && asgn.length > 0) setAssignments(asgn);
    } catch {}

    try {
      const ann = await api.getAnnouncements();
      if (ann && ann.length > 0) setAnnouncements(ann);
    } catch {}

    try {
      const matches = await api.getPotentialMatches();
      if (matches && matches.length > 0) setPotentialMatch(matches[0]);
    } catch {}
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleClaim = async (mine: boolean) => {
    if (mine) {
      setClaimState('mine');
      try {
        await api.updateMatchStatus(potentialMatch.id, 'CONFIRMEE');
      } catch {}
      Alert.alert(
        'Demande transmise !',
        'Votre confirmation a été enregistrée. Présentez-vous à l’accueil avec une pièce d’identité pour récupérer votre clé USB.'
      );
    } else {
      setClaimState('no');
      try {
        await api.updateMatchStatus(potentialMatch.id, 'REJETEE');
      } catch {}
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome Greeting Header */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingTitle}>
          Ravi de vous revoir, {user?.first_name || 'Alexandre'} !
        </Text>
        <Text style={styles.greetingSubtitle}>
          {role === 'STUDENT'
            ? 'Vos serveurs de compilation tournent actuellement. L’assistant IA a analysé 3 nouveaux documents de cours pour vous aujourd’hui.'
            : role === 'TEACHER'
            ? 'Bienvenue sur votre espace enseignant. Vous avez 2 classes affectées et 1 devoir à corriger.'
            : 'Console de supervision système et administration CampusConnect AI.'}
        </Text>
      </View>

      {/* Academic Stat Badges */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>14,8/20</Text>
          <Text style={styles.statLabel}>Moyenne Générale</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.success }]}>96.2%</Text>
          <Text style={styles.statLabel}>Taux de Présence</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>14 / 30</Text>
          <Text style={styles.statLabel}>Crédits ECTS</Text>
        </View>
      </View>

      {/* PROCHAIN COURS CARD */}
      <Card style={styles.nextCourseCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardTitleRow}>
            <Clock size={16} color={Colors.primary} />
            <Text style={styles.cardTitle}>Prochain cours</Text>
          </View>
          <Badge label="Dans 25 min" tone="info" />
        </View>

        <View style={styles.chipsRow}>
          <Badge label="CM · INFORMATIQUE" tone="neutral" />
          {nextCourse.status === 'MODIFIE' && (
            <Badge label="SALLE MODIFIÉE" tone="warning" />
          )}
        </View>

        <Text style={styles.courseTitle}>
          {nextCourse.course_title || 'Intelligence Artificielle & Réseaux'}
        </Text>

        <View style={styles.metaStack}>
          <View style={styles.metaItem}>
            <Clock size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>
              {nextCourse.start_time} – {nextCourse.end_time}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <MapPin size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>{nextCourse.room}</Text>
          </View>
          <View style={styles.metaItem}>
            <UserIcon size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>
              {nextCourse.teacher_name || 'Prof. Jean-Marc Lecoq'}
            </Text>
          </View>
        </View>

        <View style={styles.aiHintBox}>
          <Sparkles size={14} color={Colors.primary} />
          <Text style={styles.aiHintText}>
            Diapositives de cours pré-téléchargées et résumées par l’assistant IA.
          </Text>
        </View>
      </Card>

      {/* CORRESPONDANCE IA POTENTIELLE CARD */}
      <AIHighlightBox title="CORRESPONDANCE IA POTENTIELLE" badgeText="FIABILITÉ 88%">
        {claimState === 'idle' ? (
          <>
            <Text style={styles.matchNotice}>
              Un objet trouvé correspond à votre déclaration d'objet perdu :
            </Text>
            <View style={styles.matchItemBox}>
              <View style={styles.matchItemHeader}>
                <Text style={styles.matchItemTitle}>Clé USB SanDisk 64Go</Text>
                <Badge label="88% SIMILARITÉ" tone="success" size="sm" />
              </View>
              <Text style={styles.matchItemDesc}>
                Trouvée ce matin au Foyer Turing. Coque plastique rouge/noire. Correspondance de couleur, lieu et type.
              </Text>
            </View>
            <View style={styles.matchActionsRow}>
              <Button
                title="C'est la mienne !"
                onPress={() => handleClaim(true)}
                variant="primary"
                size="sm"
                style={{ flex: 1 }}
              />
              <Button
                title="Non"
                onPress={() => handleClaim(false)}
                variant="outline"
                size="sm"
                style={{ width: 65 }}
              />
            </View>
          </>
        ) : (
          <View style={styles.claimResultBox}>
            <CheckCircle2 size={18} color={claimState === 'mine' ? Colors.success : Colors.textMuted} />
            <Text style={styles.claimResultText}>
              {claimState === 'mine'
                ? 'Demande validée ! Rendez-vous au Foyer Turing avec votre carte étudiante.'
                : 'Objet retiré de vos suggestions.'}
            </Text>
          </View>
        )}
      </AIHighlightBox>

      {/* QUICK ACTIONS GRID */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>Actions rapides</Text>
      </View>
      <View style={styles.quickGrid}>
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => onNavigate('absences')}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: '#FEE2E2' }]}>
            <AlertTriangle size={18} color={Colors.danger} />
          </View>
          <Text style={styles.quickTitle}>Déclarer une absence</Text>
          <Text style={styles.quickSub}>Justificatif & aide IA</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => onNavigate('lost')}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Search size={18} color={Colors.accentGoldDark} />
          </View>
          <Text style={styles.quickTitle}>Objet perdu / trouvé</Text>
          <Text style={styles.quickSub}>Déclarer & matcher IA</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => onNavigate('assistant')}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: '#EDE9FE' }]}>
            <Sparkles size={18} color={Colors.aiPurple} />
          </View>
          <Text style={styles.quickTitle}>Assistant IA Campus</Text>
          <Text style={styles.quickSub}>Posez vos questions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => onNavigate('academics')}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: '#EFF6FF' }]}>
            <FileText size={18} color={Colors.primary} />
          </View>
          <Text style={styles.quickTitle}>Devoirs & Examens</Text>
          <Text style={styles.quickSub}>3 échéances à venir</Text>
        </TouchableOpacity>
      </View>

      {/* UPCOMING HOMEWORK PREVIEW */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>Devoirs & Examens urgents</Text>
        <TouchableOpacity onPress={() => onNavigate('academics')}>
          <Text style={styles.seeAllLink}>Voir tout</Text>
        </TouchableOpacity>
      </View>

      {assignments.slice(0, 2).map((item) => (
        <Card
          key={item.id}
          style={styles.homeworkCard}
          onPress={() => onNavigate('academics')}
        >
          <View style={styles.hwRow}>
            <View style={styles.hwLeft}>
              <View style={styles.hwIcon}>
                <FileText size={16} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.hwTitle}>{item.title}</Text>
                <Text style={styles.hwDesc} numberOfLines={1}>
                  {item.description}
                </Text>
              </View>
            </View>
            <View style={styles.hwRight}>
              <Text style={styles.hwWhen}>{item.due_date}</Text>
            </View>
          </View>
        </Card>
      ))}

      {/* LATEST ANNOUNCEMENTS */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>Dernières annonces du campus</Text>
        <TouchableOpacity onPress={() => onNavigate('announcements')}>
          <Text style={styles.seeAllLink}>Voir tout</Text>
        </TouchableOpacity>
      </View>

      {announcements.slice(0, 2).map((ann) => (
        <Card
          key={ann.id}
          style={styles.announcementCard}
          onPress={() => onNavigate('announcements')}
        >
          <View style={styles.annHeaderRow}>
            <Badge label={ann.category} tone="info" size="sm" />
            <Text style={styles.annDate}>{ann.created_at}</Text>
          </View>
          <Text style={styles.annTitle}>{ann.title}</Text>
          <Text style={styles.annBody} numberOfLines={2}>
            {ann.content}
          </Text>
        </Card>
      ))}
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
  greetingSection: {
    marginBottom: 16,
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textDark,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  nextCourseCard: {
    borderColor: '#BFDBFE',
    borderWidth: 1.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textDark,
    lineHeight: 24,
    marginBottom: 10,
  },
  metaStack: {
    gap: 6,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textMedium,
    fontWeight: '500',
  },
  aiHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  aiHintText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  matchNotice: {
    fontSize: 12,
    color: Colors.textMedium,
    marginBottom: 8,
  },
  matchItemBox: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  matchItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textDark,
  },
  matchItemDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  matchActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  claimResultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  claimResultText: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '600',
    flex: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textDark,
  },
  seeAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  quickCard: {
    width: '48%',
    backgroundColor: Colors.bgSurface,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textDark,
  },
  quickSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  homeworkCard: {
    padding: 12,
    marginBottom: 10,
  },
  hwRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hwLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  hwIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hwTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textDark,
  },
  hwDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  hwRight: {},
  hwWhen: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.danger,
  },
  announcementCard: {
    padding: 12,
    marginBottom: 10,
  },
  annHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  annDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  annTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textDark,
    marginBottom: 4,
  },
  annBody: {
    fontSize: 12,
    color: Colors.textMedium,
    lineHeight: 16,
  },
});
