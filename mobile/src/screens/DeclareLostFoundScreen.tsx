import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { api } from '../api/client';
import {
  ArrowLeft,
  Camera,
  Sparkles,
  MapPin,
  Tag,
  CheckCircle,
  HelpCircle,
} from 'lucide-react-native';

const CATEGORIES = [
  'ELECTRONIQUE',
  'DOCUMENTS',
  'FOURNITURES',
  'VETEMENTS',
  'BAGAGERIE',
  'AUTRE',
];

interface DeclareLostFoundScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const DeclareLostFoundScreen: React.FC<DeclareLostFoundScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const [itemType, setItemType] = useState<'PERDU' | 'TROUVE'>('PERDU');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ELECTRONIQUE');
  const [color, setColor] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !location.trim() || !description.trim()) {
      Alert.alert('Champs requis', 'Veuillez renseigner au minimum un titre, le lieu et une description.');
      return;
    }

    setLoading(true);
    try {
      await api.createLostFoundItem({
        item_type: itemType,
        title: title.trim(),
        description: description.trim(),
        category,
        color: color.trim() || undefined,
        location: location.trim(),
        item_date: new Date().toISOString().split('T')[0],
      });

      Alert.alert(
        'Publication enregistrée !',
        'L’algorithme IA a analysé votre signalement et compare actuellement la base d’objets pour détecter des correspondances.',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible d’enregistrer le signalement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={20} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Déclarer un objet</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Type Switcher */}
        <View style={styles.typeSwitcher}>
          <TouchableOpacity
            style={[styles.typeBtn, itemType === 'PERDU' && styles.typeBtnLost]}
            onPress={() => setItemType('PERDU')}
          >
            <HelpCircle
              size={16}
              color={itemType === 'PERDU' ? '#FFF' : Colors.textMuted}
            />
            <Text
              style={[styles.typeBtnText, itemType === 'PERDU' && styles.typeBtnTextActive]}
            >
              Objet Perdu
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeBtn, itemType === 'TROUVE' && styles.typeBtnFound]}
            onPress={() => setItemType('TROUVE')}
          >
            <CheckCircle
              size={16}
              color={itemType === 'TROUVE' ? '#FFF' : Colors.textMuted}
            />
            <Text
              style={[styles.typeBtnText, itemType === 'TROUVE' && styles.typeBtnTextActive]}
            >
              Objet Trouvé
            </Text>
          </TouchableOpacity>
        </View>

        {/* AI Auto-Matching Notice */}
        <View style={styles.aiNoticeBox}>
          <Sparkles size={16} color={Colors.aiPurple} />
          <Text style={styles.aiNoticeText}>
            L’IA Campus analysera votre texte et votre photo pour proposer des correspondances automatiques dès publication.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Titre de l'objet *</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: Clé USB SanDisk 64Go rouge et noire"
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Catégorie</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catChip,
                  category === cat && styles.catChipActive,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.catChipText,
                    category === cat && styles.catChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Couleur dominante</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: Rouge / Noire"
            placeholderTextColor={Colors.textMuted}
            value={color}
            onChangeText={setColor}
          />

          <Text style={styles.label}>Lieu où l'objet a été perdu / trouvé *</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: Amphi Alan Turing, Cafétéria, Bâtiment C..."
            placeholderTextColor={Colors.textMuted}
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.label}>Description détaillée & signes distinctifs *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Donnez un maximum de détails (marque, rayures, contenu, autocollants)..."
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Photo de l'objet (recommandé pour l'IA)</Text>
          <TouchableOpacity
            style={[styles.photoBox, hasPhoto && styles.photoBoxSelected]}
            onPress={() => {
              setHasPhoto(!hasPhoto);
              Alert.alert(
                'Photo sélectionnée',
                hasPhoto ? 'Photo retirée' : 'Photo de l’objet simulée pour l’analyse IA.'
              );
            }}
          >
            <Camera size={24} color={hasPhoto ? Colors.success : Colors.primary} />
            <Text
              style={[
                styles.photoBoxText,
                hasPhoto && { color: Colors.successText, fontWeight: '700' },
              ]}
            >
              {hasPhoto
                ? '✓ Photo de l’objet prête pour l’analyse IA'
                : 'Ajouter une photo depuis la galerie ou l’appareil'}
            </Text>
          </TouchableOpacity>

          <Button
            title={`Publier le signalement (${itemType === 'PERDU' ? 'Perdu' : 'Trouvé'})`}
            onPress={handleSubmit}
            loading={loading}
            size="lg"
            variant="primary"
            style={{ marginTop: 20 }}
          />
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textDark,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  typeSwitcher: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  typeBtnLost: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  typeBtnFound: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  typeBtnTextActive: {
    color: '#FFF',
  },
  aiNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EDE9FE',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginBottom: 16,
  },
  aiNoticeText: {
    fontSize: 12,
    color: '#5B21B6',
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  formCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: Colors.bgLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.textDark,
  },
  textArea: {
    minHeight: 80,
  },
  categoryScroll: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  catChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.bgLight,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
  },
  catChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  catChipTextActive: {
    color: '#FFF',
  },
  photoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    borderRadius: 12,
    padding: 14,
    justifyContent: 'center',
    marginTop: 4,
  },
  photoBoxSelected: {
    backgroundColor: '#D1FAE5',
    borderColor: '#6EE7B7',
    borderStyle: 'solid',
  },
  photoBoxText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    flex: 1,
  },
});
