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
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  PlusCircle,
  MessageSquare,
  Calendar,
  Sparkles,
  BookOpen,
  ChevronRight,
  Send,
} from 'lucide-react-native';

interface TeacherDashboardScreenProps {
  onNavigate: (tab: string, params?: any) => void;
  onOpenNotifications: () => void;
}

export const TeacherDashboardScreen: React.FC<TeacherDashboardScreenProps> = ({
  onNavigate,
  onOpenNotifications,
}) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [absences, setAbsences] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(false);

  const loadData = async () => {
    try {
      const [schData, asgnData, absData] = await Promise.all([
        api.getSchedules(),
        api.getAssignments(),
        api.getAbsences(),
      ]);

      if (schData && schData.length > 0) {
        setSchedules(schData);
        setIsLive(true);
      }
      if (asgnData && asgnData.length > 0) {
        setAssignments(asgnData);
      }
      if (absData && absData.length > 0) {
        setAbsences(absData);
      }
    } catch (e) {
      setIsLive(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleRollCall = (courseTitle: string, room: string) => {
    Alert.alert(
      'Appel & Présences en cours',
      `Feuille d'émargement numérique ouverte pour le cours de "${courseTitle}" en ${room}.\n\n32 étudiants inscrits — Envoi automatique du rapport de présence au secrétariat.`,
      [
        { text: 'Fermer', style: 'cancel' },
        {
          text: 'Valider l’appel (31 présents, 1 absent)',
          onPress: () => Alert.alert('Succès', 'Émargement enregistré sur CampusConnect.'),
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Salutation Enseignant */}
      <View style={styles.greetingSection}>
        <View style={styles.roleTagRow}>
          <Badge label="ESPACE ENSEIGNANT" tone="warning" size="sm" />
          <Badge
            label={isLive ? 'CONNECTÉ API' : 'MODE DÉMO'}
            tone={isLive ? 'success' : 'neutral'}
            size="sm"
          />
        </View>
        <Text style={styles.greetingTitle}>
          Bonjour, {user?.first_name ? `Prof. ${user.first_name} ${user.last_name}` : 'Prof. Jean-Marc Lecoq'}
        </Text>
        <Text style={styles.greetingSubtitle}>
          Vous supervisez les modules d'Intelligence Artificielle et de Compilation (L3 Informatique & M1 Génie Logiciel).
        </Text>
      </View>

      {/* Statistiques Métriques Prof */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>3</Text>
          <Text style={styles.statLabel}>Cours cette semaine</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.primary }]}>68</Text>
          <Text style={styles.statLabel}>Étudiants suivis</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.danger }]}>
            {absences.length > 0 ? absences.length : 2}
          </Text>
          <Text style={styles.statLabel}>Absences signalées</Text>
        </View>
      </View>

      {/* Prochain cours à dispenser */}
      <Card style={styles.nextCourseCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardTitleRow}>
            <Calendar size={16} color={Colors.primary} />
            <Text style={styles.cardTitle}>Votre prochain cours à dispenser</Text>
          </View>
          <Badge label="Dans 45 min" tone="warning" />
        </View>

        <View style={styles.chipsRow}>
          <Badge label="CM · L3 INFORMATIQUE" tone="neutral" />
          <Badge label="32 ÉTUDIANTS" tone="info" />
        </View>

        <Text style={styles.courseTitle}>Intelligence Artificielle & Réseaux de Neurones</Text>

        <View style={styles.metaStack}>
          <View style={styles.metaItem}>
            <Clock size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>10:00 – 11:30 (1h30)</Text>
          </View>
          <View style={styles.metaItem}>
            <MapPin size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>Amphi Alan Turing (Bât. C, 2e étage)</Text>
          </View>
          <View style={styles.metaItem}>
            <Users size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>Groupe Promo L3-INFO (Promotion 2025)</Text>
          </View>
        </View>

        <View style={styles.actionButtonsRow}>
          <Button
            title="Faire l'appel numérique"
            variant="primary"
            size="sm"
            onPress={() => handleRollCall('Intelligence Artificielle', 'Amphi Alan Turing')}
            icon={<CheckCircle2 size={14} color="#FFF" />}
            style={{ flex: 1 }}
          />
          <Button
            title="Consignes & Diapos"
            variant="outline"
            size="sm"
            onPress={() =>
              Alert.alert(
                'Support de cours',
                'Diapositives synchronisées : Chapitre 4 - Fonctions de coût et rétropropagation (PDF 4.2 Mo).'
              )
            }
          />
        </View>
      </Card>

      {/* Aide IA Pédagogique */}
      <AIHighlightBox title="ASSISTANT IA ENSEIGNANT" badgeText="SYNTHÈSE">
        <Text style={styles.aiHintText}>
          L'IA a synthétisé les questions récurrentes des étudiants sur le dernier TP de Compilation : 14 étudiants ont posé des questions sur la table de transition d'états du lexer.
        </Text>
        <Button
          title="Générer une note d'éclaircissement automatique"
          variant="outline"
          size="sm"
          onPress={() =>
            Alert.alert(
              'Aide IA générée',
              'Fiche mémo préparée : "Astuces pour la construction de l\'automate d\'analyse lexicale". Publiée dans l\'espace de cours.'
            )
          }
          style={{ marginTop: 8 }}
        />
      </AIHighlightBox>

      {/* Actions rapides Enseignant */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>Actions rapides Enseignant</Text>
      </View>
      <View style={styles.quickGrid}>
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => onNavigate('academics')}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: '#EFF6FF' }]}>
            <PlusCircle size={18} color={Colors.primary} />
          </View>
          <Text style={styles.quickTitle}>Créer un devoir / TP</Text>
          <Text style={styles.quickSub}>Assigner date et consignes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => onNavigate('announcements')}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Send size={18} color={Colors.accentGoldDark} />
          </View>
          <Text style={styles.quickTitle}>Publier une annonce</Text>
          <Text style={styles.quickSub}>Informer vos classes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => onNavigate('messaging')}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: '#EDE9FE' }]}>
            <MessageSquare size={18} color={Colors.aiPurple} />
          </View>
          <Text style={styles.quickTitle}>Canaux de discussion</Text>
          <Text style={styles.quickSub}>Échanges avec les délégués</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => onNavigate('schedule')}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: '#DCFCE7' }]}>
            <Calendar size={18} color={Colors.success} />
          </View>
          <Text style={styles.quickTitle}>Mon planning complet</Text>
          <Text style={styles.quickSub}>Emploi du temps semestriel</Text>
        </TouchableOpacity>
      </View>

      {/* Devoirs assignés en cours */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>Devoirs assignés & Taux de rendu</Text>
        <TouchableOpacity onPress={() => onNavigate('academics')}>
          <Text style={styles.seeAllLink}>Gérer tout</Text>
        </TouchableOpacity>
      </View>

      <Card style={styles.homeworkCard}>
        <View style={styles.hwRow}>
          <View style={styles.hwIcon}>
            <FileText size={16} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.hwTitle}>Rendu Projet : Analyseur Lexical</Text>
            <Text style={styles.hwDesc}>L3 Informatique · Échéance : Demain 23:59</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: '75%' }]} />
            </View>
            <Text style={styles.progressText}>24/32 binômes ont déjà déposé leur archive</Text>
          </View>
        </View>
      </Card>

      {/* Absences récentes signalées pour vos cours */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>Absences récentes signalées par vos étudiants</Text>
      </View>

      <Card style={styles.absenceItemCard}>
        <View style={styles.absenceHeaderRow}>
          <Text style={styles.studentName}>Alexandre Dubois (L3-INFO)</Text>
          <Badge label="CERTIFICAT FOURNI" tone="info" size="sm" />
        </View>
        <Text style={styles.absenceDetails}>
          Séance manquée : Compilation (Hier à 14h00) — Motif médical validé par le secrétariat.
        </Text>
      </Card>
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
  roleTagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
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
    fontSize: 18,
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
    borderColor: '#FED7AA',
    borderWidth: 1.5,
    marginBottom: 16,
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
    fontSize: 12,
    fontWeight: '800',
    color: Colors.accentGoldDark,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textDark,
    lineHeight: 23,
    marginBottom: 10,
  },
  metaStack: {
    gap: 6,
    marginBottom: 14,
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
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  aiHintText: {
    fontSize: 12,
    color: Colors.textDark,
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 14,
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
    padding: 14,
    marginBottom: 14,
  },
  hwRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  hwIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hwTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textDark,
  },
  hwDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 4,
  },
  absenceItemCard: {
    padding: 12,
    marginBottom: 12,
  },
  absenceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  studentName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textDark,
  },
  absenceDetails: {
    fontSize: 11,
    color: Colors.textMedium,
    lineHeight: 16,
  },
});
