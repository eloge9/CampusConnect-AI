import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { Colors } from '../theme/colors';

interface AIHighlightBoxProps {
  title: string;
  badgeText?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const AIHighlightBox: React.FC<AIHighlightBoxProps> = ({
  title,
  badgeText = 'IA CAMPUS',
  children,
  style,
}) => {
  return (
    <View style={[styles.wrapper, style]}>
      <LinearGradient
        colors={['#1E3A8A', '#2563EB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerLeft}>
          <View style={styles.sparkleCircle}>
            <Sparkles size={14} color="#F59E0B" />
          </View>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>{badgeText}</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sparkleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  badgePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePillText: {
    color: '#FEF3C7',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  body: {
    padding: 14,
    backgroundColor: '#F0F7FF',
  },
});
