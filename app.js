/* =====================================================
 *  程ヶ谷カントリー倶楽部 Game Tsuru Han
 *  UI インタラクション
 * ===================================================== */

// =================== グローバル状態 ===================
let playerCount = 4;
let startCourse = 'IN'; // 'OUT' or 'IN'
let selectedGreen = 'A'; // 'A' or 'B'
let selectedTee = 'regular'; // 'back', 'regular', 'front', 'gold'

// =================== ヤーデージデータ（程ヶ谷CC公式） ===================
const YARD_DATA = {
  A: {
    back:    { out: [410,526,165,356,392,585,342,202,442], in: [442,360,176,502,436,348,382,188,544] },
    regular: { out: [394,486,134,336,371,570,323,179,392], in: [403,351,152,476,405,323,367,176,499] },
    front:   { out: [371,474,124,324,353,549,306,171,360], in: [391,341,137,456,390,310,357,157,479] },
    gold:    { out: [311,398, 95,308,273,477,215,162,248], in: [354,257,129,378,332,274,269,142,441] }
  },
  B: {
    back:    { out: [376,528,163,352,396,557,348,186,428], in: [431,373,177,506,406,353,349,188,530] },
    regular: { out: [360,488,145,332,375,542,329,162,378], in: [392,364,153,480,375,328,334,175,485] },
    front:   { out: [337,476,135,320,357,521,312,155,346], in: [380,354,139,460,360,315,324,156,465] },
    gold:    { out: [277,400,105,304,277,449,221,145,234], in: [343,270,130,382,302,279,236,138,427] }
  }
};

function getHoleYardage(holeNum) {
  const data = YARD_DATA[selectedGreen]?.[selectedTee];
  if (!data) return 0;
  if (holeNum >= 1 && holeNum <= 9) return data.out[holeNum - 1];
  if (holeNum >= 10 && holeNum <= 18) return data.in[holeNum - 10];
  return 0;
}

const defaultPlayers = [
  { name: '荒濤', hdcp: 16 },
  { name: '佐久間', hdcp: 17 },
  { name: '上野', hdcp: 19 },
  { name: '佐藤', hdcp: 11 },
];

// =================== プレーヤーデータの永続化 ===================
function savePlayerData() {
  const data = [];
  for (let i = 0; i < playerCount; i++) {
    const nameInput = document.querySelector('[data-home-player="' + i + '"]');
    const hdcpInput = document.querySelector('[data-home-hdcp="' + i + '"]');
    const p = defaultPlayers[i] || { name: '', hdcp: 0 };
    data.push({
      name: nameInput ? nameInput.value : p.name,
      hdcp: hdcpInput ? parseInt(hdcpInput.value) || 0 : p.hdcp,
    });
  }
  localStorage.setItem('hodogaya_players', JSON.stringify(data));
  localStorage.setItem('hodogaya_player_count', playerCount);
}

function loadPlayerData() {
  try {
    const saved = localStorage.getItem('hodogaya_players');
    if (saved) return JSON.parse(saved);
  } catch (e) { /* ignore parse errors */ }
  return null;
}

function getSavedPlayerCount() {
  const saved = localStorage.getItem('hodogaya_player_count');
  return saved ? parseInt(saved) : null;
}

const PAR_OUT = [4, 5, 3, 4, 4, 5, 4, 3, 4]; // Hole 1-9
const PAR_IN  = [4, 4, 3, 5, 4, 4, 4, 3, 5]; // Hole 10-18
const HDCP_OUT = [5, 7, 17, 11, 13, 1, 15, 9, 3];
const HDCP_IN  = [8, 4, 18, 16, 2, 12, 6, 14, 10];

// =================== プレーヤー人数設定 ===================
function setPlayerCount(count) {
  playerCount = count;
  localStorage.setItem('hodogaya_player_count', count);
  
  // ボタンのアクティブ状態を更新
  document.querySelectorAll('.count-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.count) === count);
  });
  
  // ホームのプレーヤー入力欄を再描画
  renderHomePlayerInputs();

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
  localStorage.setItem('hodogaya_start_course', course);
  document.querySelectorAll('.start-course-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.course === course);
  });
}

function setGreen(green) {
  selectedGreen = green;
  document.querySelectorAll('#green-selector .green-tee-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.green === green);
  });
  updateTeeTotalDisplay();
}

function setTee(tee) {
  selectedTee = tee;
  document.querySelectorAll('#tee-selector .green-tee-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tee === tee);
  });
  updateTeeTotalDisplay();
}

function updateTeeTotalDisplay() {
  const el = document.getElementById('tee-total-display');
  if (!el) return;
  const data = YARD_DATA[selectedGreen]?.[selectedTee];
  if (!data) { el.innerHTML = ''; return; }
  const outTotal = data.out.reduce((s, v) => s + v, 0);
  const inTotal = data.in.reduce((s, v) => s + v, 0);
  const total = outTotal + inTotal;
  const teeLabel = { back:'Back', regular:'Regular', front:'Front', gold:'Gold' }[selectedTee] || selectedTee;
  el.innerHTML = `<span class="tee-total-tag">${selectedGreen}グリーン / ${teeLabel} Tee</span> ` +
    `<span class="tee-total-yards">OUT ${outTotal.toLocaleString()}Y / IN ${inTotal.toLocaleString()}Y / TOTAL ${total.toLocaleString()}Y</span>`;
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

    // 手入力ページ → ホーム画面 → デフォルト の順にフォールバック
    const manualName = nameInputs[i]?.value;
    const homeName = document.querySelector('[data-home-player="' + i + '"]')?.value;
    const finalName = manualName || homeName || (defaultPlayers[i]?.name) || `P${i + 1}`;
    const manualHdcp = hdcpInputs[i]?.value;
    const homeHdcp = document.querySelector('[data-home-hdcp="' + i + '"]')?.value;
    const finalHdcp = parseInt(manualHdcp || homeHdcp) || (defaultPlayers[i]?.hdcp) || 0;

    const totalOut = scoresOut.reduce((a, b) => a + b, 0);
    const totalIn = scoresIn.reduce((a, b) => a + b, 0);
    players.push({
      index: i,
      name: finalName,
      hdcp: finalHdcp,
      scoresOut,
      scoresIn,
      totalOut,
      totalIn,
      total: totalOut + totalIn,
      net: totalOut + totalIn - finalHdcp,
    });
  }
  return players;
}

// =================== 団体戦ロジック (4人) ===================
const ALL_HDCP = [...HDCP_OUT, ...HDCP_IN];
const ALL_PAR  = [...PAR_OUT, ...PAR_IN];

// チーム分け: プレーヤー1&2 = L組、プレーヤー3&4 = R組（入力順で決定）
function determineTeams(players) {
  if (players.length !== 4) return null;

  const teamL = [players[0], players[1]];
  const teamR = [players[2], players[3]];

  // 同ハンデでじゃんけんが必要だったか判定（情報表示用）
  const sorted = [...players].sort((a, b) => a.hdcp - b.hdcp);
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

    // 各プレーヤーのグロス・バーディ判定
    const scores = players.map(p => {
      const gross = isOut ? p.scoresOut[idx] : p.scoresIn[idx];
      const vsPar = gross - par;
      return { player: p, gross, vsPar, strokes: 0 };
    });

    // --- ベスト判定（ペアワイズ比較） ---
    // 各プレーヤーが他の全プレーヤーにペアワイズで厳密に勝てるか判定
    let soleBestIdx = -1;
    for (let i = 0; i < players.length; i++) {
      let beatsAll = true;
      for (let j = 0; j < players.length; j++) {
        if (i === j) continue;
        const hdcpDiff = Math.abs(players[i].hdcp - players[j].hdcp);
        const pairStrokes = getHoleStrokes(hdcpDiff, si);
        let netI = scores[i].gross;
        let netJ = scores[j].gross;
        if (players[i].hdcp > players[j].hdcp) {
          netI -= pairStrokes; // iがハンデをもらう
        } else if (players[j].hdcp > players[i].hdcp) {
          netJ -= pairStrokes; // jがハンデをもらう
        }
        if (netI >= netJ) {
          beatsAll = false;
          break;
        }
      }
      if (beatsAll) {
        soleBestIdx = i;
        break;
      }
    }

    const hasSoleBest = soleBestIdx >= 0;
    const soleBestPlayer = hasSoleBest ? players[soleBestIdx] : null;

    // --- キャリーオーバー判定（全プレーヤーが同グロス かつ 全ペアのネットも引き分けのときのみ） ---
    const allSameGross = scores.every(s => s.gross === scores[0].gross);
    let allPairsTied = true;
    if (allSameGross) {
      for (let i = 0; i < players.length && allPairsTied; i++) {
        for (let j = i + 1; j < players.length && allPairsTied; j++) {
          const hdcpDiff = Math.abs(players[i].hdcp - players[j].hdcp);
          const pairStrokes = getHoleStrokes(hdcpDiff, si);
          if (pairStrokes > 0) {
            allPairsTied = false;
          }
        }
      }
    } else {
      allPairsTied = false;
    }
    const triggerCarryOver = allSameGross && allPairsTied;

    // --- ポイント設定（各プレーヤーから○ポイント × (n-1)人分） ---
    const n = players.length;
    const others = n - 1;

    // --- ベストポイント ---
    const multiplier = isCarryOver ? 2 : 1;
    const bestPts = {};
    players.forEach(p => { bestPts[p.index] = 0; });
    if (hasSoleBest) {
      bestPts[soleBestPlayer.index] = others * 1 * multiplier;
      scores.forEach(s => {
        if (s.player.index !== soleBestPlayer.index) {
          bestPts[s.player.index] = -1 * multiplier;
        }
      });
    }

    // --- バーディ/イーグル/アルバトロスポイント ---
    const birdiePts = {};
    players.forEach(p => { birdiePts[p.index] = 0; });
    scores.forEach(s => {
      let ptPerPlayer = 0;
      if (s.vsPar <= -3) {
        ptPerPlayer = 3;
      } else if (s.vsPar === -2) {
        ptPerPlayer = 2;
      } else if (s.vsPar === -1) {
        ptPerPlayer = 1;
      }
      if (ptPerPlayer > 0) {
        birdiePts[s.player.index] += others * ptPerPlayer;
        scores.forEach(other => {
          if (other.player.index !== s.player.index) {
            birdiePts[other.player.index] -= ptPerPlayer;
          }
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
      scores, bestNet: null, hasSoleBest,
      soleBestPlayer,
      isCarryOver, triggerCarryOver,
      bestPts, birdiePts, holePts,
    });

    // 次のホールのキャリーオーバー設定（1ホール限定）
    // 連続COの場合も、当該ホール自体のCOは次の1ホールに持ち越す
    if (triggerCarryOver) {
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
    const manualName = nameInputs[i]?.value;
    const homeName = document.querySelector('[data-home-player="' + i + '"]')?.value;
    const finalName = manualName || homeName || (defaultPlayers[i]?.name) || `P${i + 1}`;
    const manualHdcp = hdcpInputs[i]?.value;
    const homeHdcp = document.querySelector('[data-home-hdcp="' + i + '"]')?.value;
    const finalHdcp = parseInt(manualHdcp || homeHdcp) || (defaultPlayers[i]?.hdcp) || 0;
    players.push({
      index: i,
      name: finalName,
      hdcp: finalHdcp,
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

  // HD行（各ホールのストロークインデックス）
  html += `<tr class="hdcp-stroke-row"><td class="td-label">HD</td>`;
  for (let i = 0; i < 9; i++) html += `<td>${holes[i].si}</td>`;
  html += `<td></td></tr>`;

  // 各プレーヤー行：グロス表示、ハンデありの場合はマーク付き、ベスト判定は相対ネット
  players.forEach(p => {
    html += `<tr><td class="td-label">${p.name}</td>`;
    let grossTotal = 0;
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
      // グロス表示、ストローク数を上付きで表示
      const strokeMark = sc.strokes > 0 ? `<sup class="stroke-mark">*${sc.strokes}</sup>` : '';
      html += `<td class="${cls.trim()}">${sc.gross}${strokeMark}</td>`;
      grossTotal += sc.gross;
    }
    html += `<td class="td-total">${grossTotal}</td></tr>`;
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
      if (s.vsPar <= -3) events.push(`<span class="ev-eagle">Al</span>`);
      else if (s.vsPar === -2) events.push(`<span class="ev-eagle">E</span>`);
      else if (s.vsPar === -1) events.push(`<span class="ev-birdie">B</span>`);
    });
    html += `<td>${events.join('')}</td>`;
  }
  html += `<td></td></tr>`;

  html += `</tbody></table></div></div>`;
  return html;
}

// =================== ホーム画面のプレーヤー入力欄 ===================
function renderHomePlayerInputs() {
  const container = document.getElementById('home-player-inputs');
  if (!container) return;
  const savedPlayers = loadPlayerData();
  let html = '';
  for (let i = 0; i < playerCount; i++) {
    const p = defaultPlayers[i] || { name: '', hdcp: '' };
    // 既存の入力値 → localStorage → デフォルトの優先順で値を取得
    const existing = container.querySelector('[data-home-player="' + i + '"]');
    const existingHdcp = container.querySelector('[data-home-hdcp="' + i + '"]');
    const nameVal = existing ? existing.value : (savedPlayers && savedPlayers[i] ? savedPlayers[i].name : p.name);
    const hdcpVal = existingHdcp ? existingHdcp.value : (savedPlayers && savedPlayers[i] ? savedPlayers[i].hdcp : p.hdcp);
    const teamLabel = playerCount === 4 ? (i < 2 ? 'L組' : 'R組') : '';
    html += `
      <div class="home-player-row">
        <span class="home-player-number">${i + 1}</span>
        ${playerCount === 4 ? `<span class="home-team-label ${i < 2 ? 'team-label-l' : 'team-label-r'}">${teamLabel}</span>` : ''}
        <input type="text" class="input-field home-player-name" placeholder="プレーヤー${i+1}の名前" value="${nameVal}" data-home-player="${i}">
        <input type="number" class="input-field home-player-hdcp" placeholder="HD" value="${hdcpVal}" data-home-hdcp="${i}">
      </div>`;
  }
  container.innerHTML = html;

  // 入力変更時に自動保存
  container.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', savePlayerData);
  });
}

// ホームのプレーヤー情報を取得
function getHomePlayerInfo() {
  const names = [];
  const hdcps = [];
  for (let i = 0; i < playerCount; i++) {
    const nameInput = document.querySelector('[data-home-player="' + i + '"]');
    const hdcpInput = document.querySelector('[data-home-hdcp="' + i + '"]');
    const p = defaultPlayers[i] || { name: '', hdcp: '' };
    names.push(nameInput ? (nameInput.value || p.name || 'P' + (i+1)) : (p.name || 'P' + (i+1)));
    hdcps.push(hdcpInput ? (parseInt(hdcpInput.value) || p.hdcp || 0) : (p.hdcp || 0));
  }
  return { names, hdcps };
}

// =================== プレーヤー入力欄の動的生成 ===================
function renderPlayerInputs() {
  const container = document.getElementById('player-inputs');
  if (!container) return;
  const info = getHomePlayerInfo();
  let html = '';
  for (let i = 0; i < playerCount; i++) {
    const teamLabel = playerCount === 4 ? (i < 2 ? 'L組' : 'R組') : '';
    html += `
      <div class="player-input-row">
        <span class="player-number">${i + 1}</span>
        ${playerCount === 4 ? `<span class="input-team-label ${i < 2 ? 'team-label-l' : 'team-label-r'}">${teamLabel}</span>` : ''}
        <input type="text" class="input-field player-name-input" placeholder="名前" value="${info.names[i]}" data-player="${i}">
        <input type="number" class="input-field input-hdcp" placeholder="HDCP" value="${info.hdcps[i]}" data-player="${i}">
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
      bodyHTML += `<td><input type="number" class="score-input" min="1" max="20" readonly style="cursor:pointer;"></td>`;
    }
    bodyHTML += '<td class="td-total">-</td></tr>';
  }
  table.querySelector('tbody').innerHTML = bodyHTML;
}

function getPlayerNames() {
  // まずホーム画面の入力を優先的に参照
  const info = getHomePlayerInfo();
  return info.names;
}

// ホームのプレーヤー名・HDCPが変わったら手入力画面にも反映
document.addEventListener('input', function(e) {
  if (e.target.classList.contains('home-player-name') || e.target.classList.contains('home-player-hdcp')) {
    // 手入力画面の対応するフィールドを更新
    const idx = e.target.dataset.homePlayer || e.target.dataset.homeHdcp;
    if (idx !== undefined) {
      if (e.target.classList.contains('home-player-name')) {
        const manualInput = document.querySelector('.player-name-input[data-player="' + idx + '"]');
        if (manualInput) manualInput.value = e.target.value;
        // スコアテーブルの名前も更新
        const name = e.target.value || 'P' + (parseInt(idx) + 1);
        ['score-table-out', 'score-table-in'].forEach(tableId => {
          const table = document.getElementById(tableId);
          if (!table) return;
          const rows = table.querySelectorAll('tbody tr');
          if (rows[parseInt(idx)]) {
            const td = rows[parseInt(idx)].querySelector('.td-player');
            if (td) td.textContent = name;
          }
        });
      }
      if (e.target.classList.contains('home-player-hdcp')) {
        const manualInput = document.querySelector('.input-hdcp[data-player="' + idx + '"]');
        if (manualInput) manualInput.value = e.target.value;
      }
    }
    renderTeamPreview();
  }
});

// プレーヤー名・HDCPが変わったらチームプレビューも更新
document.addEventListener('input', function(e) {
  if (e.target.classList.contains('input-hdcp')) {
    renderTeamPreview();
    // ホーム側にも同期
    const idx = e.target.dataset.player;
    const homeInput = document.querySelector('[data-home-hdcp="' + idx + '"]');
    if (homeInput) homeInput.value = e.target.value;
  }
  if (e.target.classList.contains('player-name-input')) {
    const idx = parseInt(e.target.dataset.player);
    const name = e.target.value || 'P' + (idx + 1);
    // ホーム側にも同期
    const homeInput = document.querySelector('[data-home-player="' + idx + '"]');
    if (homeInput) homeInput.value = e.target.value;
    // スコアテーブルの名前を更新
    ['score-table-out', 'score-table-in'].forEach(tableId => {
      const table = document.getElementById(tableId);
      if (!table) return;
      const rows = table.querySelectorAll('tbody tr');
      if (rows[idx]) {
        const td = rows[idx].querySelector('.td-player');
        if (td) td.textContent = name;
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
  maxDim = maxDim || 2000;
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

  // グレースケール + 適度なコントラスト強調（二値化はしない）
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    let gray = d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114;
    // 穏やかなコントラスト強調
    gray = Math.min(255, Math.max(0, (gray - 128) * 1.4 + 128));
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
    if (typeof Tesseract === 'undefined') {
      throw new Error('OCRエンジンが読み込めません。インターネット接続を確認してください。');
    }

    loadingSubtext.textContent = '画像を処理中...';
    if (progressBar) progressBar.style.width = '10%';

    const canvas = resizeImageForOCR(img, 2000);

    loadingText.textContent = 'スコアを読み取り中...';
    loadingSubtext.textContent = 'OCRエンジンを起動中...';
    if (progressBar) progressBar.style.width = '15%';

    // --- Tesseract OCR 実行（PSM 11: Sparse text） ---
    let worker;
    try {
      worker = await Tesseract.createWorker('eng', 1, {
        logger: m => {
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

    // PSM 11 = Sparse text. テーブル内のバラバラな数字に最適
    await worker.setParameters({
      tessedit_pageseg_mode: '11',
    });

    loadingSubtext.textContent = 'スコアカードを認識中...';
    const result = await worker.recognize(canvas);
    await worker.terminate();

    if (progressBar) progressBar.style.width = '95%';
    loadingText.textContent = 'スコアを解析中...';
    loadingSubtext.textContent = 'スコアカードを照合しています';

    // --- OCR結果からスコアを抽出 ---
    const ocrScores = parseOcrToScores(result.data);

    // --- 手入力画面に遷移してスコアを埋める ---
    navigateTo('page-manual');

    renderPlayerInputs();
    renderScoreTable('score-table-out', PAR_OUT, 1);
    renderScoreTable('score-table-in', PAR_IN, 10);

    if (ocrScores) {
      fillOcrScores('score-table-out', ocrScores.out);
      fillOcrScores('score-table-in', ocrScores.in);
      calculateTableTotals('score-table-out');
      calculateTableTotals('score-table-in');
      colorizeAllScoreInputs();
    }
    makeScoreInputsReadonly();

    if (progressBar) progressBar.style.width = '100%';

    const filledCount = ocrScores ? ocrScores.filledCount : 0;
    const totalCells = playerCount * 18;
    const ocrText = result.data.text || '';

    // デバッグ表示
    const debugSection = document.getElementById('ocr-debug-section');
    const debugText = document.getElementById('ocr-debug-text');
    if (debugSection && debugText) {
      debugSection.style.display = 'block';
      debugText.style.display = 'block'; // 自動で開く
      const wordCount = result.data.words ? result.data.words.length : 0;
      let debugInfo = '=== OCR結果 (' + wordCount + '語検出) ===\n';
      debugInfo += '--- 生テキスト ---\n' + ocrText + '\n';

      // words位置情報から行ごとの数字一覧を表示
      if (result.data.words && result.data.words.length > 0) {
        const dNums = [];
        for (const w of result.data.words) {
          const t = w.text.replace(/[^0-9]/g, '');
          if (!t) continue;
          const v = parseInt(t);
          if (v >= 1 && v <= 999) {
            dNums.push({ val: v, x: (w.bbox.x0+w.bbox.x1)/2, y: (w.bbox.y0+w.bbox.y1)/2 });
          }
        }
        const dMaxY = dNums.length > 0 ? Math.max(...dNums.map(n => n.y)) : 1;
        const dRows = clusterByY(dNums, dMaxY * 0.025);
        dRows.forEach(r => r.sort((a, b) => a.x - b.x));
        dRows.sort((a, b) => {
          const ay = a.reduce((s, n) => s + n.y, 0) / a.length;
          const by = b.reduce((s, n) => s + n.y, 0) / b.length;
          return ay - by;
        });
        debugInfo += '--- 行ごとの数字一覧 (' + dRows.length + '行) ---\n';
        dRows.forEach((r, i) => {
          const vals = r.map(n => n.val);
          const small = vals.filter(v => v < 100);
          debugInfo += '行' + i + ': [' + vals.join(', ') + '] 小数字=[' + small.join(', ') + ']\n';
        });
      }

      debugInfo += '--- パース結果 (' + filledCount + '/' + totalCells + ') ---\n';
      if (ocrScores) {
        for (let h = 1; h <= 18; h++) {
          const half = h <= 9 ? 'out' : 'in';
          const hIdx = h <= 9 ? h - 1 : h - 10;
          const scores = ocrScores[half].map(p => p[hIdx]);
          debugInfo += 'H' + h + ': ' + scores.map(s => s != null ? s : '-').join(', ') + '\n';
        }
      }
      debugText.textContent = debugInfo;
    }

    if (filledCount === 0) {
      showToast('読取0件。デバッグ情報を確認してください。', 8000);
    } else {
      showToast(filledCount + '/' + totalCells + ' セルを読み取りました。間違いを修正してください');
    }

  } catch (e) {
    console.error('OCR Error:', e);
    const errMsg = e.message || '不明なエラー';
    showToast('読み取り失敗: ' + errMsg, 6000);

    navigateTo('page-manual');
    renderPlayerInputs();
    renderScoreTable('score-table-out', PAR_OUT, 1);
    renderScoreTable('score-table-in', PAR_IN, 10);
    makeScoreInputsReadonly();

  } finally {
    modal.style.display = 'none';
    if (progressBar) progressBar.style.width = '0%';
    loadingText.textContent = 'スコアカードを読み取り中...';
    loadingSubtext.textContent = 'しばらくお待ちください';
  }
}

// =================================================================
// --- OCR結果パーサー ---
// 程ヶ谷スコアカード列構造:
//   ホール番号, 距離x4(>=100), PAR(3/4/5), S1, S2, HDCP, S3, S4, (空欄)
// 方針: PAR/HDCP値のマッチングはせず、距離(>=100)を除外した後の
//       インデックス位置でスコアを抽出する（値の衝突を回避）
// =================================================================

function parseOcrToScores(data) {
  if (!data) return null;

  // 方法1: words位置ベース（座標情報で行検出・精度高い）
  const r1 = parseByWordPositions(data);

  // 方法2: テキスト行ベース（フォールバック）
  const r2 = parseByTextLines(data.text);

  // より多くセルを埋められた方を採用
  if (r1 && r2) return r1.filledCount >= r2.filledCount ? r1 : r2;
  return r1 || r2 || null;
}

// --- 方法1: words座標ベース ---
function parseByWordPositions(data) {
  if (!data.words || data.words.length === 0) return null;

  const nums = [];
  for (let i = 0; i < data.words.length; i++) {
    const w = data.words[i];
    const text = w.text.replace(/[^0-9]/g, '');
    if (!text) continue;
    const val = parseInt(text);
    if (val >= 1 && val <= 999) {
      nums.push({
        val: val,
        x: (w.bbox.x0 + w.bbox.x1) / 2,
        y: (w.bbox.y0 + w.bbox.y1) / 2,
      });
    }
  }

  if (nums.length < 10) return null;

  const maxY = Math.max(...nums.map(n => n.y));
  const rows = clusterByY(nums, maxY * 0.025);
  rows.forEach(r => r.sort((a, b) => a.x - b.x));

  const holeScores = {};

  for (const row of rows) {
    if (row.length < 3) continue;

    // ホール番号: 行の左端で1-18の値
    let holeIdx = -1;
    for (let i = 0; i < Math.min(3, row.length); i++) {
      if (row[i].val >= 1 && row[i].val <= 18) {
        holeIdx = i;
        break;
      }
    }
    if (holeIdx < 0) continue;
    const holeNum = row[holeIdx].val;
    if (holeScores[holeNum]) continue; // 既に検出済み

    // ホール番号以降を取得し、距離(>=100)を除外
    const afterHole = row.slice(holeIdx + 1);
    const smallNums = afterHole.filter(n => n.val < 100).map(n => n.val);

    // smallNumsの期待される順序:
    //   [PAR, スコア1, スコア2, HDCP, スコア3, スコア4]
    //   idx:  0     1       2      3      4       5
    const scores = extractScoresByIndex(smallNums);
    if (scores.length >= 1) {
      holeScores[holeNum] = scores;
    }
  }

  return buildScoreResult(holeScores);
}

// --- 方法2: テキスト行ベース ---
function parseByTextLines(text) {
  if (!text || text.trim().length === 0) return null;

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const holeScores = {};

  for (const line of lines) {
    const tokens = [];
    const regex = /\d+/g;
    let m;
    while ((m = regex.exec(line)) !== null) {
      tokens.push(parseInt(m[0]));
    }
    if (tokens.length < 3) continue;

    // 先頭がホール番号(1-18)か?
    const holeNum = tokens[0];
    if (holeNum < 1 || holeNum > 18) continue;
    if (holeScores[holeNum]) continue;

    // 距離(>=100)を除外
    const smallNums = tokens.slice(1).filter(t => t < 100);

    const scores = extractScoresByIndex(smallNums);
    if (scores.length >= 1) {
      holeScores[holeNum] = scores;
    }
  }

  return buildScoreResult(holeScores);
}

// --- インデックスベースのスコア抽出 ---
// smallNums = 距離を除いた数値列（ホール番号は含まない）
// 期待される順序: [PAR, S1, S2, HDCP, S3, S4]
// 4人: idx 1,2,4,5 / 3人: idx 1,2,4 / 2人: idx 1,2
function extractScoresByIndex(smallNums) {
  let scores = [];

  if (playerCount === 4) {
    if (smallNums.length >= 6) {
      // 理想的: PAR(0), S1(1), S2(2), HDCP(3), S3(4), S4(5)
      scores = [smallNums[1], smallNums[2], smallNums[4], smallNums[5]];
    } else if (smallNums.length === 5) {
      // 1つ欠損: HDCPが無い可能性 → PAR(0), S1(1), S2(2), S3(3), S4(4)
      scores = [smallNums[1], smallNums[2], smallNums[3], smallNums[4]];
    } else if (smallNums.length >= 3) {
      // 不十分だが取れるだけ取る（PAR=0, 以降をスコアとして）
      scores = smallNums.slice(1).filter(s => s >= 1 && s <= 15).slice(0, playerCount);
    }
  } else if (playerCount === 3) {
    if (smallNums.length >= 5) {
      scores = [smallNums[1], smallNums[2], smallNums[4]];
    } else if (smallNums.length >= 4) {
      scores = [smallNums[1], smallNums[2], smallNums[3]];
    } else if (smallNums.length >= 2) {
      scores = smallNums.slice(1).filter(s => s >= 1 && s <= 15).slice(0, playerCount);
    }
  } else if (playerCount === 2) {
    if (smallNums.length >= 3) {
      scores = [smallNums[1], smallNums[2]];
    } else if (smallNums.length >= 2) {
      scores = [smallNums[1]];
    }
  }

  // スコア範囲チェック (1-15)
  return scores.filter(s => s >= 1 && s <= 15);
}

// --- スコア結果を構築 ---
function buildScoreResult(holeScores) {
  const outScores = [];
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
    colorizeScoreInput(e.target);
    saveScores();
  }
});

// =================== スコア入力ナンバーパッド ===================
let numpadTarget = null; // 現在選択中のinput要素
let allScoreInputs = []; // 全スコア入力セルの配列

function getAllScoreInputs() {
  // ホール単位でプレーヤーを巡回する順序に並べ替え
  // H1: P1→P2→P3→P4, H2: P1→P2→P3→P4, ... H9, then H10: P1→P2...
  const result = [];
  ['score-table-out', 'score-table-in'].forEach(tableId => {
    const table = document.getElementById(tableId);
    if (!table) return;
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    if (rows.length === 0) return;
    const numHoles = 9;
    for (let h = 0; h < numHoles; h++) {
      for (let p = 0; p < rows.length; p++) {
        const inputs = rows[p].querySelectorAll('.score-input');
        if (inputs[h]) result.push(inputs[h]);
      }
    }
  });
  return result;
}

function getScoreInputInfo(input) {
  const table = input.closest('table');
  const isOut = table?.id === 'score-table-out';
  const row = input.closest('tr');
  const rows = Array.from(table.querySelectorAll('tbody tr'));
  const playerIdx = rows.indexOf(row);
  const cells = Array.from(row.querySelectorAll('.score-input'));
  const holeIdx = cells.indexOf(input);
  const holeNum = isOut ? holeIdx + 1 : holeIdx + 10;
  const pars = isOut ? PAR_OUT : PAR_IN;
  const par = pars[holeIdx] || 4;
  const names = getPlayerNames();
  const playerName = names[playerIdx] || ('P' + (playerIdx + 1));
  return { holeNum, par, playerName, playerIdx, holeIdx, isOut };
}

function colorizeScoreInput(input) {
  input.classList.remove('has-value', 'is-birdie-score', 'is-bogey-score', 'is-double-score');
  const val = parseInt(input.value);
  if (isNaN(val)) return;
  input.classList.add('has-value');
  const info = getScoreInputInfo(input);
  const diff = val - info.par;
  if (diff <= -1) input.classList.add('is-birdie-score');
  else if (diff === 1) input.classList.add('is-bogey-score');
  else if (diff >= 2) input.classList.add('is-double-score');
}

function colorizeAllScoreInputs() {
  document.querySelectorAll('.score-input').forEach(inp => colorizeScoreInput(inp));
}

function openNumpad(input) {
  allScoreInputs = getAllScoreInputs();
  numpadTarget = input;

  // 全セルのハイライトを消す
  allScoreInputs.forEach(inp => inp.classList.remove('numpad-active'));
  input.classList.add('numpad-active');

  const info = getScoreInputInfo(input);

  // ヘッダー更新
  document.getElementById('numpad-info').textContent = `H${info.holeNum} - ${info.playerName}`;
  document.getElementById('numpad-par').textContent = `PAR ${info.par}`;

  // PAR/バーディのボタン色分け
  document.querySelectorAll('.numpad-btn[data-val]').forEach(btn => {
    btn.classList.remove('is-par', 'is-birdie');
    const v = parseInt(btn.dataset.val);
    if (!isNaN(v)) {
      if (v === info.par) btn.classList.add('is-par');
      else if (v < info.par) btn.classList.add('is-birdie');
    }
  });

  // 進捗
  const idx = allScoreInputs.indexOf(input);
  document.getElementById('numpad-progress').textContent = `${idx + 1}/${allScoreInputs.length}`;

  // 10+入力欄を閉じる
  document.getElementById('numpad-10plus-row').style.display = 'none';

  // 表示
  document.getElementById('score-numpad').style.display = 'block';

  // ナンバーパッドの高さ分、ページ下部にパディングを追加してINコースが隠れないようにする
  requestAnimationFrame(() => {
    const numpadSheet = document.querySelector('.numpad-sheet');
    const numpadHeight = numpadSheet ? numpadSheet.offsetHeight : 200;
    const manualContainer = document.querySelector('.manual-container');
    if (manualContainer) {
      manualContainer.style.paddingBottom = (numpadHeight + 40) + 'px';
    }

    // 横スクロール：後半ホール（OUT H7以降、IN H16以降）ではテーブルを横にスクロールして対象ホールを表示
    const wrapper = input.closest('.score-table-wrapper');
    if (wrapper) {
      const cell = input.closest('td');
      if (cell) {
        const cellLeft = cell.offsetLeft;
        const cellWidth = cell.offsetWidth;
        const wrapperWidth = wrapper.clientWidth;
        // セルが見えない位置にある場合、セルが中央付近に来るようスクロール
        const targetScrollLeft = cellLeft - (wrapperWidth / 3);
        wrapper.scrollTo({ left: Math.max(0, targetScrollLeft), behavior: 'smooth' });
      }
    }

    // 縦スクロール：常にアクティブセルを可視領域の適切な位置に配置
    const rect = input.getBoundingClientRect();
    const visibleBottom = window.innerHeight - numpadHeight;
    const visibleTop = 50; // ヘッダー高さ
    const targetPosition = visibleTop + (visibleBottom - visibleTop) * 0.25; // 可視領域の上から25%
    const scrollOffset = rect.top - targetPosition;
    if (Math.abs(scrollOffset) > 10) {
      window.scrollTo({ top: Math.max(0, window.scrollY + scrollOffset), behavior: 'smooth' });
    }
  });
}

function closeNumpad() {
  document.getElementById('score-numpad').style.display = 'none';
  if (numpadTarget) {
    numpadTarget.classList.remove('numpad-active');
  }
  numpadTarget = null;
  // ナンバーパッドを閉じたらパディングを元に戻す
  const manualContainer = document.querySelector('.manual-container');
  if (manualContainer) {
    manualContainer.style.paddingBottom = '';
  }
}

function startScoreEntry() {
  allScoreInputs = getAllScoreInputs();
  // 最初の未入力セルを探す
  const firstEmpty = allScoreInputs.find(inp => !inp.value || inp.value === '');
  if (firstEmpty) {
    openNumpad(firstEmpty);
  } else if (allScoreInputs.length > 0) {
    openNumpad(allScoreInputs[0]);
  } else {
    showToast('スコアテーブルが準備されていません');
  }
}

function setScoreAndAdvance(value) {
  if (!numpadTarget) return;
  numpadTarget.value = value;
  numpadTarget.dispatchEvent(new Event('input', { bubbles: true }));
  colorizeScoreInput(numpadTarget);

  // 合計再計算
  const table = numpadTarget.closest('table');
  if (table) calculateTableTotals(table.id);

  // 次のセルへ
  numpadAdvance();
}

function numpadAdvance() {
  if (!numpadTarget) return;
  const idx = allScoreInputs.indexOf(numpadTarget);
  if (idx < allScoreInputs.length - 1) {
    openNumpad(allScoreInputs[idx + 1]);
  } else {
    closeNumpad();
    showToast('全ホール入力完了！');
  }
}

function numpadPrev() {
  if (!numpadTarget) return;
  const idx = allScoreInputs.indexOf(numpadTarget);
  if (idx > 0) {
    openNumpad(allScoreInputs[idx - 1]);
  }
}

function numpadNext() {
  numpadAdvance();
}

function confirmCustomScore() {
  const customInput = document.getElementById('numpad-custom-input');
  const val = parseInt(customInput.value);
  if (!isNaN(val) && val >= 1) {
    setScoreAndAdvance(val);
    document.getElementById('numpad-10plus-row').style.display = 'none';
    customInput.value = '';
  }
}

// ナンバーパッドのボタンクリック
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.numpad-btn');
  if (!btn) return;
  const val = btn.dataset.val;
  if (!val || !numpadTarget) return;

  if (val === 'clear') {
    numpadTarget.value = '';
    numpadTarget.dispatchEvent(new Event('input', { bubbles: true }));
    colorizeScoreInput(numpadTarget);
    const table = numpadTarget.closest('table');
    if (table) calculateTableTotals(table.id);
  } else if (val === '10+') {
    const row = document.getElementById('numpad-10plus-row');
    row.style.display = row.style.display === 'none' ? 'flex' : 'none';
    if (row.style.display === 'flex') {
      document.getElementById('numpad-custom-input').focus();
    }
  } else if (val === 'next') {
    numpadAdvance();
  } else {
    setScoreAndAdvance(parseInt(val));
  }
});

// 10+入力でEnterキー対応
document.addEventListener('keydown', function(e) {
  if (e.target.id === 'numpad-custom-input' && e.key === 'Enter') {
    confirmCustomScore();
  }
});

// スコアセルをタップしたらナンバーパッドを開く（readonlyにする）
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('score-input')) {
    e.preventDefault();
    e.target.blur(); // キーボードを出さない
    openNumpad(e.target);
  }
});

// score-inputをreadonlyにする（テーブル生成時にも適用）
function makeScoreInputsReadonly() {
  document.querySelectorAll('.score-input').forEach(inp => {
    inp.setAttribute('readonly', 'readonly');
    inp.style.cursor = 'pointer';
  });
}

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
  // 実際のプレーヤーデータを使ってシェアテキストを生成
  const players = collectPlayerData();
  const sorted = [...players].sort((a, b) => a.net - b.net);
  const today = new Date();
  const dateStr = `${today.getFullYear()}/${today.getMonth()+1}/${today.getDate()}`;
  let lines = [`【程ヶ谷CC 握り結果】`, dateStr];
  sorted.forEach((p, i) => {
    lines.push(`${i+1}位 ${p.name} ${p.total} (NET ${p.net})`);
  });
  const shareText = lines.join('\n');

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
function showToast(message, duration) {
  duration = duration || 3000;
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
    max-width: 90vw;
    text-align: center;
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
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
// =================== スコアの永続化 ===================
function saveScores() {
  const data = { out: [], in: [] };
  ['score-table-out', 'score-table-in'].forEach(tableId => {
    const key = tableId === 'score-table-out' ? 'out' : 'in';
    const table = document.getElementById(tableId);
    if (!table) return;
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach((row, pIdx) => {
      const scores = [];
      row.querySelectorAll('.score-input').forEach(inp => {
        scores.push(inp.value || '');
      });
      data[key][pIdx] = scores;
    });
  });
  try {
    localStorage.setItem('hodogaya_scores', JSON.stringify(data));
  } catch(e) { console.warn('Score save failed', e); }
}

function loadScores() {
  try {
    const saved = localStorage.getItem('hodogaya_scores');
    if (saved) return JSON.parse(saved);
  } catch(e) { console.warn('Score load failed', e); }
  return null;
}

function prefillScores() {
  const saved = loadScores();
  if (!saved) return;

  function fillTable(tableId, scores) {
    const table = document.getElementById(tableId);
    if (!table || !scores) return;
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach((row, pIdx) => {
      if (pIdx >= scores.length) return;
      const inputs = row.querySelectorAll('.score-input');
      inputs.forEach((inp, hIdx) => {
        if (hIdx < scores[pIdx].length && scores[pIdx][hIdx] !== '') {
          inp.value = scores[pIdx][hIdx];
        }
      });
    });
  }

  fillTable('score-table-out', saved.out);
  fillTable('score-table-in', saved.in);

  // 合計を計算
  calculateTableTotals('score-table-out');
  calculateTableTotals('score-table-in');

  // スコア色分け
  colorizeAllScoreInputs();
}

// =================== ショット記録機能 ===================
let shotTrackerData = {}; // { 1: [{type,club,distance,direction,quality,puttResult},...], ... }
let currentShotHole = 1;
let currentShotEntryType = 'shot'; // 'shot' or 'putt'

// localStorage からデータ読み込み
function loadShotData() {
  try {
    const saved = localStorage.getItem('hodogaya_shot_data');
    if (saved) shotTrackerData = JSON.parse(saved);
  } catch(e) { console.warn('Shot data load failed', e); }
}

// localStorage にデータ保存
function saveShotData() {
  try {
    localStorage.setItem('hodogaya_shot_data', JSON.stringify(shotTrackerData));
  } catch(e) { console.warn('Shot data save failed', e); }
}

// ホールタブを生成
function renderHoleTabs() {
  const container = document.getElementById('hole-tabs');
  if (!container) return;
  let html = '';
  for (let h = 1; h <= 18; h++) {
    const isActive = h === currentShotHole ? ' active' : '';
    const hasData = (shotTrackerData[h] && shotTrackerData[h].length > 0) ? ' has-data' : '';
    html += '<button class="hole-tab' + isActive + hasData + '" onclick="selectShotHole(' + h + ')">' + h + '</button>';
  }
  container.innerHTML = html;
}

// ホール選択
function selectShotHole(h) {
  currentShotHole = h;
  renderHoleTabs();
  renderCurrentHoleInfo();
  renderShotList();
  checkScoreMismatch();
  // タブをスクロール
  const tabs = document.querySelectorAll('.hole-tab');
  if (tabs[h-1]) tabs[h-1].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

// 現在のホール情報を表示
function renderCurrentHoleInfo() {
  const allPar = [...PAR_OUT, ...PAR_IN];
  const par = allPar[currentShotHole - 1];
  const badge = document.getElementById('hole-number-badge');
  const parBadge = document.getElementById('hole-par-badge');
  if (badge) badge.textContent = 'H' + currentShotHole;
  if (parBadge) parBadge.textContent = 'PAR ' + par;
}

// ショットリストを描画
function renderShotList() {
  const container = document.getElementById('shot-list');
  if (!container) return;
  const shots = shotTrackerData[currentShotHole] || [];
  if (shots.length === 0) {
    container.innerHTML = '<div class="shot-list-empty"><i class="fas fa-plus-circle"></i> ショットを追加してください</div>';
    return;
  }
  let shotNum = 0;
  let puttNum = 0;
  let html = '';
  shots.forEach((s, idx) => {
    const isShot = s.type === 'shot';
    const isPutt = s.type === 'putt';
    const isPenalty = s.type === 'penalty';
    if (isShot) { shotNum++; } else if (isPutt) { puttNum++; }
    let num, numClass;
    if (isShot) { num = shotNum; numClass = ''; }
    else if (isPutt) { num = 'P' + puttNum; numClass = ' putt-number'; }
    else { num = '!'; numClass = ' penalty-number'; }
    let mainText = '';
    let subText = '';
    if (isShot) {
      mainText = (s.club || '') + (s.distance ? ' ' + s.distance + 'yd' : '');
      if (s.remaining) mainText += ' →残' + s.remaining + 'yd';
      if (s.bunker) mainText = '<i class="fas fa-mountain" style="color:#c8a04a;"></i> ' + mainText;
      const parts = [];
      if (s.direction && s.direction !== 'まっすぐ') parts.push(s.direction);
      if (s.direction === 'まっすぐ') parts.push('✓ まっすぐ');
      if (s.quality && s.quality !== '普通') parts.push(s.quality);
      if (s.quality === '普通') parts.push('✓ 普通');
      subText = parts.join(' / ');
    } else if (isPutt) {
      mainText = (s.distance ? s.distance + 'm' : '') + (s.puttResult ? ' → ' + s.puttResult : '');
      if (s.puttResult === '入った') mainText = (s.distance ? s.distance + 'm' : '') + ' → ✓ 入った';
      if (s.greenPosition && puttNum === 1) {
        subText = 'オン: ' + (GREEN_ZONE_LABELS[s.greenPosition] || s.greenPosition);
      }
    } else {
      mainText = s.penaltyType || 'ペナルティ';
      subText = s.penaltyType === 'OB' ? '+1打（打ち直し）' : '+1打';
    }
    html += '<div class="shot-item">';
    html += '  <div class="shot-item-number' + numClass + '">' + num + '</div>';
    html += '  <div class="shot-item-details">';
    html += '    <div class="shot-item-main">' + mainText + '</div>';
    if (subText) html += '    <div class="shot-item-sub">' + subText + '</div>';
    html += '  </div>';
    html += '  <button class="shot-item-delete" onclick="deleteShotEntry(' + idx + ')"><i class="fas fa-times"></i></button>';
    html += '</div>';
  });
  container.innerHTML = html;
}

// ショット入力フォームを開く
function openShotEntry(type) {
  currentShotEntryType = type;
  const overlay = document.getElementById('shot-entry-overlay');
  const title = document.getElementById('shot-entry-title');
  if (!overlay) return;
  overlay.style.display = 'block';
  
  // タイトル
  if (type === 'shot') {
    if (title) title.textContent = 'ショット追加 (H' + currentShotHole + ')';
  } else if (type === 'putt') {
    if (title) title.textContent = 'パット追加 (H' + currentShotHole + ')';
  } else {
    if (title) title.textContent = 'ペナルティ (H' + currentShotHole + ')';
  }
  
  // フィールドの表示切替
  document.querySelectorAll('.shot-only-field').forEach(el => el.style.display = type === 'shot' ? '' : 'none');
  document.querySelectorAll('.putt-only-field').forEach(el => el.style.display = type === 'putt' ? '' : 'none');
  document.querySelectorAll('.penalty-only-field').forEach(el => el.style.display = type === 'penalty' ? '' : 'none');
  
  // 距離フィールド: ペナルティでは非表示
  const distField = document.getElementById('shot-distance-field');
  if (distField) distField.style.display = type === 'penalty' ? 'none' : '';
  
  // 残距離フィールド: ショットのみ表示
  const remainGroup = document.getElementById('dist-remaining-group');
  if (remainGroup) remainGroup.style.display = type === 'shot' ? '' : 'none';
  
  // ホールヤード情報
  const yardInfo = document.getElementById('hole-yardage-info');
  if (yardInfo) {
    if (type === 'shot') {
      const yd = getHoleYardage(currentShotHole);
      yardInfo.textContent = yd > 0 ? `H${currentShotHole}: ${yd}yd (${selectedGreen}グリーン)` : '';
      yardInfo.style.display = yd > 0 ? '' : 'none';
    } else {
      yardInfo.style.display = 'none';
    }
  }
  
  // パットの場合、既にパットがあればオン位置フィールドを非表示
  if (type === 'putt') {
    const shots = shotTrackerData[currentShotHole] || [];
    const existingPutts = shots.filter(s => s.type === 'putt').length;
    const greenField = document.getElementById('putt-green-field');
    if (greenField) greenField.style.display = existingPutts > 0 ? 'none' : '';
  }
  
  // 距離ラベル・単位更新
  const label = document.getElementById('shot-distance-label');
  const unitEl = document.getElementById('shot-distance-unit');
  if (type === 'putt') {
    if (label) label.textContent = '距離 (m)';
    if (unitEl) unitEl.textContent = 'm';
  } else {
    if (label) label.textContent = '距離 (yd)';
    if (unitEl) unitEl.textContent = 'yd';
  }
  
  // フォームリセット
  resetShotForm();
}

// フォームリセット
function resetShotForm() {
  const distInput = document.getElementById('shot-distance-input');
  if (distInput) distInput.value = '';
  const remainInput = document.getElementById('shot-remaining-input');
  if (remainInput) remainInput.value = '';
  document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.club-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.green-zone').forEach(b => b.classList.remove('active'));
  const greenLabel = document.getElementById('green-selected-label');
  if (greenLabel) greenLabel.textContent = '';
  const bunkerBtn = document.getElementById('bunker-toggle');
  if (bunkerBtn) bunkerBtn.classList.remove('active');
}

// 距離 ↔ 残距離 自動逆算
(function() {
  let distCalcLock = false;
  
  document.addEventListener('input', function(e) {
    if (distCalcLock) return;
    if (currentShotEntryType !== 'shot') return;
    
    const distInput = document.getElementById('shot-distance-input');
    const remainInput = document.getElementById('shot-remaining-input');
    if (!distInput || !remainInput) return;
    
    const holeYd = getHoleYardage(currentShotHole);
    if (holeYd <= 0) return;
    
    // 既に打ったショットの飛距離合計を計算（累積消費ヤード）
    const shots = shotTrackerData[currentShotHole] || [];
    let usedYards = 0;
    shots.forEach(s => {
      if (s.type === 'shot' && s.distance) usedYards += s.distance;
    });
    const effectiveTotal = holeYd - usedYards;
    
    distCalcLock = true;
    if (e.target === distInput) {
      const dist = parseInt(distInput.value);
      if (!isNaN(dist) && dist >= 0) {
        const remain = Math.max(0, effectiveTotal - dist);
        remainInput.value = remain;
      } else {
        remainInput.value = '';
      }
    } else if (e.target === remainInput) {
      const remain = parseInt(remainInput.value);
      if (!isNaN(remain) && remain >= 0) {
        const dist = Math.max(0, effectiveTotal - remain);
        distInput.value = dist;
      } else {
        distInput.value = '';
      }
    }
    distCalcLock = false;
  });
})();

// Pill ボタン選択
function selectPill(btn) {
  const container = btn.closest('.pill-selector');
  container.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// クラブ選択
function selectClub(btn) {
  document.querySelectorAll('.club-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// グリーンゾーン選択
const GREEN_ZONE_LABELS = {
  '奥左': '奥・左', '奥中': '奥・センター', '奥右': '奥・右',
  '中左': '真ん中・左', '中中': 'ピン周り', '中右': '真ん中・右',
  '前左': '手前・左', '前中': '手前・センター', '前右': '手前・右'
};

function selectGreenZone(btn) {
  document.querySelectorAll('.green-zone').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const label = document.getElementById('green-selected-label');
  if (label) label.textContent = GREEN_ZONE_LABELS[btn.dataset.zone] || btn.dataset.zone;
}

// バンカートグル
function toggleBunker() {
  const btn = document.getElementById('bunker-toggle');
  if (btn) btn.classList.toggle('active');
}

// 入力フォームを閉じる
function closeShotEntry() {
  const overlay = document.getElementById('shot-entry-overlay');
  if (overlay) overlay.style.display = 'none';
}

// ショットを保存
function saveShotEntry() {
  const distInput = document.getElementById('shot-distance-input');
  const distance = distInput ? parseInt(distInput.value) || 0 : 0;
  const remainInput = document.getElementById('shot-remaining-input');
  const remaining = remainInput ? parseInt(remainInput.value) || 0 : 0;
  
  const entry = {
    type: currentShotEntryType,
    distance: distance || null
  };
  
  if (currentShotEntryType === 'shot') {
    entry.remaining = remaining || null;
    // クラブ
    const activeClub = document.querySelector('.club-btn.active');
    entry.club = activeClub ? activeClub.dataset.val : null;
    // バンカー
    const bunkerBtn = document.getElementById('bunker-toggle');
    entry.bunker = bunkerBtn ? bunkerBtn.classList.contains('active') : false;
    // 方向
    const activeDir = document.querySelector('#shot-direction-pills .pill-btn.active');
    entry.direction = activeDir ? activeDir.dataset.val : null;
    // 打球品質
    const activeQual = document.querySelector('#shot-quality-pills .pill-btn.active');
    entry.quality = activeQual ? activeQual.dataset.val : null;
  } else if (currentShotEntryType === 'putt') {
    // グリーン位置
    const activeZone = document.querySelector('.green-zone.active');
    entry.greenPosition = activeZone ? activeZone.dataset.zone : null;
    // パット結果
    const activePutt = document.querySelector('#putt-result-pills .pill-btn.active');
    entry.puttResult = activePutt ? activePutt.dataset.val : null;
  } else {
    // ペナルティ
    const activePenalty = document.querySelector('#penalty-type-pills .pill-btn.active');
    entry.penaltyType = activePenalty ? activePenalty.dataset.val : null;
    entry.type = 'penalty';
  }
  
  // データに追加
  if (!shotTrackerData[currentShotHole]) shotTrackerData[currentShotHole] = [];
  shotTrackerData[currentShotHole].push(entry);
  saveShotData();
  
  // UI更新
  closeShotEntry();
  renderShotList();
  renderHoleTabs();
  checkScoreMismatch();
}

// ショットを削除
function deleteShotEntry(idx) {
  const shots = shotTrackerData[currentShotHole];
  if (!shots || idx < 0 || idx >= shots.length) return;
  shots.splice(idx, 1);
  if (shots.length === 0) delete shotTrackerData[currentShotHole];
  saveShotData();
  renderShotList();
  renderHoleTabs();
  checkScoreMismatch();
}

// データをシェア（テキスト形式）
function exportShotData() {
  const allPar = [...PAR_OUT, ...PAR_IN];
  let text = '⛳ ショット記録\n';
  text += '程ヶ谷カントリー倶楽部\n';
  text += new Date().toLocaleDateString('ja-JP') + '\n\n';
  
  for (let h = 1; h <= 18; h++) {
    const shots = shotTrackerData[h];
    if (!shots || shots.length === 0) continue;
    const par = allPar[h - 1];
    text += '【H' + h + ' PAR' + par + '】\n';
    let shotNum = 0;
    let puttNum = 0;
    shots.forEach(s => {
      if (s.type === 'shot') {
        shotNum++;
        let line = '  ' + shotNum + '. ';
        if (s.bunker) line += '[バンカー] ';
        if (s.club) line += s.club + ' ';
        if (s.distance) line += s.distance + 'yd ';
        if (s.remaining) line += '→残' + s.remaining + 'yd ';
        if (s.direction) line += s.direction + ' ';
        if (s.quality && s.quality !== '普通') line += s.quality;
        text += line.trim() + '\n';
      } else if (s.type === 'putt') {
        puttNum++;
        let line = '  P' + puttNum + '. ';
        if (s.greenPosition && puttNum === 1) line += '[' + (GREEN_ZONE_LABELS[s.greenPosition] || s.greenPosition) + '] ';
        if (s.distance) line += s.distance + 'm ';
        if (s.puttResult) line += '→ ' + s.puttResult;
        text += line.trim() + '\n';
      } else if (s.type === 'penalty') {
        text += '  ⚠ ' + (s.penaltyType || 'ペナルティ') + ' (+1打)\n';
      }
    });
    text += '\n';
  }
  
  if (navigator.share) {
    navigator.share({ text: text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => {
      alert('クリップボードにコピーしました');
    }).catch(() => {
      alert(text);
    });
  }
}

// データリセット
function clearShotData() {
  if (!confirm('ショット記録をすべて削除しますか？')) return;
  shotTrackerData = {};
  saveShotData();
  renderHoleTabs();
  renderShotList();
}

// ショットトラッカー初期化
function initShotTracker() {
  loadShotData();
  renderHoleTabs();
  renderCurrentHoleInfo();
  renderShotList();
  checkScoreMismatch();
}

// =================== 打数チェック ===================
function getMyScoreForHole(holeNum) {
  // player index 0 = 自分のスコアを取得
  const isOut = holeNum <= 9;
  const tableId = isOut ? 'score-table-out' : 'score-table-in';
  const holeIdx = isOut ? holeNum - 1 : holeNum - 10;
  const table = document.getElementById(tableId);
  if (!table) return null;
  const firstRow = table.querySelector('tbody tr'); // 最初のプレーヤー = 自分
  if (!firstRow) return null;
  const inputs = firstRow.querySelectorAll('.score-input');
  if (!inputs[holeIdx]) return null;
  const val = parseInt(inputs[holeIdx].value);
  return isNaN(val) ? null : val;
}

function countShotTrackerStrokes(holeNum) {
  const shots = shotTrackerData[holeNum] || [];
  if (shots.length === 0) return null;
  let total = 0;
  shots.forEach(s => {
    if (s.type === 'shot') total += 1;
    else if (s.type === 'putt') total += 1;
    else if (s.type === 'penalty') total += 1; // ペナルティ = +1打
  });
  return total;
}

function checkScoreMismatch() {
  const alertEl = document.getElementById('score-mismatch-alert');
  const textEl = document.getElementById('score-mismatch-text');
  if (!alertEl || !textEl) return;
  
  const trackerCount = countShotTrackerStrokes(currentShotHole);
  const scoreCount = getMyScoreForHole(currentShotHole);
  
  if (trackerCount === null || scoreCount === null) {
    alertEl.style.display = 'none';
    return;
  }
  
  if (trackerCount !== scoreCount) {
    alertEl.style.display = 'flex';
    textEl.textContent = 'H' + currentShotHole + ': スコア入力=' + scoreCount + '打 / ショット記録=' + trackerCount + '打（差: ' + (trackerCount - scoreCount) + '）';
  } else {
    alertEl.style.display = 'none';
  }
}

// =================== ショット集計機能 ===================
const CLUB_CATEGORIES = [
  { key: 'driver', name: 'ドライバー', clubs: ['1W'], type: 'shot' },
  { key: 'fw', name: 'フェアウェイウッド', clubs: ['3W', '5W'], type: 'shot' },
  { key: 'ut', name: 'ユーティリティ', clubs: ['4U', '5U'], type: 'shot' },
  { key: 'iron', name: 'アイアン', clubs: ['5I', '6I', '7I', '8I', '9I', 'PW'], type: 'shot' },
  { key: 'wedge', name: 'ウェッジ', clubs: ['52\u00b0', '58\u00b0'], type: 'shot' },
  { key: 'putt', name: 'パット', clubs: [], type: 'putt' }
];

function getAllShotEntries() {
  const all = [];
  for (let h = 1; h <= 18; h++) {
    const shots = shotTrackerData[h] || [];
    shots.forEach(s => all.push({ ...s, hole: h }));
  }
  return all;
}

function categorizeEntry(entry) {
  if (entry.type === 'putt') return 'putt';
  for (const cat of CLUB_CATEGORIES) {
    if (cat.type === 'shot' && entry.club && cat.clubs.includes(entry.club)) return cat.key;
  }
  return null; // クラブ未選択
}

function buildStatsHtml(entries, category) {
  if (entries.length === 0) return '<div class="stats-no-data">データなし</div>';
  
  let html = '';
  
  if (category.type === 'shot') {
    // 平均距離
    const withDist = entries.filter(e => e.distance);
    if (withDist.length > 0) {
      const avg = Math.round(withDist.reduce((s, e) => s + e.distance, 0) / withDist.length);
      html += '<div class="stats-section"><div class="stats-avg-dist">平均距離: ' + avg + 'yd</div></div>';
    }
    
    // 方向集計
    const dirLabels = ['大きく左', 'やや左', 'まっすぐ', 'やや右', '大きく右'];
    const dirColors = ['bar-maroon', 'bar-gold', 'bar-green', 'bar-gold', 'bar-maroon'];
    const dirShort = ['大左', 'やや左', 'まっすぐ', 'やや右', '大右'];
    const dirCounts = dirLabels.map(l => entries.filter(e => e.direction === l).length);
    const maxDir = Math.max(...dirCounts, 1);
    
    html += '<div class="stats-section"><div class="stats-section-title">方向</div>';
    dirLabels.forEach((l, i) => {
      const pct = Math.round((dirCounts[i] / entries.length) * 100);
      const w = Math.round((dirCounts[i] / maxDir) * 100);
      html += '<div class="stats-bar-row">';
      html += '<div class="stats-bar-label">' + dirShort[i] + '</div>';
      html += '<div class="stats-bar-track"><div class="stats-bar-fill ' + dirColors[i] + '" style="width:' + w + '%"></div></div>';
      html += '<div class="stats-bar-value">' + dirCounts[i] + ' (' + pct + '%)</div>';
      html += '</div>';
    });
    html += '</div>';
    
    // ダフリ・トップ集計
    const qualLabels = ['大きくダフリ', 'ややダフリ', '普通', 'ややトップ', '大きくトップ'];
    const qualColors = ['bar-maroon', 'bar-gold', 'bar-green', 'bar-gold', 'bar-maroon'];
    const qualShort = ['大ダフ', 'ややダフ', '普通', 'ややトップ', '大トップ'];
    const qualCounts = qualLabels.map(l => entries.filter(e => e.quality === l).length);
    const maxQual = Math.max(...qualCounts, 1);
    
    html += '<div class="stats-section"><div class="stats-section-title">打球</div>';
    qualLabels.forEach((l, i) => {
      const pct = Math.round((qualCounts[i] / entries.length) * 100);
      const w = Math.round((qualCounts[i] / maxQual) * 100);
      html += '<div class="stats-bar-row">';
      html += '<div class="stats-bar-label">' + qualShort[i] + '</div>';
      html += '<div class="stats-bar-track"><div class="stats-bar-fill ' + qualColors[i] + '" style="width:' + w + '%"></div></div>';
      html += '<div class="stats-bar-value">' + qualCounts[i] + ' (' + pct + '%)</div>';
      html += '</div>';
    });
    html += '</div>';
    
  } else {
    // パット集計
    const puttLabels = ['入った', '左外し', '右外し', 'ショート', 'オーバー'];
    const puttColors = ['bar-green', 'bar-blue', 'bar-blue', 'bar-gold', 'bar-maroon'];
    const puttCounts = puttLabels.map(l => entries.filter(e => e.puttResult === l).length);
    const maxPutt = Math.max(...puttCounts, 1);
    
    html += '<div class="stats-section"><div class="stats-section-title">結果</div>';
    puttLabels.forEach((l, i) => {
      const pct = Math.round((puttCounts[i] / entries.length) * 100);
      const w = Math.round((puttCounts[i] / maxPutt) * 100);
      html += '<div class="stats-bar-row">';
      html += '<div class="stats-bar-label">' + l + '</div>';
      html += '<div class="stats-bar-track"><div class="stats-bar-fill ' + puttColors[i] + '" style="width:' + w + '%"></div></div>';
      html += '<div class="stats-bar-value">' + puttCounts[i] + ' (' + pct + '%)</div>';
      html += '</div>';
    });
    html += '</div>';
    
    // オン位置集計
    const withGreen = entries.filter(e => e.greenPosition);
    if (withGreen.length > 0) {
      const zoneKeys = ['奥左', '奥中', '奥右', '中左', '中中', '中右', '前左', '前中', '前右'];
      const zoneCounts = zoneKeys.map(k => withGreen.filter(e => e.greenPosition === k).length);
      const maxZone = Math.max(...zoneCounts, 1);
      
      html += '<div class="stats-section"><div class="stats-section-title">オン位置</div>';
      zoneKeys.forEach((k, i) => {
        if (zoneCounts[i] === 0) return;
        const label = GREEN_ZONE_LABELS[k] || k;
        const pct = Math.round((zoneCounts[i] / withGreen.length) * 100);
        const w = Math.round((zoneCounts[i] / maxZone) * 100);
        html += '<div class="stats-bar-row">';
        html += '<div class="stats-bar-label">' + label + '</div>';
        html += '<div class="stats-bar-track"><div class="stats-bar-fill bar-green" style="width:' + w + '%"></div></div>';
        html += '<div class="stats-bar-value">' + zoneCounts[i] + ' (' + pct + '%)</div>';
        html += '</div>';
      });
      html += '</div>';
    }
  }
  
  return html;
}

function showShotStats() {
  const container = document.getElementById('shot-stats-container');
  if (!container) return;
  
  const allEntries = getAllShotEntries();
  if (allEntries.length === 0) {
    container.innerHTML = '<div class="stats-no-data">データがありません</div>';
    container.style.display = 'block';
    return;
  }
  
  let html = '';
  CLUB_CATEGORIES.forEach(cat => {
    const entries = allEntries.filter(e => categorizeEntry(e) === cat.key);
    if (entries.length === 0) return;
    
    html += '<div class="stats-category">';
    html += '<div class="stats-category-header">';
    html += '<span class="stats-category-name">' + cat.name + '</span>';
    html += '<span class="stats-category-count">' + entries.length + '打</span>';
    html += '</div>';
    html += buildStatsHtml(entries, cat);
    html += '</div>';
  });
  
  if (!html) html = '<div class="stats-no-data">データがありません</div>';
  container.innerHTML = html;
  container.style.display = 'block';
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// =================== スティッキーホールバー ===================
function initStickyHoleBar() {
  var bar = document.getElementById('sticky-hole-bar');
  if (!bar) return;

  var lastActiveTableId = null;

  function updateStickyBar() {
    var manualPage = document.getElementById('page-manual');
    if (!manualPage || !manualPage.classList.contains('active')) {
      bar.style.display = 'none';
      lastActiveTableId = null;
      return;
    }

    // ページヘッダーの下端を取得
    var pageHeader = manualPage.querySelector('.page-header');
    var stickyTop = 56 + 45; // header + page-header の概算
    if (pageHeader) {
      var phRect = pageHeader.getBoundingClientRect();
      stickyTop = phRect.bottom;
    }

    var activeWrapper = null;
    var activeTable = null;

    // OUT / IN どちらのテーブルが画面上部にかかっているか
    var pairs = [
      { wId: 'score-table-out-wrapper', tId: 'score-table-out' },
      { wId: 'score-table-in-wrapper', tId: 'score-table-in' }
    ];
    for (var p = 0; p < pairs.length; p++) {
      var w = document.getElementById(pairs[p].wId);
      var t = document.getElementById(pairs[p].tId);
      if (!w || !t) continue;
      var wRect = w.getBoundingClientRect();
      if (wRect.top < stickyTop && wRect.bottom > stickyTop + 30) {
        activeWrapper = w;
        activeTable = t;
      }
    }

    if (!activeTable) {
      bar.style.display = 'none';
      lastActiveTableId = null;
      return;
    }

    // thead が画面外に隠れている場合のみ表示
    var thead = activeTable.querySelector('thead');
    if (!thead) { bar.style.display = 'none'; return; }
    var theadRect = thead.getBoundingClientRect();
    if (theadRect.bottom > stickyTop) {
      bar.style.display = 'none';
      lastActiveTableId = null;
      return;
    }

    // thead をクローンして固定表示
    // テーブルIDが変わった場合 or 初回のみクローンを再作成
    if (lastActiveTableId !== activeTable.id) {
      bar.innerHTML = '';
      var cloneTable = document.createElement('table');
      cloneTable.className = activeTable.className + ' sticky-thead-clone';
      cloneTable.style.cssText = 'width:' + activeTable.offsetWidth + 'px; table-layout:fixed;';
      // colgroup をコピー（あれば）
      var colgroup = activeTable.querySelector('colgroup');
      if (colgroup) cloneTable.appendChild(colgroup.cloneNode(true));
      cloneTable.appendChild(thead.cloneNode(true));
      bar.appendChild(cloneTable);
      lastActiveTableId = activeTable.id;
    }

    // 位置とサイズを同期
    var wrapperRect = activeWrapper.getBoundingClientRect();
    bar.style.top = stickyTop + 'px';
    bar.style.left = wrapperRect.left + 'px';
    bar.style.width = wrapperRect.width + 'px';

    // 横スクロール同期
    var cloneTbl = bar.querySelector('table');
    if (cloneTbl) {
      cloneTbl.style.marginLeft = (-activeWrapper.scrollLeft) + 'px';
    }

    bar.style.display = 'block';
  }

  window.addEventListener('scroll', updateStickyBar, { passive: true });
  ['score-table-out-wrapper', 'score-table-in-wrapper'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('scroll', function() {
      lastActiveTableId = null; // 横スクロール時にクローン位置を更新
      updateStickyBar();
    }, { passive: true });
  });
}

// =================== 音声入力 ===================
let voiceRecognition = null;
let voiceMode = 'simple'; // 'simple' or 'named'
let voiceParsedData = null;

function startVoiceInput() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    showToast('お使いのブラウザは音声入力に対応していません');
    return;
  }
  document.getElementById('voice-input-modal').style.display = 'flex';
  resetVoiceUI();
}

function cancelVoiceInput() {
  if (voiceRecognition) {
    voiceRecognition.abort();
    voiceRecognition = null;
  }
  document.getElementById('voice-input-modal').style.display = 'none';
  resetVoiceUI();
}

function resetVoiceUI() {
  document.getElementById('voice-mic-icon').classList.remove('recording');
  document.getElementById('btn-voice-record').classList.remove('recording');
  document.getElementById('btn-voice-record').innerHTML = '<i class="fas fa-microphone"></i> 録音開始';
  document.getElementById('voice-status-text').textContent = 'マイクボタンを押して開始';
  document.getElementById('voice-transcript').style.display = 'none';
  document.getElementById('voice-parsed').style.display = 'none';
  document.getElementById('btn-voice-apply').style.display = 'none';
  voiceParsedData = null;
}

function setVoiceMode(mode) {
  voiceMode = mode;
  document.querySelectorAll('.voice-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  const instructions = document.getElementById('voice-instructions');
  if (mode === 'simple') {
    instructions.innerHTML = `
      <p><strong>スコアのみモード:</strong></p>
      <p>「ホール番号、スコア、スコア、...」の順に読み上げてください</p>
      <p class="voice-example">例: 「10、5、4、6、5」</p>`;
  } else {
    instructions.innerHTML = `
      <p><strong>名前＋スコアモード:</strong></p>
      <p>「ホール番号、名前 スコア、名前 スコア、...」の順に読み上げてください</p>
      <p class="voice-example">例: 「10、荒濤 5、佐久間 4、上野 6、佐藤 5」</p>`;
  }
  resetVoiceUI();
}

function toggleVoiceRecording() {
  if (voiceRecognition) {
    voiceRecognition.stop();
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  voiceRecognition = new SpeechRecognition();
  voiceRecognition.lang = 'ja-JP';
  voiceRecognition.interimResults = true;
  voiceRecognition.continuous = true;
  voiceRecognition.maxAlternatives = 1;

  let finalTranscript = '';

  document.getElementById('voice-mic-icon').classList.add('recording');
  document.getElementById('btn-voice-record').classList.add('recording');
  document.getElementById('btn-voice-record').innerHTML = '<i class="fas fa-stop"></i> 録音停止';
  document.getElementById('voice-status-text').textContent = '聞いています...';
  document.getElementById('voice-transcript').style.display = 'block';
  document.getElementById('voice-transcript-text').textContent = '';

  voiceRecognition.onresult = function(event) {
    let interim = '';
    finalTranscript = '';
    for (let i = 0; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    document.getElementById('voice-transcript-text').textContent = finalTranscript + interim;
  };

  voiceRecognition.onend = function() {
    voiceRecognition = null;
    document.getElementById('voice-mic-icon').classList.remove('recording');
    document.getElementById('btn-voice-record').classList.remove('recording');
    document.getElementById('btn-voice-record').innerHTML = '<i class="fas fa-microphone"></i> 再録音';
    document.getElementById('voice-status-text').textContent = '録音完了';

    const transcript = document.getElementById('voice-transcript-text').textContent.trim();
    if (transcript) {
      parseVoiceInput(transcript);
    }
  };

  voiceRecognition.onerror = function(event) {
    voiceRecognition = null;
    document.getElementById('voice-mic-icon').classList.remove('recording');
    document.getElementById('btn-voice-record').classList.remove('recording');
    document.getElementById('btn-voice-record').innerHTML = '<i class="fas fa-microphone"></i> 再録音';
    if (event.error === 'not-allowed') {
      document.getElementById('voice-status-text').textContent = 'マイクのアクセスが拒否されました';
    } else {
      document.getElementById('voice-status-text').textContent = 'エラー: ' + event.error;
    }
  };

  voiceRecognition.start();
}

function japaneseToNumber(str) {
  // 漢数字マッピング
  var kanjiMap = { '零':0,'〇':0,'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10 };
  // ひらがな/カタカナ数字マッピング
  var kanaMap = {
    'いち':1,'に':2,'さん':3,'し':4,'よん':4,'ご':5,'ろく':6,
    'しち':7,'なな':7,'はち':8,'きゅう':9,'く':9,'きゅ':9,
    'じゅう':10,'じゅ':10,'とお':10,
    'じゅういち':11,'じゅうに':12,'じゅうさん':13,'じゅうし':14,'じゅうよん':14,
    'じゅうご':15,'じゅうろく':16,'じゅうしち':17,'じゅうなな':17,
    'じゅうはち':18,'じゅうきゅう':19,'じゅうく':19,'にじゅう':20,
    'イチ':1,'ニ':2,'サン':3,'シ':4,'ヨン':4,'ゴ':5,'ロク':6,
    'シチ':7,'ナナ':7,'ハチ':8,'キュウ':9,'ク':9,
    'ジュウ':10,'ジュウイチ':11,'ジュウニ':12,'ジュウサン':13,
    'ジュウヨン':14,'ジュウゴ':15,'ジュウロク':16,'ジュウナナ':17,
    'ジュウハチ':18,'ジュウキュウ':19,'ニジュウ':20
  };
  var s = str.trim();

  // まず半角数字として解析を試みる
  var directNum = parseInt(s);
  if (!isNaN(directNum)) return directNum;

  // かなマッピング（長いキーから先にチェック）
  var kanaKeys = Object.keys(kanaMap).sort(function(a,b){ return b.length - a.length; });
  for (var i = 0; i < kanaKeys.length; i++) {
    if (s === kanaKeys[i]) return kanaMap[kanaKeys[i]];
  }

  // 漢数字の組み合わせ解析（十六 → 16 等）
  if (s.indexOf('十') >= 0) {
    var parts = s.split('十');
    var tens = parts[0] ? (kanjiMap[parts[0]] || 1) : 1;
    var ones = parts[1] ? (kanjiMap[parts[1]] || 0) : 0;
    return tens * 10 + ones;
  }

  // 単一漢数字
  if (kanjiMap[s] !== undefined) return kanjiMap[s];

  // 漢数字が並んでいる場合（一五 → 15 等、あまりないが念のため）
  var result = '';
  for (var i = 0; i < s.length; i++) {
    if (kanjiMap[s[i]] !== undefined) {
      result += kanjiMap[s[i]];
    } else {
      return NaN;
    }
  }
  return result.length > 0 ? parseInt(result) : NaN;
}

function normalizeTranscriptNumbers(text) {
  // 全角数字を半角に
  text = text.replace(/[０-９]/g, function(ch) { return String.fromCharCode(ch.charCodeAt(0) - 0xFFF0); });
  return text;
}

function parseVoiceInput(transcript) {
  var text = normalizeTranscriptNumbers(transcript);
  // 句読点・読点・カンマ・スペースで分割
  var tokens = text.split(/[、,，。.\s　]+/).filter(function(t) { return t.length > 0; });

  var names = getPlayerNames();
  var holeNum = null;
  var scores = [];

  // トークンを数値に変換するヘルパー（日本語対応）
  function tokenToNum(t) {
    var n = japaneseToNumber(t);
    if (!isNaN(n)) return n;
    // 「ホール」「番」を除去してリトライ
    var cleaned = t.replace(/[ホールhH番]/gi, '');
    return japaneseToNumber(cleaned);
  }

  if (voiceMode === 'simple') {
    // シンプルモード: 最初のトークンがホール番号、以降がスコア
    for (var i = 0; i < tokens.length; i++) {
      var num = tokenToNum(tokens[i]);
      if (i === 0) {
        if (!isNaN(num) && num >= 1 && num <= 18) {
          holeNum = num;
        }
      } else {
        if (!isNaN(num) && num >= 1 && num <= 20) {
          scores.push({ playerIdx: scores.length, name: names[scores.length] || ('P' + (scores.length + 1)), score: num });
        }
      }
    }
  } else {
    // 名前＋スコアモード: ホール番号の後に「名前 スコア」のペア
    var i = 0;
    // ホール番号を探す
    while (i < tokens.length) {
      var num = tokenToNum(tokens[i]);
      if (!isNaN(num) && num >= 1 && num <= 18) {
        holeNum = num;
        i++;
        break;
      }
      i++;
    }

    // 残りのトークンから名前・スコアを解析
    while (i < tokens.length) {
      var token = tokens[i];
      var num = tokenToNum(token);

      if (!isNaN(num) && num >= 1 && num <= 20) {
        // 数字のみ→プレーヤー順
        scores.push({ playerIdx: scores.length, name: names[scores.length] || ('P' + (scores.length + 1)), score: num });
      } else {
        // 名前が含まれる可能性 → トークン内に数字が埋め込まれているか
        var nameNumMatch = token.match(/^(.+?)(\d+)$/);
        if (nameNumMatch) {
          var spokenName = nameNumMatch[1];
          var score = parseInt(nameNumMatch[2]);
          var pidx = findPlayerIndex(spokenName, names);
          if (pidx >= 0 && !isNaN(score) && score >= 1 && score <= 20) {
            scores.push({ playerIdx: pidx, name: names[pidx], score: score });
          }
        } else {
          // 次のトークンがスコアかもしれない
          if (i + 1 < tokens.length) {
            var nextNum = tokenToNum(tokens[i + 1]);
            if (!isNaN(nextNum) && nextNum >= 1 && nextNum <= 20) {
              var pidx = findPlayerIndex(token, names);
              if (pidx >= 0) {
                scores.push({ playerIdx: pidx, name: names[pidx], score: nextNum });
                i++;
              }
            }
          }
        }
      }
      i++;
    }
  }

  if (holeNum === null) {
    document.getElementById('voice-status-text').textContent = 'ホール番号を認識できませんでした';
    return;
  }

  if (scores.length === 0) {
    document.getElementById('voice-status-text').textContent = 'スコアを認識できませんでした';
    return;
  }

  voiceParsedData = { holeNum: holeNum, scores: scores };

  // 解析結果を表示
  var parsedDiv = document.getElementById('voice-parsed');
  var parsedContent = document.getElementById('voice-parsed-content');
  var html = '<p style="margin-bottom:8px; font-weight:600;">ホール ' + holeNum + '</p>';
  html += '<table class="voice-parsed-table"><tr><th>プレーヤー</th><th>スコア</th></tr>';
  scores.forEach(function(s) {
    html += '<tr><td>' + s.name + '</td><td class="voice-score-val">' + s.score + '</td></tr>';
  });
  html += '</table>';
  parsedContent.innerHTML = html;
  parsedDiv.style.display = 'block';
  document.getElementById('btn-voice-apply').style.display = 'block';
}

function findPlayerIndex(spokenName, names) {
  // 完全一致
  var exactIdx = names.findIndex(function(n) { return n === spokenName; });
  if (exactIdx >= 0) return exactIdx;

  // 部分一致（名前の一部）
  var partialIdx = names.findIndex(function(n) { return n.includes(spokenName) || spokenName.includes(n); });
  if (partialIdx >= 0) return partialIdx;

  // 小文字比較
  var lowerSpoken = spokenName.toLowerCase();
  var lowerIdx = names.findIndex(function(n) { return n.toLowerCase().includes(lowerSpoken) || lowerSpoken.includes(n.toLowerCase()); });
  return lowerIdx;
}

function applyVoiceInput() {
  if (!voiceParsedData) return;
  var holeNum = voiceParsedData.holeNum;
  var scores = voiceParsedData.scores;

  var isOut = holeNum <= 9;
  var tableId = isOut ? 'score-table-out' : 'score-table-in';
  var holeIdx = isOut ? holeNum - 1 : holeNum - 10;
  var table = document.getElementById(tableId);
  if (!table) { showToast('テーブルが見つかりません'); return; }

  var rows = table.querySelectorAll('tbody tr');

  scores.forEach(function(s) {
    var pidx = s.playerIdx;
    if (pidx < 0 || pidx >= rows.length) return;
    var inputs = rows[pidx].querySelectorAll('.score-input');
    if (inputs[holeIdx]) {
      inputs[holeIdx].value = s.score;
      inputs[holeIdx].dispatchEvent(new Event('input', { bubbles: true }));
      colorizeScoreInput(inputs[holeIdx]);
    }
  });

  calculateTableTotals(tableId);

  showToast('ホール' + holeNum + 'のスコアを入力しました');
  cancelVoiceInput();
}

// =================== 初期化 ===================
document.addEventListener('DOMContentLoaded', function() {
  try {
    console.log('[INIT] DOMContentLoaded fired');
    // ホーム画面をデフォルト表示
    navigateTo('page-home');
    console.log('[INIT] navigateTo done');
    
    // 保存済みのプレーヤー人数があれば復元、なければ4人
    const savedCount = getSavedPlayerCount();
    setPlayerCount(savedCount || 4);
    console.log('[INIT] setPlayerCount done');
    
    // ゲーム種別が表示されているか確認
    const gtContainer = document.getElementById('game-type-options');
    console.log('[INIT] game-type-options element:', gtContainer);
    console.log('[INIT] game-type-options innerHTML length:', gtContainer ? gtContainer.innerHTML.length : 'N/A');
    
    // スタートコースを復元（保存済みがあればそれを使う）
    const savedStartCourse = localStorage.getItem('hodogaya_start_course') || 'IN';
    setStartCourse(savedStartCourse);
    document.querySelectorAll('.start-course-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.course === savedStartCourse);
    });

    // グリーン/ティー初期表示更新
    updateTeeTotalDisplay();

    // スコアカード読み取りデータを自動入力
    prefillScores();

    // score-inputをreadonlyに
    makeScoreInputsReadonly();

    // ショットトラッカー初期化
    initShotTracker();

    // スティッキーホールバー初期化
    initStickyHoleBar();

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
