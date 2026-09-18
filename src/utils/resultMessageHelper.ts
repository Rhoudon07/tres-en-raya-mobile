import { CellSymbol } from '../types/board';

/**
 * Formatea el mensaje del resultado para la pantalla final / modal.
 * Cuando la CPU gana frente al jugador humano, especifica que ganó la CPU y la ficha con la que lo logró.
 */
export const formatResultMessage = (resultMessage: string, winner: CellSymbol | 'D'): string => {
  const isDefeat = resultMessage.includes('Derrota') || resultMessage.toLowerCase().includes('cpu');
  if (isDefeat) {
    if (winner && winner !== 'D' && winner !== ' ') {
      let suffix = '';
      if (resultMessage.includes('Inmovilizado')) {
        suffix = ' (Por inmovilización)';
      } else if (resultMessage.includes('tiempo')) {
        suffix = ' (Por tiempo)';
      }
      return `Ha ganado la CPU con la ficha ${winner}${suffix}`;
    }
    return 'Ha ganado la CPU';
  }
  return resultMessage;
};
