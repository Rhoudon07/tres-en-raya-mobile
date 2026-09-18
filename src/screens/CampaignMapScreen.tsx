import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import {
  CAMPAIGN_WORLDS,
  CAMPAIGN_LEVELS,
  CampaignLevel,
  CampaignWorld,
} from '../types/campaign';
import { useCampaignStore } from '../stores/useCampaignStore';
import { useGameStore } from '../stores/useGameStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { GameMode, PlayerTurnOrder } from '../types/game';
import { GameButton } from '../components/common/GameButton';
import { Badge } from '../components/common/Badge';
import { LevelBriefModal } from '../components/campaign/LevelBriefModal';

interface CampaignMapScreenProps {
  navigation: any;
}

export const CampaignMapScreen: React.FC<CampaignMapScreenProps> = ({ navigation }) => {
  const [selectedWorldId, setSelectedWorldId] = useState<number>(1);
  const [activeModalLevel, setActiveModalLevel] = useState<CampaignLevel | null>(null);

  const progress = useCampaignStore((state) => state.progress);
  const loadCampaign = useCampaignStore((state) => state.loadCampaign);
  const getTotalStars = useCampaignStore((state) => state.getTotalStars);
  const setActiveLevel = useCampaignStore((state) => state.setActiveLevel);

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  const activeWorld = CAMPAIGN_WORLDS.find((w) => w.id === selectedWorldId) || CAMPAIGN_WORLDS[0];
  const worldLevels = CAMPAIGN_LEVELS.filter((lvl) => lvl.worldId === activeWorld.id);
  const totalStars = getTotalStars();

  const handleStartLevel = (level: CampaignLevel) => {
    setActiveModalLevel(null);
    setActiveLevel(level.id);

    // Configurar la dificultad de la IA especificada por el nivel
    useSettingsStore.getState().setDifficultyFor(level.boardType, level.aiDifficulty);

    // Configurar el tipo de tablero (y reglas personalizadas si existen)
    useGameStore.getState().setBoardType(level.boardType, level.customRules);

    // Iniciar partida PvCPU donde el jugador humano (X) inicia
    useGameStore.getState().startNewGame(GameMode.PvCPU, PlayerTurnOrder.First);

    navigation.navigate('Game');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Barra Superior */}
      <View style={styles.topBar}>
        <GameButton
          title="←"
          size="small"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        />
        <View style={styles.titleColumn}>
          <Text style={styles.screenTitle}>MODO CAMPAÑA</Text>
          <Text style={styles.screenSubtitle}>Aventura Multidimensional</Text>
        </View>
        <Badge
          label={`⭐ ${totalStars} / 36`}
          color="#fbbf24"
          style={styles.starsBadge}
        />
      </View>

      {/* Selector de Mundos */}
      <View style={styles.worldTabsContainer}>
        {CAMPAIGN_WORLDS.map((world) => {
          const isSelected = world.id === selectedWorldId;
          return (
            <TouchableOpacity
              key={world.id}
              style={[
                styles.worldTab,
                isSelected && { borderColor: world.accentColor, backgroundColor: 'rgba(255,255,255,0.06)' },
              ]}
              onPress={() => setSelectedWorldId(world.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.worldTabNumber,
                  { color: isSelected ? world.accentColor : Colors.textSecondary },
                ]}
              >
                M{world.id}
              </Text>
              <Text
                style={[
                  styles.worldTabTitle,
                  isSelected && { color: Colors.textPrimary, fontWeight: '700' },
                ]}
                numberOfLines={1}
              >
                {world.title.replace(/^Mundo \d+:\s*/, '')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Contenido del Mundo y Mapa de Nodos */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner descriptivo del mundo */}
        <View style={[styles.worldBanner, { borderColor: activeWorld.themeColor }]}>
          <Text style={[styles.worldBannerTitle, { color: activeWorld.accentColor }]}>
            {activeWorld.title.toUpperCase()}
          </Text>
          <Text style={styles.worldBannerSubtitle}>{activeWorld.subtitle}</Text>
        </View>

        {/* Nodos de Nivel */}
        <View style={styles.pathContainer}>
          {worldLevels.map((lvl, index) => {
            const lvlProgress = progress[lvl.id] || {
              levelId: lvl.id,
              unlocked: lvl.id === 1,
              completed: false,
              stars: 0,
              highScore: 0,
            };
            const isUnlocked = lvlProgress.unlocked;
            const isCompleted = lvlProgress.completed;
            const isBoss = !!lvl.isBoss;

            return (
              <View key={lvl.id} style={styles.nodeWrapper}>
                {/* Conector vertical hacia el siguiente nodo */}
                {index > 0 && (
                  <View
                    style={[
                      styles.connectorLine,
                      { backgroundColor: isUnlocked ? activeWorld.accentColor : Colors.boardBorder },
                    ]}
                  />
                )}

                <TouchableOpacity
                  style={[
                    styles.levelNode,
                    isBoss && styles.bossNode,
                    !isUnlocked && styles.lockedNode,
                    isUnlocked && { borderColor: isBoss ? '#f59e0b' : activeWorld.accentColor },
                    isCompleted && styles.completedNode,
                  ]}
                  disabled={!isUnlocked}
                  onPress={() => setActiveModalLevel(lvl)}
                  activeOpacity={0.8}
                >
                  <View style={styles.nodeIconContainer}>
                    {!isUnlocked ? (
                      <Text style={styles.lockedIcon}>🔒</Text>
                    ) : isBoss ? (
                      <Text style={styles.bossIcon}>{lvl.bossAvatar || '👑'}</Text>
                    ) : (
                      <Text
                        style={[
                          styles.nodeNumber,
                          { color: isUnlocked ? Colors.textPrimary : Colors.textSecondary },
                        ]}
                      >
                        {lvl.id}
                      </Text>
                    )}
                  </View>

                  <View style={styles.nodeDetails}>
                    <View style={styles.nodeHeaderRow}>
                      <Text
                        style={[
                          styles.nodeTitle,
                          !isUnlocked && styles.lockedText,
                          isBoss && { color: '#f59e0b' },
                        ]}
                      >
                        {lvl.title}
                      </Text>
                      {isBoss && (
                        <Badge label="JEFE" color="#ef4444" style={styles.bossBadge} />
                      )}
                    </View>
                    <Text style={styles.nodeSubtitle} numberOfLines={1}>
                      {lvl.subtitle}
                    </Text>

                    {/* Estrellas obtenidas */}
                    {isUnlocked && (
                      <View style={styles.starsRow}>
                        {[1, 2, 3].map((starIndex) => (
                          <Text
                            key={starIndex}
                            style={[
                              styles.nodeStar,
                              starIndex <= lvlProgress.stars && styles.nodeStarFilled,
                            ]}
                          >
                            ★
                          </Text>
                        ))}
                        {lvlProgress.bestMoves !== undefined && (
                          <Text style={styles.bestMovesText}>
                            • Mejor: {lvlProgress.bestMoves} mvtos
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Modal de Briefing del Nivel */}
      <LevelBriefModal
        visible={!!activeModalLevel}
        level={activeModalLevel}
        progress={activeModalLevel ? progress[activeModalLevel.id] : null}
        onStart={handleStartLevel}
        onClose={() => setActiveModalLevel(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.boardBorder,
  },
  backBtn: {
    width: 42,
    height: 42,
  },
  titleColumn: {
    flex: 1,
    marginLeft: 12,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  screenSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  starsBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  worldTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  worldTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.boardBorder,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  worldTabNumber: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  worldTabTitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  worldBanner: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
    alignItems: 'center',
  },
  worldBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  worldBannerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  pathContainer: {
    alignItems: 'center',
  },
  nodeWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  connectorLine: {
    width: 3,
    height: 24,
    borderRadius: 1.5,
  },
  levelNode: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.boardSurface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.boardBorder,
    padding: 14,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  bossNode: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderColor: '#f59e0b',
  },
  completedNode: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  lockedNode: {
    opacity: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: Colors.boardBorder,
  },
  nodeIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  nodeNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  bossIcon: {
    fontSize: 22,
  },
  lockedIcon: {
    fontSize: 18,
  },
  nodeDetails: {
    flex: 1,
  },
  nodeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nodeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  bossBadge: {
    marginLeft: 8,
  },
  lockedText: {
    color: Colors.textSecondary,
  },
  nodeSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  nodeStar: {
    fontSize: 14,
    color: Colors.boardBorder,
    marginRight: 2,
  },
  nodeStarFilled: {
    color: '#fbbf24',
  },
  bestMovesText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
});
