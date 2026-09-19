import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { AIHighlightBox } from '../components/AIHighlightBox';
import { useAuth } from '../context/AuthContext';
import { MOCK_TRANSCRIPT } from '../data/mockData';
import { SubjectGrades, Grade } from '../types';
import {
  BarChart2,
  TrendingUp,
  Award,
  BookOpen,
  ChevronRight,
  X,
  Star,
  User as UserIcon,
  AlertTriangle,
  Sparkles,
} from 'lucide-react-native';

// ─── Mini Bar Chart (pas de lib externe) ─────────────────────────────────────
const BAR_MAX_HEIGHT = 80;

interface BarChartProps {
  subjects: SubjectGrades[];
}

const SubjectBarChart: React.FC<BarChartProps> = ({ subjects }) => {
  const maxGrade = 20;
  return (
    <View style={chartStyles.container}>
      {subjects.map((s) => {
        const myBarH = (s.average / maxGrade) * BAR_MAX_HEIGHT;
        const avgBarH = (s.class_average / maxGrade) * BAR_MAX_HEIGHT;
        const isAbove = s.average >= s.class_average;
        return (
          <View key={s.subject_id} style={chartStyles.barGroup}>
            <View style={chartStyles.barsRow}>
              {/* Mon bar */}
              <View style={chartStyles.barWrapper}>
                <Text style={[chartStyles.barValue, { color: s.color }]}>
                  {s.average.toFixed(1)}
                </Text>
                <View
                  style={[
                    chartStyles.bar,
                    { height: myBarH, backgroundColor: s.color },
                  ]}
                />
              </View>
              {/* Moyenne classe bar */}
              <View style={chartStyles.barWrapper}>
                <Text style={[chartStyles.barValue, { color: Colors.textMuted }]}>
                  {s.class_average.toFixed(1)}
                </Text>
                <View
                  style={[
                    chartStyles.bar,
                    { height: avgBarH, backgroundColor: '#E2E8F0' },
                  ]}
                />
              </View>
            </View>
            <Text style={chartStyles.barLabel} numberOfLines={2}>
              {s.subject_code}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    paddingTop: 8,
    height: BAR_MAX_HEIGHT + 52,
  },
  barGroup: {
    alignItems: 'center',
    flex: 1,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: BAR_MAX_HEIGHT + 16,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: BAR_MAX_HEIGHT + 16,
  },
  bar: {
    width: 10,
    borderRadius: 4,
    minHeight: 4,
  },
  barValue: {
    fontSize: 8,
    fontWeight: '800',
    marginBottom: 2,
  },
  barLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 50,
  },
});

// ─── Grade Type Badge Tone ─────────────────────────────────────────────────
const gradeTypeTone: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'neutral'> = {
  CC: 'info',
  TD: 'neutral',
  TP: 'neutral',
  PARTIEL: 'warning',
  PROJET: 'success',
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
interface GradesScreenProps {
  onBack?: () => void;
}

export const GradesScreen: React.FC<GradesScreenProps> = ({ onBack }) => {
  const { user } = useAuth();
  const isDemoStudent = user?.email === 'etudiant@campusconnect.dev';
  const studentName = user ? `${user.first_name} ${user.last_name}` : 'Alexandre Dupont';
  const className = user?.classe?.name || (isDemoStudent ? 'Master 1 IA & Big Data' : 'L3 Informatique');

  const transcript = React.useMemo(() => {
    if (isDemoStudent) return MOCK_TRANSCRIPT;
    return {
      semester: 'Semestre en cours',
      year: '2025 / 2026',
      overall_average: 15.2,
      class_average: 13.1,
      ects_validated: 18,
      ects_total: 30,
      rank: 3,
      class_size: 28,
      mention: 'Bien',
      subjects: [
        {
          subject_id: 1,
          subject_name: 'Génie Logiciel & Architecture',
          subject_code: 'INFO-GL',
          teacher_name: 'Prof. Référent',
          ects_credits: 6,
          coefficient: 3,
          color: '#3B82F6',
          average: 15.5,
          class_average: 13.0,
          rank: 4,
          grades: [
            { id: 101, grade_type: 'CC' as const, value: 16.0, max_value: 20, coefficient: 1, date: '10 Mars 2025', class_average: 13.5 },
            { id: 102, grade_type: 'PROJET' as const, value: 15.0, max_value: 20, coefficient: 2, date: '28 Mars 2025', class_average: 12.8 },
          ]
        },
        {
          subject_id: 2,
          subject_name: 'Bases de Données Avancées',
          subject_code: 'INFO-BD',
          teacher_name: 'Prof. Référent',
          ects_credits: 6,
          coefficient: 3,
          color: '#10B981',
          average: 16.0,
          class_average: 13.5,
          rank: 2,
          grades: [
            { id: 103, grade_type: 'TP' as const, value: 16.5, max_value: 20, coefficient: 1, date: '15 Fév 2025', class_average: 14.0 },
            { id: 104, grade_type: 'PARTIEL' as const, value: 15.5, max_value: 20, coefficient: 2, date: '12 Mars 2025', class_average: 13.0 },
          ]
        },
        {
          subject_id: 3,
          subject_name: 'Réseaux & Protocoles',
          subject_code: 'INFO-RES',
          teacher_name: 'Prof. Référent',
          ects_credits: 6,
          coefficient: 2,
          color: '#F59E0B',
          average: 14.0,
          class_average: 12.8,
          rank: 6,
          grades: [
            { id: 105, grade_type: 'CC' as const, value: 14.0, max_value: 20, coefficient: 1, date: '05 Mars 2025', class_average: 12.8 },
          ]
        }
      ]
    };
  }, [isDemoStudent]);

  const [selectedSubject, setSelectedSubject] = useState<SubjectGrades | null>(null);

  const getMentionColor = (mention?: string) => {
    if (!mention) return Colors.textMuted;
    if (mention === 'Très Bien' || mention === 'Félicitations') return Colors.success;
    if (mention === 'Bien') return Colors.primary;
    if (mention === 'Assez Bien') return '#F59E0B';
    return Colors.textMuted;
  };

  const getGradeColor = (value: number, max: number) => {
    const pct = value / max;
    if (pct >= 0.8) return Colors.success;
    if (pct >= 0.6) return Colors.primary;
    if (pct >= 0.5) return '#F59E0B';
    return Colors.danger;
  };

  // ECTS progress
  const ectsPercent = transcript.ects_validated / transcript.ects_total;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Synthèse générale ───────────────────────────────────── */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.semesterLabel}>{studentName} · {className}</Text>
              <Text style={styles.summaryTitle}>Bulletin de Notes · {transcript.semester}</Text>
            </View>
            <Badge label={transcript.mention || 'Admis'} tone="success" />
          </View>

          {/* Grande moyenne */}
          <View style={styles.avgRow}>
            <View style={styles.avgPrimary}>
              <Text style={styles.avgBig}>{transcript.overall_average.toFixed(2)}</Text>
              <Text style={styles.avgSub}>/ 20</Text>
            </View>
            <View style={styles.avgDivider} />
            <View style={styles.avgSecondaryCol}>
              <View style={styles.avgSecondaryItem}>
                <Text style={styles.avgSecondaryVal}>
                  {transcript.rank}<Text style={styles.avgSecondarySubVal}>e</Text>/{transcript.class_size}
                </Text>
                <Text style={styles.avgSecondaryLabel}>Classement</Text>
              </View>
              <View style={styles.avgSecondaryItem}>
                <Text style={[styles.avgSecondaryVal, { color: Colors.textMuted }]}>
                  {transcript.class_average.toFixed(2)}
                </Text>
                <Text style={styles.avgSecondaryLabel}>Moy. classe</Text>
              </View>
            </View>
          </View>

          {/* ECTS Progress Bar */}
          <View style={styles.ectsSection}>
            <View style={styles.ectsHeaderRow}>
              <Text style={styles.ectsLabel}>Crédits ECTS validés</Text>
              <Text style={styles.ectsVal}>
                {transcript.ects_validated} / {transcript.ects_total} ECTS
              </Text>
            </View>
            <View style={styles.ectsTrack}>
              <View
                style={[styles.ectsBar, { width: `${ectsPercent * 100}%` }]}
              />
            </View>
            <Text style={styles.ectsHint}>
              {Math.round(ectsPercent * 100)}% des crédits semestriels acquis
            </Text>
          </View>
        </Card>

        {/* ── AI Analyse ──────────────────────────────────────────── */}
        <AIHighlightBox title="ANALYSE IA DE VOS RÉSULTATS" badgeText="PERSONNALISÉE">
          <Text style={styles.aiText}>
            Bonjour <Text style={{ fontWeight: '800' }}>{user?.first_name || 'étudiant'}</Text>, vous êtes classé{' '}
            <Text style={{ fontWeight: '800' }}>{transcript.rank}e sur {transcript.class_size} étudiants</Text> en {className} avec une mention{' '}
            <Text style={{ fontWeight: '800', color: Colors.primary }}>{transcript.mention}</Text>. Moyenne générale de {transcript.overall_average.toFixed(1)}/20 (+{(transcript.overall_average - transcript.class_average).toFixed(1)} au-dessus de la promo).
          </Text>
          <View style={styles.aiTagsRow}>
            <View style={styles.aiTag}>
              <TrendingUp size={12} color={Colors.success} />
              <Text style={[styles.aiTagText, { color: Colors.success }]}>+2.4 vs moy. classe</Text>
            </View>
            <View style={styles.aiTag}>
              <Star size={12} color={Colors.accentGoldDark} />
              <Text style={[styles.aiTagText, { color: Colors.accentGoldDark }]}>Top 12%</Text>
            </View>
          </View>
        </AIHighlightBox>

        {/* ── Graphique comparatif ─────────────────────────────────── */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleRow}>
              <BarChart2 size={16} color={Colors.primary} />
              <Text style={styles.chartTitle}>Comparaison par Matière</Text>
            </View>
          </View>
          <SubjectBarChart subjects={transcript.subjects} />
          {/* Légende */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>Ma moyenne</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E2E8F0' }]} />
              <Text style={styles.legendText}>Moy. classe</Text>
            </View>
          </View>
        </Card>

        {/* ── Liste matières ───────────────────────────────────────── */}
        <Text style={styles.sectionHeading}>Détail par Matière</Text>

        {transcript.subjects.map((subject) => {
          const delta = subject.average - subject.class_average;
          const isAbove = delta >= 0;
          return (
            <TouchableOpacity
              key={subject.subject_id}
              onPress={() => setSelectedSubject(subject)}
              activeOpacity={0.85}
            >
              <Card style={styles.subjectCard}>
                {/* Header */}
                <View style={styles.subjectHeaderRow}>
                  <View
                    style={[styles.subjectColorBar, { backgroundColor: subject.color }]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subjectName} numberOfLines={2}>
                      {subject.subject_name}
                    </Text>
                    <Text style={styles.subjectMeta}>
                      {subject.subject_code} · {subject.teacher_name}
                    </Text>
                  </View>
                  <View style={styles.subjectGradeCol}>
                    <Text
                      style={[
                        styles.subjectAvg,
                        { color: getGradeColor(subject.average, 20) },
                      ]}
                    >
                      {subject.average.toFixed(1)}
                    </Text>
                    <Text style={styles.subjectAvgSub}>/20</Text>
                  </View>
                </View>

                {/* Stats row */}
                <View style={styles.subjectStatsRow}>
                  <View style={styles.subjectStat}>
                    <Text style={styles.subjectStatLabel}>Moy. classe</Text>
                    <Text style={styles.subjectStatVal}>{subject.class_average.toFixed(1)}</Text>
                  </View>
                  <View style={styles.subjectStat}>
                    <Text style={styles.subjectStatLabel}>ECTS</Text>
                    <Text style={styles.subjectStatVal}>{subject.ects_credits} cr.</Text>
                  </View>
                  <View style={styles.subjectStat}>
                    <Text style={styles.subjectStatLabel}>Rang</Text>
                    <Text style={styles.subjectStatVal}>
                      {subject.rank ? `${subject.rank}e` : '—'}
                    </Text>
                  </View>
                  <View style={styles.subjectDeltaBadge}>
                    <Text
                      style={[
                        styles.subjectDeltaText,
                        { color: isAbove ? Colors.success : Colors.danger },
                      ]}
                    >
                      {isAbove ? '+' : ''}{delta.toFixed(1)}
                    </Text>
                    <Text style={styles.subjectDeltaLabel}>vs classe</Text>
                  </View>
                </View>

                {/* Mini grade bar */}
                <View style={styles.miniBarTrack}>
                  <View
                    style={[
                      styles.miniBarFill,
                      {
                        width: `${(subject.average / 20) * 100}%`,
                        backgroundColor: subject.color,
                      },
                    ]}
                  />
                </View>

                <View style={styles.subjectFooter}>
                  <Text style={styles.subjectGradesCount}>
                    {subject.grades.length} note{subject.grades.length > 1 ? 's' : ''}
                  </Text>
                  <View style={styles.seeDetailRow}>
                    <Text style={styles.seeDetailText}>Voir le détail</Text>
                    <ChevronRight size={14} color={Colors.primary} />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Modal Détail Matière ─────────────────────────────────── */}
      {selectedSubject && (
        <Modal visible animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={[styles.modalColorDot, { backgroundColor: selectedSubject.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedSubject.subject_name}
                </Text>
                <Text style={styles.modalSubtitle}>{selectedSubject.subject_code}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedSubject(null)} style={styles.modalCloseBtn}>
                <X size={20} color={Colors.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Synthèse matière */}
              <View style={styles.modalSummaryRow}>
                <View style={styles.modalStat}>
                  <Text style={[styles.modalStatVal, { color: selectedSubject.color }]}>
                    {selectedSubject.average.toFixed(2)}
                  </Text>
                  <Text style={styles.modalStatLabel}>Ma moyenne</Text>
                </View>
                <View style={styles.modalStat}>
                  <Text style={[styles.modalStatVal, { color: Colors.textMuted }]}>
                    {selectedSubject.class_average.toFixed(2)}
                  </Text>
                  <Text style={styles.modalStatLabel}>Moy. classe</Text>
                </View>
                <View style={styles.modalStat}>
                  <Text style={styles.modalStatVal}>
                    {selectedSubject.rank ? `${selectedSubject.rank}e` : '—'}
                  </Text>
                  <Text style={styles.modalStatLabel}>Rang</Text>
                </View>
                <View style={styles.modalStat}>
                  <Text style={styles.modalStatVal}>{selectedSubject.ects_credits}</Text>
                  <Text style={styles.modalStatLabel}>ECTS</Text>
                </View>
              </View>

              {/* Enseignant */}
              <View style={styles.teacherRow}>
                <UserIcon size={14} color={Colors.textMuted} />
                <Text style={styles.teacherText}>{selectedSubject.teacher_name}</Text>
              </View>

              {/* Liste des notes */}
              <Text style={styles.modalSectionHeading}>Toutes les notes</Text>

              {selectedSubject.grades.map((grade) => {
                const isPending = grade.date === 'À venir';
                return (
                  <Card key={grade.id} style={styles.gradeCard}>
                    <View style={styles.gradeHeader}>
                      <Badge
                        label={grade.grade_type}
                        tone={gradeTypeTone[grade.grade_type] || 'neutral'}
                        size="sm"
                      />
                      <Text style={styles.gradeDate}>{grade.date}</Text>
                    </View>

                    {isPending ? (
                      <View style={styles.pendingRow}>
                        <AlertTriangle size={14} color={Colors.accentGoldDark} />
                        <Text style={styles.pendingText}>Note à venir — Examen non encore passé</Text>
                      </View>
                    ) : (
                      <>
                        <View style={styles.gradeValueRow}>
                          <Text
                            style={[
                              styles.gradeValue,
                              { color: getGradeColor(grade.value, grade.max_value) },
                            ]}
                          >
                            {grade.value.toFixed(1)}
                          </Text>
                          <Text style={styles.gradeMax}>/{grade.max_value}</Text>
                          <Text style={styles.gradeCoef}>× coef. {grade.coefficient}</Text>
                        </View>

                        {/* Barre comparaison */}
                        <View style={styles.gradeCompare}>
                          <View style={styles.gradeCompareBarBg}>
                            <View
                              style={[
                                styles.gradeCompareBarFill,
                                {
                                  width: `${(grade.value / grade.max_value) * 100}%`,
                                  backgroundColor: getGradeColor(grade.value, grade.max_value),
                                },
                              ]}
                            />
                            {/* Moyenne classe marker */}
                            {grade.class_average && (
                              <View
                                style={[
                                  styles.avgMarker,
                                  { left: `${(grade.class_average / grade.max_value) * 100}%` as any },
                                ]}
                              />
                            )}
                          </View>
                          {grade.class_average && (
                            <Text style={styles.gradeCompareLabel}>
                              Moy. classe : {grade.class_average.toFixed(1)}/{grade.max_value}
                            </Text>
                          )}
                        </View>

                        {grade.comment && (
                          <View style={styles.commentBox}>
                            <Sparkles size={12} color={Colors.primary} />
                            <Text style={styles.commentText}>"{grade.comment}"</Text>
                          </View>
                        )}

                        {grade.rank && (
                          <Text style={styles.gradeRank}>
                            🏆 Classé {grade.rank}e sur {MOCK_TRANSCRIPT.class_size}
                          </Text>
                        )}
                      </>
                    )}
                  </Card>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </View>
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

  // Summary Card
  summaryCard: {
    marginBottom: 14,
    borderColor: '#BFDBFE',
    borderWidth: 1.5,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  semesterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textDark,
  },
  avgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avgPrimary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  avgBig: {
    fontSize: 44,
    fontWeight: '900',
    color: Colors.primaryDark,
    letterSpacing: -1,
  },
  avgSub: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  avgDivider: {
    width: 1,
    height: 44,
    backgroundColor: Colors.border,
    marginHorizontal: 20,
  },
  avgSecondaryCol: {
    gap: 8,
  },
  avgSecondaryItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  avgSecondaryVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  avgSecondarySubVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  avgSecondaryLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  ectsSection: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ectsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ectsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textDark,
  },
  ectsVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  ectsTrack: {
    height: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  ectsBar: {
    height: 10,
    backgroundColor: Colors.primary,
    borderRadius: 5,
  },
  ectsHint: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },

  // AI
  aiText: {
    fontSize: 12,
    color: Colors.textDark,
    lineHeight: 18,
  },
  aiTagsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bgSurface,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aiTagText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Chart
  chartCard: {
    marginBottom: 14,
  },
  chartHeader: {
    marginBottom: 4,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
  },

  // Section heading
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 4,
  },

  // Subject Card
  subjectCard: {
    marginBottom: 12,
    padding: 14,
  },
  subjectHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  subjectColorBar: {
    width: 4,
    borderRadius: 2,
    height: '100%',
    minHeight: 36,
    marginTop: 2,
  },
  subjectName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textDark,
    lineHeight: 18,
    marginBottom: 2,
  },
  subjectMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  subjectGradeCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  subjectAvg: {
    fontSize: 22,
    fontWeight: '900',
  },
  subjectAvgSub: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  subjectStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  subjectStat: {
    alignItems: 'center',
  },
  subjectStatLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  subjectStatVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textDark,
    marginTop: 1,
  },
  subjectDeltaBadge: {
    marginLeft: 'auto',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  subjectDeltaText: {
    fontSize: 13,
    fontWeight: '900',
  },
  subjectDeltaLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  miniBarTrack: {
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  miniBarFill: {
    height: 5,
    borderRadius: 3,
  },
  subjectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  subjectGradesCount: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  seeDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeDetailText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.bgLight,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  modalColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textDark,
  },
  modalSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  modalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.bgSurface,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  modalStat: {
    alignItems: 'center',
  },
  modalStatVal: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primaryDark,
  },
  modalStatLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  teacherText: {
    fontSize: 12,
    color: Colors.textMedium,
    fontWeight: '600',
  },
  modalSectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },

  // Grade Card
  gradeCard: {
    marginBottom: 12,
    padding: 14,
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gradeDate: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  gradeValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 10,
  },
  gradeValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  gradeMax: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  gradeCoef: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    marginLeft: 8,
    backgroundColor: Colors.bgLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gradeCompare: {
    marginBottom: 10,
  },
  gradeCompareBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative',
    marginBottom: 4,
  },
  gradeCompareBarFill: {
    height: 8,
    borderRadius: 4,
  },
  avgMarker: {
    position: 'absolute',
    top: -3,
    width: 2,
    height: 14,
    backgroundColor: Colors.textMuted,
    borderRadius: 1,
  },
  gradeCompareLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  commentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  gradeRank: {
    fontSize: 11,
    color: Colors.accentGoldDark,
    fontWeight: '700',
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  pendingText: {
    fontSize: 12,
    color: Colors.accentGoldDark,
    fontWeight: '600',
  },
});
