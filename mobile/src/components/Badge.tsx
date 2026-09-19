import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

export type BadgeTone = 'info' | 'success' | 'warning' | 'danger' | 'purple' | 'neutral';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  tone = 'info',
  size = 'md',
  icon,
}) => {
  const getColors = () => {
    switch (tone) {
      case 'success':
        return { bg: Colors.successLight, text: Colors.successText, border: '#A7F3D0' };
      case 'warning':
        return { bg: Colors.warningLight, text: Colors.warningText, border: '#FDE68A' };
      case 'danger':
        return { bg: Colors.dangerLight, text: Colors.dangerText, border: '#FECACA' };
      case 'purple':
        return { bg: Colors.aiPurpleLight, text: Colors.aiPurple, border: '#DDD6FE' };
      case 'neutral':
        return { bg: Colors.bgSubtle, text: Colors.textMuted, border: Colors.border };
      default:
        return { bg: Colors.infoLight, text: Colors.infoText, border: '#BFDBFE' };
    }
  };

  const scheme = getColors();
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: scheme.bg,
          borderColor: scheme.border,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 6 : 8,
        },
      ]}
    >
      {icon && <View style={styles.iconBox}>{icon}</View>}
      <Text
        style={[
          styles.text,
          {
            color: scheme.text,
            fontSize: isSmall ? 10 : 11,
            fontWeight: '700',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  iconBox: {
    marginRight: 4,
  },
  text: {
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
