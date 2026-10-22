// Client-side Xiangqi rule validator for instant UI feedback and highlight dots

export const PIECE_COLORS = {
  RED: 'Red',
  BLACK: 'Black'
};

export const PIECE_TYPES = {
  KING: 'King',
  ADVISOR: 'Advisor',
  ELEPHANT: 'Elephant',
  HORSE: 'Horse',
  ROOK: 'Rook',
  CANNON: 'Cannon',
  PAWN: 'Pawn'
};

export function isValidPos(r, c) {
  return r >= 0 && r <= 9 && c >= 0 && c <= 8;
}

export function isInPalace(r, c, color) {
  if (c < 3 || c > 5) return false;
  return color === PIECE_COLORS.RED ? (r >= 7 && r <= 9) : (r >= 0 && r <= 2);
}

export function hasCrossedRiver(r, color) {
  return color === PIECE_COLORS.RED ? r <= 4 : r >= 5;
}

export function getPseudoLegalMoves(board, from, piece) {
  const moves = [];
  const { row: r, col: c } = from;
  const color = piece.color;

  switch (piece.type) {
    case PIECE_TYPES.KING: {
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (isValidPos(nr, nc) && isInPalace(nr, nc, color)) {
          const target = board[nr][nc];
          if (!target || target.color !== color) {
            moves.push({ row: nr, col: nc });
          }
        }
      }
      break;
    }

    case PIECE_TYPES.ADVISOR: {
      const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (isValidPos(nr, nc) && isInPalace(nr, nc, color)) {
          const target = board[nr][nc];
          if (!target || target.color !== color) {
            moves.push({ row: nr, col: nc });
          }
        }
      }
      break;
    }

    case PIECE_TYPES.ELEPHANT: {
      const dirs = [[-2, -2], [-2, 2], [2, -2], [2, 2]];
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (!isValidPos(nr, nc)) continue;
        if (hasCrossedRiver(nr, color)) continue; // Cannot cross river

        // Check eye
        const eyeR = r + dr / 2;
        const eyeC = c + dc / 2;
        if (board[eyeR][eyeC] !== null && board[eyeR][eyeC] !== undefined) continue;

        const target = board[nr][nc];
        if (!target || target.color !== color) {
          moves.push({ row: nr, col: nc });
        }
      }
      break;
    }

    case PIECE_TYPES.HORSE: {
      const jumps = [
        [-2, -1, -1, 0],
        [-2,  1, -1, 0],
        [ 2, -1,  1, 0],
        [ 2,  1,  1, 0],
        [-1, -2,  0, -1],
        [ 1, -2,  0, -1],
        [-1,  2,  0,  1],
        [ 1,  2,  0,  1]
      ];
      for (const [dr, dc, br, bc] of jumps) {
        const nr = r + dr, nc = c + dc;
        if (!isValidPos(nr, nc)) continue;

        // Check blocking leg
        const blockR = r + br;
        const blockC = c + bc;
        if (board[blockR][blockC] !== null && board[blockR][blockC] !== undefined) continue;

        const target = board[nr][nc];
        if (!target || target.color !== color) {
          moves.push({ row: nr, col: nc });
        }
      }
      break;
    }

    case PIECE_TYPES.ROOK: {
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) {
        let nr = r + dr, nc = c + dc;
        while (isValidPos(nr, nc)) {
          const target = board[nr][nc];
          if (!target) {
            moves.push({ row: nr, col: nc });
          } else {
            if (target.color !== color) {
              moves.push({ row: nr, col: nc });
            }
            break;
          }
          nr += dr;
          nc += dc;
        }
      }
      break;
    }

    case PIECE_TYPES.CANNON: {
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) {
        let nr = r + dr, nc = c + dc;
        let screened = false;
        while (isValidPos(nr, nc)) {
          const target = board[nr][nc];
          if (!screened) {
            if (!target) {
              moves.push({ row: nr, col: nc });
            } else {
              screened = true;
            }
          } else {
            if (target) {
              if (target.color !== color) {
                moves.push({ row: nr, col: nc });
              }
              break;
            }
          }
          nr += dr;
          nc += dc;
        }
      }
      break;
    }

    case PIECE_TYPES.PAWN: {
      const forwardDr = color === PIECE_COLORS.RED ? -1 : 1;
      const nr = r + forwardDr;
      if (isValidPos(nr, c)) {
        const target = board[nr][c];
        if (!target || target.color !== color) {
          moves.push({ row: nr, col: c });
        }
      }
      // Sideways moves after crossing river
      if (hasCrossedRiver(r, color)) {
        for (const dc of [-1, 1]) {
          const nc = c + dc;
          if (isValidPos(r, nc)) {
            const target = board[r][nc];
            if (!target || target.color !== color) {
              moves.push({ row: r, col: nc });
            }
          }
        }
      }
      break;
    }
  }

  return moves;
}

export function findKing(board, color) {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.type === PIECE_TYPES.KING && p.color === color) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

export function areKingsFacing(board) {
  const redKing = findKing(board, PIECE_COLORS.RED);
  const blackKing = findKing(board, PIECE_COLORS.BLACK);
  if (!redKing || !blackKing) return false;
  if (redKing.col !== blackKing.col) return false;

  const minR = Math.min(redKing.row, blackKing.row);
  const maxR = Math.max(redKing.row, blackKing.row);
  for (let r = minR + 1; r < maxR; r++) {
    if (board[r][redKing.col]) return false;
  }
  return true;
}

export function isPositionUnderAttack(board, pos, attackerColor) {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.color === attackerColor) {
        const moves = getPseudoLegalMoves(board, { row: r, col: c }, p);
        if (moves.some(m => m.row === pos.row && m.col === pos.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

export function getClientLegalMoves(board, from) {
  const piece = board[from.row][from.col];
  if (!piece) return [];

  const pseudoMoves = getPseudoLegalMoves(board, from, piece);
  const legal = [];

  for (const to of pseudoMoves) {
    // Clone board tentatively
    const temp = board.map(row => [...row]);
    temp[to.row][to.col] = piece;
    temp[from.row][from.col] = null;

    if (areKingsFacing(temp)) continue;

    const kingPos = findKing(temp, piece.color);
    if (!kingPos) continue;

    const opponentColor = piece.color === PIECE_COLORS.RED ? PIECE_COLORS.BLACK : PIECE_COLORS.RED;
    if (!isPositionUnderAttack(temp, kingPos, opponentColor)) {
      legal.push(to);
    }
  }

  return legal;
}
