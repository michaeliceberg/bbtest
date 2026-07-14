// db/achievements-config.ts

export const achievementsConfig = [
  {
    id: 1,
    name: "First Blood",
    description: "Реши первую задачу на арене",
    category: "combat",
    requirement: 1,
    rewardPoints: 50,
    rewardGems: 10,
    imageSrc: "/achievements/first-blood.svg",
    gameStyle: "bronze"
  },
  {
    id: 2,
    name: "Rampage",
    description: "10 правильных ответов подряд",
    category: "streak",
    requirement: 10,
    rewardPoints: 200,
    rewardGems: 50,
    imageSrc: "/achievements/rampage.svg",
    gameStyle: "epic"
  },
  {
    id: 3,
    name: "GODLIKE",
    description: "20 правильных ответов подряд",
    category: "streak",
    requirement: 20,
    rewardPoints: 500,
    rewardGems: 100,
    imageSrc: "/achievements/godlike.svg",
    gameStyle: "legendary"
  },
  {
    id: 4,
    name: "CARRY",
    description: "Реши 100 задач и помоги команде",
    category: "progress",
    requirement: 100,
    rewardPoints: 1000,
    rewardGems: 200,
    imageSrc: "/achievements/carry.svg",
    gameStyle: "legendary"
  },
  {
    id: 5,
    name: "Wiped Team",
    description: "Выполни все ДЗ за неделю",
    category: "homework",
    requirement: 7,
    rewardPoints: 300,
    rewardGems: 75,
    imageSrc: "/achievements/ace.svg",
    gameStyle: "epic"
  },
  {
    id: 6,
    name: "Pro Player",
    description: "Достигни 1000 MMR",
    category: "rank",
    requirement: 1000,
    rewardPoints: 2000,
    rewardGems: 500,
    imageSrc: "/achievements/pro.svg",
    gameStyle: "legendary"
  },
  {
    id: 7,
    name: "Noob Saibot",
    description: "Ошибись в лёгкой задаче 3 раза подряд",
    category: "secret",
    requirement: 3,
    rewardPoints: 10,
    rewardGems: 1,
    imageSrc: "/achievements/noob.svg",
    gameStyle: "common",
    isHidden: true
  }
];