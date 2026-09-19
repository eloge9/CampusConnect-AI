import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { AIHighlightBox } from '../components/AIHighlightBox';
import { api } from '../api/client';
import { MOCK_LOST_ITEMS, MOCK_MATCH } from '../data/mockData';
import { LostFoundItem, PotentialMatch } from '../types';
import {
  Search,
  Plus,
  MapPin,
  Calendar,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Tag,
} from 'lucide-react-native';

interface LostFoundScreenProps {
  onOpenDeclareModal: () => void;
}

export const LostFoundScreen: React.FC<LostFoundScreenProps> = ({
  onOpenDeclareModal,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'perdu' | 'trouve' | 'match'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<LostFoundItem[]>(MOCK_LOST_ITEMS);
  const [match, setMatch] = useState<PotentialMatch>(MOCK_MATCH);
  const [matchAction, setMatchAction] = useState<'idle' | 'confirmed' | 'rejected'>('idle');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await api.getLostFoundItems();
      if (data && data.length > 0) setItems(data);
    } catch {}

    try {
      const matches = await api.getPotentialMatches();
      if (matches && matches.length > 0) setMatch(matches[0]);
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

  const handleMatchResponse = async (status: 'CONFIRMEE' | 'REJETEE') => {
    try {
      await api.updateMatchStatus(match.id, status);
    } catch {}

    if (status === 'CONFIRMEE') {
      setMatchAction('confirmed');
      Alert.alert(
        'Correspondance Confirmée !',
        'La correspondance a été validée. Les coordonnées de retrait ont été transmises.'
      );
    } else {
      setMatchAction('rejected');
      Alert.alert('Information', 'Cette suggestion a été écartée.');
    }
  };

  const filteredItems = items.filter((item) => {
    if (filterTab === 'perdu' && item.item_type !== 'PERDU') return false;
    if (filterTab === 'trouve' && item.item_type !== 'TROUVE') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un objet, lieu, couleur..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          style={styles.declareBtn}
          onPress={onOpenDeclareModal}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#FFF" />
          <Text style={styles.declareBtnText}>Déclarer</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterStrip}>
        <TouchableOpacity
          style={[styles.filterChip, filterTab === 'all' && styles.filterChipActive]}
          onPress={() => setFilterTab('all')}
        >
          <Text
            style={[styles.filterChipText, filterTab === 'all' && styles.filterChipTextActive]}
          >
            Tous ({items.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterTab === 'perdu' && styles.filterChipActive]}
          onPress={() => setFilterTab('perdu')}
        >
          <Text
            style={[styles.filterChipText, filterTab === 'perdu' && styles.filterChipTextActive]}
          >
            Perdus
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterTab === 'trouve' && styles.filterChipActive]}
          onPress={() => setFilterTab('trouve')}
        >
          <Text
            style={[styles.filterChipText, filterTab === 'trouve' && styles.filterChipTextActive]}
          >
            Trouvés
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterTab === 'match' && styles.filterChipActive]}
          onPress={() => setFilterTab('match')}
        >
          <Sparkles
            size={12}
            color={filterTab === 'match' ? '#FFF' : Colors.aiPurple}
          />
          <Text
            style={[styles.filterChipText, filterTab === 'match' && styles.filterChipTextActive]}
          >
            Matchs IA (1)
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Core AI Match Banner (shown on all or match tab) */}
        {(filterTab === 'all' || filterTab === 'match') && (
          <AIHighlightBox
            title="CORRESPONDANCE IA DÉTECTÉE"
            badgeText={`${Math.round((match.similarity_score || 0.88) * 100)}% MATCH`}
          >
            {matchAction === 'idle' ? (
              <View style={styles.matchBoxContent}>
                <Text style={styles.matchIntro}>
                  L’algorithme IA a identifié une correspondance sémantique et spatiale forte entre votre objet perdu et une récente trouvaille :
                </Text>

                <View style={styles.matchComparison}>
                  <View style={styles.matchItemSide}>
                    <Badge label="VOTRE OBJET PERDU" tone="danger" size="sm" />
                    <Text style={styles.matchSideTitle}>Clé USB SanDisk 64Go</Text>
                    <Text style={styles.matchSideMeta}>Foyer Turing · Bât. C</Text>
                  </View>

                  <View style={styles.matchVersus}>
                    <Sparkles size={16} color={Colors.primary} />
                  </View>

                  <View style={styles.matchItemSide}>
                    <Badge label="OBJET TROUVÉ" tone="success" size="sm" />
                    <Text style={styles.matchSideTitle}>SanDisk Ultra 64Go</Text>
                    <Text style={styles.matchSideMeta}>Foyer Turing · Matin</Text>
                  </View>
                </View>

                <Text style={styles.matchExplanation}>
                  « Caractéristiques identiques : clé USB SanDisk 64Go, coque rouge/noire, même zone de perte/découverte au Foyer Turing. »
                </Text>

                <View style={styles.matchActionsRow}>
                  <Button
                    title="Confirmer la correspondance"
                    onPress={() => handleMatchResponse('CONFIRMEE')}
                    variant="primary"
                    size="sm"
                    icon={<CheckCircle2 size={14} color="#FFF" />}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Rejeter"
                    onPress={() => handleMatchResponse('REJETEE')}
                    variant="outline"
                    size="sm"
                    icon={<XCircle size={14} color={Colors.primary} />}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.matchResolved}>
                <CheckCircle2 size={20} color={Colors.success} />
                <Text style={styles.matchResolvedText}>
                  {matchAction === 'confirmed'
                    ? 'Correspondance confirmée ! Rendez-vous au Foyer Turing pour la restitution.'
                    : 'Suggestion rejetée par l’utilisateur.'}
                </Text>
              </View>
            )}
          </AIHighlightBox>
        )}

        {filterTab !== 'match' && (
          <>
            <Text style={styles.sectionHeading}>
              Derniers signalements ({filteredItems.length})
            </Text>

            {filteredItems.map((item) => {
              const isLost = item.item_type === 'PERDU';
              return (
                <Card key={item.id} style={styles.itemCard}>
                  <View style={styles.itemCardHeader}>
                    <Badge
                      label={isLost ? 'OBJET PERDU' : 'OBJET TROUVÉ'}
                      tone={isLost ? 'danger' : 'success'}
                      size="sm"
                    />
                    <Text style={styles.itemDate}>{item.item_date}</Text>
                  </View>

                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDesc}>{item.description}</Text>

                  <View style={styles.metaRow}>
                    <MapPin size={14} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{item.location}</Text>
                  </View>

                  {item.color && (
                    <View style={styles.metaRow}>
                      <Tag size={14} color={Colors.textMuted} />
                      <Text style={styles.metaText}>Couleur : {item.color}</Text>
                    </View>
                  )}

                  <View style={styles.itemFooter}>
                    <Badge label={item.category || 'DIVERS'} tone="neutral" size="sm" />
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert(
                          item.title,
                          `Déclaration : ${item.description}\nLieu : ${item.location}\nPour réclamer ou signaler cet objet, adressez-vous à l'accueil du bâtiment C.`
                        )
                      }
                    >
                      <Text style={styles.contactLink}>Voir détails</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })}
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
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    fontSize: 13,
    color: Colors.textDark,
  },
  declareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  declareBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  filterStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.bgLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  matchBoxContent: {
    gap: 10,
  },
  matchIntro: {
    fontSize: 12,
    color: Colors.textMedium,
    lineHeight: 16,
  },
  matchComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  matchItemSide: {
    flex: 1,
    gap: 3,
  },
  matchSideTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textDark,
  },
  matchSideMeta: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  matchVersus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchExplanation: {
    fontSize: 11,
    color: Colors.primaryDark,
    fontStyle: 'italic',
    lineHeight: 15,
  },
  matchActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  matchResolved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  matchResolvedText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textDark,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 6,
  },
  itemCard: {
    marginBottom: 12,
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textDark,
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 12,
    color: Colors.textMedium,
    lineHeight: 17,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  contactLink: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});
