"use client";

import React, { useMemo, useState } from "react";

type JamType =
  | "OVERTHINK"
  | "PERFECT"
  | "INFO"
  | "PRIORITY"
  | "ENERGY"
  | "TIME"
  | "DISTRACT"
  | "MOTIVATION";

type Trouble = "ACTION" | "DECIDE" | "FOCUS" | "TIRED" | "NO_TIME";

type Option = {
  label: string;
  score: Partial<Record<JamType, number>>;
};

type Question = {
  id: string;
  title: string;
  subtitle?: string;
  a: Option;
  b: Option;
};

const JAM_META: Record<
  JamType,
  {
    name: string;
    catch: string;
    why: string;
    stop: string[];
    doToday: string[];
    doWeek: string[];
    doMonth: string[];
    aiUse: string[];
  }
> = {
  OVERTHINK: {
    name: "考えすぎ停止タイプ",
    catch: "頭の中で「正解探し」が終わらず、着手が遅れる。",
    why: "曖昧さに耐えるより、納得してから進めたい。だから準備で止まりやすい。",
    stop: ["“完璧な計画”を作ってから始める", "比較して最適解を探し続ける"],
    doToday: ["5分だけ着手（開始条件は“雑でOK”）", "タスクを「次の1手」だけに分解"],
    doWeek: ["“60点で提出”ルールを決める", "迷ったら「仮決め→検証」フローにする"],
    doMonth: ["やる前に決める基準（判断軸）を3つ固定", "週1で振り返り→判断軸を更新"],
    aiUse: ["AIに「選択肢A/Bのメリデメ比較→仮決め案」を出させる", "AIに「次の1手だけ」タスクリスト化させる"],
  },
  PERFECT: {
    name: "完璧主義詰まりタイプ",
    catch: "完成形を求めすぎて、途中が苦しくなる。",
    why: "品質へのこだわりが強いほど、開始が重くなる。",
    stop: ["最初から“完成形”で作ろうとする", "一発で当てに行く"],
    doToday: ["“捨て案”を1つ作る（捨てる前提）", "公開/提出の最小形を決める"],
    doWeek: ["2回に分けて作る（粗→整）", "毎回「ここまででOK」ラインを明文化"],
    doMonth: ["テンプレ化（型）で品質を安定させる", "レビュー観点を固定して手戻りを減らす"],
    aiUse: ["AIに「粗案→改善案」の2段階で出させる", "AIにチェックリスト（完成条件）を作らせる"],
  },
  INFO: {
    name: "情報収集沼タイプ",
    catch: "調べるほど不安が増えて、逆に動けない。",
    why: "失敗回避のための情報収集が、行動を後回しにする。",
    stop: ["調べる時間に上限を置かない", "複数記事を渡り歩く"],
    doToday: ["調べ物は15分タイマーで打ち切る", "“今すぐ試す1手”を決める"],
    doWeek: ["情報源を3つに固定", "検証ログ（やってみた結果）を残す"],
    doMonth: ["「読む→試す→まとめる」を週1ループにする", "自分用のナレッジに再編集"],
    aiUse: ["AIに「要点3つ＋次の実験1つ」で要約させる", "AIに“比較表”を作らせて迷いを減らす"],
  },
  PRIORITY: {
    name: "優先順位迷子タイプ",
    catch: "やることが多くて、どれから手を付けるかで止まる。",
    why: "タスクが並列で、重要度と緊急度が混ざっている。",
    stop: ["全部やろうとする", "今日やることが曖昧なまま着手する"],
    doToday: ["今日の“勝ちタスク”を1つだけ決める", "他は“保留リスト”へ逃がす"],
    doWeek: ["週のTOP3を先に決める", "タスクを“成果”単位にまとめる"],
    doMonth: ["四半期ゴール→月→週へ落とす", "やらないことリストを育てる"],
    aiUse: ["AIに「重要度/緊急度で仕分け→今日の1つ提案」をさせる", "AIに“次の3ステップ”まで分解させる"],
  },
  ENERGY: {
    name: "回復不足タイプ",
    catch: "気合じゃなく、体力が足りてない。",
    why: "睡眠・食事・休息が崩れると、判断力も集中も落ちる。",
    stop: ["疲れてるのに予定を詰める", "夜に重いタスクを入れる"],
    doToday: ["一番軽いタスクを5分だけ", "回復タスク（風呂/散歩/水分）を先に入れる"],
    doWeek: ["集中タスクは午前/回復後に固定", "睡眠の最低ラインを決める"],
    doMonth: ["疲労が抜けるルーティンをテンプレ化", "“回復→集中”の波を設計"],
    aiUse: ["AIに「体力前提の一日設計（軽→重）」を作らせる", "AIに“省エネ手順”を作らせる"],
  },
  TIME: {
    name: "時間分断タイプ",
    catch: "まとまった時間が取れず、進捗が積み上がらない。",
    why: "家庭/仕事/副業で中断が多い。設計が必要。",
    stop: ["“まとまった時間が取れたらやる”と思う", "中断前提の設計をしない"],
    doToday: ["15分で終わる最小タスクを作る", "中断しても再開できる形にする"],
    doWeek: ["“固定の小枠”を週3回だけ確保", "タスクをモジュール化（短時間で進む形）"],
    doMonth: ["作業の定位置・定時間・定手順を決める", "家族/予定とセットで運用ルール化"],
    aiUse: ["AIに「15分タスク化」させる", "AIに“中断→再開”の再開手順を作らせる"],
  },
  DISTRACT: {
    name: "注意散漫タイプ",
    catch: "通知・SNS・雑音で集中が途切れる。",
    why: "刺激が多い環境だと、脳が切り替えコストを払う。",
    stop: ["通知ONのまま作業する", "最初から長時間集中を狙う"],
    doToday: ["通知OFFで10分だけ集中", "作業前に“やること1行”を書く"],
    doWeek: ["集中タイムを短く固定（10→15→20）", "スマホの置き場所を変える"],
    doMonth: ["集中環境をテンプレ化（場所/音/時間）", "集中の入口ルーティンを固定"],
    aiUse: ["AIに「作業開始の手順（チェックリスト）」を作らせる", "AIに“詰まった瞬間の復帰手順”を作らせる"],
  },
  MOTIVATION: {
    name: "意味迷子タイプ",
    catch: "やる気の波が大きく、続かない。",
    why: "目的や手応えが見えないと、脳が優先度を下げる。",
    stop: ["ゴールが曖昧なまま頑張る", "成果が出る前にやめる"],
    doToday: ["“なぜやるか”を1行で書く", "5分で成果が見えるタスクを選ぶ"],
    doWeek: ["成果を可視化（チェック/ログ/カレンダー）", "小さく褒める仕組みを作る"],
    doMonth: ["目標を“生活に効く形”で再定義", "週1で目的を更新・微修正"],
    aiUse: ["AIに「目的の言語化（1行）」を手伝わせる", "AIに“今週の小さな成果”の設計をさせる"],
  },
};

const TROUBLE_BONUS: Record<Trouble, Partial<Record<JamType, number>>> = {
  ACTION: { MOTIVATION: 2, OVERTHINK: 1, PERFECT: 1, TIME: 1 },
  DECIDE: { OVERTHINK: 2, PRIORITY: 2, INFO: 1 },
  FOCUS: { DISTRACT: 2, ENERGY: 1, TIME: 1 },
  TIRED: { ENERGY: 3, TIME: 1, MOTIVATION: 1 },
  NO_TIME: { TIME: 3, PRIORITY: 1, DISTRACT: 1 },
};

const CORE_QUESTIONS: Question[] = [
  {
    id: "q1",
    title: "始める前に、どっちが近い？",
    subtitle: "着手のクセ",
    a: { label: "全体像が見えるまで動けない", score: { OVERTHINK: 2, INFO: 1 } },
    b: { label: "とりあえず触ってみる", score: {} },
  },
  {
    id: "q2",
    title: "止まる瞬間は？",
    subtitle: "詰まりの形",
    a: { label: "もっと良い方法がある気がして迷う", score: { OVERTHINK: 2, INFO: 1, PRIORITY: 1 } },
    b: { label: "完璧にできないなら出したくない", score: { PERFECT: 3 } },
  },
  {
    id: "q3",
    title: "タスクが増えると？",
    subtitle: "整理のクセ",
    a: { label: "優先順位が決まらず散らばる", score: { PRIORITY: 3, OVERTHINK: 1 } },
    b: { label: "まず全部を把握しようとして疲れる", score: { INFO: 2, ENERGY: 1 } },
  },
  {
    id: "q4",
    title: "集中が切れる要因は？",
    subtitle: "集中環境",
    a: { label: "通知や別用事で頻繁に途切れる", score: { DISTRACT: 3, TIME: 1 } },
    b: { label: "疲れで頭が回らなくなる", score: { ENERGY: 3 } },
  },
  {
    id: "q5",
    title: "時間の取り方は？",
    subtitle: "時間設計",
    a: { label: "まとまった時間がないと進まない", score: { TIME: 3, OVERTHINK: 1 } },
    b: { label: "短時間でも積み上げられる", score: {} },
  },
  {
    id: "q6",
    title: "学び直しで多いのは？",
    subtitle: "学び方のクセ",
    a: { label: "情報を集めるほど不安が増える", score: { INFO: 3, OVERTHINK: 1 } },
    b: { label: "やる気の波が大きく続かない", score: { MOTIVATION: 3, ENERGY: 1 } },
  },
  {
    id: "q7",
    title: "提出・公開のときは？",
    subtitle: "アウトプット",
    a: { label: "60点でも出して改善したい", score: {} },
    b: { label: "出すなら納得できる完成度で", score: { PERFECT: 3, OVERTHINK: 1 } },
  },
  {
    id: "q8",
    title: "決めるときは？",
    subtitle: "判断スタイル",
    a: { label: "比較して最適解を探したい", score: { OVERTHINK: 2, INFO: 1 } },
    b: { label: "仮決めして試しながら調整したい", score: {} },
  },
  {
    id: "q9",
    title: "作業のやり直しは？",
    subtitle: "手戻り",
    a: { label: "最初からしっかり設計して減らしたい", score: { OVERTHINK: 1, PERFECT: 1 } },
    b: { label: "まず出してから直していく", score: {} },
  },
  {
    id: "q10",
    title: "忙しい日の自分は？",
    subtitle: "現実の状態",
    a: { label: "やる気はあるのに進まない", score: { OVERTHINK: 1, PRIORITY: 1, TIME: 1 } },
    b: { label: "気力がなくて動けない", score: { ENERGY: 2, MOTIVATION: 1 } },
  },
];

const EXTRA_POOL: Record<JamType, Question[]> = {
  OVERTHINK: [
    {
      id: "ex_overthink_1",
      title: "迷うとき、どっち？",
      a: { label: "納得できる根拠が揃うまで止まる", score: { OVERTHINK: 3 } },
      b: { label: "仮で決めて進められる", score: {} },
    },
  ],
  PERFECT: [
    {
      id: "ex_perfect_1",
      title: "品質の基準は？",
      a: { label: "基準が高く、常に上を狙う", score: { PERFECT: 3 } },
      b: { label: "用途に合わせて調整できる", score: {} },
    },
  ],
  INFO: [
    {
      id: "ex_info_1",
      title: "調べ物は？",
      a: { label: "つい延長して時間が溶ける", score: { INFO: 3 } },
      b: { label: "時間を区切って試せる", score: {} },
    },
  ],
  PRIORITY: [
    {
      id: "ex_priority_1",
      title: "ToDoが増えたら？",
      a: { label: "全部が同じ重要度に見える", score: { PRIORITY: 3 } },
      b: { label: "トップ1つに絞れる", score: {} },
    },
  ],
  ENERGY: [
    {
      id: "ex_energy_1",
      title: "疲労のサインは？",
      a: { label: "睡眠/回復が足りない自覚がある", score: { ENERGY: 3 } },
      b: { label: "疲れてても何とか押し切れる", score: {} },
    },
  ],
  TIME: [
    {
      id: "ex_time_1",
      title: "中断は？",
      a: { label: "中断が多く再開に時間がかかる", score: { TIME: 3 } },
      b: { label: "中断してもすぐ戻れる", score: {} },
    },
  ],
  DISTRACT: [
    {
      id: "ex_distract_1",
      title: "環境は？",
      a: { label: "スマホが近いとつい触る", score: { DISTRACT: 3 } },
      b: { label: "通知があっても流せる", score: {} },
    },
  ],
  MOTIVATION: [
    {
      id: "ex_motivation_1",
      title: "続かない理由は？",
      a: { label: "意味や手応えが見えず止まる", score: { MOTIVATION: 3 } },
      b: { label: "決めたら継続できる方", score: {} },
    },
  ],
};

type TimeBucket = "0_15" | "30" | "60";
const TIME_BUCKET_BONUS: Record<TimeBucket, Partial<Record<JamType, number>>> = {
  "0_15": { TIME: 2, PRIORITY: 1 },
  "30": { TIME: 1 },
  "60": {},
};

function addScore(base: Record<JamType, number>, delta: Partial<Record<JamType, number>>) {
  const next = { ...base };
  (Object.keys(delta) as JamType[]).forEach((k) => {
    next[k] += delta[k] ?? 0;
  });
  return next;
}
function initScores(): Record<JamType, number> {
  return {
    OVERTHINK: 0,
    PERFECT: 0,
    INFO: 0,
    PRIORITY: 0,
    ENERGY: 0,
    TIME: 0,
    DISTRACT: 0,
    MOTIVATION: 0,
  };
}
function topTwo(scores: Record<JamType, number>) {
  const sorted = (Object.keys(scores) as JamType[])
    .map((k) => [k, scores[k]] as const)
    .sort((a, b) => b[1] - a[1]);
  const [t1, t2] = sorted;
  return { top1: t1[0], s1: t1[1], top2: t2[0], s2: t2[1], sorted };
}
function confidenceFrom(scores: Record<JamType, number>) {
  const { s1, s2 } = topTwo(scores);
  if (s1 <= 0) return 0;
  return (s1 - s2) / Math.max(1, s1);
}
function pickExtraQuestions(scores: Record<JamType, number>): Question[] {
  const { sorted } = topTwo(scores);
  const picks: Question[] = [];
  for (const [jt] of sorted.slice(0, 3)) {
    const q = EXTRA_POOL[jt]?.[0];
    if (q) picks.push(q);
  }
  return picks.slice(0, 3);
}

export default function Page() {
  const [step, setStep] = useState<"intro" | "trouble" | "time" | "core" | "extra" | "result">("intro");
  const [trouble, setTrouble] = useState<Trouble | null>(null);
  const [timeBucket, setTimeBucket] = useState<TimeBucket | null>(null);
  const [coreIndex, setCoreIndex] = useState(0);
  const [extraIndex, setExtraIndex] = useState(0);
  const [scores, setScores] = useState<Record<JamType, number>>(initScores());

  const coreQ = CORE_QUESTIONS[coreIndex];
  const extraQs = useMemo(() => pickExtraQuestions(scores), [scores]);
  const extraQ = extraQs[extraIndex];

  const conf = useMemo(() => confidenceFrom(scores), [scores]);
  const { top1, top2 } = useMemo(() => topTwo(scores), [scores]);

  const resetAll = () => {
    setStep("intro");
    setTrouble(null);
    setTimeBucket(null);
    setCoreIndex(0);
    setExtraIndex(0);
    setScores(initScores());
  };

  const applyAnswer = (q: Question, which: "A" | "B") => {
    const opt = which === "A" ? q.a : q.b;
    setScores((prev) => addScore(prev, opt.score));
  };

  const start = () => setStep("trouble");

  const applyTrouble = (t: Trouble) => {
    setTrouble(t);
    setScores((prev) => addScore(prev, TROUBLE_BONUS[t]));
    setStep("time");
  };

  const applyTime = (tb: TimeBucket) => {
    setTimeBucket(tb);
    setScores((prev) => addScore(prev, TIME_BUCKET_BONUS[tb]));
    setStep("core");
  };

  const nextCore = () => {
    const next = coreIndex + 1;
    if (next >= CORE_QUESTIONS.length) {
      const c = confidenceFrom(scores);
      if (c < 0.18) setStep("extra");
      else setStep("result");
    } else setCoreIndex(next);
  };

  const nextExtra = () => {
    const next = extraIndex + 1;
    if (next >= extraQs.length) setStep("result");
    else setExtraIndex(next);
  };

  const resultText = useMemo(() => {
    const meta = JAM_META[top1];
    const secondary = JAM_META[top2];

    const troubleLabel: Record<Trouble, string> = {
      ACTION: "行動が続かない",
      DECIDE: "決められない",
      FOCUS: "集中できない",
      TIRED: "疲れて動けない",
      NO_TIME: "時間がない",
    };
    const timeLabel: Record<TimeBucket, string> = {
      "0_15": "0〜15分",
      "30": "30分くらい",
      "60": "1時間以上",
    };

    const prompt = `あなたは「会社員の学び直し設計所」のコーチです。
私はAI×タイプ別「最短改善」で、いま詰まっている原因を言語化し、制約（時間/体力/家庭）前提で今日からの行動を3つに絞ってください。

【前提】
- 主な困りごと: ${trouble ? troubleLabel[trouble] : "未選択"}
- 平日に使える時間: ${timeBucket ? timeLabel[timeBucket] : "未選択"}
- 推定詰まりタイプ: ${meta.name}
- サブ傾向: ${secondary.name}
- 自信度(目安): ${(conf * 100).toFixed(0)}%

【出力フォーマット】
1. 今の詰まりの正体（短く言語化）
2. やめた方がいいこと（2つ）
3. 今日・今週・今月の行動（各1つ、超具体）
4. AIの具体的な使い方（1つ、コピペで使える）
5. うまく行かなかった時の立て直し手順（3ステップ）
`;

    return { meta, secondary, prompt };
  }, [top1, top2, trouble, timeBucket, conf]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("コピーしました！");
    } catch {
      alert("コピーに失敗しました（ブラウザの権限を確認してね）");
    }
  };

  const Card = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        maxWidth: 760,
        margin: "24px auto",
        padding: 20,
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        background: "white",
        boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
      }}
    >
      {children}
    </div>
  );

  const Pill = ({ children }: { children: React.ReactNode }) => (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 999,
        background: "#f3f4f6",
        fontSize: 12,
        marginRight: 8,
      }}
    >
      {children}
    </span>
  );

  const Button = ({
    children,
    onClick,
    variant = "primary",
  }: {
    children: React.ReactNode;
    onClick: () => void;
    variant?: "primary" | "ghost";
  }) => (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: variant === "ghost" ? "1px solid #e5e7eb" : "1px solid #111827",
        background: variant === "ghost" ? "white" : "#111827",
        color: variant === "ghost" ? "#111827" : "white",
        fontWeight: 700,
        cursor: "pointer",
        marginTop: 10,
      }}
    >
      {children}
    </button>
  );

  const TwoChoice = ({ q, onA, onB }: { q: Question; onA: () => void; onB: () => void }) => (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.4 }}>{q.title}</div>
      {q.subtitle && (
        <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
          <Pill>{q.subtitle}</Pill>
          <span>二択でOK（直感で）</span>
        </div>
      )}
      <div style={{ marginTop: 14 }}>
        <Button onClick={onA}>A：{q.a.label}</Button>
        <Button onClick={onB} variant="ghost">
          B：{q.b.label}
        </Button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", padding: "18px 12px", fontFamily: "ui-sans-serif, system-ui" }}>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>会社員の学び直し設計所</div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>AI×タイプ別「最短改善」ミニ診断</div>
          </div>
          <button
            onClick={resetAll}
            style={{ border: "1px solid #e5e7eb", background: "white", padding: "8px 10px", borderRadius: 10, cursor: "pointer" }}
          >
            リセット
          </button>
        </div>

        {step === "intro" && (
          <>
            <div style={{ marginTop: 14, color: "#111827", lineHeight: 1.75 }}>
              入力ゼロに近い“ワンタップ診断”で、<b>今の詰まり</b>を特定して<b>最短の一手</b>を出します。
              <br />
              （MBTIを当てる診断じゃなく、<b>改善に効く診断</b>）
            </div>
            <div style={{ marginTop: 12, color: "#6b7280", fontSize: 13 }}>
              流れ：困りごと → 使える時間 → 二択10問 →（必要なら追加3問）→ 結果 & AIプロンプト
            </div>
            <Button onClick={start}>診断スタート</Button>
          </>
        )}

        {step === "trouble" && (
          <>
            <div style={{ marginTop: 14, fontSize: 16, fontWeight: 800 }}>いま一番困ってるのは？（1タップ）</div>
            <div style={{ marginTop: 10 }}>
              {(
                [
                  ["ACTION", "行動が続かない"],
                  ["DECIDE", "決められない"],
                  ["FOCUS", "集中できない"],
                  ["TIRED", "疲れて動けない"],
                  ["NO_TIME", "時間がない"],
                ] as const
              ).map(([k, label]) => (
                <Button key={k} onClick={() => applyTrouble(k)}>
                  {label}
                </Button>
              ))}
            </div>
          </>
        )}

        {step === "time" && (
          <>
            <div style={{ marginTop: 14, fontSize: 16, fontWeight: 800 }}>平日に自分のために使える時間は？</div>
            <div style={{ marginTop: 10 }}>
              <Button onClick={() => applyTime("0_15")}>0〜15分</Button>
              <Button onClick={() => applyTime("30")} variant="ghost">
                30分くらい
              </Button>
              <Button onClick={() => applyTime("60")} variant="ghost">
                1時間以上
              </Button>
            </div>
          </>
        )}

        {step === "core" && coreQ && (
          <>
            <div style={{ marginTop: 10, color: "#6b7280", fontSize: 13 }}>
              進捗：{coreIndex + 1} / {CORE_QUESTIONS.length}
            </div>
            <TwoChoice
              q={coreQ}
              onA={() => {
                applyAnswer(coreQ, "A");
                nextCore();
              }}
              onB={() => {
                applyAnswer(coreQ, "B");
                nextCore();
              }}
            />
            <div style={{ marginTop: 14, color: "#6b7280", fontSize: 12 }}>
              ※ 途中結果：<b>{JAM_META[top1].name}</b>（次点：{JAM_META[top2].name}）／自信度 {(conf * 100).toFixed(0)}%
            </div>
          </>
        )}

        {step === "extra" && extraQ && (
          <>
            <div style={{ marginTop: 10, color: "#6b7280", fontSize: 13 }}>
              精度アップ質問：{extraIndex + 1} / {extraQs.length}（自信度 {(conf * 100).toFixed(0)}%）
            </div>
            <TwoChoice
              q={extraQ}
              onA={() => {
                applyAnswer(extraQ, "A");
                nextExtra();
              }}
              onB={() => {
                applyAnswer(extraQ, "B");
                nextExtra();
              }}
            />
            <div style={{ marginTop: 14, color: "#6b7280", fontSize: 12 }}>
              ※ “当てる”より“進む”精度を上げています
            </div>
          </>
        )}

        {step === "result" && (
          <>
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 18, fontWeight: 900 }}>診断結果</div>
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                <Pill>主タイプ：{resultText.meta.name}</Pill>
                <Pill>サブ：{resultText.secondary.name}</Pill>
                <Pill>自信度：{(conf * 100).toFixed(0)}%</Pill>
              </div>

              <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: "#f3f4f6" }}>
                <div style={{ fontWeight: 900 }}>{resultText.meta.catch}</div>
                <div style={{ marginTop: 8, color: "#374151", lineHeight: 1.7 }}>{resultText.meta.why}</div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 900 }}>やめた方がいいこと（2つ）</div>
                <ul style={{ marginTop: 8, lineHeight: 1.8, color: "#111827" }}>
                  {resultText.meta.stop.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 900 }}>最短の一手</div>
                <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                  {[
                    ["今日", resultText.meta.doToday],
                    ["今週", resultText.meta.doWeek],
                    ["今月", resultText.meta.doMonth],
                  ].map(([label, items]) => (
                    <div key={label} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
                      <div style={{ fontWeight: 900 }}>{label}</div>
                      <ul style={{ marginTop: 6, lineHeight: 1.8 }}>
                        {(items as string[]).map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 900 }}>AIの使い方（すぐ効く）</div>
                <ul style={{ marginTop: 8, lineHeight: 1.8 }}>
                  {resultText.meta.aiUse.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 900 }}>AIに貼るプロンプト（コピペ）</div>
                <textarea
                  readOnly
                  value={resultText.prompt}
                  style={{
                    width: "100%",
                    minHeight: 220,
                    marginTop: 8,
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    fontSize: 12,
                    lineHeight: 1.6,
                    background: "white",
                  }}
                />
                <Button onClick={() => copy(resultText.prompt)}>プロンプトをコピー</Button>
              </div>

              <div style={{ marginTop: 14, color: "#6b7280", fontSize: 12, lineHeight: 1.6 }}>
                ※ MVP版は「保存しない」設計。個人情報を預からずに安全に動かせます。
              </div>
            </div>
          </>
        )}
      </Card>

      <div style={{ maxWidth: 760, margin: "0 auto", color: "#6b7280", fontSize: 12, textAlign: "center", paddingBottom: 20 }}>
        © 会社員の学び直し設計所 — AI×タイプ別「最短改善」
      </div>
    </div>
  );
}
