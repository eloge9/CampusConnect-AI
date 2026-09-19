import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { Bell, Sparkles, Shield, GraduationCap } from 'lucide-react-native';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onNotificationPress?: () => void;
  unreadNotifications?: number;
  onRolePress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onNotificationPress,
  unreadNotifications = 2,
  onRolePress,
}) => {
  const { user, role, isBackendConnected } = useAuth();

  const getRoleLabel = () => {
    switch (role) {
      case 'ADMIN':
        return 'Admin';
      case 'TEACHER':
        return 'Enseignant';
      default:
        return 'Étudiant';
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case 'ADMIN':
        return Colors.danger;
      case 'TEACHER':
        return Colors.accentGoldDark;
      default:
        return Colors.secondary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.brandText}>CampusConnect</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.aiTag}>AI</Text>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isBackendConnected ? Colors.success : Colors.accentGold },
                ]}
              />
              <Text style={styles.statusLabel}>
                {isBackendConnected ? 'API OK' : 'Local'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.rolePill, { borderColor: getRoleColor() }]}
            onPress={onRolePress}
            activeOpacity={0.7}
          >
            {role === 'ADMIN' ? (
              <Shield size={12} color={getRoleColor()} />
            ) : role === 'TEACHER' ? (
              <Sparkles size={12} color={getRoleColor()} />
            ) : (
              <GraduationCap size={12} color={getRoleColor()} />
            )}
            <Text style={[styles.roleText, { color: getRoleColor() }]}>
              {getRoleLabel()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={onNotificationPress}
            activeOpacity={0.7}
          >
            <Bell size={20} color={Colors.textDark} />
            {unreadNotifications > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {title && (
        <View style={styles.greetingBox}>
          <Text style={styles.titleText}>{title}</Text>
          {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgSurface,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },
  aiTag: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryLight,
    letterSpacing: 0.5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 20,
    borderWidth: 1.2,
    backgroundColor: Colors.bgLight,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeCount: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.danger,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.bgSurface,
  },
  badgeCountText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  greetingBox: {
    marginTop: 14,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textDark,
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 3,
    lineHeight: 18,
  },
});
