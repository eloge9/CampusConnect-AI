import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Colors } from '../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          btn: { backgroundColor: Colors.secondary },
          text: { color: '#FFF' },
        };
      case 'accent':
        return {
          btn: { backgroundColor: Colors.accentGold },
          text: { color: Colors.primaryDark },
        };
      case 'outline':
        return {
          btn: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: Colors.primary,
          },
          text: { color: Colors.primary },
        };
      case 'danger':
        return {
          btn: { backgroundColor: Colors.danger },
          text: { color: '#FFF' },
        };
      case 'ghost':
        return {
          btn: { backgroundColor: 'transparent' },
          text: { color: Colors.primary },
        };
      default:
        return {
          btn: { backgroundColor: Colors.primary },
          text: { color: '#FFF' },
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          btn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
          text: { fontSize: 12, fontWeight: '700' as const },
        };
      case 'lg':
        return {
          btn: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16 },
          text: { fontSize: 16, fontWeight: '800' as const },
        };
      default:
        return {
          btn: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12 },
          text: { fontSize: 14, fontWeight: '700' as const },
        };
    }
  };

  const vStyles = getVariantStyles();
  const sStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.baseButton,
        vStyles.btn,
        sStyles.btn,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={vStyles.text.color}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconBox}>{icon}</View>}
          <Text style={[styles.baseText, vStyles.text, sStyles.text, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    marginRight: 8,
  },
  baseText: {
    letterSpacing: -0.2,
  },
  disabled: {
    opacity: 0.5,
  },
});
