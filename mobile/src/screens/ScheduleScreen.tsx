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
import { MOCK_SCHEDULES } from '../data/mockData';
import { ScheduleItem } from '../types';
import {
  Clock,
  MapPin,
  User as UserIcon,
  AlertTriangle,
  Sparkles,
  Calendar,
  ChevronRight,
} from 'lucide-react-native';

import { useAuth } from '../context/AuthContext';

const DAYS = [
  { id: 'lun', label: 'Lun', num: '14' },
  { id: 'mar', label: 'Mar', num: '15', active: true },
  { id: 'mer', label: 'Mer', num: '16' },
  { id: 'jeu', label: 'Jeu', num: '17' },
  { id: 'ven', label: 'Ven', num: '18' },
  { id: 'sam', label: 'Sam', num: '19' },
];

interface ScheduleScreenProps {
  onDeclareAbsenceForSchedule?: (scheduleId: number) => void;
}

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({
  onDeclareAbsenceForSchedule,
}) => {
  const { user } = useAuth();
  const isDemoStudent = user?.email === 'etudiant@campusconnect.dev';
  const [selectedDay, setSelectedDay] = useState('mar');
  const [schedules, setSchedules] = useState<ScheduleItem[]>(isDemoStudent ? MOCK_SCHEDULES : []);
  const [refreshing, setRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const loadSchedules = async () => {
    try {
      const data = await api.getSchedules();
      if (data && data.length > 0) {
        const enriched = data.map((s, idx) => ({
          ...s,
          course_title:
            s.affectation?.subject?.name ||
            s.course_title ||
            (idx === 0
              ? 'Intelligence Artificielle & Réseaux'
              : idx === 1
              ? 'Compilation & Analyse Lexicale'
              : 'Bases de Données NoSQL'),
          teacher_name: s.affectation?.teacher
            ? `Prof. ${s.affectation.teacher.first_name} ${s.affectation.teacher.last_name}`
            : s.teacher_name || 'Prof. Référent',
          start_time: typeof s.start_time === 'string' ? s.start_time.substring(0, 5) : s.start_time,
          end_time: typeof s.end_time === 'string' ? s.end_time.substring(0, 5) : s.end_time,
          course_type:
            s.course_type ||
            (idx === 0 ? ('CM' as const) : idx === 1 ? ('TD' as const) : ('TP' as const)),
        }));
        setSchedules(enriched);
        setIsLive(true);
      } else {
        setSchedules(isDemoStudent ? MOCK_SCHEDULES : []);
        setIsLive(true);
      }
    } catch {
      if (isDemoStudent) setSchedules(MOCK_SCHEDULES);
      setIsLive(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchedules();
    setRefreshing(false);
  };

  // Filtrer ou simuler cours par jour
  const currentDaySchedules =
    schedules.length === 0
      ? []
      : selectedDay === 'mar'
      ? schedules.slice(0, 2)
      : selectedDay === 'mer'
      ? schedules.slice(2, 4)
      : selectedDay === 'jeu'
      ? schedules.slice(4, 5)
      : schedules.slice(0, 1);

  return (
    <View style={styles.container}>
      {/* Day Selector Strip */}
      <View style={styles.dayStrip}>
        {DAYS.map((d) => {
          const isSelected = selectedDay === d.id;
          return (
            <TouchableOpacity
              key={d.id}
              style={[styles.dayItem, isSelected && styles.dayItemActive]}
              onPress={() => setSelectedDay(d.id)}
            >
              <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>
                {d.label}
              </Text>
              <Text style={[styles.dayNum, isSelected && styles.dayNumActive]}>
                {d.num}
              </Text>
              {d.id === 'mar' && <View style={styles.todayDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Schedule Detector Banner */}
        {selectedDay === 'mar' && (
          <AIHighlightBox title="DÉTECTION IA : CHANGEMENT DE SALLE" badgeText="SYNCHRO">
            <View style={styles.aiAlertContent}>
              <Text style={styles.aiAlertText}>
                Le cours de <Text style={{ fontWeight: '800' }}>Compilation</Text> prévu à 14h en salle A1 a été déplacé en <Text style={{ fontWeight: '800' }}>Salle B2</Text> en raison d'une maintenance technique.
              </Text>
              <Badge label="HORAIRE & SALLE MIS À JOUR" tone="warning" size="sm" />
            </View>
          </AIHighlightBox>
        )}

        <Text style={styles.dayHeading}>
          {selectedDay === 'mar'
            ? 'Mardi 15 Avril 2025'
            : selectedDay === 'mer'
            ? 'Mercredi 16 Avril 2025'
            : selectedDay === 'jeu'
            ? 'Jeudi 17 Avril 2025'
            : selectedDay === 'ven'
            ? 'Vendredi 18 Avril 2025'
            : 'Emploi du temps'} · {currentDaySchedules.length} séance(s)
        </Text>

        {currentDaySchedules.length === 0 ? (
          <Card style={{ padding: 24, alignItems: 'center' }}>
            <Calendar size={32} color={Colors.textMuted} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textDark, marginTop: 10 }}>
              Aucun cours ce jour
            </Text>
            <Text style={{ fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 4 }}>
              Aucune séance programmée pour {user?.classe?.name || 'votre groupe'} pour cette journée.
            </Text>
          </Card>
        ) : (
          currentDaySchedules.map((item, index) => {
            const isModified = item.status === 'MODIFIE';
            return (
              <Card key={item.id} style={styles.sessionCard}>
                <View style={styles.sessionHeaderRow}>
                  <View style={styles.timeBox}>
                    <Clock size={14} color={Colors.primary} />
                    <Text style={styles.timeText}>
                      {item.start_time} – {item.end_time}
                    </Text>
                  </View>
                  <View style={styles.badgesRow}>
                    <Badge label={item.course_type || 'CM'} tone="neutral" size="sm" />
                    {isModified && (
                      <Badge label="MODIFIÉ" tone="warning" size="sm" />
                    )}
                  </View>
                </View>

                <Text style={styles.sessionTitle}>{item.course_title}</Text>

                <View style={styles.infoRow}>
                  <MapPin size={15} color={isModified ? Colors.warningText : Colors.textMuted} />
                  <Text
                    style={[
                      styles.infoText,
                      isModified && { color: Colors.warningText, fontWeight: '700' },
                    ]}
                  >
                    {item.room}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <UserIcon size={15} color={Colors.textMuted} />
                  <Text style={styles.infoText}>{item.teacher_name}</Text>
                </View>

                <View style={styles.sessionFooter}>
                  <TouchableOpacity
                    style={styles.absenceBtn}
                    onPress={() => {
                      if (onDeclareAbsenceForSchedule) {
                        onDeclareAbsenceForSchedule(item.id);
                      } else {
                        Alert.alert(
                          'Déclarer une absence',
                          `Signaler une absence pour le cours de ${item.course_title} ?`
                        );
                      }
                    }}
                  >
                    <AlertTriangle size={13} color={Colors.danger} />
                    <Text style={styles.absenceBtnText}>Signaler une absence</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.detailsBtn}
                    onPress={() =>
                      Alert.alert(
                        item.course_title || 'Cours',
                        `Enseignant : ${item.teacher_name}\nSalle : ${item.room}\nSupport de cours téléchargeable sur CampusConnect.`
                      )
                    }
                  >
                    <Text style={styles.detailsBtnText}>Détails</Text>
                    <ChevronRight size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
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
  dayStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSurface,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    position: 'relative',
  },
  dayItemActive: {
    backgroundColor: Colors.primary,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  dayLabelActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  dayNum: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textDark,
    marginTop: 2,
  },
  dayNumActive: {
    color: '#FFF',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accentGold,
    marginTop: 3,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  aiAlertContent: {
    gap: 8,
  },
  aiAlertText: {
    fontSize: 12,
    color: Colors.textDark,
    lineHeight: 18,
  },
  dayHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sessionCard: {
    marginBottom: 14,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textDark,
    lineHeight: 22,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textMedium,
    fontWeight: '500',
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  absenceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  absenceBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.danger,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});
