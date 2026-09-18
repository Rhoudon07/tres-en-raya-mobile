import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Colors } from '../../constants/colors';
import { PowerType, PlayerPowers } from '../../types/powers';
import { HapticService } from '../../services/HapticService';

interface PowerBarProps {
  powers: PlayerPowers;
  activePower: PowerType | null;
  onSelectPower: (power: PowerType | null) => void;
  disabled?: boolean;
}

interface PowerDef {
  type: PowerType;
  icon: string;
  name: string;
  desc: string;
  isUsed: (p: PlayerPowers) => boolean;
}

const POWER_DEFS: PowerDef[] = [
  {
    type: PowerType.Bomb,
    icon: '💥',
    name: 'BOMBA',
    desc: 'Toca cualquier ficha para destruirla',
    isUsed: (p) => p.bombUsed,
  },
  {
    type: PowerType.DoubleTurn,
    icon: '🔄',
    name: '2X TURNO',
    desc: 'Coloca dos fichas consecutivas',
    isUsed: (p) => p.doubleTurnUsed,
  },
  {
    type: PowerType.BlockCell,
    icon: '🪨',
    name: 'BLOQUEO',
    desc: 'Toca una casilla vacía para bloquearla',
    isUsed: (p) => p.blockCellUsed,
  },
  {
    type: PowerType.Swap,
    icon: '🔀',
    name: 'SWAP',
    desc: 'Selecciona 2 fichas para intercambiarlas',
    isUsed: (p) => p.swapUsed,
  },
];

export const PowerBar: React.FC<PowerBarProps> = ({
  powers,
  activePower,
  onSelectPower,
  disabled = false,
}) => {
  const handlePress = (power: PowerType, used: boolean) => {
    if (disabled || used) {
      HapticService.warning();
      return;
    }

    if (activePower === power) {
      onSelectPower(null);
      HapticService.selection();
    } else {
      onSelectPower(power);
      HapticService.mediumImpact();
    }
  };

  const activeDef = POWER_DEFS.find((p) => p.type === activePower);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>HABILIDADES TÁCTICAS (1 USO C/U)</Text>

      <View style={styles.buttonsRow}>
        {POWER_DEFS.map((p) => {
          const used = p.isUsed(powers);
          const isSelected = activePower === p.type;

          return (
            <Pressable
              key={p.type}
              disabled={disabled || used}
              onPress={() => handlePress(p.type, used)}
              style={({ pressed }) => [
                styles.powerBtn,
                used && styles.powerBtnUsed,
                isSelected && styles.powerBtnSelected,
                pressed && !used && styles.powerBtnPressed,
              ]}
              accessibilityLabel={`${p.name}: ${used ? 'Agotado' : 'Disponible'}`}
            >
              <Text style={[styles.iconText, used && styles.iconUsed]}>
                {p.icon}
              </Text>
              <Text
                style={[
                  styles.powerName,
                  used && styles.textUsed,
                  isSelected && styles.textSelected,
                ]}
              >
                {p.name}
              </Text>
              {used && (
                <View style={styles.usedBadge}>
                  <Text style={styles.usedBadgeText}>USADO</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Mensaje instructivo del poder activo */}
      {activeDef && (
        <View style={styles.instructionBanner}>
          <Text style={styles.instructionText}>
            {activeDef.icon} {activeDef.desc} (Toca de nuevo para cancelar)
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.boardSurface,
    borderColor: Colors.boardBorder,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 12,
    marginVertical: 10,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  powerBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cellNormal,
    borderColor: Colors.cellBorder,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 8,
    position: 'relative',
  },
  powerBtnUsed: {
    opacity: 0.35,
    backgroundColor: '#171a23',
    borderColor: '#262d3d',
  },
  powerBtnSelected: {
    borderColor: Colors.accentPink,
    backgroundColor: 'rgba(255, 77, 121, 0.15)',
  },
  powerBtnPressed: {
    backgroundColor: Colors.cellHover,
  },
  iconText: {
    fontSize: 22,
    marginBottom: 2,
  },
  iconUsed: {
    opacity: 0.5,
  },
  powerName: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  textUsed: {
    color: Colors.textMuted,
  },
  textSelected: {
    color: Colors.accentPink,
  },
  usedBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#334155',
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  usedBadgeText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#94a3b8',
  },
  instructionBanner: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 77, 121, 0.1)',
    borderColor: 'rgba(255, 77, 121, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ff809f',
    textAlign: 'center',
  },
});
