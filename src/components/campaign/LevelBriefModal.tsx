import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';
import { CampaignLevel, CampaignLevelProgress } from '../../types/campaign';
import { GameButton } from '../common/GameButton';
import { Badge } from '../common/Badge';

interface LevelBriefModalProps {
  visible: boolean;
  level: CampaignLevel | null;
  progress: CampaignLevelProgress | null;
  onStart: (level: CampaignLevel) => void;
  onClose: () => void;
}

export const LevelBriefModal: React.FC<LevelBriefModalProps> = ({
  visible,
  level,
  progress,
  onStart,
  onClose,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.92);
    }
  }, [visible]);

  if (!visible || !level) return null;

  const currentStars = progress?.stars || 0;
  const isBoss = !!level.isBoss;
  const accentColor = isBoss ? '#f59e0b' : Colors.accentCyan;

  return (
    <Animated.View style={[styles.overlayContainer, { opacity: fadeAnim }]} pointerEvents="auto">
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale: scaleAnim }] },
            isBoss && styles.bossCardBorder,
          ]}
        >
          <ScrollView contentContainerStyle={styles.scrollInside} showsVerticalScrollIndicator={false}>
            {/* Encabezado del Nivel */}
            <View style={styles.header}>
              <View style={styles.badgeRow}>
                <Badge
                  label={`MUNDO ${level.worldId} • NIVEL ${level.id}`}
                  color={accentColor}
                />
                {isBoss && (
                  <Badge
                    label="👑 JEFE DE MUNDO"
                    color="#ef4444"
                    style={{ marginLeft: 6 }}
                  />
                )}
              </View>

              <Text style={styles.levelTitle}>{level.title}</Text>
              <Text style={styles.levelSubtitle}>{level.subtitle}</Text>
            </View>

            {/* Sección de Jefe (si aplica) */}
            {isBoss && (
              <View style={styles.bossBox}>
                <View style={styles.bossAvatarRow}>
                  <Text style={styles.bossAvatar}>{level.bossAvatar || '👾'}</Text>
                  <View style={styles.bossNameColumn}>
                    <Text style={styles.bossLabel}>OPONENTE SUPREMO</Text>
                    <Text style={styles.bossName}>{level.bossName}</Text>
                  </View>
                </View>
                {level.bossDialogue && (
                  <View style={styles.dialogueBubble}>
                    <Text style={styles.dialogueText}>"{level.bossDialogue}"</Text>
                  </View>
                )}
              </View>
            )}

            {/* Descripción del desafío */}
            <Text style={styles.description}>{level.description}</Text>

            {/* Metas / Condiciones de Estrellas */}
            <View style={styles.starsSection}>
              <Text style={styles.sectionTitle}>OBJETIVOS DE MISIÓN</Text>
              {level.starConditions.map((cond) => {
                const earned = currentStars >= cond.star;
                return (
                  <View key={cond.star} style={styles.starRow}>
                    <Text style={[styles.starIcon, earned && styles.starEarned]}>
                      {earned ? '★' : '☆'}
                    </Text>
                    <View style={styles.starTextContainer}>
                      <Text style={[styles.starConditionText, earned && styles.starTextEarned]}>
                        {cond.description}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Estadísticas de récord si ya fue completado */}
            {progress?.completed && (
              <View style={styles.recordBox}>
                <Text style={styles.recordLabel}>RÉCORD ACTUAL</Text>
                <Text style={styles.recordValue}>
                  {currentStars} / 3 ⭐ • {progress.bestMoves !== undefined ? `${progress.bestMoves} turnos` : ''} • {progress.highScore} pts
                </Text>
              </View>
            )}

            {/* Botones de acción */}
            <View style={styles.buttonGroup}>
              <GameButton
                title="INICIAR MISIÓN"
                variant={isBoss ? 'accent' : 'primary'}
                size="medium"
                onPress={() => onStart(level)}
                style={styles.actionBtn}
              />
              <GameButton
                title="VOLVER"
                variant="outline"
                size="small"
                onPress={onClose}
                style={styles.cancelBtn}
              />
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    elevation: 20,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 15, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: Colors.boardSurface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.boardBorder,
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  bossCardBorder: {
    borderColor: '#f59e0b',
    borderWidth: 2,
  },
  scrollInside: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  levelTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  levelSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  bossBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    padding: 12,
    marginBottom: 14,
  },
  bossAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bossAvatar: {
    fontSize: 32,
    marginRight: 10,
  },
  bossNameColumn: {
    flex: 1,
  },
  bossLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f59e0b',
    letterSpacing: 1,
  },
  bossName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dialogueBubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  dialogueText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  starsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  starIcon: {
    fontSize: 18,
    color: Colors.textSecondary,
    width: 24,
    textAlign: 'center',
  },
  starEarned: {
    color: '#fbbf24',
  },
  starTextContainer: {
    flex: 1,
    marginLeft: 6,
  },
  starConditionText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  starTextEarned: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  recordBox: {
    alignItems: 'center',
    marginBottom: 14,
    paddingVertical: 6,
  },
  recordLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accentGreen,
    letterSpacing: 1,
    marginBottom: 2,
  },
  recordValue: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  buttonGroup: {
    marginTop: 6,
    gap: 8,
  },
  actionBtn: {
    width: '100%',
  },
  cancelBtn: {
    width: '100%',
  },
});
