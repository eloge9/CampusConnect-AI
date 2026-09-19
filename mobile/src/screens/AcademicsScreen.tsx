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
import { api } from '../api/client';
import { MOCK_ASSIGNMENTS, MOCK_EXAMS } from '../data/mockData';
import { Assignment, Exam } from '../types';
import {
  ClipboardList,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  FileCheck,
  UploadCloud,
  ChevronRight,
} from 'lucide-react-native';

export const AcademicsScreen: React.FC = () => {
  const [tab, setTab] = useState<'assignments' | 'exams'>('assignments');
  const [assignments, setAssignments] = useState<Assignment[]>(MOCK_ASSIGNMENTS);
  const [exams, setExams] = useState<Exam[]>(MOCK_EXAMS);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const a = await api.getAssignments();
      if (a && a.length > 0) setAssignments(a);
    } catch {}

    try {
      const e = await api.getExams();
      if (e && e.length > 0) setExams(e);
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

  return (
    <View style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'assignments' && styles.tabButtonActive]}
          onPress={() => setTab('assignments')}
        >
          <ClipboardList
            size={16}
            color={tab === 'assignments' ? Colors.primary : Colors.textMuted}
          />
          <Text
            style={[styles.tabButtonText, tab === 'assignments' && styles.tabButtonTextActive]}
          >
            Devoirs ({assignments.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, tab === 'exams' && styles.tabButtonActive]}
          onPress={() => setTab('exams')}
        >
          <Calendar
            size={16}
            color={tab === 'exams' ? Colors.primary : Colors.textMuted}
          />
          <Text
            style={[styles.tabButtonText, tab === 'exams' && styles.tabButtonTextActive]}
          >
            Examens ({exams.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Study Planner Box */}
        <AIHighlightBox title="PLANIFICATEUR DE RÉVISIONS IA" badgeText="SUGGESTION">
          <Text style={styles.aiPlannerText}>
            L’IA Campus vous recommande de consacrer <Text style={{ fontWeight: '800' }}>2 heures ce soir</Text> aux requêtes d’agrégation NoSQL avant le partiel de Jeudi en Amphi Turing.
          </Text>
          <Button
            title="Générer un programme de révision complet"
            onPress={() =>
              Alert.alert(
                'Programme de révision IA généré',
                '1. Mardi 20h-22h : Révision NoSQL (Index & Sharding)\n2. Mercredi 17h-19h : Tests unitaires Compilateur\n3. Jeudi matin : Fiche mémo synthétique'
              )
            }
            variant="outline"
            size="sm"
            style={{ marginTop: 8 }}
          />
        </AIHighlightBox>

        {tab === 'assignments' ? (
          <>
            <Text style={styles.sectionHeading}>Devoirs & Travaux Pratiques</Text>
            {assignments.map((item) => (
              <Card key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Badge label="À RENDRE" tone="danger" size="sm" />
                  <Text style={styles.dueText}>{item.due_date}</Text>
                </View>

                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>

                <View style={styles.footerRow}>
                  <Button
                    title="Déposer mon travail"
                    onPress={() =>
                      Alert.alert(
                        'Déposer un devoir',
                        `Sélectionner une archive .zip pour « ${item.title} » ?`,
                        [
                          { text: 'Annuler', style: 'cancel' },
                          {
                            text: 'Sélectionner un fichier',
                            onPress: () =>
                              Alert.alert('Succès', 'Devoir transmis au secrétariat académique.'),
                          },
                        ]
                      )
                    }
                    size="sm"
                    variant="primary"
                    icon={<UploadCloud size={14} color="#FFF" />}
                  />
                  <TouchableOpacity
                    style={styles.detailsLink}
                    onPress={() =>
                      Alert.alert(
                        item.title,
                        `Consignes : ${item.description}\nÉchéance stricte : ${item.due_date}`
                      )
                    }
                  >
                    <Text style={styles.detailsLinkText}>Consignes</Text>
                    <ChevronRight size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Text style={styles.sectionHeading}>Sessions d'Évaluation & Examens</Text>
            {exams.map((exam) => (
              <Card key={exam.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Badge label="CONTRÔLE" tone="warning" size="sm" />
                  <Text style={styles.dueText}>{exam.exam_date}</Text>
                </View>

                <Text style={styles.itemTitle}>{exam.title}</Text>
                <Text style={styles.itemDesc}>{exam.description}</Text>

                <View style={styles.examMetaGrid}>
                  <View style={styles.metaRow}>
                    <Clock size={14} color={Colors.textMuted} />
                    <Text style={styles.metaLabel}>
                      {exam.start_time} – {exam.end_time}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <MapPin size={14} color={Colors.textMuted} />
                    <Text style={styles.metaLabel}>{exam.room}</Text>
                  </View>
                </View>

                <View style={styles.examFooter}>
                  <Button
                    title="Consulter ma convocation"
                    size="sm"
                    variant="outline"
                    onPress={() =>
                      Alert.alert(
                        'Convocation officielle',
                        `Épreuve : ${exam.title}\nSalle : ${exam.room}\nDate : ${exam.exam_date}\nPrésentez votre carte étudiante 15 minutes avant le début de l’épreuve.`
                      )
                    }
                    style={{ flex: 1 }}
                  />
                </View>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgLight,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSurface,
    padding: 6,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#EFF6FF',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  tabButtonTextActive: {
    color: Colors.primary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  aiPlannerText: {
    fontSize: 12,
    color: Colors.textDark,
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  itemCard: {
    marginBottom: 14,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dueText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.danger,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textDark,
    lineHeight: 20,
    marginBottom: 6,
  },
  itemDesc: {
    fontSize: 12,
    color: Colors.textMedium,
    lineHeight: 17,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailsLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  examMetaGrid: {
    gap: 6,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaLabel: {
    fontSize: 12,
    color: Colors.textMedium,
    fontWeight: '600',
  },
  examFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
