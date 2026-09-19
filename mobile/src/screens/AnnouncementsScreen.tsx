import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { api } from '../api/client';
import { MOCK_ANNOUNCEMENTS } from '../data/mockData';
import { Announcement, AnnouncementCategory } from '../types';
import { Search, Sparkles, Calendar, Bell, ChevronDown, ChevronUp } from 'lucide-react-native';

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'ALL', label: 'Toutes' },
  { id: 'ADMINISTRATION', label: 'Administration' },
  { id: 'COURS', label: 'Cours' },
  { id: 'EXAMENS', label: 'Examens' },
  { id: 'EVENEMENTS', label: 'Événements' },
];

export const AnnouncementsScreen: React.FC = () => {
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [search, setSearch] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [expandedAi, setExpandedAi] = useState<Record<number, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);

  const loadAnnouncements = async () => {
    try {
      const data = await api.getAnnouncements();
      if (data && data.length > 0) setAnnouncements(data);
    } catch {}
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnnouncements();
    setRefreshing(false);
  };

  const toggleAiSummary = (id: number) => {
    setExpandedAi((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = announcements.filter((a) => {
    if (selectedCat !== 'ALL' && a.category !== selectedCat) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchBox}>
        <Search size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une annonce officielle..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category Filter Chips */}
      <View style={styles.categoriesBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.catChip, selectedCat === c.id && styles.catChipActive]}
              onPress={() => setSelectedCat(c.id)}
            >
              <Text style={[styles.catChipText, selectedCat === c.id && styles.catChipTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Fil officiel du campus ({filtered.length})</Text>

        {filtered.map((item) => {
          const isAiOpen = expandedAi[item.id];
          return (
            <Card key={item.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Badge label={item.category} tone="info" size="sm" />
                <Text style={styles.dateText}>{item.created_at}</Text>
              </View>

              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.content}</Text>

              {/* AI Quick Summary Toggle */}
              <TouchableOpacity
                style={styles.aiToggleBtn}
                onPress={() => toggleAiSummary(item.id)}
                activeOpacity={0.7}
              >
                <Sparkles size={13} color={Colors.aiPurple} />
                <Text style={styles.aiToggleText}>
                  {isAiOpen ? 'Masquer la synthèse IA' : 'Afficher le résumé généré par l’IA'}
                </Text>
                {isAiOpen ? (
                  <ChevronUp size={14} color={Colors.aiPurple} />
                ) : (
                  <ChevronDown size={14} color={Colors.aiPurple} />
                )}
              </TouchableOpacity>

              {isAiOpen && (
                <View style={styles.aiSummaryBox}>
                  <Text style={styles.aiSummaryHeading}>Synthèse intelligente :</Text>
                  <Text style={styles.aiSummaryBullet}>
                    • <Text style={{ fontWeight: '700' }}>Information clé :</Text> Concerne la promotion L3 Informatique.
                  </Text>
                  <Text style={styles.aiSummaryBullet}>
                    • <Text style={{ fontWeight: '700' }}>Action requise :</Text> À compléter avant la date limite mentionnée.
                  </Text>
                </View>
              )}
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgLight,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textDark,
  },
  categoriesBar: {
    marginVertical: 10,
  },
  catChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.border,
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  card: {
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textDark,
    marginBottom: 6,
    lineHeight: 20,
  },
  body: {
    fontSize: 13,
    color: Colors.textMedium,
    lineHeight: 18,
    marginBottom: 10,
  },
  aiToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  aiToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.aiPurple,
    flex: 1,
  },
  aiSummaryBox: {
    backgroundColor: '#F5F3FF',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    gap: 4,
  },
  aiSummaryHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.aiPurple,
  },
  aiSummaryBullet: {
    fontSize: 11,
    color: Colors.textDark,
    lineHeight: 16,
  },
});
