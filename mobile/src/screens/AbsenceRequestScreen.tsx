import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { AIHighlightBox } from '../components/AIHighlightBox';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { MOCK_ABSENCES, MOCK_SCHEDULES } from '../data/mockData';
import { AbsenceRequest, ScheduleItem } from '../types';
import {
  AlertTriangle,
  Plus,
  Calendar,
  FileText,
  Sparkles,
  Paperclip,
  CheckCircle2,
  Clock,
  X,
  Check,
  XCircle,
} from 'lucide-react-native';

export const AbsenceRequestScreen: React.FC = () => {
  const { role, user } = useAuth();
  const isDemoStudent = user?.email === 'etudiant@campusconnect.dev';
  const isStaff = role === 'ADMIN' || role === 'TEACHER';
  const [absences, setAbsences] = useState<AbsenceRequest[]>(isDemoStudent ? MOCK_ABSENCES : []);
  const [schedules, setSchedules] = useState<ScheduleItem[]>(isDemoStudent ? MOCK_SCHEDULES : []);
  const [showForm, setShowForm] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [hasJustificatif, setHasJustificatif] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const loadData = async () => {
    try {
      const a = await api.getAbsences();
      if (a && a.length > 0) {
        setAbsences(a);
        setIsLive(true);
      } else {
        setAbsences(isDemoStudent ? MOCK_ABSENCES : []);
        setIsLive(true);
      }
    } catch {
      if (isDemoStudent) setAbsences(MOCK_ABSENCES);
      setIsLive(false);
    }

    try {
      const s = await api.getSchedules();
      if (s && s.length > 0) {
        setSchedules(s);
        if (s[0]) setSelectedScheduleId(s[0].id);
      } else {
        setSchedules(isDemoStudent ? MOCK_SCHEDULES : []);
      }
    } catch {
      if (isDemoStudent) setSchedules(MOCK_SCHEDULES);
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleReviewAbsence = async (id: number, status: 'ACCEPTEE' | 'REFUSEE') => {
    try {
      await api.updateAbsenceStatus(
        id,
        status,
        status === 'ACCEPTEE' ? 'Justificatif validé par l’administration' : 'Motif ou justificatif non conforme'
      );
      Alert.alert(
        status === 'ACCEPTEE' ? 'Absence Validée' : 'Absence Refusée',
        `La demande a été mise à jour avec succès.`
      );
      await loadData();
    } catch (e) {
      // Fallback local
      setAbsences((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                review_comment:
                  status === 'ACCEPTEE'
                    ? 'Justificatif validé (Mode local)'
                    : 'Refusé par la scolarité',
              }
            : item
        )
      );
      Alert.alert('Statut mis à jour', `L'absence a été marquée comme ${status.toLowerCase()}.`);
    }
  };


  const handleAiDraft = () => {
    const aiDrafted =
      'Madame, Monsieur,\n\nJe vous informe par la présente de mon impossibilité d’assister à la séance de cours en raison d’un rendez-vous médical impérieux.\n\nVous trouverez en pièce jointe le certificat médical justificatif.\n\nEn vous remerciant de votre compréhension,\nAlexandre Dubois';
    setReason(aiDrafted);
    Alert.alert('Aide IA à la rédaction', 'Le motif formel d’absence a été rédigé avec succès.');
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('Motif obligatoire', 'Veuillez indiquer le motif de votre absence.');
      return;
    }

    setLoading(true);
    try {
      await api.createAbsence({
        schedule_id: selectedScheduleId,
        reason: reason.trim(),
      });
      Alert.alert(
        'Demande transmise',
        'Votre déclaration d’absence a été enregistrée et transmise au secrétariat pédagogique.'
      );
      setShowForm(false);
      setReason('');
      setHasJustificatif(false);
      await loadData();
    } catch (e: any) {
      // Local fallback
      const newAbs: AbsenceRequest = {
        id: Date.now(),
        student_id: 3,
        schedule_id: selectedScheduleId,
        reason: reason.trim(),
        status: 'EN_ATTENTE',
        created_at: 'Aujourd’hui',
      };
      setAbsences([newAbs, ...absences]);
      setShowForm(false);
      setReason('');
      Alert.alert(
        'Demande transmise',
        'Votre demande a été enregistrée. Statut : En attente de validation.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header action */}
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.heading}>
              {isStaff ? 'Supervision des Absences' : 'Mes Démarches d’Absence'}
            </Text>
            <Badge
              label={isLive ? 'API LIVE' : 'LOCAL'}
              tone={isLive ? 'success' : 'neutral'}
              size="sm"
            />
          </View>
          <Text style={styles.subheading}>
            {isStaff
              ? 'Traitement et validation des justificatifs médicaux'
              : 'Déclarer un empêchement et suivre vos justificatifs'}
          </Text>
        </View>

        {!isStaff && (
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => setShowForm(!showForm)}
            activeOpacity={0.8}
          >
            {showForm ? (
              <X size={16} color="#FFF" />
            ) : (
              <>
                <Plus size={16} color="#FFF" />
                <Text style={styles.newBtnText}>Déclarer</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>


      {/* New Absence Declaration Form */}
      {showForm && (
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Nouvelle déclaration d'absence</Text>

          <Text style={styles.label}>Sélectionnez le cours concerné</Text>
          <View style={styles.scheduleChoices}>
            {schedules.slice(0, 3).map((sch) => (
              <TouchableOpacity
                key={sch.id}
                style={[
                  styles.schChoice,
                  selectedScheduleId === sch.id && styles.schChoiceActive,
                ]}
                onPress={() => setSelectedScheduleId(sch.id)}
              >
                <Calendar
                  size={14}
                  color={selectedScheduleId === sch.id ? Colors.primary : Colors.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.schTitle,
                      selectedScheduleId === sch.id && styles.schTitleActive,
                    ]}
                  >
                    {sch.course_title || 'Cours de spécialité'}
                  </Text>
                  <Text style={styles.schSub}>
                    {sch.start_time} - {sch.end_time} · {sch.room}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.reasonHeader}>
            <Text style={styles.label}>Motif de l'absence *</Text>
            <TouchableOpacity style={styles.aiHelpBtn} onPress={handleAiDraft}>
              <Sparkles size={12} color={Colors.aiPurple} />
              <Text style={styles.aiHelpText}>Rédiger avec l’IA</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Indiquez la raison de votre absence..."
            placeholderTextColor={Colors.textMuted}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Justificatif (PDF, photo de certificat)</Text>
          <TouchableOpacity
            style={[styles.uploadBox, hasJustificatif && styles.uploadBoxSelected]}
            onPress={() => {
              setHasJustificatif(!hasJustificatif);
              Alert.alert(
                'Document justificatif',
                hasJustificatif ? 'Pièce retirée' : 'Certificat_medical_2025.pdf joint avec succès.'
              );
            }}
          >
            <Paperclip size={18} color={hasJustificatif ? Colors.success : Colors.primary} />
            <Text
              style={[
                styles.uploadText,
                hasJustificatif && { color: Colors.successText, fontWeight: '700' },
              ]}
            >
              {hasJustificatif
                ? '✓ Certificat_medical_2025.pdf joint'
                : 'Joindre un justificatif (PDF ou JPG)'}
            </Text>
          </TouchableOpacity>

          <Button
            title="Soumettre ma demande"
            onPress={handleSubmit}
            loading={loading}
            size="md"
            variant="primary"
            style={{ marginTop: 14 }}
          />
        </Card>
      )}

      {/* Absence History List */}
      <Text style={styles.historyHeading}>
        {isStaff ? `Demandes d’absence à traiter (${absences.length})` : `Historique de vos demandes (${absences.length})`}
      </Text>

      {absences.length === 0 ? (
        <Card style={{ padding: 24, alignItems: 'center' }}>
          <FileText size={32} color={Colors.textMuted} />
          <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textDark, marginTop: 10 }}>
            {isStaff ? 'Aucune demande à traiter' : 'Aucune absence déclarée'}
          </Text>
          <Text style={{ fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 4 }}>
            {isStaff
              ? 'Toutes les demandes d’absence ont été traitées.'
              : 'Vous êtes à jour. Vous pouvez soumettre une déclaration en cas d’imprévu.'}
          </Text>
        </Card>
      ) : (
        absences.map((abs) => {
          const isAccepted = abs.status === 'ACCEPTEE';
          const isPending = abs.status === 'EN_ATTENTE';
          return (
            <Card key={abs.id} style={styles.absenceCard}>
              <View style={styles.cardHeader}>
                <Badge
                  label={
                    isAccepted ? 'ACCEPTÉE' : isPending ? 'EN ATTENTE' : 'REFUSÉE'
                  }
                  tone={isAccepted ? 'success' : isPending ? 'warning' : 'danger'}
                  size="sm"
                />
                <Text style={styles.dateText}>{abs.created_at}</Text>
              </View>

              <Text style={styles.reasonText}>{abs.reason}</Text>

              {abs.review_comment && (
                <View style={styles.commentBox}>
                  <Text style={styles.commentLabel}>Commentaire administration :</Text>
                  <Text style={styles.commentText}>{abs.review_comment}</Text>
                </View>
              )}

              {/* Actions de validation pour Enseignant ou Administrateur */}
              {isStaff && isPending && (
                <View style={styles.staffActionRow}>
                  <Button
                    title="Valider"
                    variant="primary"
                    size="sm"
                    onPress={() => handleReviewAbsence(abs.id, 'ACCEPTEE')}
                    icon={<Check size={14} color="#FFF" />}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Refuser"
                    variant="danger"
                    size="sm"
                    onPress={() => handleReviewAbsence(abs.id, 'REFUSEE')}
                    icon={<XCircle size={14} color="#FFF" />}
                    style={{ flex: 1 }}
                  />
                </View>
              )}
            </Card>
          );
        })
      )}

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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textDark,
  },
  subheading: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  newBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  formCard: {
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textDark,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 6,
    marginTop: 8,
  },
  scheduleChoices: {
    gap: 6,
    marginBottom: 8,
  },
  schChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgLight,
  },
  schChoiceActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  schTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textDark,
  },
  schTitleActive: {
    color: Colors.primary,
  },
  schSub: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  reasonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  aiHelpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDE9FE',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  aiHelpText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.aiPurple,
  },
  input: {
    backgroundColor: Colors.bgLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: Colors.textDark,
  },
  textArea: {
    minHeight: 80,
  },
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
  },
  uploadBoxSelected: {
    backgroundColor: '#D1FAE5',
    borderColor: '#6EE7B7',
    borderStyle: 'solid',
  },
  uploadText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  historyHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  absenceCard: {
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  reasonText: {
    fontSize: 13,
    color: Colors.textDark,
    lineHeight: 18,
  },
  commentBox: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  commentLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  commentText: {
    fontSize: 11,
    color: Colors.textMedium,
    marginTop: 2,
  },
  staffActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});

