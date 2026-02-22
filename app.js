/* =====================================================
 *  程ヶ谷カントリー倶楽部 Game Tsuru Han
 *  UI インタラクション
 * ===================================================== */

// =================== グローバル状態 ===================
let playerCount = 4;
let startCourse = 'IN'; // 'OUT' or 'IN'
const defaultPlayers = [
  { name: '荒濤', hdcp: 16 },
  { name: '佐久間', hdcp: 17 },
  { name: '上野', hdcp: 19 },
  { name: '佐藤', hdcp: 11 },
];

const PAR_OUT = [4, 5, 3, 4, 4, 5, 4, 3, 4]; // Hole 1-9
const PAR_IN  = [4, 4, 3, 5, 4, 4, 4, 3, 5]; // Hole 10-18
const HDCP_OUT = [5, 7, 17, 11, 13, 1, 15, 9, 3];
const HDCP_IN  = [8, 4, 18, 16, 2, 12, 6, 14, 10];

// =================== プレーヤー人数設定 ===================
function setPlayerCount(count) {
  playerCount = count;
  
  // ボタンのアクティブ状態を更新
  document.querySelectorAll('.count-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.count) === count);
  });
  
  // ゲーム種別を再描画
  renderGameTypes();
  renderTeamPreview();

  // 手動入力画面のプレーヤー欄・スコアテーブルを再構築
  renderPlayerInputs();
  renderScoreTable('score-table-out', PAR_OUT, 1);
  renderScoreTable('score-table-in', PAR_IN, 10);
  
  // バッジ更新
  const badge = document.getElementById('player-count-badge');
  if (badge) badge.textContent = count + '人';
}

// =================== スタートコース設定 ===================
function setStartCourse(course) {
  startCourse = course;
  document.querySelectorAll('.start-course-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.course === course);
  });
}

// =================== ゲーム種別の定義 ===================
const GAME_TYPES = {
  4: [
    { id: 'team',       label: '団体戦',        icon: 'fa-people-group',    desc: 'チーム対抗（2対2）',              defaultOn: true  },
    { id: 'individual',  label: '個人戦',        icon: 'fa-user',            desc: '全員の個人マッチ',               defaultOn: true  },
    { id: 'best',        label: 'ベスト',        icon: 'fa-trophy',          desc: '各ホールのネットベスト',          defaultOn: true  },
  ],
  3: [
    { id: 'nakanuki',    label: '中抜き',        icon: 'fa-arrows-left-right', desc: '9ホールトータルのネット勝敗',  defaultOn: true  },
    { id: 'individual',  label: '個人戦',        icon: 'fa-user',            desc: '全員の個人マッチ',               defaultOn: true  },
    { id: 'best',        label: 'ベスト',        icon: 'fa-trophy',          desc: '各ホールのネットベスト',          defaultOn: false },
  ],
  2: [
    { id: 'individual_v', label: '個人戦（タテ）', icon: 'fa-arrows-up-down',    desc: '9ホールトータルのネット勝敗', defaultOn: true  },
    { id: 'individual_h', label: '個人戦（ヨコ）', icon: 'fa-arrows-left-right', desc: '各ホールのネット勝敗',        defaultOn: true  },
    { id: 'best',         label: 'ベスト',        icon: 'fa-trophy',            desc: '各ホールのネットベスト',        defaultOn: false },
  ],
};

let selectedGames = {}; // { gameId: true/false }

// =================== ゲーム種別の動的生成 ===================
function renderGameTypes() {
  console.log('[renderGameTypes] called, playerCount:', playerCount);
  const container = document.getElementById('game-type-options');
  console.log('[renderGameTypes] container:', container);
  if (!container) { console.warn('[renderGameTypes] container NOT FOUND, returning'); return; }

  const types = GAME_TYPES[playerCount] || [];
  console.log('[renderGameTypes] types:', types.length, 'games');
  // 初期化: まだ設定がないゲームはデフォルト値を使う
  types.forEach(t => {
    if (selectedGames[playerCount + '_' + t.id] === undefined) {
      selectedGames[playerCount + '_' + t.id] = t.defaultOn;
    }
  });

  let html = '';
  types.forEach(t => {
    const key = playerCount + '_' + t.id;
    const checked = selectedGames[key] ? 'checked' : '';
    html += `
      <div class="game-type-card ${selectedGames[key] ? 'active' : ''}" data-key="${key}" onclick="toggleGameType('${key}')">
        <div class="game-type-icon"><i class="fas ${t.icon}"></i></div>
        <div class="game-type-info">
          <div class="game-type-label">${t.label}</div>
          <div class="game-type-desc">${t.desc}</div>
        </div>
        <label class="toggle-switch" onclick="event.stopPropagation()">
          <input type="checkbox" ${checked} onchange="toggleGameType('${key}')">
          <span class="toggle-slider"></span>
        </label>
      </div>`;
  });
  container.innerHTML = html;
  console.log('[renderGameTypes] innerHTML set, length:', container.innerHTML.length);
}

function toggleGameType(key) {
  selectedGames[key] = !selectedGames[key];
  renderGameTypes();
  renderTeamPreview();
}

function getActiveGames() {
  const types = GAME_TYPES[playerCount] || [];
  return types.filter(t => selectedGames[playerCount + '_' + t.id]);
}

// =================== データ収集 ===================
function collectPlayerData() {
  const players = [];
  const nameInputs = document.querySelectorAll('.player-name-input');
  const hdcpInputs = document.querySelectorAll('.input-hdcp');

  for (let i = 0; i < playerCount; i++) {
    const scoresOut = [];
    const scoresIn = [];

    const outTable = document.getElementById('score-table-out');
    const outRow = outTable?.querySelectorAll('tbody tr')[i];
    if (outRow) {
      outRow.querySelectorAll('.score-input').forEach(inp => {
        scoresOut.push(parseInt(inp.value) || 0);
      });
    }

    const inTable = document.getElementById('score-table-in');
    const inRow = inTable?.querySelectorAll('tbody tr')[i];
    if (inRow) {
      inRow.querySelectorAll('.score-input').forEach(inp => {
        scoresIn.push(parseInt(inp.value) || 0);
      });
    }

    players.push({
      index: i,
      name: nameInputs[i]?.value || `P${i + 1}`,
      hdcp: parseInt(hdcpInputs[i]?.value) || 0,
      scoresOut,
      scoresIn,
      totalOut: scoresOut.reduce((a, b) => a + b, 0),
      totalIn: scoresIn.reduce((a, b) => a + b, 0),
      total: scoresOut.reduce((a, b) => a + b, 0) + scoresIn.reduce((a, b) => a + b, 0),
      net: scoresOut.reduce((a, b) => a + b, 0) + scoresIn.reduce((a, b) => a + b, 0) - (parseInt(hdcpInputs[i]?.value) || 0),
    });
  }
  return players;
}

// =================== 団体戦ロジック (4人) ===================
const ALL_HDCP = [...HDCP_OUT, ...HDCP_IN];
const ALL_PAR  = [...PAR_OUT, ...PAR_IN];

// チーム分け: ベスト+ワースト vs 2番手+3番手
function determineTeams(players) {
  if (players.length !== 4) return null;
  const sorted = [...players].sort((a, b) => a.hdcp - b.hdcp);

  const teamL = [sorted[0], sorted[3]];
  const teamR = [sorted[1], sorted[2]];
  const needsJanken = (sorted[0].hdcp === sorted[1].hdcp) || (sorted[2].hdcp === sorted[3].hdcp);

  return {
    teamL,
    teamR,
    needsJanken,
    teamL_hdcp: teamL[0].hdcp + teamL[1].hdcp,
    teamR_hdcp: teamR[0].hdcp + teamR[1].hdcp,
  };
}

// ホール別ハンデ配分（ストロークインデックスの小さいホールから割り当て）
function distributeTeamHdcp(teamL_hdcp, teamR_hdcp) {
  const diff = Math.abs(teamL_hdcp - teamR_hdcp);
  const receivingTeam = teamL_hdcp > teamR_hdcp ? 'L' : (teamR_hdcp > teamL_hdcp ? 'R' : null);

  const holesByDifficulty = Array.from({length: 18}, (_, i) => ({ hole: i, si: ALL_HDCP[i] }))
    .sort((a, b) => a.si - b.si);

  const holeStrokes = Array(18).fill(0);
  if (!receivingTeam) return holeStrokes;

  for (let s = 0; s < diff; s++) {
    const holeIdx = holesByDifficulty[s % 18].hole;
    holeStrokes[holeIdx] += (receivingTeam === 'L') ? 1 : -1;
  }
  return holeStrokes; // 正=L組にハンデ、負=R組にハンデ
}

// 各ホールのハイアンドロー計算
function calcTeamHole(teamL, teamR, holeIdx, holeStroke) {
  const isOut = holeIdx < 9;
  const h = isOut ? holeIdx : holeIdx - 9;

  const l1 = isOut ? teamL[0].scoresOut[h] : teamL[0].scoresIn[h];
  const l2 = isOut ? teamL[1].scoresOut[h] : teamL[1].scoresIn[h];
  const r1 = isOut ? teamR[0].scoresOut[h] : teamR[0].scoresIn[h];
  const r2 = isOut ? teamR[1].scoresOut[h] : teamR[1].scoresIn[h];

  // ハイ（良いスコア=小さい数値）、ロー（悪いスコア=大きい数値）
  let l_high = Math.min(l1, l2);
  let l_low  = Math.max(l1, l2);
  let r_high = Math.min(r1, r2);
  let r_low  = Math.max(r1, r2);

  // ハンデは悪い方のスコア（ロー）に適用
  if (holeStroke > 0) {
    l_low -= holeStroke;  // L組がハンデをもらう
  } else if (holeStroke < 0) {
    r_low += holeStroke;  // R組がハンデをもらう（holeStrokeは負）
  }

  let points = 0;
  if (l_high < r_high) points += 1;
  else if (l_high > r_high) points -= 1;

  if (l_low < r_low) points += 1;
  else if (l_low > r_low) points -= 1;

  return {
    holeNum: holeIdx + 1,
    l1, l2, r1, r2,
    l_high, l_low, r_high, r_low,
    holeStroke,
    points, // 正=L組勝ち、負=R組勝ち
  };
}

// 団体戦の全18ホール計算
function calculateTeamGame(players) {
  const teams = determineTeams(players);
  if (!teams) return null;

  const holeStrokes = distributeTeamHdcp(teams.teamL_hdcp, teams.teamR_hdcp);
  const results = [];

  for (let h = 0; h < 18; h++) {
    results.push(calcTeamHole(teams.teamL, teams.teamR, h, holeStrokes[h]));
  }

  return {
    teams,
    holeStrokes,
    results,
    totalPoints: results.reduce((s, r) => s + r.points, 0),
    outPoints: results.slice(0, 9).reduce((s, r) => s + r.points, 0),
    inPoints: results.slice(9).reduce((s, r) => s + r.points, 0),
  };
}

// =================== 個人戦ロジック ===================

// 2人のペアについて、18ホールの勝敗を計算
function calcIndividualPair(pA, pB) {
  const hdcpDiff = Math.abs(pA.hdcp - pB.hdcp);
  const weakerIs = pA.hdcp > pB.hdcp ? 'A' : (pB.hdcp > pA.hdcp ? 'B' : null);

  const holeResults = [];
  for (let h = 0; h < 18; h++) {
    const isOut = h < 9;
    const idx = isOut ? h : h - 9;
    const si = ALL_HDCP[h]; // そのホールのストロークインデックス

    let scoreA = isOut ? pA.scoresOut[idx] : pA.scoresIn[idx];
    let scoreB = isOut ? pB.scoresOut[idx] : pB.scoresIn[idx];

    // ハンデ差がそのホールのSI以上ならハンデあり
    const hasStroke = hdcpDiff >= si;
    let netA = scoreA;
    let netB = scoreB;
    if (hasStroke && weakerIs === 'A') netA -= 1;
    if (hasStroke && weakerIs === 'B') netB -= 1;

    let result = 0; // 0=引き分け, 1=A勝ち, -1=B勝ち
    if (netA < netB) result = 1;
    else if (netA > netB) result = -1;

    holeResults.push({
      hole: h,
      holeNum: h + 1,
      scoreA, scoreB,
      netA, netB,
      hasStroke,
      strokeFor: hasStroke ? weakerIs : null,
      result,
    });
  }
  return holeResults;
}

// 個人戦の全ペア計算
function calculateIndividualGame(players) {
  const isOutStart = startCourse === 'OUT';
  const pairs = [];

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const holeResults = calcIndividualPair(players[i], players[j]);

      // OUT/IN のホール結果
      const outHoles = holeResults.slice(0, 9);
      const inHoles  = holeResults.slice(9);

      // 前半・後半をスタートコースで決定
      const frontHoles = isOutStart ? outHoles : inHoles;
      const backHoles  = isOutStart ? inHoles : outHoles;

      const frontSum = frontHoles.reduce((s, r) => s + r.result, 0);
      const backSum  = backHoles.reduce((s, r) => s + r.result, 0);
      const totalSum = frontSum + backSum;

      // 前半: 勝ち+3 / 負け-3
      // 後半: 勝ち+6 / 負け-6
      // トータル: 勝ち+3 / 負け-3
      const frontPtA = frontSum > 0 ? 3 : (frontSum < 0 ? -3 : 0);
      const backPtA  = backSum > 0 ? 6 : (backSum < 0 ? -6 : 0);
      const totalPtA = totalSum > 0 ? 3 : (totalSum < 0 ? -3 : 0);
      const totalPtForA = frontPtA + backPtA + totalPtA;

      pairs.push({
        playerA: players[i],
        playerB: players[j],
        holeResults,
        frontHoles, backHoles,
        frontSum, backSum, totalSum,
        frontPtA, backPtA, totalPtA,
        totalPtForA, // 正=A勝ち、負=B勝ち
      });
    }
  }

  // 各プレーヤーのポイント集計
  const pointsByPlayer = {};
  players.forEach(p => {
    pointsByPlayer[p.index] = { front: 0, back: 0, total: 0, sum: 0 };
  });
  pairs.forEach(pair => {
    const ai = pair.playerA.index;
    const bi = pair.playerB.index;
    pointsByPlayer[ai].front += pair.frontPtA;
    pointsByPlayer[ai].back  += pair.backPtA;
    pointsByPlayer[ai].total += pair.totalPtA;
    pointsByPlayer[ai].sum   += pair.totalPtForA;
    pointsByPlayer[bi].front -= pair.frontPtA;
    pointsByPlayer[bi].back  -= pair.backPtA;
    pointsByPlayer[bi].total -= pair.totalPtA;
    pointsByPlayer[bi].sum   -= pair.totalPtForA;
  });

  return { pairs, pointsByPlayer };
}

// =================== ホール別ストローク配分 ===================
function getHoleStrokes(hdcp, si) {
  let strokes = Math.floor(hdcp / 18);
  const remainder = hdcp % 18;
  if (si <= remainder) strokes += 1;
  return strokes;
}

// =================== ベストロジック ===================
function calculateBestGame(players) {
  let nextCarryOver = false;
  const holeResults = [];
  const playerPoints = {};
  players.forEach(p => { playerPoints[p.index] = 0; });

  for (let h = 0; h < 18; h++) {
    const isOut = h < 9;
    const idx = isOut ? h : h - 9;
    const par = ALL_PAR[h];
    const si = ALL_HDCP[h];
    const isCarryOver = nextCarryOver;
    nextCarryOver = false;

    // 各プレーヤーのグロス・ネット・バーディ判定
    const scores = players.map(p => {
      const gross = isOut ? p.scoresOut[idx] : p.scoresIn[idx];
      const strokes = getHoleStrokes(p.hdcp, si);
      const net = gross - strokes;
      const vsPar = gross - par;
      return { player: p, gross, net, strokes, vsPar };
    });

    // --- ベスト判定 ---
    const bestNet = Math.min(...scores.map(s => s.net));
    const bestPlayers = scores.filter(s => s.net === bestNet);
    const hasSoleBest = bestPlayers.length === 1;

    // --- キャリーオーバー判定 ---
    const allSameGross = scores.every(s => s.gross === scores[0].gross);
    const allSameNet = scores.every(s => s.net === scores[0].net);
    const triggerCarryOver = allSameGross && allSameNet;

    // --- ポイント設定（人数によって変動） ---
    const n = players.length;
    const bestWinPt  = n === 2 ? 1 : (n === 3 ? 2 : 3);   // 2人:+1, 3人:+2, 4人:+3
    const bestLosePt = -1;                                  // 常に-1
    const birdiePt   = n === 2 ? 1 : (n === 3 ? 2 : 3);   // 2人:+1, 3人:+2, 4人:+3
    const birdieOther = -1;                                 // 常に-1
    const eaglePt    = n === 2 ? 2 : (n === 3 ? 4 : 6);   // 2人:+2, 3人:+4, 4人:+6
    const eagleOther = n === 2 ? -2 : -2;                   // 常に-2

    // --- ベストポイント ---
    const multiplier = isCarryOver ? 2 : 1;
    const bestPts = {};
    players.forEach(p => { bestPts[p.index] = 0; });
    if (hasSoleBest) {
      bestPts[bestPlayers[0].player.index] = bestWinPt * multiplier;
      scores.forEach(s => {
        if (s.player.index !== bestPlayers[0].player.index) {
          bestPts[s.player.index] = bestLosePt * multiplier;
        }
      });
    }

    // --- バーディ/イーグルポイント ---
    const birdiePts = {};
    players.forEach(p => { birdiePts[p.index] = 0; });
    scores.forEach(s => {
      if (s.vsPar <= -2) {
        // イーグル以上
        birdiePts[s.player.index] += eaglePt;
        scores.forEach(other => {
          if (other.player.index !== s.player.index) birdiePts[other.player.index] += eagleOther;
        });
      } else if (s.vsPar === -1) {
        // バーディ
        birdiePts[s.player.index] += birdiePt;
        scores.forEach(other => {
          if (other.player.index !== s.player.index) birdiePts[other.player.index] += birdieOther;
        });
      }
    });

    // --- ホール合計 ---
    const holePts = {};
    players.forEach(p => {
      holePts[p.index] = bestPts[p.index] + birdiePts[p.index];
      playerPoints[p.index] += holePts[p.index];
    });

    holeResults.push({
      holeIdx: h, holeNum: h + 1, par, si,
      scores, bestNet, hasSoleBest,
      soleBestPlayer: hasSoleBest ? bestPlayers[0].player : null,
      isCarryOver, triggerCarryOver,
      bestPts, birdiePts, holePts,
    });

    // 次のホールのキャリーオーバー設定（1ホール限定）
    if (triggerCarryOver && !isCarryOver) {
      nextCarryOver = true;
    }
  }

  return { holeResults, playerPoints };
}

// =================== 中抜きロジック（3人） ===================
function calculateNakanukiGame(players) {
  const isOutStart = startCourse === 'OUT';

  // ハーフごとにストロークインデックスベースのネットスコアを計算
  function calcHalfScores(hdcps, getScores) {
    return players.map(p => {
      const scores = getScores(p);
      let gross = 0;
      let net = 0;
      for (let h = 0; h < 9; h++) {
        const g = scores[h];
        const strokes = getHoleStrokes(p.hdcp, hdcps[h]);
        gross += g;
        net += g - strokes;
      }
      return { player: p, gross, net };
    });
  }

  const outScores = calcHalfScores(HDCP_OUT, p => p.scoresOut);
  const inScores  = calcHalfScores(HDCP_IN,  p => p.scoresIn);

  function calcHalf(scores) {
    const sorted = [...scores].sort((a, b) => a.net - b.net);
    const bestNet = sorted[0].net;
    const worstNet = sorted[sorted.length - 1].net;
    const winners = scores.filter(s => s.net === bestNet);
    const losers  = scores.filter(s => s.net === worstNet);
    // 全員同ネットの場合は引き分け
    if (bestNet === worstNet) {
      return { scores, winners: [], losers: [], isDraw: true, pts: {} };
    }
    const pts = {};
    scores.forEach(s => { pts[s.player.index] = 0; });
    // 勝者・敗者のポイント配分（15pt基準、折半あり）
    const winPt = 15 / winners.length;
    const losePt = -15 / losers.length;
    winners.forEach(w => { pts[w.player.index] = winPt; });
    losers.forEach(l => { pts[l.player.index] = losePt; });
    return { scores, winners, losers, isDraw: false, pts };
  }

  const frontScores = isOutStart ? outScores : inScores;
  const backScores  = isOutStart ? inScores : outScores;
  const front = calcHalf(frontScores);
  const back  = calcHalf(backScores);

  // 合計ポイント
  const totalPts = {};
  players.forEach(p => {
    totalPts[p.index] = (front.pts[p.index] || 0) + (back.pts[p.index] || 0);
  });

  return {
    front, back, totalPts,
    frontLabel: isOutStart ? 'OUT' : 'IN',
    backLabel:  isOutStart ? 'IN'  : 'OUT',
  };
}

// =================== 中抜き結果描画 ===================
function renderNakanukiGameResult(nkResult, players) {
  const { front, back, totalPts, frontLabel, backLabel } = nkResult;

  function buildHalfSection(half, label, isBack) {
    const sorted = [...half.scores].sort((a, b) => a.net - b.net);
    let html = `<div class="nk-half-section">`;
    html += `<div class="nk-half-subtitle">${label}</div>`;
    html += `<table class="nk-half-table"><thead><tr><th></th><th>グロス</th><th>NET</th><th>結果</th></tr></thead><tbody>`;
    sorted.forEach(s => {
      const isWin  = half.winners.some(w => w.player.index === s.player.index);
      const isLose = half.losers.some(l => l.player.index === s.player.index);
      const badge = isWin ? '<span class="nk-badge nk-win">勝ち</span>'
                  : isLose ? '<span class="nk-badge nk-lose">負け</span>'
                  : half.isDraw ? '<span class="nk-badge nk-draw">引分</span>'
                  : '<span class="nk-badge nk-mid">中抜き</span>';
      html += `<tr class="${isWin ? 'nk-row-win' : (isLose ? 'nk-row-lose' : '')}">`;
      html += `<td class="td-label">${s.player.name}</td>`;
      html += `<td>${s.gross}</td>`;
      html += `<td><strong>${s.net}</strong></td>`;
      html += `<td>${badge}</td>`;
      html += `</tr>`;
    });
    html += `</tbody></table>`;
    // 報酬表示
    if (!isBack) {
      const winnerNames = half.winners.map(w => w.player.name).join('・');
      const loserNames  = half.losers.map(l => l.player.name).join('・');
      const rewardText = half.isDraw ? '引き分け'
                       : `${winnerNames} が ${loserNames} からランチ獲得`;
      html += `<div class="nk-reward"><i class="fas fa-utensils"></i> ${rewardText}</div>`;
    } else {
      if (half.isDraw) {
        html += `<div class="nk-reward"><i class="fas fa-coins"></i> 引き分け</div>`;
      } else {
        const parts = [];
        half.winners.forEach(w => {
          const pt = half.pts[w.player.index];
          parts.push(`${w.player.name} <strong class="positive">+${pt % 1 === 0 ? pt : pt.toFixed(1)}</strong>pt`);
        });
        half.losers.forEach(l => {
          const pt = half.pts[l.player.index];
          parts.push(`${l.player.name} <strong class="negative">${pt % 1 === 0 ? pt : pt.toFixed(1)}</strong>pt`);
        });
        html += `<div class="nk-reward"><i class="fas fa-coins"></i> ${parts.join(' / ')}</div>`;
      }
    }
    html += `</div>`;
    return html;
  }

  let html = `<div class="nk-game-result">`;
  html += `<h4 class="game-result-title"><i class="fas fa-arrows-left-right"></i> 中抜き</h4>`;
  html += buildHalfSection(front, frontLabel, false);
  html += buildHalfSection(back, backLabel, true);

  // ポイント集計
  html += `<div class="nk-points-summary">`;
  html += `<h5 class="nk-summary-title">中抜き ポイント集計</h5>`;
  html += `<table class="nk-pts-table"><thead><tr><th></th>`;
  players.forEach(p => { html += `<th>${p.name}</th>`; });
  html += `</tr></thead><tbody>`;

  // 前半行
  html += `<tr><td class="td-label">${frontLabel}</td>`;
  players.forEach(p => {
    const pt = front.pts[p.index] || 0;
    const cls = pt > 0 ? 'positive' : (pt < 0 ? 'negative' : '');
    const txt = pt === 0 ? '0' : (pt > 0 ? '+' : '') + (pt % 1 === 0 ? pt : pt.toFixed(1));
    html += `<td class="${cls}">${txt}</td>`;
  });
  html += `</tr>`;

  // 後半行
  html += `<tr><td class="td-label">${backLabel}</td>`;
  players.forEach(p => {
    const pt = back.pts[p.index] || 0;
    const cls = pt > 0 ? 'positive' : (pt < 0 ? 'negative' : '');
    const txt = pt === 0 ? '0' : (pt > 0 ? '+' : '') + (pt % 1 === 0 ? pt : pt.toFixed(1));
    html += `<td class="${cls}">${txt}</td>`;
  });
  html += `</tr>`;

  // 合計行
  html += `<tr class="total-row"><td class="td-label">中抜き合計</td>`;
  players.forEach(p => {
    const pt = totalPts[p.index];
    const cls = pt > 0 ? 'positive' : (pt < 0 ? 'negative' : '');
    const txt = pt === 0 ? '0' : (pt > 0 ? '+' : '') + (pt % 1 === 0 ? pt : pt.toFixed(1));
    html += `<td class="${cls}"><strong>${txt}</strong></td>`;
  });
  html += `</tr></tbody></table></div>`;

  html += `</div>`;
  return html;
}

// =================== 個人戦タテロジック（2人） ===================
function calculateIndividualVGame(players) {
  const isOutStart = startCourse === 'OUT';

  function calcHalfScores(hdcps, getScores) {
    return players.map(p => {
      const scores = getScores(p);
      let gross = 0;
      let net = 0;
      for (let h = 0; h < 9; h++) {
        const g = scores[h];
        const strokes = getHoleStrokes(p.hdcp, hdcps[h]);
        gross += g;
        net += g - strokes;
      }
      return { player: p, gross, net };
    });
  }

  const outScores = calcHalfScores(HDCP_OUT, p => p.scoresOut);
  const inScores  = calcHalfScores(HDCP_IN,  p => p.scoresIn);

  function calcHalf(scores) {
    const a = scores[0], b = scores[1];
    if (a.net === b.net) {
      return { scores, winner: null, loser: null, isDraw: true, diff: 0, pts: { [a.player.index]: 0, [b.player.index]: 0 } };
    }
    const winner = a.net < b.net ? a : b;
    const loser  = a.net < b.net ? b : a;
    return {
      scores, winner, loser, isDraw: false,
      diff: Math.abs(a.net - b.net),
      pts: { [winner.player.index]: 15, [loser.player.index]: -15 },
    };
  }

  const frontScores = isOutStart ? outScores : inScores;
  const backScores  = isOutStart ? inScores : outScores;
  const front = calcHalf(frontScores);
  const back  = calcHalf(backScores);

  const totalPts = {};
  players.forEach(p => {
    totalPts[p.index] = (front.pts[p.index] || 0) + (back.pts[p.index] || 0);
  });

  return {
    front, back, totalPts,
    frontLabel: isOutStart ? 'OUT' : 'IN',
    backLabel:  isOutStart ? 'IN'  : 'OUT',
  };
}

// =================== 個人戦タテ結果描画 ===================
function renderIndividualVGameResult(ivResult, players) {
  const { front, back, totalPts, frontLabel, backLabel } = ivResult;

  function buildHalfSection(half, label, isBack) {
    const sorted = [...half.scores].sort((a, b) => a.net - b.net);
    let html = `<div class="nk-half-section">`;
    html += `<div class="nk-half-subtitle">${label}</div>`;
    html += `<table class="nk-half-table"><thead><tr><th></th><th>グロス</th><th>NET</th><th>結果</th></tr></thead><tbody>`;
    sorted.forEach(s => {
      const isWin  = half.winner && half.winner.player.index === s.player.index;
      const isLose = half.loser  && half.loser.player.index  === s.player.index;
      const badge = half.isDraw ? '<span class="nk-badge nk-draw">引分</span>'
                  : isWin  ? '<span class="nk-badge nk-win">勝ち</span>'
                  : '<span class="nk-badge nk-lose">負け</span>';
      html += `<tr class="${isWin ? 'nk-row-win' : (isLose ? 'nk-row-lose' : '')}">`;
      html += `<td class="td-label">${s.player.name}</td>`;
      html += `<td>${s.gross}</td>`;
      html += `<td><strong>${s.net}</strong></td>`;
      html += `<td>${badge}</td></tr>`;
    });
    html += `</tbody></table>`;
    if (!isBack) {
      const rewardText = half.isDraw ? '引き分け' : `${half.winner.player.name} が ${half.loser.player.name} からランチ獲得`;
      html += `<div class="nk-reward"><i class="fas fa-utensils"></i> ${rewardText}</div>`;
    } else {
      if (half.isDraw) {
        html += `<div class="nk-reward"><i class="fas fa-coins"></i> 引き分け</div>`;
      } else {
        html += `<div class="nk-reward"><i class="fas fa-coins"></i> ${half.winner.player.name} <strong class="positive">+15</strong>pt / ${half.loser.player.name} <strong class="negative">-15</strong>pt</div>`;
      }
    }
    html += `</div>`;
    return html;
  }

  let html = `<div class="nk-game-result">`;
  html += `<h4 class="game-result-title"><i class="fas fa-arrows-up-down"></i> 個人戦（タテ）</h4>`;
  html += buildHalfSection(front, frontLabel, false);
  html += buildHalfSection(back, backLabel, true);

  // ポイント集計
  html += `<div class="nk-points-summary">`;
  html += `<h5 class="nk-summary-title">個人戦（タテ） ポイント集計</h5>`;
  html += `<table class="nk-pts-table"><thead><tr><th></th>`;
  players.forEach(p => { html += `<th>${p.name}</th>`; });
  html += `</tr></thead><tbody>`;

  html += `<tr><td class="td-label">${frontLabel}</td>`;
  players.forEach(p => {
    const pt = front.pts[p.index] || 0;
    const cls = pt > 0 ? 'positive' : (pt < 0 ? 'negative' : '');
    html += `<td class="${cls}">${pt === 0 ? '0' : (pt > 0 ? '+' + pt : pt)}</td>`;
  });
  html += `</tr>`;

  html += `<tr><td class="td-label">${backLabel}</td>`;
  players.forEach(p => {
    const pt = back.pts[p.index] || 0;
    const cls = pt > 0 ? 'positive' : (pt < 0 ? 'negative' : '');
    html += `<td class="${cls}">${pt === 0 ? '0' : (pt > 0 ? '+' + pt : pt)}</td>`;
  });
  html += `</tr>`;

  html += `<tr class="total-row"><td class="td-label">タテ合計</td>`;
  players.forEach(p => {
    const pt = totalPts[p.index];
    const cls = pt > 0 ? 'positive' : (pt < 0 ? 'negative' : '');
    html += `<td class="${cls}"><strong>${pt === 0 ? '0' : (pt > 0 ? '+' + pt : pt)}</strong></td>`;
  });
  html += `</tr></tbody></table></div>`;

  html += `</div>`;
  return html;
}

// =================== チームプレビュー表示 ===================
function renderTeamPreview() {
  const section = document.getElementById('team-preview-section');
  const container = document.getElementById('team-preview');
  if (!section || !container) return;

  if (playerCount !== 4 || !selectedGames['4_team']) {
    section.style.display = 'none';
    return;
  }

  const hdcpInputs = document.querySelectorAll('.input-hdcp');
  const nameInputs = document.querySelectorAll('.player-name-input');
  const players = [];
  for (let i = 0; i < 4; i++) {
    players.push({
      index: i,
      name: nameInputs[i]?.value || `P${i + 1}`,
      hdcp: parseInt(hdcpInputs[i]?.value) || 0,
    });
  }

  const teams = determineTeams(players);
  if (!teams) { section.style.display = 'none'; return; }

  section.style.display = '';
  const diff = Math.abs(teams.teamL_hdcp - teams.teamR_hdcp);
  const receiver = teams.teamL_hdcp > teams.teamR_hdcp ? 'L組' : (teams.teamR_hdcp > teams.teamL_hdcp ? 'R組' : 'なし');

  let html = `
    <div class="team-preview-grid">
      <div class="team-card team-l">
        <div class="team-header">L組</div>
        <div class="team-players">
          <div class="team-player"><span class="tp-name">${teams.teamL[0].name}</span><span class="tp-hdcp">HDCP ${teams.teamL[0].hdcp}</span></div>
          <div class="team-player"><span class="tp-name">${teams.teamL[1].name}</span><span class="tp-hdcp">HDCP ${teams.teamL[1].hdcp}</span></div>
        </div>
        <div class="team-total-hdcp">合計 ${teams.teamL_hdcp}</div>
      </div>
      <div class="team-vs">VS</div>
      <div class="team-card team-r">
        <div class="team-header">R組</div>
        <div class="team-players">
          <div class="team-player"><span class="tp-name">${teams.teamR[0].name}</span><span class="tp-hdcp">HDCP ${teams.teamR[0].hdcp}</span></div>
          <div class="team-player"><span class="tp-name">${teams.teamR[1].name}</span><span class="tp-hdcp">HDCP ${teams.teamR[1].hdcp}</span></div>
        </div>
        <div class="team-total-hdcp">合計 ${teams.teamR_hdcp}</div>
      </div>
    </div>
    <div class="team-hdcp-info">
      <span>ハンデ差: <strong>${diff}</strong></span>
      <span>ハンデ付与: <strong>${diff > 0 ? receiver : 'なし'}</strong></span>
    </div>`;

  if (teams.needsJanken) {
    html += `<div class="team-janken-notice"><i class="fas fa-exclamation-triangle"></i> 同ハンデのプレーヤーがいます。じゃんけんで組み合わせを決定してください。</div>`;
  }
  container.innerHTML = html;
}

// =================== 結果ページ描画 ===================
function renderResultPage(players, teamResult, individualResult, bestResult, nakanukiResult, individualVResult) {
  // --- スコアサマリー ---
  const sorted = [...players].sort((a, b) => a.net - b.net);
  const summaryCards = document.querySelector('.summary-cards');
  if (summaryCards) {
    const rankClasses = ['rank-1','rank-2','rank-3','rank-4'];
    const ordinals = ['1st','2nd','3rd','4th'];
    let html = '';
    sorted.forEach((p, i) => {
      html += `
        <div class="summary-card ${rankClasses[i] || ''}">
          <div class="rank-badge">${ordinals[i] || (i+1)}</div>
          <div class="player-name">${p.name}</div>
          <div class="player-score">${p.total}</div>
          <div class="player-detail">HDCP ${p.hdcp} / NET ${p.net}</div>
        </div>`;
    });
    summaryCards.innerHTML = html;
  }

  // --- ゲーム結果 ---
  const container = document.getElementById('game-results-container');
  if (!container) return;
  let html = '';

  if (teamResult) {
    html += renderTeamGameResult(teamResult, players);
  }

  if (nakanukiResult) {
    html += renderNakanukiGameResult(nakanukiResult, players);
  }

  if (individualVResult) {
    html += renderIndividualVGameResult(individualVResult, players);
  }

  if (individualResult) {
    html += renderIndividualGameResult(individualResult, players);
  }

  if (bestResult) {
    html += renderBestGameResult(bestResult, players);
  }

  // --- 全ゲーム合計ポイント集計 ---
  const gameRows = []; // { label, pts: { playerIdx: number } }
  const grandTotal = {};
  players.forEach(p => { grandTotal[p.index] = 0; });

  if (teamResult) {
    const tr = teamResult;
    const isOutStart = startCourse === 'OUT';
    const backResults = isOutStart ? tr.results.slice(9) : tr.results.slice(0, 9);
    const backPoints = backResults.reduce((s, r) => s + r.points, 0);
    const backWinner = backPoints > 0 ? 'L' : (backPoints < 0 ? 'R' : null);
    const lPt = backWinner === 'L' ? 15 : (backWinner === 'R' ? -15 : 0);
    const rPt = backWinner === 'R' ? 15 : (backWinner === 'L' ? -15 : 0);
    const pts = {};
    tr.teams.teamL.forEach(p => { pts[p.index] = lPt; });
    tr.teams.teamR.forEach(p => { pts[p.index] = rPt; });
    gameRows.push({ label: '団体戦', pts });
  }

  if (nakanukiResult) {
    const pts = {};
    players.forEach(p => { pts[p.index] = nakanukiResult.totalPts[p.index] || 0; });
    gameRows.push({ label: '中抜き', pts });
  }

  if (individualVResult) {
    const pts = {};
    players.forEach(p => { pts[p.index] = individualVResult.totalPts[p.index] || 0; });
    gameRows.push({ label: '個人戦（タテ）', pts });
  }

  if (individualResult) {
    const lbl = playerCount === 2 ? '個人戦（ヨコ）' : '個人戦';
    const pts = {};
    players.forEach(p => { pts[p.index] = individualResult.pointsByPlayer[p.index].sum; });
    gameRows.push({ label: lbl, pts });
  }

  if (bestResult) {
    const pts = {};
    players.forEach(p => { pts[p.index] = bestResult.playerPoints[p.index]; });
    gameRows.push({ label: 'ベスト', pts });
  }

  gameRows.forEach(row => {
    players.forEach(p => { grandTotal[p.index] += row.pts[p.index] || 0; });
  });

  if (gameRows.length > 0) {
    html += renderGrandTotal(players, gameRows, grandTotal);
  }

  if (!html) {
    html = '<p class="no-results">ゲーム結果はありません</p>';
  }
  container.innerHTML = html;
}

// =================== 全ゲーム合計ポイント ===================
function renderGrandTotal(players, gameRows, grandTotal) {
  // ポイント順にソート
  const ranked = [...players].sort((a, b) => grandTotal[b.index] - grandTotal[a.index]);

  let html = `<div class="grand-total-section">`;
  html += `<h4 class="game-result-title"><i class="fas fa-calculator"></i> 合計ポイント集計</h4>`;

  // ランキングカード
  html += `<div class="grand-ranking">`;
  const medals = ['🥇', '🥈', '🥉', '4th'];
  ranked.forEach((p, i) => {
    const pt = grandTotal[p.index];
    const cls = pt > 0 ? 'grand-plus' : (pt < 0 ? 'grand-minus' : 'grand-zero');
    const sign = pt > 0 ? '+' : '';
    const ptTxt = pt % 1 === 0 ? pt : pt.toFixed(1);
    html += `
      <div class="grand-rank-card ${cls} ${i === 0 ? 'grand-rank-1st' : ''}">
        <div class="grand-rank-medal">${medals[i] || (i + 1)}</div>
        <div class="grand-rank-name">${p.name}</div>
        <div class="grand-rank-pt">${sign}${ptTxt}<span class="grand-rank-unit">pt</span></div>
      </div>`;
  });
  html += `</div>`;

  // 明細テーブル
  html += `<div class="grand-detail">`;
  html += `<table class="grand-table"><thead><tr><th class="gt-label">ゲーム</th>`;
  players.forEach(p => { html += `<th>${p.name}</th>`; });
  html += `</tr></thead><tbody>`;

  gameRows.forEach(row => {
    html += `<tr><td class="gt-label">${row.label}</td>`;
    players.forEach(p => {
      const pt = row.pts[p.index] || 0;
      const cls = pt > 0 ? 'positive' : (pt < 0 ? 'negative' : '');
      const ptTxt = pt === 0 ? '0' : (pt > 0 ? '+' : '') + (pt % 1 === 0 ? pt : pt.toFixed(1));
      html += `<td class="${cls}">${ptTxt}</td>`;
    });
    html += `</tr>`;
  });

  html += `<tr class="grand-total-row"><td class="gt-label">合計</td>`;
  players.forEach(p => {
    const pt = grandTotal[p.index];
    const cls = pt > 0 ? 'positive' : (pt < 0 ? 'negative' : '');
    const ptTxt = pt === 0 ? '0' : (pt > 0 ? '+' : '') + (pt % 1 === 0 ? pt : pt.toFixed(1));
    html += `<td class="${cls}"><strong>${ptTxt}</strong></td>`;
  });
  html += `</tr></tbody></table></div>`;

  html += `</div>`;
  return html;
}

function renderTeamGameResult(tr, players) {
  const { teams, results, outPoints, inPoints, totalPoints } = tr;

  // 前半・後半をスタートコースに応じて決定
  const isOutStart = startCourse === 'OUT';
  const frontLabel = isOutStart ? 'OUT' : 'IN';
  const backLabel  = isOutStart ? 'IN'  : 'OUT';
  const frontResults = isOutStart ? results.slice(0, 9) : results.slice(9);
  const backResults  = isOutStart ? results.slice(9) : results.slice(0, 9);
  const frontStart   = isOutStart ? 1 : 10;
  const backStart    = isOutStart ? 10 : 1;
  const frontPoints  = frontResults.reduce((s, r) => s + r.points, 0);
  const backPoints   = backResults.reduce((s, r) => s + r.points, 0);

  let html = `
    <div class="team-game-result">
      <h4 class="game-result-title"><i class="fas fa-people-group"></i> 団体戦</h4>
      <div class="team-result-header">
        <div class="trh-team trh-l">
          <span class="trh-label">L組</span>
          <span class="trh-names">${teams.teamL.map(p => p.name).join(' & ')}</span>
          <span class="trh-hdcp">HDCP ${teams.teamL_hdcp}</span>
        </div>
        <div class="trh-vs">VS</div>
        <div class="trh-team trh-r">
          <span class="trh-label">R組</span>
          <span class="trh-names">${teams.teamR.map(p => p.name).join(' & ')}</span>
          <span class="trh-hdcp">HDCP ${teams.teamR_hdcp}</span>
        </div>
      </div>`;

  // 前半（ランチ）
  html += buildTeamTable(frontLabel, frontResults, frontStart, frontPoints);
  const frontWinner = frontPoints > 0 ? 'L組' : (frontPoints < 0 ? 'R組' : null);
  const frontWinClass = frontPoints > 0 ? 'team-l-wins' : (frontPoints < 0 ? 'team-r-wins' : 'team-draw');
  html += `
    <div class="team-half-result ${frontWinClass}">
      <div class="thr-half">前半（${frontLabel}）</div>
      <div class="thr-points">${frontPoints > 0 ? '+' : ''}${frontPoints} pt</div>
      <div class="thr-reward"><i class="fas fa-utensils"></i> ${frontWinner ? frontWinner + ' がランチ獲得' : '引き分け'}</div>
    </div>`;

  // 後半（15ポイント）
  html += buildTeamTable(backLabel, backResults, backStart, backPoints);
  const backWinner = backPoints > 0 ? 'L組' : (backPoints < 0 ? 'R組' : null);
  const backWinClass = backPoints > 0 ? 'team-l-wins' : (backPoints < 0 ? 'team-r-wins' : 'team-draw');
  html += `
    <div class="team-half-result ${backWinClass}">
      <div class="thr-half">後半（${backLabel}）</div>
      <div class="thr-points">${backPoints > 0 ? '+' : ''}${backPoints} pt</div>
      <div class="thr-reward"><i class="fas fa-coins"></i> ${backWinner ? backWinner + ' +15pt / ' + (backWinner === 'L組' ? 'R組' : 'L組') + ' -15pt' : '引き分け'}</div>
    </div>`;

  // ポイント集計テーブル
  html += `<div class="team-points-summary"><table class="team-pts-table">`;
  html += `<thead><tr><th></th>`;
  teams.teamL.concat(teams.teamR).forEach(p => { html += `<th>${p.name}</th>`; });
  html += `</tr></thead><tbody>`;

  // 後半のポイントを各メンバーに配分
  const lPt = backWinner === 'L組' ? 15 : (backWinner === 'R組' ? -15 : 0);
  const rPt = backWinner === 'R組' ? 15 : (backWinner === 'L組' ? -15 : 0);
  const allMembers = teams.teamL.concat(teams.teamR);
  const memberPts = allMembers.map((p, i) => i < 2 ? lPt : rPt);

  html += `<tr><td class="td-label">後半</td>`;
  memberPts.forEach(pt => {
    const cls = pt > 0 ? 'positive' : (pt < 0 ? 'negative' : '');
    html += `<td class="${cls}">${pt > 0 ? '+' : ''}${pt}</td>`;
  });
  html += `</tr>`;

  html += `<tr class="total-row"><td class="td-label">団体戦合計</td>`;
  memberPts.forEach(pt => {
    const cls = pt > 0 ? 'positive' : (pt < 0 ? 'negative' : '');
    html += `<td class="${cls}"><strong>${pt > 0 ? '+' : ''}${pt}</strong></td>`;
  });
  html += `</tr></tbody></table></div>`;

  html += `</div>`;
  return html;
}

function buildTeamTable(label, results, startHole, subtotal) {
  const subLabel = subtotal > 0 ? `L組 +${subtotal}` : (subtotal < 0 ? `R組 +${Math.abs(subtotal)}` : '引き分け');
  let html = `
    <div class="team-result-section">
      <div class="team-result-subtitle">${label} <span class="trs-sub">${subLabel}</span></div>
      <div class="score-table-wrapper">
        <table class="score-table team-result-table">
          <thead>
            <tr><th class="th-hole">H</th>`;
  for (let i = 0; i < 9; i++) html += `<th>${startHole + i}</th>`;
  html += `<th class="th-total">計</th></tr></thead><tbody>`;

  // HDCP行
  html += `<tr class="hdcp-stroke-row"><td class="td-label">HD</td>`;
  for (let i = 0; i < 9; i++) {
    const hs = results[i].holeStroke;
    html += `<td class="${hs ? 'has-stroke' : ''}">${hs > 0 ? 'L' + hs : (hs < 0 ? 'R' + Math.abs(hs) : '')}</td>`;
  }
  html += `<td></td></tr>`;

  // ハイ（良いスコア）比較行
  html += `<tr class="hi-row"><td class="td-label">Hi</td>`;
  for (let i = 0; i < 9; i++) {
    const r = results[i];
    const cls = r.l_high < r.r_high ? 'cell-l-win' : (r.l_high > r.r_high ? 'cell-r-win' : 'cell-draw');
    html += `<td class="${cls}">${r.l_high}<span class="vs-sep">-</span>${r.r_high}</td>`;
  }
  html += `<td></td></tr>`;

  // ロー（悪いスコア）比較行
  html += `<tr class="lo-row"><td class="td-label">Lo</td>`;
  for (let i = 0; i < 9; i++) {
    const r = results[i];
    const cls = r.l_low < r.r_low ? 'cell-l-win' : (r.l_low > r.r_low ? 'cell-r-win' : 'cell-draw');
    html += `<td class="${cls}">${r.l_low}<span class="vs-sep">-</span>${r.r_low}</td>`;
  }
  html += `<td></td></tr>`;

  // ポイント行
  html += `<tr class="points-row"><td class="td-label">Pt</td>`;
  let cum = 0;
  for (let i = 0; i < 9; i++) {
    const p = results[i].points;
    cum += p;
    const cls = p > 0 ? 'positive' : (p < 0 ? 'negative' : '');
    html += `<td class="${cls}">${p > 0 ? '+' + p : p}</td>`;
  }
  const cumCls = cum > 0 ? 'positive' : (cum < 0 ? 'negative' : '');
  html += `<td class="td-total ${cumCls}"><strong>${cum > 0 ? '+' + cum : cum}</strong></td></tr>`;

  html += `</tbody></table></div></div>`;
  return html;
}

// =================== 個人戦結果描画 ===================
function renderIndividualGameResult(indResult, players) {
  const { pairs, pointsByPlayer } = indResult;
  const isOutStart = startCourse === 'OUT';
  const frontLabel = isOutStart ? 'OUT' : 'IN';
  const backLabel  = isOutStart ? 'IN'  : 'OUT';

  let html = `
    <div class="individual-game-result">
      <h4 class="game-result-title"><i class="fas fa-user"></i> 個人戦</h4>`;

  // ペアごとの結果テーブル
  pairs.forEach(pair => {
    const { playerA, playerB, frontHoles, backHoles, frontSum, backSum, totalSum,
            frontPtA, backPtA, totalPtA, totalPtForA } = pair;

    const frontWinLabel = frontSum > 0 ? playerA.name : (frontSum < 0 ? playerB.name : '引分');
    const backWinLabel  = backSum > 0 ? playerA.name : (backSum < 0 ? playerB.name : '引分');
    const totalWinLabel = totalSum > 0 ? playerA.name : (totalSum < 0 ? playerB.name : '引分');

    html += `
      <div class="ind-pair-card">
        <div class="ind-pair-header">
          <span class="ind-pair-name">${playerA.name} <small>HD${playerA.hdcp}</small></span>
          <span class="ind-pair-vs">VS</span>
          <span class="ind-pair-name">${playerB.name} <small>HD${playerB.hdcp}</small></span>
          <span class="ind-pair-diff">差${Math.abs(playerA.hdcp - playerB.hdcp)}</span>
        </div>`;

    // 前半ホール
    html += buildIndividualHalfTable(frontLabel, frontHoles, isOutStart ? 1 : 10, playerA, playerB, frontSum);
    // 後半ホール
    html += buildIndividualHalfTable(backLabel, backHoles, isOutStart ? 10 : 1, playerA, playerB, backSum);

    // サマリー行
    html += `
        <div class="ind-pair-summary">
          <div class="ind-summary-row">
            <span class="ind-s-label">前半</span>
            <span class="ind-s-score">${frontSum > 0 ? '+' : ''}${frontSum}</span>
            <span class="ind-s-winner">${frontWinLabel}</span>
            <span class="ind-s-pt ${frontPtA > 0 ? 'positive' : (frontPtA < 0 ? 'negative' : '')}">${playerA.name}: ${frontPtA > 0 ? '+' : ''}${frontPtA}pt</span>
          </div>
          <div class="ind-summary-row">
            <span class="ind-s-label">後半</span>
            <span class="ind-s-score">${backSum > 0 ? '+' : ''}${backSum}</span>
            <span class="ind-s-winner">${backWinLabel}</span>
            <span class="ind-s-pt ${backPtA > 0 ? 'positive' : (backPtA < 0 ? 'negative' : '')}">${playerA.name}: ${backPtA > 0 ? '+' : ''}${backPtA}pt</span>
          </div>
          <div class="ind-summary-row">
            <span class="ind-s-label">ﾄｰﾀﾙ</span>
            <span class="ind-s-score">${totalSum > 0 ? '+' : ''}${totalSum}</span>
            <span class="ind-s-winner">${totalWinLabel}</span>
            <span class="ind-s-pt ${totalPtA > 0 ? 'positive' : (totalPtA < 0 ? 'negative' : '')}">${playerA.name}: ${totalPtA > 0 ? '+' : ''}${totalPtA}pt</span>
          </div>
          <div class="ind-summary-total">
            合計: ${playerA.name} <strong class="${totalPtForA > 0 ? 'positive' : (totalPtForA < 0 ? 'negative' : '')}">${totalPtForA > 0 ? '+' : ''}${totalPtForA}pt</strong>
            / ${playerB.name} <strong class="${-totalPtForA > 0 ? 'positive' : (-totalPtForA < 0 ? 'negative' : '')}">${-totalPtForA > 0 ? '+' : ''}${-totalPtForA}pt</strong>
          </div>
        </div>
      </div>`;
  });

  // 個人戦ポイント集計テーブル
  html += `
    <div class="ind-points-summary">
      <h5 class="ind-summary-title">個人戦ポイント集計</h5>
      <table class="ind-pts-table">
        <thead><tr><th></th>`;
  players.forEach(p => { html += `<th>${p.name}</th>`; });
  html += `</tr></thead><tbody>`;

  ['front', 'back', 'total'].forEach((key, ki) => {
    const labels = ['前半 (±3)', '後半 (±6)', 'ﾄｰﾀﾙ (±3)'];
    html += `<tr><td class="td-label">${labels[ki]}</td>`;
    players.forEach(p => {
      const pt = pointsByPlayer[p.index][key];
      const cls = pt > 0 ? 'positive' : (pt < 0 ? 'negative' : '');
      html += `<td class="${cls}">${pt > 0 ? '+' : ''}${pt}</td>`;
    });
    html += `</tr>`;
  });

  html += `<tr class="total-row"><td class="td-label">個人戦合計</td>`;
  players.forEach(p => {
    const pt = pointsByPlayer[p.index].sum;
    const cls = pt > 0 ? 'positive' : (pt < 0 ? 'negative' : '');
    html += `<td class="${cls}"><strong>${pt > 0 ? '+' : ''}${pt}</strong></td>`;
  });
  html += `</tr></tbody></table></div>`;

  html += `</div>`;
  return html;
}

function buildIndividualHalfTable(label, holes, startHole, pA, pB, halfSum) {
  const subLabel = halfSum > 0 ? `${pA.name} +${halfSum}` : (halfSum < 0 ? `${pB.name} +${Math.abs(halfSum)}` : '引分');
  let html = `
    <div class="ind-half-section">
      <div class="ind-half-subtitle">${label} <span class="trs-sub">${subLabel}</span></div>
      <div class="score-table-wrapper">
        <table class="score-table ind-result-table">
          <thead><tr><th class="th-hole">H</th>`;
  for (let i = 0; i < 9; i++) html += `<th>${startHole + i}</th>`;
  html += `<th class="th-total">計</th></tr></thead><tbody>`;

  // ハンデ行
  html += `<tr class="hdcp-stroke-row"><td class="td-label">HD</td>`;
  for (let i = 0; i < 9; i++) {
    const h = holes[i];
    html += `<td class="${h.hasStroke ? 'has-stroke' : ''}">${h.hasStroke ? (h.strokeFor === 'A' ? pA.name.charAt(0) : pB.name.charAt(0)) : ''}</td>`;
  }
  html += `<td></td></tr>`;

  // プレーヤーAのスコア行
  html += `<tr><td class="td-label">${pA.name}</td>`;
  let totalA = 0;
  for (let i = 0; i < 9; i++) {
    const h = holes[i];
    const cls = h.result > 0 ? 'cell-l-win' : (h.result < 0 ? 'cell-r-win' : 'cell-draw');
    const netMark = (h.hasStroke && h.strokeFor === 'A') ? `<sup>*</sup>` : '';
    html += `<td class="${cls}">${h.netA}${netMark}</td>`;
    totalA += h.netA;
  }
  html += `<td class="td-total">${totalA}</td></tr>`;

  // プレーヤーBのスコア行
  html += `<tr><td class="td-label">${pB.name}</td>`;
  let totalB = 0;
  for (let i = 0; i < 9; i++) {
    const h = holes[i];
    const cls = h.result < 0 ? 'cell-l-win' : (h.result > 0 ? 'cell-r-win' : 'cell-draw');
    const netMark = (h.hasStroke && h.strokeFor === 'B') ? `<sup>*</sup>` : '';
    html += `<td class="${cls}">${h.netB}${netMark}</td>`;
    totalB += h.netB;
  }
  html += `<td class="td-total">${totalB}</td></tr>`;

  // 勝敗行
  html += `<tr class="points-row"><td class="td-label">結果</td>`;
  let cum = 0;
  for (let i = 0; i < 9; i++) {
    const r = holes[i].result;
    cum += r;
    const symbol = r > 0 ? '○' : (r < 0 ? '●' : '△');
    const cls = r > 0 ? 'positive' : (r < 0 ? 'negative' : '');
    html += `<td class="${cls}">${symbol}</td>`;
  }
  const cumCls = cum > 0 ? 'positive' : (cum < 0 ? 'negative' : '');
  html += `<td class="td-total ${cumCls}"><strong>${cum > 0 ? '+' : ''}${cum}</strong></td></tr>`;

  html += `</tbody></table></div></div>`;
  return html;
}

// =================== ベスト結果描画 ===================
function renderBestGameResult(bestResult, players) {
  const { holeResults, playerPoints } = bestResult;
  const isOutStart = startCourse === 'OUT';

  let html = `
    <div class="best-game-result">
      <h4 class="game-result-title"><i class="fas fa-trophy"></i> ベスト</h4>`;

  // OUT / IN をプレー順で表示
  const frontHoles = isOutStart ? holeResults.slice(0, 9) : holeResults.slice(9);
  const backHoles  = isOutStart ? holeResults.slice(9) : holeResults.slice(0, 9);
  const frontLabel = isOutStart ? 'OUT' : 'IN';
  const backLabel  = isOutStart ? 'IN' : 'OUT';
  const frontStart = isOutStart ? 1 : 10;
  const backStart  = isOutStart ? 10 : 1;

  html += buildBestTable(frontLabel, frontHoles, frontStart, players);
  html += buildBestTable(backLabel, backHoles, backStart, players);

  // ポイント集計テーブル
  html += `
    <div class="best-points-summary">
      <h5 class="best-summary-title">ベスト ポイント集計</h5>
      <table class="best-pts-table">
        <thead><tr><th></th>`;
  players.forEach(p => { html += `<th>${p.name}</th>`; });
  html += `</tr></thead><tbody>`;

  // 前半
  html += `<tr><td class="td-label">${frontLabel}</td>`;
  players.forEach(p => {
    const pt = frontHoles.reduce((s, hr) => s + hr.holePts[p.index], 0);
    const cls = pt > 0 ? 'positive' : (pt < 0 ? 'negative' : '');
    html += `<td class="${cls}">${pt > 0 ? '+' : ''}${pt}</td>`;
  });
  html += `</tr>`;

  // 後半
  html += `<tr><td class="td-label">${backLabel}</td>`;
  players.forEach(p => {
    const pt = backHoles.reduce((s, hr) => s + hr.holePts[p.index], 0);
    const cls = pt > 0 ? 'positive' : (pt < 0 ? 'negative' : '');
    html += `<td class="${cls}">${pt > 0 ? '+' : ''}${pt}</td>`;
  });
  html += `</tr>`;

  // 合計
  html += `<tr class="total-row"><td class="td-label">ベスト合計</td>`;
  players.forEach(p => {
    const pt = playerPoints[p.index];
    const cls = pt > 0 ? 'positive' : (pt < 0 ? 'negative' : '');
    html += `<td class="${cls}"><strong>${pt > 0 ? '+' : ''}${pt}</strong></td>`;
  });
  html += `</tr></tbody></table></div>`;

  html += `</div>`;
  return html;
}

function buildBestTable(label, holes, startHole, players) {
  let html = `
    <div class="best-half-section">
      <div class="best-half-subtitle">${label}</div>
      <div class="score-table-wrapper">
        <table class="score-table best-result-table">
          <thead><tr><th class="th-hole">H</th>`;
  for (let i = 0; i < 9; i++) html += `<th>${startHole + i}</th>`;
  html += `<th class="th-total">計</th></tr></thead><tbody>`;

  // PAR行
  html += `<tr class="par-row"><td class="td-label">PAR</td>`;
  for (let i = 0; i < 9; i++) html += `<td>${holes[i].par}</td>`;
  html += `<td></td></tr>`;

  // 各プレーヤーのネットスコア行
  players.forEach(p => {
    html += `<tr><td class="td-label">${p.name}</td>`;
    let total = 0;
    for (let i = 0; i < 9; i++) {
      const hr = holes[i];
      const sc = hr.scores.find(s => s.player.index === p.index);
      const isBest = hr.hasSoleBest && hr.soleBestPlayer.index === p.index;
      const isBirdie = sc.vsPar === -1;
      const isEagle = sc.vsPar <= -2;
      let cls = '';
      if (isBest) cls = 'cell-best';
      if (isBirdie) cls += ' cell-birdie';
      if (isEagle) cls += ' cell-eagle';
      const strokeMark = sc.strokes > 0 ? `<sup>${sc.strokes}</sup>` : '';
      html += `<td class="${cls.trim()}">${sc.net}${strokeMark}</td>`;
      total += sc.net;
    }
    html += `<td class="td-total">${total}</td></tr>`;
  });

  // ポイント行
  players.forEach(p => {
    html += `<tr class="best-pts-row"><td class="td-label">${p.name} pt</td>`;
    let total = 0;
    for (let i = 0; i < 9; i++) {
      const pt = holes[i].holePts[p.index];
      total += pt;
      const cls = pt > 0 ? 'positive' : (pt < 0 ? 'negative' : '');
      html += `<td class="${cls}">${pt !== 0 ? (pt > 0 ? '+' + pt : pt) : ''}</td>`;
    }
    const cls = total > 0 ? 'positive' : (total < 0 ? 'negative' : '');
    html += `<td class="td-total ${cls}"><strong>${total > 0 ? '+' : ''}${total}</strong></td></tr>`;
  });

  // キャリーオーバー・バーディ/イーグル表示行
  html += `<tr class="best-event-row"><td class="td-label">Event</td>`;
  for (let i = 0; i < 9; i++) {
    const hr = holes[i];
    const events = [];
    if (hr.isCarryOver) events.push('<span class="ev-co">CO</span>');
    if (hr.triggerCarryOver) events.push('<span class="ev-co">→CO</span>');
    hr.scores.forEach(s => {
      if (s.vsPar <= -2) events.push(`<span class="ev-eagle">E</span>`);
      else if (s.vsPar === -1) events.push(`<span class="ev-birdie">B</span>`);
    });
    html += `<td>${events.join('')}</td>`;
  }
  html += `<td></td></tr>`;

  html += `</tbody></table></div></div>`;
  return html;
}

// =================== プレーヤー入力欄の動的生成 ===================
function renderPlayerInputs() {
  const container = document.getElementById('player-inputs');
  if (!container) return;
  
  let html = '';
  for (let i = 0; i < playerCount; i++) {
    const p = defaultPlayers[i] || { name: '', hdcp: '' };
    html += `
      <div class="player-input-row">
        <span class="player-number">${i + 1}</span>
        <input type="text" class="input-field player-name-input" placeholder="名前" value="${p.name}" data-player="${i}">
        <input type="number" class="input-field input-hdcp" placeholder="HDCP" value="${p.hdcp}" data-player="${i}">
      </div>`;
  }
  container.innerHTML = html;
}

// =================== スコアテーブルの動的生成 ===================
function renderScoreTable(tableId, pars, startHole) {
  const table = document.getElementById(tableId);
  if (!table) return;
  
  // ヘッダー行
  let headerRow = '<tr><th class="th-hole">H</th>';
  for (let h = 0; h < 9; h++) {
    headerRow += `<th>${startHole + h}</th>`;
  }
  headerRow += '<th class="th-total">計</th></tr>';
  
  // PAR行
  let parRow = '<tr class="par-row"><td class="td-label">PAR</td>';
  let parTotal = 0;
  for (let h = 0; h < 9; h++) {
    parRow += `<td>${pars[h]}</td>`;
    parTotal += pars[h];
  }
  parRow += `<td class="td-total">${parTotal}</td></tr>`;
  
  table.querySelector('thead').innerHTML = headerRow + parRow;
  
  // プレーヤー行
  const names = getPlayerNames();
  let bodyHTML = '';
  for (let i = 0; i < playerCount; i++) {
    bodyHTML += `<tr><td class="td-player">${names[i]}</td>`;
    for (let h = 0; h < 9; h++) {
      bodyHTML += `<td><input type="number" class="score-input" min="1" max="15"></td>`;
    }
    bodyHTML += '<td class="td-total">-</td></tr>';
  }
  table.querySelector('tbody').innerHTML = bodyHTML;
}

function getPlayerNames() {
  const inputs = document.querySelectorAll('.player-name-input');
  const names = [];
  inputs.forEach((inp, i) => {
    names.push(inp.value || `P${i + 1}`);
  });
  // 足りない場合はデフォルト名で補完
  while (names.length < playerCount) {
    const p = defaultPlayers[names.length];
    names.push(p ? p.name : `P${names.length + 1}`);
  }
  return names;
}

// プレーヤー名・HDCPが変わったらチームプレビューも更新
document.addEventListener('input', function(e) {
  if (e.target.classList.contains('input-hdcp')) {
    renderTeamPreview();
  }
  if (e.target.classList.contains('player-name-input')) {
    const idx = parseInt(e.target.dataset.player);
    const name = e.target.value || `P${idx + 1}`;
    
    // 対応する行のプレーヤー名を更新
    ['score-table-out', 'score-table-in'].forEach(tableId => {
      const table = document.getElementById(tableId);
      if (!table) return;
      const rows = table.querySelectorAll('tbody tr');
      if (rows[idx]) {
        rows[idx].querySelector('.td-player').textContent = name;
      }
    });
  }
});

// =================== ページナビゲーション ===================
function navigateTo(pageId) {
  // 全ページを非表示
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  
  // 対象ページを表示
  const page = document.getElementById(pageId);
  if (page) {
    page.classList.add('active');
    // ページトップにスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // ナビゲーションのアクティブ状態を更新
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageId);
  });
}

// =================== カメラ / 画像選択 ===================
let cameraStream = null;

function handleImageSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = document.getElementById('captured-image');
    img.src = e.target.result;
    img.style.display = 'block';
    
    // プレースホルダーを非表示
    document.querySelector('.camera-placeholder').style.display = 'none';
    
    // 解析ボタンを表示
    document.getElementById('btn-analyze').style.display = 'flex';
    document.getElementById('btn-retake').style.display = 'flex';
  };
  reader.readAsDataURL(file);
}

function takePhoto() {
  // カメラ専用のinputをトリガー（モバイルではカメラが起動）
  const cameraInput = document.getElementById('file-input-camera');
  if (cameraInput) {
    cameraInput.value = '';
    cameraInput.click();
  }
}

function retakePhoto() {
  document.getElementById('captured-image').style.display = 'none';
  document.getElementById('captured-image').src = '';
  document.querySelector('.camera-placeholder').style.display = 'block';
  document.getElementById('btn-analyze').style.display = 'none';
  document.getElementById('btn-retake').style.display = 'none';
  const gallery = document.getElementById('file-input-gallery');
  const camera = document.getElementById('file-input-camera');
  if (gallery) gallery.value = '';
  if (camera) camera.value = '';
}

// =================== 画像リサイズ（iOS対応） ===================
function resizeImageForOCR(img, maxDim) {
  maxDim = maxDim || 1600;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let w = img.naturalWidth;
  let h = img.naturalHeight;

  // iOSのcanvasメモリ制限対策: 長辺をmaxDimに縮小
  if (w > maxDim || h > maxDim) {
    if (w > h) {
      h = Math.round(h * maxDim / w);
      w = maxDim;
    } else {
      w = Math.round(w * maxDim / h);
      h = maxDim;
    }
  }

  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(img, 0, 0, w, h);

  // グレースケール + コントラスト強調
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    let gray = d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114;
    gray = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128));
    // 二値化（しきい値150）で数字を際立たせる
    gray = gray > 150 ? 255 : 0;
    d[i] = d[i+1] = d[i+2] = gray;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// =================== スコアカード解析（Tesseract.js OCR） ===================
async function analyzeScorecard() {
  const img = document.getElementById('captured-image');
  if (!img.src || img.src === '') {
    showToast('写真を撮影してください');
    return;
  }

  const modal = document.getElementById('loading-modal');
  const loadingText = document.getElementById('loading-text');
  const loadingSubtext = document.getElementById('loading-subtext');
  const progressBar = modal.querySelector('.loading-progress-bar');
  modal.style.display = 'flex';
  loadingText.textContent = 'OCRエンジンを準備中...';
  loadingSubtext.textContent = '初回は少し時間がかかります（最大30秒）';
  if (progressBar) progressBar.style.width = '5%';

  try {
    // Tesseract.jsが読み込まれているか確認
    if (typeof Tesseract === 'undefined') {
      throw new Error('OCRエンジンが読み込めません。インターネット接続を確認してください。');
    }

    // --- 画像前処理（リサイズ含む） ---
    loadingSubtext.textContent = '画像を処理中...';
    if (progressBar) progressBar.style.width = '10%';

    const canvas = resizeImageForOCR(img, 1600);
    console.log('OCR canvas size:', canvas.width, 'x', canvas.height);

    loadingText.textContent = 'スコアを読み取り中...';
    loadingSubtext.textContent = 'OCRエンジンを起動中...';
    if (progressBar) progressBar.style.width = '15%';

    // --- Tesseract OCR 実行 ---
    let worker;
    try {
      worker = await Tesseract.createWorker('eng', 1, {
        logger: m => {
          console.log('Tesseract:', m.status, m.progress);
          if (m.status === 'recognizing text') {
            const pct = Math.round(20 + m.progress * 70);
            if (progressBar) progressBar.style.width = pct + '%';
            loadingSubtext.textContent = '認識中... ' + pct + '%';
          } else if (m.status === 'loading tesseract core') {
            loadingSubtext.textContent = 'OCRコアを読み込み中...';
          } else if (m.status === 'initializing tesseract') {
            loadingSubtext.textContent = 'OCRを初期化中...';
          } else if (m.status === 'loading language traineddata') {
            loadingSubtext.textContent = '言語データを読み込み中...';
          }
        }
      });
    } catch (workerErr) {
      throw new Error('OCRエンジンの起動に失敗: ' + workerErr.message);
    }

    await worker.setParameters({
      tessedit_char_whitelist: '0123456789',
      tessedit_pageseg_mode: '6',
    });

    loadingSubtext.textContent = 'スコアカードを認識中...';
    const result = await worker.recognize(canvas);
    await worker.terminate();

    console.log('OCR raw text:', result.data.text);
    console.log('OCR words count:', result.data.words ? result.data.words.length : 0);

    if (progressBar) progressBar.style.width = '95%';
    loadingText.textContent = 'スコアを解析中...';
    loadingSubtext.textContent = 'スコアカードを照合しています';

    // --- OCR結果からスコアを抽出 ---
    const ocrScores = parseOcrToScores(result.data);

    // --- 手入力画面に遷移してスコアを埋める ---
    navigateTo('page-manual');

    // プレーヤー入力・テーブルが存在することを確認
    renderPlayerInputs();
    renderScoreTable('score-table-out', PAR_OUT, 1);
    renderScoreTable('score-table-in', PAR_IN, 10);

    // スコアを埋める
    if (ocrScores) {
      fillOcrScores('score-table-out', ocrScores.out);
      fillOcrScores('score-table-in', ocrScores.in);
      calculateTableTotals('score-table-out');
      calculateTableTotals('score-table-in');
    }

    if (progressBar) progressBar.style.width = '100%';

    const filledCount = ocrScores ? ocrScores.filledCount : 0;
    const totalCells = playerCount * 18;
    if (filledCount === 0) {
      showToast('スコアを読み取れませんでした。手入力で修正してください。');
    } else {
      showToast(filledCount + '/' + totalCells + ' セルを読み取りました。間違いを修正してください');
    }

  } catch (e) {
    console.error('OCR Error:', e);
    // ユーザーに詳しいエラーを表示
    const errMsg = e.message || '不明なエラー';
    showToast('読み取り失敗: ' + errMsg);

    // エラーでも手入力画面に遷移して手入力可能にする
    navigateTo('page-manual');
    renderPlayerInputs();
    renderScoreTable('score-table-out', PAR_OUT, 1);
    renderScoreTable('score-table-in', PAR_IN, 10);

  } finally {
    modal.style.display = 'none';
    if (progressBar) progressBar.style.width = '0%';
    loadingText.textContent = 'スコアカードを読み取り中...';
    loadingSubtext.textContent = 'しばらくお待ちください';
  }
}

// --- OCR結果パーサー: words の位置情報からスコア行を抽出 ---
function parseOcrToScores(data) {
  if (!data || !data.words || data.words.length === 0) return null;

  // 全数字ワードを取得（位置付き）
  const nums = data.words
    .filter(w => /^\d{1,2}$/.test(w.text.trim()))
    .map(w => ({
      val: parseInt(w.text.trim()),
      x: (w.bbox.x0 + w.bbox.x1) / 2,
      y: (w.bbox.y0 + w.bbox.y1) / 2,
      w: w.bbox.x1 - w.bbox.x0,
      h: w.bbox.y1 - w.bbox.y0,
    }));

  if (nums.length < 10) return null;

  // 画像全体のサイズ推定
  const maxX = Math.max(...nums.map(n => n.x));
  const maxY = Math.max(...nums.map(n => n.y));

  // Y座標でクラスタリング（行検出）
  const rows = clusterByY(nums, maxY * 0.025);

  // 各行をX座標でソート
  rows.forEach(row => row.sort((a, b) => a.x - b.x));

  // 行をY座標でソート
  rows.sort((a, b) => {
    const ay = a.reduce((s, n) => s + n.y, 0) / a.length;
    const by = b.reduce((s, n) => s + n.y, 0) / b.length;
    return ay - by;
  });

  // スコアカードの構造: 
  // 各ホール行は [ホール番号, (距離x4), PAR, スコアx4, HDCP] のような構成
  // スコア値は 1-15 の範囲、距離は 100-600 の範囲、ホール番号は 1-18
  // HDCP は 1-18
  
  // ホール行を特定する:
  // - 行の最初の数字がホール番号(1-18)のいずれか
  // - 行にスコア範囲(2-12)の数字が4つ以上ある
  const knownPars = {
    1:4, 2:5, 3:3, 4:4, 5:4, 6:5, 7:4, 8:3, 9:4,
    10:4, 11:4, 12:3, 13:5, 14:4, 15:4, 16:4, 17:3, 18:5
  };
  const knownHdcp = {
    1:5, 2:7, 3:17, 4:11, 5:13, 6:1, 7:15, 8:9, 9:3,
    10:8, 11:4, 12:18, 13:16, 14:2, 15:12, 16:6, 17:14, 18:10
  };

  const holeScores = {}; // { holeNumber: [score1, score2, score3, score4] }

  for (const row of rows) {
    if (row.length < 3) continue;

    // この行のスコア候補（2〜15の数字）を末尾側から取得
    const scoreCandidates = row.filter(n => n.val >= 2 && n.val <= 15);
    if (scoreCandidates.length < 2) continue;

    // ホール番号候補: 行の中で1-18のいずれか、かつX座標が最も左
    const firstNum = row[0];
    const holeNum = firstNum.val;
    if (holeNum < 1 || holeNum > 18) continue;

    // この行の右側にあるスコア候補を取得
    // PAR値とHDCP値を除外するため、既知の値を使う
    const par = knownPars[holeNum];
    const hdcp = knownHdcp[holeNum];

    // スコア候補: ホール番号より右にある2-15の数字
    // 距離値(3桁)は既にフィルタ済み(1-2桁のみ)
    let candidates = row.filter(n => n.x > firstNum.x && n.val >= 2 && n.val <= 15);

    // PAR値とHDCP値に近い値を除外する試み
    // 右端の数字がHDCPの可能性が高い
    if (candidates.length > playerCount) {
      // HDCPと一致する末尾の数字を除外
      const last = candidates[candidates.length - 1];
      if (last.val === hdcp) {
        candidates = candidates.slice(0, -1);
      }
    }
    if (candidates.length > playerCount) {
      // PAR値と一致する先頭の数字を除外
      const first = candidates[0];
      if (first.val === par) {
        candidates = candidates.slice(1);
      }
    }

    // まだ多い場合は右からplayerCount個取る（スコア列は右寄り）
    if (candidates.length > playerCount) {
      candidates = candidates.slice(candidates.length - playerCount);
    }

    if (candidates.length >= 2) {
      holeScores[holeNum] = candidates.map(c => c.val);
    }
  }

  // OUT / IN に分配
  const outScores = []; // [player][hole]
  const inScores = [];
  for (let p = 0; p < playerCount; p++) {
    outScores.push([]);
    inScores.push([]);
  }

  let filledCount = 0;
  for (let h = 1; h <= 9; h++) {
    const scores = holeScores[h];
    for (let p = 0; p < playerCount; p++) {
      const val = (scores && scores[p] != null) ? scores[p] : null;
      outScores[p].push(val);
      if (val != null) filledCount++;
    }
  }
  for (let h = 10; h <= 18; h++) {
    const scores = holeScores[h];
    for (let p = 0; p < playerCount; p++) {
      const val = (scores && scores[p] != null) ? scores[p] : null;
      inScores[p].push(val);
      if (val != null) filledCount++;
    }
  }

  return { out: outScores, in: inScores, filledCount };
}

// --- Y座標でクラスタリング ---
function clusterByY(nums, threshold) {
  if (nums.length === 0) return [];
  const sorted = [...nums].sort((a, b) => a.y - b.y);
  const clusters = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const prevY = clusters[clusters.length - 1].reduce((s, n) => s + n.y, 0) / clusters[clusters.length - 1].length;
    if (Math.abs(sorted[i].y - prevY) < threshold) {
      clusters[clusters.length - 1].push(sorted[i]);
    } else {
      clusters.push([sorted[i]]);
    }
  }
  return clusters;
}

// --- OCRスコアをテーブルに埋める ---
function fillOcrScores(tableId, scores) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach((row, pIdx) => {
    if (pIdx >= scores.length) return;
    const inputs = row.querySelectorAll('.score-input');
    inputs.forEach((inp, hIdx) => {
      if (hIdx < scores[pIdx].length && scores[pIdx][hIdx] != null) {
        inp.value = scores[pIdx][hIdx];
      }
    });
  });
}

// =================== スコア計算 ===================
function calculateAndShow() {
  // テーブル合計を計算
  calculateTableTotals('score-table-out');
  calculateTableTotals('score-table-in');

  // データ収集
  const players = collectPlayerData();

  // スコア未入力チェック
  const incomplete = players.some(p =>
    p.scoresOut.some(s => s === 0) || p.scoresIn.some(s => s === 0)
  );
  if (incomplete) {
    showToast('全ホールのスコアを入力してください');
    return;
  }

  // 有効なゲームの計算
  let teamResult = null;
  if (playerCount === 4 && selectedGames['4_team']) {
    teamResult = calculateTeamGame(players);
  }

  let nakanukiResult = null;
  if (playerCount === 3 && selectedGames['3_nakanuki']) {
    nakanukiResult = calculateNakanukiGame(players);
  }

  let individualVResult = null;
  if (playerCount === 2 && selectedGames['2_individual_v']) {
    individualVResult = calculateIndividualVGame(players);
  }

  let individualResult = null;
  const indKey = playerCount === 2 ? '2_individual_h' : playerCount + '_individual';
  if (selectedGames[indKey]) {
    individualResult = calculateIndividualGame(players);
  }

  let bestResult = null;
  const bestKey = playerCount + '_best';
  if (selectedGames[bestKey]) {
    bestResult = calculateBestGame(players);
  }

  // ローディング表示後、結果描画＆遷移
  const modal = document.getElementById('loading-modal');
  modal.style.display = 'flex';

  setTimeout(() => {
    renderResultPage(players, teamResult, individualResult, bestResult, nakanukiResult, individualVResult);
    modal.style.display = 'none';
    navigateTo('page-result');
  }, 800);
}

function calculateTableTotals(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(row => {
    const inputs = row.querySelectorAll('.score-input');
    let total = 0;
    let allFilled = true;
    
    inputs.forEach(input => {
      const val = parseInt(input.value);
      if (isNaN(val)) {
        allFilled = false;
      } else {
        total += val;
      }
    });
    
    const totalCell = row.querySelector('.td-total');
    if (totalCell) {
      totalCell.textContent = allFilled ? total : '-';
    }
  });
}

// =================== スコア入力のリアルタイム計算 ===================
document.addEventListener('input', function(e) {
  if (e.target.classList.contains('score-input')) {
    const table = e.target.closest('table');
    if (table) {
      calculateTableTotals(table.id);
    }
    
    // 次のセルに自動フォーカス
    const val = e.target.value;
    if (val.length >= 1 && parseInt(val) >= 3) {
      const allInputs = Array.from(table.querySelectorAll('.score-input'));
      const currentIdx = allInputs.indexOf(e.target);
      if (currentIdx < allInputs.length - 1) {
        allInputs[currentIdx + 1].focus();
        allInputs[currentIdx + 1].select();
      }
    }
  }
});

// =================== 詳細トグル（OUT / IN 切り替え） ===================
document.querySelectorAll('.detail-toggle').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.detail-toggle').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    // 将来的にテーブル表示切り替えの実装箇所
  });
});

// =================== 結果シェア ===================
function shareResult() {
  const shareText = `【程ヶ谷CC 握り結果】\n` +
    `2026/2/22\n` +
    `1位 田中 82 (NET 74) → +7,000円\n` +
    `2位 山田 88 (NET 76) → +2,500円\n` +
    `3位 佐藤 95 (NET 80) → -5,000円\n` +
    `4位 鈴木 98 (NET 80) → -4,500円`;

  if (navigator.share) {
    navigator.share({
      title: '程ヶ谷CC 握り結果',
      text: shareText,
    }).catch(() => {});
  } else {
    // クリップボードにコピー
    navigator.clipboard.writeText(shareText).then(() => {
      showToast('結果をコピーしました');
    }).catch(() => {
      alert(shareText);
    });
  }
}

function saveResult() {
  showToast('結果を保存しました');
}

// =================== トースト通知 ===================
function showToast(message) {
  // 既存のトーストがあれば削除
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(12,11,77,0.9);
    color: #fff;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    animation: toastIn 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// トーストアニメーションを動的に追加
const style = document.createElement('style');
style.textContent = `
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(10px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
`;
document.head.appendChild(style);

// =================== スコア入力セルのカラーリング ===================
document.addEventListener('change', function(e) {
  if (e.target.classList.contains('score-input')) {
    const val = parseInt(e.target.value);
    const td = e.target.closest('td');
    
    // PARの値を取得
    const table = e.target.closest('table');
    const colIdx = Array.from(td.parentElement.children).indexOf(td);
    const parRow = table.querySelector('.par-row');
    const parVal = parseInt(parRow.children[colIdx]?.textContent);
    
    if (!isNaN(val) && !isNaN(parVal)) {
      td.classList.remove('score-birdie', 'score-bogey', 'score-double', 'score-eagle');
      
      const diff = val - parVal;
      if (diff <= -2) {
        td.classList.add('score-eagle');
      } else if (diff === -1) {
        td.classList.add('score-birdie');
      } else if (diff === 1) {
        td.classList.add('score-bogey');
      } else if (diff >= 2) {
        td.classList.add('score-double');
      }
    }
  }
});

// スコアカラーのスタイルを動的に追加
const scoreStyle = document.createElement('style');
scoreStyle.textContent = `
  .score-eagle  { background: #fff3cd !important; }
  .score-eagle .score-input  { color: #d4a017; font-weight: 700; }
  .score-birdie { background: #e8f5e9 !important; }
  .score-birdie .score-input { color: #196719; font-weight: 700; }
  .score-bogey  { background: #fce4ec !important; }
  .score-bogey .score-input  { color: #c0392b; }
  .score-double { background: #f8d7da !important; }
  .score-double .score-input { color: #891e2b; font-weight: 700; }
`;
document.head.appendChild(scoreStyle);

// =================== 初期化 ===================
// =================== スコア自動入力 ===================
function prefillScores() {
  // OUT (Hole 1-9) 各プレーヤーのスコア
  const scoresOut = [
    [5, 6, 4, 5, 5, 7, 5, 4, 5],  // 荒濤  = 46
    [5, 6, 5, 5, 6, 7, 5, 4, 5],  // 佐久間 = 48
    [6, 6, 5, 5, 5, 7, 5, 4, 5],  // 上野  = 48
    [5, 6, 3, 5, 5, 6, 5, 3, 6],  // 佐藤  = 44
  ];
  // IN (Hole 10-18) 各プレーヤーのスコア
  const scoresIn = [
    [6, 7, 4, 6, 6, 5, 5, 4, 7],  // 荒濤  = 50
    [6, 5, 4, 5, 4, 5, 5, 4, 6],  // 佐久間 = 44
    [7, 6, 5, 5, 5, 5, 6, 4, 7],  // 上野  = 50
    [5, 6, 4, 6, 5, 5, 5, 4, 7],  // 佐藤  = 47
  ];

  function fillTable(tableId, scores) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach((row, pIdx) => {
      if (pIdx >= scores.length) return;
      const inputs = row.querySelectorAll('.score-input');
      inputs.forEach((inp, hIdx) => {
        if (hIdx < scores[pIdx].length) {
          inp.value = scores[pIdx][hIdx];
        }
      });
    });
  }

  fillTable('score-table-out', scoresOut);
  fillTable('score-table-in', scoresIn);

  // 合計を計算
  calculateTableTotals('score-table-out');
  calculateTableTotals('score-table-in');
}

document.addEventListener('DOMContentLoaded', function() {
  try {
    console.log('[INIT] DOMContentLoaded fired');
    // ホーム画面をデフォルト表示
    navigateTo('page-home');
    console.log('[INIT] navigateTo done');
    
    // プレーヤー人数のデフォルト設定（4人）で初期描画
    setPlayerCount(4);
    console.log('[INIT] setPlayerCount done');
    
    // ゲーム種別が表示されているか確認
    const gtContainer = document.getElementById('game-type-options');
    console.log('[INIT] game-type-options element:', gtContainer);
    console.log('[INIT] game-type-options innerHTML length:', gtContainer ? gtContainer.innerHTML.length : 'N/A');
    
    // スタートコースをINに設定
    setStartCourse('IN');
    document.querySelectorAll('.start-course-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.course === 'IN');
    });

    // スコアカード読み取りデータを自動入力
    prefillScores();

    console.log('程ヶ谷CC Game Tsuru Han initialized');
  } catch (e) {
    console.error('[INIT ERROR]', e);
    document.title = 'INIT ERR: ' + e.message;
    var d = document.createElement('div');
    d.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:red;color:white;padding:10px;font-size:14px;';
    d.textContent = 'Init Error: ' + e.message;
    document.body.prepend(d);
  }
});
