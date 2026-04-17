import { Employee, ThanksCard, CategoryInfo } from "./types";

export const CATEGORIES: CategoryInfo[] = [
  { id: "cat1", value: "志高く、挑戦・進化", displayOrder: 1, colorClass: "text-red-700", bgClass: "bg-red-100", icon: "🔥" },
  { id: "cat2", value: "5S", displayOrder: 2, colorClass: "text-blue-700", bgClass: "bg-blue-100", icon: "✨" },
  { id: "cat3", value: "報連相", displayOrder: 3, colorClass: "text-green-700", bgClass: "bg-green-100", icon: "💬" },
  { id: "cat4", value: "思いやり", displayOrder: 4, colorClass: "text-pink-700", bgClass: "bg-pink-100", icon: "🤝" },
  { id: "cat5", value: "約束・ルールを守る", displayOrder: 5, colorClass: "text-purple-700", bgClass: "bg-purple-100", icon: "📌" },
];

export const LOCATIONS: string[] = [
  "本社",
  "HD",
  "アバロン工場",
  "横浜",
  "エンイート",
  "UMITTO",
];

export const employees: Employee[] = [
  { id: "e01", employeeNumber: "1001", name: "田中 太郎", nameKana: "たなか たろう", location: "本社", isAdmin: false },
  { id: "e02", employeeNumber: "1002", name: "鈴木 花子", nameKana: "すずき はなこ", location: "本社", isAdmin: false },
  { id: "e03", employeeNumber: "1003", name: "佐藤 健一", nameKana: "さとう けんいち", location: "本社", isAdmin: true },
  { id: "e04", employeeNumber: "1004", name: "高橋 美咲", nameKana: "たかはし みさき", location: "HD", isAdmin: false },
  { id: "e05", employeeNumber: "1005", name: "渡辺 誠", nameKana: "わたなべ まこと", location: "HD", isAdmin: true },
  { id: "e06", employeeNumber: "1006", name: "伊藤 恵子", nameKana: "いとう けいこ", location: "アバロン工場", isAdmin: false },
  { id: "e07", employeeNumber: "1007", name: "山本 拓也", nameKana: "やまもと たくや", location: "アバロン工場", isAdmin: false },
  { id: "e08", employeeNumber: "1008", name: "中村 あゆみ", nameKana: "なかむら あゆみ", location: "横浜", isAdmin: false },
  { id: "e09", employeeNumber: "1009", name: "小林 大介", nameKana: "こばやし だいすけ", location: "横浜", isAdmin: false },
  { id: "e10", employeeNumber: "1010", name: "加藤 里奈", nameKana: "かとう りな", location: "エンイート", isAdmin: false },
  { id: "e11", employeeNumber: "1011", name: "吉田 翔太", nameKana: "よしだ しょうた", location: "エンイート", isAdmin: false },
  { id: "e12", employeeNumber: "1012", name: "市川 雄大", nameKana: "いちかわ ゆうだい", location: "本社", isAdmin: false },
  { id: "e13", employeeNumber: "1013", name: "市川 美穂", nameKana: "いちかわ みほ", location: "アバロン工場", isAdmin: false },
  { id: "e14", employeeNumber: "1014", name: "市川 孝夫", nameKana: "いちかわ たかお", location: "HD", isAdmin: false },
  { id: "e15", employeeNumber: "1015", name: "大川 浩二", nameKana: "おおかわ こうじ", location: "HD", isAdmin: false },
  { id: "e16", employeeNumber: "1016", name: "小川 真理", nameKana: "おがわ まり", location: "横浜", isAdmin: false },
  { id: "e17", employeeNumber: "1017", name: "大川 裕子", nameKana: "おおかわ ゆうこ", location: "UMITTO", isAdmin: false },
];

function randomDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 10) + 8);
  d.setMinutes(Math.floor(Math.random() * 60));
  return d.toISOString();
}

const sampleMessages: Record<string, string[]> = {
  "志高く、挑戦・進化": [
    "新しい加工方法を自分から提案して試してくれたおかげで、品質が上がりました。挑戦する姿勢に感謝です。",
    "「もっと良くできるはず」と改善案を出してくれて、チーム全体の意識が変わりました。ありがとう。",
    "難しい案件に率先して手を挙げてくれた姿に刺激を受けました。一緒に頑張れてよかったです。",
    "若手への指導を自ら買って出てくれて、チーム全体のレベルが上がっています。ありがとう。",
  ],
  "5S": [
    "作業場をいつもきれいに整頓してくれているおかげで、効率よく仕事ができています。ありがとう。",
    "工具の置き場を見直してくれて、探す時間が減りました。地味だけど大きな改善です。感謝。",
    "共有スペースの清掃を黙々とやってくれていて、みんな気持ちよく使えています。ありがとう。",
  ],
  報連相: [
    "進捗をこまめに共有してくれるおかげで、安心して任せられます。いつもありがとう。",
    "トラブルの早期報告のおかげで大事に至らず済みました。すぐに教えてくれて感謝です。",
    "他部署との情報共有を丁寧にやってくれて、連携がスムーズになりました。ありがとう。",
    "会議の要点を簡潔にまとめて共有してくれるので、参加できなかった人も助かっています。",
  ],
  思いやり: [
    "体調が悪い時に「無理しないで」と声をかけてくれて、本当に嬉しかったです。ありがとう。",
    "忙しい中でも後輩の相談に丁寧に乗ってくれている姿、見ていて心強いです。",
    "新人さんが困っている時にさりげなくフォローしてくれて、チームの安心感になっています。",
    "お客様への電話対応がとても丁寧で、名指しでお褒めの言葉をいただきました。",
  ],
  "約束・ルールを守る": [
    "納期を必ず守ってくれるので、後工程も安心して進められます。いつもありがとう。",
    "安全ルールの声かけを欠かさずやってくれて、現場の意識が高まっています。感謝です。",
    "急な変更にも関わらず、約束通りの品質で仕上げてくれてありがとうございます。",
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateCards(): ThanksCard[] {
  const cards: ThanksCard[] = [];
  const categoryValues = Object.keys(sampleMessages);

  for (let i = 0; i < 30; i++) {
    const fromIdx = Math.floor(Math.random() * employees.length);
    let toIdx = Math.floor(Math.random() * employees.length);
    while (toIdx === fromIdx) {
      toIdx = Math.floor(Math.random() * employees.length);
    }
    const mainCatValue = pickRandom(categoryValues);
    const cardCategories: CategoryInfo[] = [
      CATEGORIES.find((c) => c.value === mainCatValue)!,
    ];
    if (Math.random() < 0.3) {
      const secondValue = pickRandom(categoryValues.filter((c) => c !== mainCatValue));
      cardCategories.push(CATEGORIES.find((c) => c.value === secondValue)!);
    }

    const reactCount = Math.floor(Math.random() * 8);
    const reactors = employees
      .filter((_, idx) => idx !== fromIdx && idx !== toIdx)
      .sort(() => Math.random() - 0.5)
      .slice(0, reactCount)
      .map((e) => e.id);

    cards.push({
      id: `tc${String(i + 1).padStart(3, "0")}`,
      from: employees[fromIdx],
      to: employees[toIdx],
      categories: cardCategories,
      message: pickRandom(sampleMessages[mainCatValue]),
      createdAt: randomDate(30),
      reactionCount: reactCount,
      reactedByMe: false,
      isPicked: Math.random() < 0.15,
      // Keep reactor IDs for mock toggle functionality
      _reactorIds: reactors,
    } as ThanksCard & { _reactorIds: string[] });
  }

  return cards.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export const thanksCards: ThanksCard[] = generateCards();

export function getEmployee(id: string): Employee | undefined {
  return employees.find((e) => e.id === id);
}

export function getCardsForUser(userId: string): {
  received: ThanksCard[];
  sent: ThanksCard[];
} {
  return {
    received: thanksCards.filter((c) => c.to.id === userId),
    sent: thanksCards.filter((c) => c.from.id === userId),
  };
}

export function getCategoryInfo(categoryValue: string): CategoryInfo {
  return CATEGORIES.find((c) => c.value === categoryValue) ?? CATEGORIES[4];
}

export function searchEmployees(query: string, excludeId?: string): Employee[] {
  if (!query.trim()) return [];
  const q = query.trim().toLowerCase();
  return employees
    .filter((e) => e.id !== excludeId)
    .filter(
      (e) =>
        e.name.includes(q) ||
        e.nameKana.includes(q) ||
        e.name.replace(/\s/g, "").includes(q) ||
        e.nameKana.replace(/\s/g, "").includes(q)
    )
    .slice(0, 8);
}
