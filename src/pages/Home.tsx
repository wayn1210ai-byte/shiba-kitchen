/*
Design reminder — Premium Japanese izakaya mobile UI.
Use warm cream, dark wood, amber glow, handcrafted rhythm.
Avoid generic SaaS styling.
*/
import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import { ChefHat, GripVertical, RefreshCcw, Settings2, Soup, Timer, X, Share2 } from "lucide-react";
import { toast } from "sonner";
import mascotImage from "@/assets/shiba-chef-portrait.png";

type Screen = "home" | "cooking" | "menu";
type Provider = "openai" | "gemini";
type CookingMode = "stir" | "boil" | "grill";

export type Recipe = {
  dishName: string;
  cookingTime: string;
  shibaTalk: string;
  cookingSteps: string[];
  ingredientsUsed: string[];
  seasoningNotes: string[];
  platingNotes: string;
};
export type SavedRecipe = Recipe & { savedAt: string; id: string };

const categories = [
  ["meat", "肉類與海鮮", "🥩", ["豬肉片", "五花肉", "絞肉", "豬小排", "豬肝", "大腸", "雞胸肉", "雞腿肉", "雞翅", "牛肉片", "牛腱", "鴨肉", "蝦子", "蛤蜊", "蚵仔", "鮭魚", "鱸魚", "鯛魚", "透抽", "小卷", "干貝"]],
  ["veg", "蔬菜與菇類", "🥬", ["高麗菜", "空心菜", "地瓜葉", "大白菜", "花椰菜", "青花菜", "洋蔥", "白蘿蔔", "紅蘿蔔", "番茄", "玉米", "小黃瓜", "絲瓜", "苦瓜", "茄子", "青椒", "四季豆", "韭菜", "芹菜", "豆芽菜", "秋葵", "大蒜", "老薑", "青蔥", "九層塔", "香菜", "辣椒", "金針菇", "香菇", "杏鮑菇", "木耳", "鴻禧菇"]],
  ["egg", "蛋與豆製品", "🥚", ["雞蛋", "皮蛋", "鹹蛋", "傳統豆腐", "嫩豆腐", "雞蛋豆腐", "百頁豆腐", "油豆腐", "臭豆腐", "豆皮", "豆乾", "毛豆"]],
  ["grain", "五穀主食", "🍚", ["白飯", "麵條", "烏龍麵", "油麵", "意麵", "泡麵", "冬粉", "米粉", "水餃", "餛飩", "吐司", "地瓜", "馬鈴薯", "南瓜"]],
  ["pantry", "加工與常備品", "🧺", ["貢丸", "香腸", "培根", "火腿", "肉鬆", "甜不辣", "火鍋料", "起司", "泡菜", "鮪魚罐頭", "乾香菇", "蝦米", "酸菜", "榨菜", "菜脯", "花生", "柴魚片", "海苔"]],
] as const;

const categoryOrderMap = Object.fromEntries(categories.map(([key, , , items]) => [key, [...items]])) as Record<string, string[]>;
const tabOrderSeed = categories.map(([key]) => key);

const ingredientArtKind: Record<string, string> = {
  豬肉片: "pork-slice",
  五花肉: "pork-belly",
  絞肉: "minced-meat",
  雞胸肉: "chicken-breast",
  雞腿肉: "chicken-drumstick",
  牛肉片: "beef-slice",
  蝦子: "shrimp",
  蛤蜊: "clam",
  鮭魚: "salmon",
  透抽: "squid",
  小卷: "small-squid",
  干貝: "scallop",
  豬小排: "pork-rib",
  豬肝: "pork-liver",
  大腸: "pork-intestine",
  雞翅: "chicken-wing",
  牛腱: "beef-shank",
  鴨肉: "duck",
  蚵仔: "oyster",
  鱸魚: "bass",
  鯛魚: "sea-bream",
  高麗菜: "cabbage",
  空心菜: "water-spinach",
  地瓜葉: "sweet-potato-leaf",
  洋蔥: "onion",
  白蘿蔔: "daikon",
  紅蘿蔔: "carrot",
  小黃瓜: "cucumber",
  絲瓜: "luffa",
  大蒜: "garlic",
  青蔥: "scallion",
  金針菇: "enoki",
  香菇: "shiitake",
  杏鮑菇: "king-oyster",
  大白菜: "napa-cabbage",
  花椰菜: "cauliflower",
  青花菜: "broccoli",
  番茄: "tomato",
  玉米: "corn",
  苦瓜: "bitter-melon",
  茄子: "eggplant",
  青椒: "bell-pepper",
  四季豆: "green-bean",
  韭菜: "chives",
  芹菜: "celery",
  豆芽菜: "bean-sprout",
  秋葵: "okra",
  老薑: "old-ginger",
  九層塔: "basil",
  香菜: "cilantro",
  辣椒: "chili",
  木耳: "wood-ear",
  鴻禧菇: "bunashimeji",
  雞蛋: "egg",
  皮蛋: "century-egg",
  鹹蛋: "salted-egg",
  傳統豆腐: "firm-tofu",
  嫩豆腐: "silken-tofu",
  雞蛋豆腐: "egg-tofu",
  百頁豆腐: "thousand-layer-tofu",
  豆皮: "tofu-skin",
  豆乾: "dried-tofu",
  油豆腐: "fried-tofu",
  臭豆腐: "stinky-tofu",
  毛豆: "edamame",
  白飯: "rice-bowl",
  麵條: "noodles",
  意麵: "yi-noodles",
  泡麵: "instant-noodles",
  冬粉: "glass-noodles",
  米粉: "rice-noodles",
  吐司: "toast",
  烏龍麵: "udon",
  油麵: "oil-noodles",
  水餃: "dumpling",
  餛飩: "wonton",
  地瓜: "sweet-potato",
  馬鈴薯: "potato",
  南瓜: "pumpkin",
  貢丸: "meatball",
  香腸: "sausage",
  甜不辣: "tempura-fishcake",
  火鍋料: "hotpot-mix",
  起司: "cheese",
  泡菜: "kimchi",
  鮪魚罐頭: "tuna-can",
  培根: "bacon",
  火腿: "ham",
  肉鬆: "pork-floss",
  蝦米: "dried-shrimp",
  乾香菇: "dried-shiitake",
  酸菜: "pickled-mustard",
  榨菜: "pickled-veg",
  菜脯: "dried-radish",
  花生: "peanut",
  柴魚片: "bonito",
  海苔: "nori",
};

function IngredientSketch({ item, active = false }: { item: string; active?: boolean }) {
  const ink = active ? "#fff6ea" : "#7a4a2b";
  const soft = active ? "#ffe0b2" : "#f6d7a8";
  const pale = active ? "#fff3df" : "#fff8ee";
  const green = active ? "#d8efbf" : "#7fb86a";
  const darkGreen = active ? "#bfe19c" : "#5a8e45";
  const orange = active ? "#ffbc73" : "#ef9241";
  const red = active ? "#e79b8b" : "#d47868";
  const yellow = active ? "#f5d36b" : "#efc24f";
  const beige = active ? "#f2e5d1" : "#ead6bc";
  const brown = active ? "#c79a72" : "#9a6a48";
  const gray = active ? "#d7dedd" : "#b8c7c9";

  const svg = (content: string, viewBox = "0 0 64 64") => (
    <svg viewBox={viewBox} className="h-10 w-10" aria-hidden="true">
      <g dangerouslySetInnerHTML={{ __html: content }} />
    </svg>
  );

  const kind = ingredientArtKind[item];
  const art: Record<string, JSX.Element> = {
    "pork-slice": svg(`<path d="M12 38c4-11 18-18 33-14 5 1 8 4 8 8 0 8-9 14-22 16-12 2-23-2-19-10Z" fill="${soft}" stroke="${ink}" stroke-width="3"/><path d="M23 29c5 4 11 7 19 8" stroke="${ink}" stroke-width="2.5" fill="none"/><path d="M19 36c5 2 10 2 16 1" stroke="#d79185" stroke-width="2.3" fill="none"/>`),
    "pork-belly": svg(`<rect x="13" y="17" width="38" height="28" rx="11" fill="${soft}" stroke="${ink}" stroke-width="3"/><path d="M18 24c9 4 19 4 28 0M18 31c9 4 19 4 28 0M18 38c9 4 19 4 28 0" stroke="#d88979" stroke-width="3" fill="none"/>`),
    "minced-meat": svg(`<path d="M17 24c9-6 22-6 30 0 7 5 5 15-4 21-10 6-24 6-31-1-6-6-4-15 5-20Z" fill="${red}" stroke="${ink}" stroke-width="3"/><path d="M22 29l19 11M23 38l17-4M29 24l8 19" stroke="${ink}" stroke-width="2.5"/>`),
    "chicken-breast": svg(`<path d="M22 17c15-3 25 6 24 19-1 11-9 18-19 18-10 0-16-8-15-17 1-9 5-17 10-20Z" fill="#efc8a1" stroke="${ink}" stroke-width="3"/><path d="M26 24c6 5 9 11 10 19" stroke="#d69d6c" stroke-width="2.5" fill="none"/>`),
    "chicken-drumstick": svg(`<path d="M17 27c4-8 14-12 24-9 8 3 13 12 10 20-3 9-13 15-24 12-11-3-15-14-10-23Z" fill="#d69b61" stroke="${ink}" stroke-width="3"/><circle cx="47" cy="45" r="5" fill="${pale}" stroke="${ink}" stroke-width="3"/><path d="M41 39l5 5" stroke="${ink}" stroke-width="3"/>`),
    "beef-slice": svg(`<path d="M12 38c4-11 18-18 33-14 5 1 8 4 8 8 0 8-9 14-22 16-12 2-23-2-19-10Z" fill="#d67b6e" stroke="${ink}" stroke-width="3"/><path d="M23 29c5 4 11 7 19 8" stroke="${pale}" stroke-width="2.5" fill="none"/><path d="M18 36c7 1 13 1 19 0" stroke="${ink}" stroke-width="2.2" fill="none"/>`),
    "shrimp": svg(`<path d="M18 38c1-10 8-18 17-20 9-2 16 4 15 12-1 9-10 18-22 20" fill="#f0a06b" stroke="${ink}" stroke-width="3" stroke-linecap="round"/><path d="M18 39c7 1 12 4 12 9M29 20c4 3 7 8 7 13" stroke="${ink}" stroke-width="2.5" fill="none"/><circle cx="38" cy="27" r="1.8" fill="${ink}"/>`),
    "clam": svg(`<path d="M16 36c0-11 8-18 16-18s16 7 16 18H16Z" fill="#d7b7a1" stroke="${ink}" stroke-width="3"/><path d="M18 36c4 7 9 10 14 10s10-3 14-10" fill="#f0d3c8" stroke="${ink}" stroke-width="3"/><path d="M22 30c7 2 13 2 20 0" stroke="${ink}" stroke-width="2.3" fill="none"/>`),
    "salmon": svg(`<path d="M13 33c9-11 25-13 35-7 4 2 4 9 0 11-11 8-27 6-35-4Z" fill="#f39b7e" stroke="${ink}" stroke-width="3"/><path d="M24 26c6 4 8 8 0 14M34 24c6 5 8 11 0 17" stroke="${pale}" stroke-width="3" fill="none"/><path d="M49 28l5 5-5 5" stroke="${ink}" stroke-width="3" fill="none"/>`),
    "squid": svg(`<path d="M31 14c10 6 14 17 11 26-3 9-13 14-20 9-6-5-7-16-2-26 2-4 6-7 11-9Z" fill="#f5efe8" stroke="${ink}" stroke-width="3"/><path d="M24 46l-4 7M31 47v8M38 46l4 7M44 42l5 7" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/><circle cx="34" cy="27" r="2" fill="${ink}"/>`),
    "cabbage": svg(`<circle cx="32" cy="32" r="16" fill="${green}" stroke="${ink}" stroke-width="3"/><path d="M24 40c4-9 11-15 19-18M23 28c8 0 14 4 18 14M32 20c2 8 0 16-4 24" stroke="${pale}" stroke-width="2.5" fill="none"/>`),
    "water-spinach": svg(`<path d="M18 45c7-15 15-24 27-28" stroke="${ink}" stroke-width="3" fill="none"/><path d="M18 44c0-7 5-12 11-15M29 34c5-8 12-12 18-14" stroke="${green}" stroke-width="6" stroke-linecap="round" fill="none"/><circle cx="18" cy="44" r="4" fill="${green}" stroke="${ink}" stroke-width="3"/>`),
    "sweet-potato-leaf": svg(`<path d="M18 46c6-18 14-27 26-31" stroke="${ink}" stroke-width="3" fill="none"/><path d="M27 24c6-9 18-10 21-2 3 7-5 13-13 13-8 0-13-5-8-11Z" fill="${green}" stroke="${ink}" stroke-width="3"/><path d="M18 35c0-6 5-10 11-10" stroke="${darkGreen}" stroke-width="5" fill="none"/>`),
    "onion": svg(`<path d="M32 15c8 6 13 14 13 23 0 10-5 17-13 17s-13-7-13-17c0-9 5-17 13-23Z" fill="#d9b9e8" stroke="${ink}" stroke-width="3"/><path d="M27 31c4 5 6 11 5 20M38 29c-3 5-4 12-4 21" stroke="${pale}" stroke-width="2.5" fill="none"/>`),
    "daikon": svg(`<path d="M25 19c8 0 14 6 14 15 0 11-6 20-13 20-8 0-13-6-13-15 0-8 5-20 12-20Z" fill="#fafaf4" stroke="${ink}" stroke-width="3"/><path d="M35 19c4-4 8-4 12 1" stroke="${green}" stroke-width="5" stroke-linecap="round"/><path d="M29 28c4 7 4 12 2 20" stroke="#d4d4cc" stroke-width="2.5"/>`),
    "carrot": svg(`<path d="M20 22c7-4 17-3 22 3 5 5 2 13-7 19-8 5-17 6-21 1-5-5-2-15 6-23Z" fill="${orange}" stroke="${ink}" stroke-width="3"/><path d="M35 18c3-4 8-6 12-4M31 17c2-4 6-7 10-8" stroke="${green}" stroke-width="5" stroke-linecap="round"/><path d="M24 29l10 12M22 36l12-2" stroke="${ink}" stroke-width="2.3"/>`),
    "cucumber": svg(`<path d="M15 39c8-13 23-19 33-12 6 4 5 12-4 18-10 7-25 8-29-6Z" fill="#7fbd6a" stroke="${ink}" stroke-width="3"/><path d="M22 35c7-2 15-1 22 3" stroke="${pale}" stroke-width="2.5" fill="none"/>`),
    "luffa": svg(`<path d="M15 38c7-14 23-21 33-13 7 6 4 14-7 20-11 6-24 6-26-7Z" fill="#9dc97a" stroke="${ink}" stroke-width="3"/><path d="M23 26c6 6 9 12 9 20M32 23c4 5 7 13 7 21" stroke="${pale}" stroke-width="2.2" fill="none"/>`),
    "garlic": svg(`<path d="M24 22c0-6 4-10 8-10s8 4 8 10c6 2 9 6 9 12 0 8-7 14-17 14s-17-6-17-14c0-6 4-10 9-12Z" fill="#f4eee2" stroke="${ink}" stroke-width="3"/><path d="M32 13v9M24 25c4 3 5 8 4 15M40 25c-4 3-5 8-4 15" stroke="#d7ccbd" stroke-width="2.4"/>`),
    "scallion": svg(`<path d="M22 49c4-17 5-27 5-36M32 49c2-18 3-28 3-36M42 49c0-17-1-27-2-36" stroke="${green}" stroke-width="6" stroke-linecap="round"/><path d="M21 49h22" stroke="${pale}" stroke-width="5" stroke-linecap="round"/><path d="M22 49c0 4 20 4 20 0" stroke="${ink}" stroke-width="3" fill="none"/>`),
    "enoki": svg(`<path d="M20 46V26M28 46V24M36 46V24M44 46V26" stroke="${ink}" stroke-width="3" stroke-linecap="round"/><path d="M16 25c2-4 6-6 8-3 2-3 7-3 9 0 2-3 7-3 9 0 2-3 6-1 8 3" fill="#f4e9d0" stroke="${ink}" stroke-width="3"/>`),
    "shiitake": svg(`<path d="M16 30c2-10 12-16 20-16s18 6 20 16H16Z" fill="#8d664d" stroke="${ink}" stroke-width="3"/><path d="M24 30v12M32 30v14M40 30v12" stroke="${beige}" stroke-width="3" stroke-linecap="round"/><path d="M26 42c4 6 8 6 12 0" stroke="${ink}" stroke-width="3" fill="none"/>`),
    "king-oyster": svg(`<path d="M24 19c6-6 15-8 20-3 5 5 3 12-4 16-7 4-15 4-18-2-2-4-1-8 2-11Z" fill="${brown}" stroke="${ink}" stroke-width="3"/><path d="M28 31c-1 9 2 15 9 17 6-1 10-6 9-16" fill="#efe2cf" stroke="${ink}" stroke-width="3"/>`),
    "egg": svg(`<ellipse cx="32" cy="33" rx="13" ry="17" fill="#fff8ea" stroke="${ink}" stroke-width="3"/>`),
    "century-egg": svg(`<ellipse cx="32" cy="33" rx="13" ry="17" fill="#495042" stroke="${ink}" stroke-width="3"/><path d="M25 29c3 0 5 2 6 5M39 27c-1 4-3 7-7 8" stroke="#d9e0d0" stroke-width="2.5"/>`),
    "salted-egg": svg(`<ellipse cx="32" cy="33" rx="13" ry="17" fill="#fff4da" stroke="${ink}" stroke-width="3"/><circle cx="32" cy="33" r="7" fill="#f0b739" stroke="${ink}" stroke-width="2.5"/>`),
    "firm-tofu": svg(`<rect x="18" y="18" width="28" height="28" rx="5" fill="#fffdf8" stroke="${ink}" stroke-width="3"/>`),
    "silken-tofu": svg(`<rect x="16" y="16" width="32" height="32" rx="10" fill="#fffdf9" stroke="${ink}" stroke-width="3"/><path d="M21 25c6-2 13-2 21 0M21 34c6-2 13-2 21 0" stroke="#eadfcd" stroke-width="2.5"/>`),
    "egg-tofu": svg(`<rect x="16" y="18" width="32" height="26" rx="8" fill="#efd178" stroke="${ink}" stroke-width="3"/><path d="M16 27h32" stroke="${ink}" stroke-width="2.5"/>`),
    "thousand-layer-tofu": svg(`<rect x="16" y="18" width="32" height="28" rx="6" fill="#f3ddb2" stroke="${ink}" stroke-width="3"/><path d="M22 22v20M30 22v20M38 22v20" stroke="#d8ba8e" stroke-width="2.4"/>`),
    "tofu-skin": svg(`<path d="M18 18h28l-4 28H14l4-28Z" fill="#f0ca7d" stroke="${ink}" stroke-width="3"/><path d="M20 26c8 2 16 2 24 0M18 34c8 2 16 2 22 0" stroke="#ddb15f" stroke-width="2.4"/>`),
    "dried-tofu": svg(`<rect x="16" y="18" width="32" height="28" rx="6" fill="#be8550" stroke="${ink}" stroke-width="3"/><path d="M20 24h24M20 32h24M20 40h18" stroke="#e7bb8b" stroke-width="2.4"/>`),
    "rice-bowl": svg(`<path d="M18 33c0-8 6-14 14-14s14 6 14 14v7H18v-7Z" fill="#fffaf2" stroke="${ink}" stroke-width="3"/><path d="M15 40h34" stroke="${ink}" stroke-width="3"/><path d="M24 26c5-2 9-2 13 0" stroke="#e9e4da" stroke-width="2.4"/>`),
    "noodles": svg(`<path d="M16 38c9-9 24-12 32-7" stroke="${yellow}" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M19 44c8-7 18-9 27-6" stroke="${yellow}" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M14 48h36" stroke="${ink}" stroke-width="3"/>`),
    "yi-noodles": svg(`<path d="M18 24c6-5 13-5 19 0 6 5 6 13 0 18-6 5-13 5-19 0-6-5-6-13 0-18Z" fill="none" stroke="${yellow}" stroke-width="6" stroke-linecap="round"/><path d="M16 47h32" stroke="${ink}" stroke-width="3"/>`),
    "instant-noodles": svg(`<path d="M18 32c0-7 6-12 14-12s14 5 14 12v9H18v-9Z" fill="#f0c566" stroke="${ink}" stroke-width="3"/><path d="M20 27c4 2 7 2 10 0 4 2 7 2 11 0" stroke="${ink}" stroke-width="2.4"/><path d="M18 41h28" stroke="${ink}" stroke-width="3"/>`),
    "glass-noodles": svg(`<path d="M18 36c7-8 20-10 29-7" stroke="${gray}" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M19 42c8-6 18-8 25-5" stroke="${gray}" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M14 48h36" stroke="${ink}" stroke-width="3"/>`),
    "rice-noodles": svg(`<path d="M17 36c10-5 21-5 30 0" stroke="#f3eee4" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M17 42c10-5 21-5 30 0" stroke="#f3eee4" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M14 48h36" stroke="${ink}" stroke-width="3"/>`),
    "toast": svg(`<path d="M20 23c0-6 5-10 12-10s12 4 12 10v21H20V23Z" fill="#f0ca8d" stroke="${ink}" stroke-width="3"/><rect x="24" y="28" width="16" height="12" rx="4" fill="#fff0d0" stroke="${ink}" stroke-width="2.5"/>`),
    "meatball": svg(`<circle cx="32" cy="32" r="14" fill="#efd9c0" stroke="${ink}" stroke-width="3"/><path d="M24 27c6 1 10 1 15 0" stroke="${ink}" stroke-width="2.3"/>`),
    "sausage": svg(`<path d="M16 34c6-10 21-15 31-11 6 2 7 7 4 12-4 7-15 13-25 13-9 0-13-5-10-14Z" fill="#c86b55" stroke="${ink}" stroke-width="3"/><path d="M18 29l-5-2M46 24l5-3" stroke="${ink}" stroke-width="2.3"/>`),
    "tempura-fishcake": svg(`<path d="M16 36c8-12 20-18 29-13 8 4 8 12 1 19-8 7-21 10-28 4-6-5-6-7-2-10Z" fill="#ddb27a" stroke="${ink}" stroke-width="3"/><path d="M25 28c4 4 7 9 9 16" stroke="${ink}" stroke-width="2.3" fill="none"/>`),
    "hotpot-mix": svg(`<circle cx="22" cy="28" r="7" fill="#f4d8cb" stroke="${ink}" stroke-width="3"/><circle cx="40" cy="31" r="7" fill="#e7bf7a" stroke="${ink}" stroke-width="3"/><rect x="19" y="40" width="26" height="10" rx="5" fill="#dcb6dd" stroke="${ink}" stroke-width="3"/>`),
    "cheese": svg(`<path d="M17 42V20l30 8v14H17Z" fill="#f0ca53" stroke="${ink}" stroke-width="3"/><circle cx="31" cy="31" r="3" fill="#f8df85"/><circle cx="39" cy="36" r="2.5" fill="#f8df85"/>`),
    "kimchi": svg(`<path d="M18 44c6-18 17-26 28-26 5 0 9 3 10 8 1 8-7 17-18 22-10 4-19 3-20-4Z" fill="#e36d4d" stroke="${ink}" stroke-width="3"/><path d="M24 32c6 2 12 2 19-1" stroke="#ffd2b6" stroke-width="2.4"/>`),
    "tuna-can": svg(`<ellipse cx="32" cy="22" rx="14" ry="6" fill="#b7d0d4" stroke="${ink}" stroke-width="3"/><path d="M18 22v16c0 3 6 6 14 6s14-3 14-6V22" fill="#9fbabd" stroke="${ink}" stroke-width="3"/><path d="M24 31c4-2 8-2 12 0" stroke="${ink}" stroke-width="2.4"/>`),
    // MEAT
    "small-squid": svg(`<ellipse cx="32" cy="28" rx="14" ry="10" fill="#f0e8dc" stroke="${ink}" stroke-width="3"/><path d="M20 36l-4 8M28 38l-2 9M36 38l2 9M44 36l4 8" stroke="${ink}" stroke-width="2.8" stroke-linecap="round"/><circle cx="28" cy="26" r="2.5" fill="${ink}"/><circle cx="36" cy="26" r="2.5" fill="${ink}"/>`),
    "scallop": svg(`<circle cx="32" cy="32" r="16" fill="#faf0e6" stroke="${ink}" stroke-width="3"/><path d="M28 21c6 4 9 10 9 17" fill="${beige}" stroke="${ink}" stroke-width="2.8"/><path d="M22 27c5 3 8 8 8 14" fill="${beige}" stroke="${ink}" stroke-width="2.8"/><path d="M34 21c-6 4-9 10-9 17" fill="${beige}" stroke="${ink}" stroke-width="2.8"/><path d="M40 27c-5 3-8 8-8 14" fill="${beige}" stroke="${ink}" stroke-width="2.8"/>`),
    "pork-rib": svg(`<path d="M16 28c3-8 10-13 18-13 10 0 16 6 17 14 1 9-5 16-13 17-7 1-15-4-22-18Z" fill="${red}" stroke="${ink}" stroke-width="3"/><path d="M36 16c-2 6-2 13 0 20M44 20c-2 5-3 11-1 17" stroke="${pale}" stroke-width="2.5" fill="none"/><circle cx="30" cy="22" r="1.8" fill="${ink}"/>`),
    "pork-liver": svg(`<path d="M18 38c5-14 18-22 30-17 6 3 7 9 3 15-5 7-15 12-24 10-7-2-11-5-9-8Z" fill="#8d4a3a" stroke="${ink}" stroke-width="3"/><path d="M24 30c5 4 10 5 16 2" stroke="${pale}" stroke-width="2.5" fill="none"/><path d="M22 36c6 2 12 2 18-1" stroke="#6b3428" stroke-width="2.3" fill="none"/>`),
    "pork-intestine": svg(`<path d="M16 30c0-8 6-14 12-14s12 6 12 14c0 5-4 9-10 9-4 0-8-2-10-6" fill="${soft}" stroke="${ink}" stroke-width="3"/><path d="M40 30c0 8 6 14 12 14 6 0 10-6 10-14" fill="${soft}" stroke="${ink}" stroke-width="3"/><path d="M30 30c0 4-4 8-10 8" stroke="${ink}" stroke-width="2.3" fill="none"/>`),
    "chicken-wing": svg(`<path d="M16 34c6-8 14-13 22-12 6 0 10 4 10 9 0 5-3 9-9 12-8 4-18 4-23-9Z" fill="#e8b878" stroke="${ink}" stroke-width="3"/><path d="M36 24c4 4 5 9 2 14" stroke="#d0944e" stroke-width="2.5" fill="none"/><circle cx="44" cy="32" r="2" fill="${ink}"/>`),
    "beef-shank": svg(`<path d="M14 40c3-12 14-20 26-18 8 2 12 8 9 15-3 8-14 14-24 12-8-2-12-5-11-9Z" fill="#a85444" stroke="${ink}" stroke-width="3"/><ellipse cx="22" cy="28" rx="4" ry="2" fill="${pale}"/><path d="M42 25c-4 2-6 6-5 11" stroke="${pale}" stroke-width="2.5" fill="none"/>`),
    "duck": svg(`<path d="M20 42c7-12 18-18 28-14 5 2 7 7 5 13-3 7-12 11-21 9-8-2-13-4-12-8Z" fill="#8b6b4a" stroke="${ink}" stroke-width="3"/><path d="M36 28c5 2 8 5 7 9" stroke="#6f5237" stroke-width="2.5" fill="none"/><circle cx="44" cy="34" r="2" fill="${ink}"/>`),
    "oyster": svg(`<ellipse cx="32" cy="32" rx="16" ry="11" fill="#b8b89a" stroke="${ink}" stroke-width="3"/><path d="M20 28c4 8 10 11 18 11" fill="#d4cfb8" stroke="${ink}" stroke-width="3"/><circle cx="28" cy="30" r="3" fill="${pale}"/><circle cx="36" cy="32" r="2.5" fill="${pale}"/>`),
    "bass": svg(`<path d="M16 34c7-8 17-12 26-9 5 2 7 6 5 11-3 6-11 10-19 9-7-1-13-5-12-11Z" fill="#8faa9b" stroke="${ink}" stroke-width="3"/><path d="M30 26c4 2 6 5 5 9" stroke="${pale}" stroke-width="2.5" fill="none"/><path d="M14 32l-6-3M12 36l-5-1" stroke="${ink}" stroke-width="2.5"/><circle cx="34" cy="32" r="1.8" fill="${ink}"/>`),
    "sea-bream": svg(`<path d="M15 34c8-8 19-10 27-6 5 2 6 7 3 12-4 7-13 9-21 7-7-2-11-6-9-13Z" fill="#e88b7a" stroke="${ink}" stroke-width="3"/><path d="M28 28c4 2 6 6 4 10" stroke="${pale}" stroke-width="2.5" fill="none"/><path d="M16 30l-7-4" stroke="${ink}" stroke-width="2.5"/><circle cx="32" cy="33" r="2" fill="${ink}"/>`),
    // VEG
    "napa-cabbage": svg(`<ellipse cx="32" cy="34" rx="16" ry="14" fill="${green}" stroke="${ink}" stroke-width="3"/><path d="M22 22c4 2 6 8 4 16M34 22c-2 4-2 10 0 18" stroke="${pale}" stroke-width="2.5" fill="none"/><path d="M26 18c6-4 12-3 17 2" stroke="${pale}" stroke-width="3" fill="none"/>`),
    "cauliflower": svg(`<circle cx="32" cy="28" r="12" fill="#f0eadc" stroke="${ink}" stroke-width="3"/><path d="M24 20c3-5 9-6 13-2 3-4 8-3 10 1 3-2 7-1 8 3" fill="#f0eadc" stroke="${ink}" stroke-width="3"/><path d="M22 28c6-2 12-2 18 2" stroke="#ddd7c8" stroke-width="2.3" fill="none"/><path d="M28 17c2 3 2 7 0 12" stroke="#ddd7c8" stroke-width="2.3"/>`),
    "broccoli": svg(`<circle cx="32" cy="24" r="10" fill="${darkGreen}" stroke="${ink}" stroke-width="3"/><path d="M28 18c2-5 6-7 10-5 2-4 6-5 9-1" fill="${darkGreen}" stroke="${ink}" stroke-width="3"/><path d="M24 34l8-10M28 34l4-8M32 34l2-10" stroke="${green}" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M20 44c6-2 12-2 18 0" stroke="${ink}" stroke-width="2.3" fill="none"/>`),
    "tomato": svg(`<circle cx="32" cy="34" r="14" fill="${red}" stroke="${ink}" stroke-width="3"/><path d="M26 24c4-4 8-4 12 0" stroke="${pale}" stroke-width="2.5" fill="none"/><path d="M32 20v-5M28 16l4-1 4 1" stroke="${green}" stroke-width="3" stroke-linecap="round"/>`),
    "corn": svg(`<path d="M22 22c0-5 4-9 10-9s10 4 10 9v18c0 7-4 12-10 12s-10-5-10-12V22Z" fill="#f0c548" stroke="${ink}" stroke-width="3"/><path d="M26 24c2 3 4 5 6 4 2 1 4-1 6-4" stroke="${ink}" stroke-width="2.5" fill="none"/><path d="M24 30c2 3 4 5 6 4 2 1 4-1 6-4" stroke="${ink}" stroke-width="2.5" fill="none"/><path d="M24 36c2 3 4 5 6 4 2 1 4-1 6-4" stroke="${ink}" stroke-width="2.5" fill="none"/>`),
    "bitter-melon": svg(`<path d="M16 34c8-12 22-16 30-7 6 6 4 14-7 19-10 5-20 3-23-12Z" fill="${green}" stroke="${ink}" stroke-width="3"/><path d="M24 26c5 3 7 8 6 16M34 24c3 4 4 9 3 17" stroke="${pale}" stroke-width="2.3" fill="none"/><path d="M22 31c4 1 7 2 10 1" stroke="${darkGreen}" stroke-width="2.3" fill="none"/>`),
    "eggplant": svg(`<path d="M26 18c5 0 10 6 10 16 0 11-5 18-10 18s-10-7-10-18c0-10 5-16 10-16Z" fill="#7a5599" stroke="${ink}" stroke-width="3"/><path d="M33 18l5-4M35 16l3-3" stroke="${green}" stroke-width="3" stroke-linecap="round"/><path d="M24 30c6-2 10-2 14 0" stroke="#d7c1e6" stroke-width="2.3" fill="none"/>`),
    "bell-pepper": svg(`<path d="M18 28c5-8 16-8 22 0 4 5 4 12-2 15-5 3-14 3-19-1-5-3-5-9-1-14Z" fill="${green}" stroke="${ink}" stroke-width="3"/><path d="M24 26c4 2 6 5 5 10M36 26c-2 3-3 7-2 11" stroke="${pale}" stroke-width="2.3" fill="none"/><path d="M30 18l2-4M28 16l4-2" stroke="${green}" stroke-width="3" stroke-linecap="round"/>`),
    "green-bean": svg(`<path d="M18 32c6-12 18-18 28-12 5 3 5 9 0 13-8 7-19 8-28-1Z" fill="${green}" stroke="${ink}" stroke-width="3"/><path d="M24 28c5 3 8 7 9 13" stroke="${pale}" stroke-width="2.3" fill="none"/><path d="M44 22l4 4" stroke="${ink}" stroke-width="2.5"/>`),
    "chives": svg(`<path d="M22 44c0-12 4-22 10-28M32 44c2-10 4-20 2-30M42 44c2-8 1-18-2-28" stroke="${green}" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M20 44h24" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`),
    "celery": svg(`<path d="M22 46c4-14 10-24 20-28" stroke="${green}" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M24 44c2-8 6-12 12-16" stroke="${pale}" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M20 46h22" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`),
    "bean-sprout": svg(`<path d="M18 40c6-8 14-14 22-14" stroke="${beige}" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M18 42c8-4 16-4 24 0" stroke="${beige}" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M42 28l4-6M44 26l3-4" stroke="${green}" stroke-width="2.5" stroke-linecap="round"/><path d="M20 40l2-6" stroke="${green}" stroke-width="2.5" stroke-linecap="round"/>`),
    "okra": svg(`<path d="M24 22c4-4 10-6 14-4 4 2 5 7 3 12-3 7-9 12-16 13-5 1-9-2-7-7 2-6 2-10 6-14Z" fill="${green}" stroke="${ink}" stroke-width="3"/><path d="M28 24c4 4 4 9 2 16M36 24c-2 4-3 8-2 15" stroke="${pale}" stroke-width="2.3" fill="none"/>`),
    "old-ginger": svg(`<path d="M20 34c6-10 16-14 25-8 6 4 5 11-3 15-8 4-17 3-22-7Z" fill="${beige}" stroke="${ink}" stroke-width="3"/><path d="M26 28c5 3 7 8 5 15M34 26c4 4 5 9 4 16" stroke="${brown}" stroke-width="2.3" fill="none"/>`),
    "basil": svg(`<path d="M28 44l4-26M32 44l2-22M36 44l-1-24" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/><path d="M24 22c4-8 10-9 13-3 3-5 8-4 10 2 2-3 6-2 9 4" fill="${green}" stroke="${ink}" stroke-width="3"/><path d="M20 44h24" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`),
    "cilantro": svg(`<path d="M24 48l8-32M32 48l4-28M40 48l2-26" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/><circle cx="20" cy="22" r="5" fill="${green}" stroke="${ink}" stroke-width="2.8"/><circle cx="34" cy="18" r="4.5" fill="${green}" stroke="${ink}" stroke-width="2.8"/><circle cx="46" cy="24" r="4" fill="${green}" stroke="${ink}" stroke-width="2.8"/><path d="M22 44h22" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`),
    "chili": svg(`<path d="M30 18c-2 8-4 14-8 18-4 5-10 7-13 4s-2-9 3-14c3-3 6-5 8-8" fill="${red}" stroke="${ink}" stroke-width="3"/><path d="M28 20l6-8M26 18l8-6" stroke="${green}" stroke-width="2.5" stroke-linecap="round"/><path d="M22 28c3 2 5 4 4 8" stroke="${pale}" stroke-width="2.3" fill="none"/>`),
    "wood-ear": svg(`<ellipse cx="32" cy="32" rx="16" ry="10" fill="#5a3d2b" stroke="${ink}" stroke-width="3"/><path d="M20 28c6-4 14-4 20 0" stroke="#8a6b55" stroke-width="2.5" fill="none"/><path d="M18 34c6-4 16-4 24 0" stroke="#8a6b55" stroke-width="2.5" fill="none"/><path d="M26 24c-4 8-4 16 0 24" stroke="#6a4d39" stroke-width="2.3" fill="none"/>`),
    "bunashimeji": svg(`<path d="M22 32V24c0-4 3-7 7-7s7 3 7 7v8" stroke="${ink}" stroke-width="3" fill="none"/><ellipse cx="22" cy="34" rx="7" ry="5" fill="${beige}" stroke="${ink}" stroke-width="3"/><ellipse cx="36" cy="34" rx="7" ry="5" fill="${beige}" stroke="${ink}" stroke-width="3"/><ellipse cx="29" cy="36" rx="7" ry="5" fill="${beige}" stroke="${ink}" stroke-width="3"/><path d="M22 26c2 2 4 2 6 0M32 26c2 2 4 2 6 0" stroke="${ink}" stroke-width="2.3" fill="none"/>`),
    // EGG
    "fried-tofu": svg(`<rect x="16" y="20" width="32" height="24" rx="6" fill="#f0c670" stroke="${ink}" stroke-width="3"/><path d="M20 28h24M20 36h24" stroke="${brown}" stroke-width="2.3"/>`),
    "stinky-tofu": svg(`<rect x="16" y="20" width="32" height="24" rx="6" fill="#7a7845" stroke="${ink}" stroke-width="3"/><path d="M20 27c6 2 12 2 18 0M20 35c6 2 12 2 18 0" stroke="#a8a665" stroke-width="2.4"/>`),
    "edamame": svg(`<path d="M22 26c6-8 14-10 20-6 5 4 4 10-3 14-8 5-17 4-20-2-2-3-18-3 3-6Z" fill="${green}" stroke="${ink}" stroke-width="3"/><ellipse cx="34" cy="28" rx="4" ry="3" fill="${pale}" stroke="${ink}" stroke-width="2.5"/><ellipse cx="28" cy="26" rx="3.5" ry="2.8" fill="${pale}" stroke="${ink}" stroke-width="2.5"/>`),
    // GRAIN
    "udon": svg(`<path d="M16 30c0-8 6-14 14-14s14 6 14 14v7c0 4-3 7-7 7H23c-4 0-7-3-7-7v-7Z" fill="${beige}" stroke="${ink}" stroke-width="3"/><path d="M20 28c4 2 8 2 12 0 4 2 8 2 12 0M20 35c4 2 8 2 12 0 4 2 8 2 12 0" stroke="${ink}" stroke-width="2.5" fill="none"/>`),
    "oil-noodles": svg(`<path d="M16 34c8-8 20-10 29-5c4 3 3 8-3 12-8 6-21 7-28 1-5-4-4-6 2-8Z" fill="${yellow}" stroke="${ink}" stroke-width="3"/><path d="M22 30c6 3 10 3 16-1" stroke="${beige}" stroke-width="2.5" fill="none"/><path d="M24 38c4 2 10 2 16-1" stroke="${beige}" stroke-width="2.5" fill="none"/>`),
    "dumpling": svg(`<ellipse cx="32" cy="34" rx="14" ry="10" fill="${beige}" stroke="${ink}" stroke-width="3"/><path d="M18 30c4-2 8-2 12 0 4-2 8-2 12 0" stroke="${ink}" stroke-width="2.5" fill="none"/><path d="M22 24c4-4 10-5 14-2 3 2 3 6 0 6M36 24c2-3 0-6-4-6" stroke="${ink}" stroke-width="2.5" fill="none"/>`),
    "wonton": svg(`<path d="M18 34c4-6 10-9 16-7 4 2 4 8 0 10-6 3-14 3-18-2-2-3 0-5 2-1Z" fill="${beige}" stroke="${ink}" stroke-width="3"/><path d="M38 28c3-2 6-3 8-1 2 3 0 8-4 9" fill="${beige}" stroke="${ink}" stroke-width="3"/><path d="M28 22c-2 4-2 8 0 12" stroke="${ink}" stroke-width="2.3" fill="none"/>`),
    "sweet-potato": svg(`<ellipse cx="32" cy="34" rx="12" ry="16" fill="#d4784a" stroke="${ink}" stroke-width="3"/><path d="M42 20c4-4 8-3 10 2" stroke="${brown}" stroke-width="4" stroke-linecap="round"/><path d="M26 28c6-2 10-2 14 0" stroke="#b45c34" stroke-width="2.3" fill="none"/><path d="M24 36c6-2 12-2 18 0" stroke="#b45c34" stroke-width="2.3" fill="none"/>`),
    "potato": svg(`<ellipse cx="32" cy="32" rx="15" ry="13" fill="#e8d4a8" stroke="${ink}" stroke-width="3"/><circle cx="26" cy="26" r="2" fill="${brown}"/><circle cx="36" cy="28" r="2.5" fill="${brown}"/><circle cx="30" cy="38" r="1.8" fill="${brown}"/>`),
    "pumpkin": svg(`<ellipse cx="32" cy="32" rx="16" ry="12" fill="${orange}" stroke="${ink}" stroke-width="3"/><path d="M24 24c-4 8-4 16 0 20M32 22v20M40 24c4 8 4 16 0 20" stroke="${pale}" stroke-width="2.5" fill="none"/><path d="M32 20l-2-5M32 20l2-4" stroke="${green}" stroke-width="2.5" stroke-linecap="round"/>`),
    // PANTRY
    "bacon": svg(`<path d="M14 32c4-10 16-16 28-12 6 2 8 7 5 13-4 7-14 13-26 11-9-2-11-6-7-12Z" fill="#c45a3c" stroke="${ink}" stroke-width="3"/><path d="M18 30c4 2 8 2 12-1 4 3 8 3 12-1" stroke="${pale}" stroke-width="2.5" fill="none"/><path d="M20 36c4 2 8 2 12-1 4 3 8 3 12-1" stroke="${pale}" stroke-width="2.5" fill="none"/>`),
    "ham": svg(`<rect x="16" y="20" width="32" height="24" rx="6" fill="#e8a27a" stroke="${ink}" stroke-width="3"/><circle cx="26" cy="30" r="3" fill="${pale}"/><circle cx="36" cy="30" r="3" fill="${pale}"/><circle cx="31" cy="38" r="2.5" fill="${pale}"/>`),
    "pork-floss": svg(`<circle cx="32" cy="32" r="15" fill="${beige}" stroke="${ink}" stroke-width="3"/><path d="M22 27c6 0 10 2 14 5M28 32c4-2 8-3 12-1M24 36c6 2 10 2 16-1" stroke="${brown}" stroke-width="3" fill="none" stroke-linecap="round"/>`),
    "dried-shrimp": svg(`<path d="M22 20c0-4 4-8 10-8s10 4 10 8c5 3 8 8 8 14 0 8-6 14-14 14-8 0-14-6-14-14 0-6 3-11 8-14" fill="#e8a060" stroke="${ink}" stroke-width="3"/><circle cx="38" cy="30" r="1.8" fill="${ink}"/><path d="M28 28c-2 4-2 10 0 16" stroke="#d48448" stroke-width="2.3" fill="none"/>`),
    "dried-shiitake": svg(`<path d="M16 30c2-8 10-14 18-14s16 6 18 14H16Z" fill="#6b4a30" stroke="${ink}" stroke-width="3"/><path d="M26 30v8M32 30v10M38 30v8" stroke="${beige}" stroke-width="3" stroke-linecap="round"/><path d="M28 40c4 3 8 3 12-1" stroke="${ink}" stroke-width="2.5" fill="none"/>`),
    "pickled-mustard": svg(`<path d="M18 32c4-10 14-16 24-13 6 2 8 7 5 12-4 6-13 11-22 9-8-2-10-4-7-8Z" fill="#7a8835" stroke="${ink}" stroke-width="3"/><path d="M24 28c4 2 7 4 7 10" stroke="${pale}" stroke-width="2.3" fill="none"/><path d="M36 26c-2 4-2 9 0 14" stroke="${pale}" stroke-width="2.3" fill="none"/>`),
    "pickled-veg": svg(`<path d="M18 34c6-8 16-10 24-5 5 3 5 8 1 12-6 5-17 7-24 1-4-3-2-6-1-8Z" fill="#c4b340" stroke="${ink}" stroke-width="3"/><path d="M24 30c4 2 6 5 5 10" stroke="${pale}" stroke-width="2.3" fill="none"/><path d="M36 28c-2 4-2 9-1 14" stroke="${pale}" stroke-width="2.3" fill="none"/>`),
    "dried-radish": svg(`<ellipse cx="32" cy="32" rx="14" ry="8" fill="#d4c8a4" stroke="${ink}" stroke-width="3"/><path d="M20 26c6-4 14-4 20 0" stroke="${beige}" stroke-width="2.5" fill="none"/><path d="M18 34c6-4 14-4 24 0" stroke="${beige}" stroke-width="2.5" fill="none"/><path d="M28 24c-4 6-4 14 0 18M36 24c4 6 4 14 0 18" stroke="#b8ac88" stroke-width="2.3" fill="none"/>`),
    "peanut": svg(`<ellipse cx="26" cy="30" rx="8" ry="5" fill="${beige}" stroke="${ink}" stroke-width="3" transform="rotate(-20 26 30)"/><ellipse cx="38" cy="34" rx="8" ry="5" fill="${beige}" stroke="${ink}" stroke-width="3" transform="rotate(15 38 34)"/><ellipse cx="32" cy="26" rx="7" ry="4.5" fill="${beige}" stroke="${ink}" stroke-width="3" transform="rotate(-5 32 26)"/>`),
    "bonito": svg(`<circle cx="32" cy="32" r="15" fill="#e0a880" stroke="${ink}" stroke-width="3"/><path d="M22 28c4-2 8-2 12 0 4-2 8-2 12 0" stroke="${pale}" stroke-width="2.5" fill="none"/><path d="M24 36c4-2 8-2 12 0 4-2 8-2 12 0" stroke="${pale}" stroke-width="2.5" fill="none"/>`),
    "nori": svg(`<rect x="16" y="16" width="32" height="32" rx="4" fill="#2a3a28" stroke="${ink}" stroke-width="3"/><path d="M22 24c6 2 12 2 18 0M22 32c6 2 12 2 18 0M22 40c6 2 12 2 18 0" stroke="#4a6a48" stroke-width="2.3"/>`),
  };

  return art[kind] ?? <span className="text-2xl">•</span>;
}

const promptFor = (ingredients: string[]) => `你是台灣日式居酒屋「阿柴食堂」的大將，幽默可愛，句尾自然加上「汪!」。請根據食材 ${ingredients.join("、")} 回傳嚴格 JSON：{"dishName":"","cookingTime":"","shibaTalk":"","ingredientsUsed":[""],"seasoningNotes":[""],"platingNotes":"","cookingSteps":["..."]}。步驟至少 8 段，必須包含備料、火力控制、大火中火小火、台式調味（醬油、米酒、鹽，可視情況加胡椒、糖、香油）、下鍋順序、份量感與視覺判斷。ingredientsUsed 要列出實際使用食材；seasoningNotes 要列出調味重點；platingNotes 要描述最後擺盤與完成樣貌。禁止輸出 markdown 或其他說明。`;

const parseRecipe = (text: string): Recipe => {
  const raw = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const d = JSON.parse(raw);
  return {
    dishName: d.dishName ?? d["菜名"] ?? "阿柴私房菜",
    cookingTime: d.cookingTime ?? d["烹飪時間"] ?? "25～35 分鐘",
    shibaTalk: d.shibaTalk ?? d["大將碎碎念"] ?? "今晚這鍋香得很穩，直接上桌汪!",
    cookingSteps: d.cookingSteps ?? d["料理步驟"] ?? [],
    ingredientsUsed: d.ingredientsUsed ?? d["使用食材"] ?? [],
    seasoningNotes: d.seasoningNotes ?? d["調味重點"] ?? [],
    platingNotes: d.platingNotes ?? d["擺盤完成描述"] ?? "把熱騰騰的料理盛進深盤，表面留一點醬亮與蔥花，像居酒屋剛出餐的樣子汪!",
  };
};

const fallbackRecipe = (ings: string[]): Recipe => ({
  dishName: ings.includes("白飯") ? "琥珀醬香柴燒滑蛋肉片丼" : ings.includes("麵條") || ings.includes("意麵") ? "阿柴深夜鐵鍋醬炒暖胃麵" : "阿柴居酒屋私房香炒三寶",
  cookingTime: "25～35 分鐘",
  shibaTalk: `老闆，今天把 ${ings.slice(0, 4).join("、")} 叫來集合，這鍋做完隔壁桌都會流口水汪!`,
  ingredientsUsed: ings,
  seasoningNotes: ["基礎鹹香：醬油 1.5～2 大匙", "去腥提香：米酒 1 大匙", "收尾校味：鹽少量、白胡椒少量", "圓潤提鮮：可依口味補 1/2 小匙糖或幾滴香油"],
  platingNotes: "建議盛進暖色深盤或木紋碗，主料堆高、醬汁薄亮，最後撒青蔥或白芝麻，讓完成圖看起來像居酒屋現點現炒汪!",
  cookingSteps: [
    "【前置備料】肉類切成入口大小，海鮮擦乾水分；洋蔥切絲、大蒜切末、青蔥切花，菇類撕散，葉菜切段。若有豆腐先壓掉多餘水分，等等比較不會碎汪!",
    "【抓底味】肉片先拌少量鹽、白胡椒、1 小匙醬油與少量米酒，抓拌 3 分鐘，讓底味先進去。",
    "【起鍋爆香】熱鍋後下 1.5 大匙油，用中火把蒜末與洋蔥炒到微透明，聞到甜香但蒜還沒焦，就是對的時間點。",
    "【主角下鍋】轉中大火，下肉類先鋪平不要急著翻，讓表面先吃鍋氣 20～30 秒，再翻炒到七分熟。海鮮請在肉類變色後再下。",
    "【分批加料】硬質蔬菜與菇類先下，葉菜、小黃瓜、絲瓜後下。若鍋子偏乾，沿鍋邊補 2～3 大匙水。",
    "【居酒屋調味】加入 1.5～2 大匙醬油、1 大匙米酒、少量鹽，想要更圓潤可補半小匙糖。若有泡菜可後下保留酸香，起司則在關火前鋪上。",
    "【火候收汁】維持中火快速翻拌，讓醬汁均勻裹上食材。理想狀態是表面油亮、鍋底不積太多水。",
    "【視覺判斷】肉片邊緣帶點焦糖色、蔬菜仍保有亮度、菇類吸飽醬香不軟爛，就是差不多完成。",
    "【盛盤】起鍋前撒青蔥，若搭白飯就直接鋪成丼飯；若搭麵類，記得把鍋底香汁一起拌進去，香氣會更完整汪!",
  ],
});

async function fetchRecipe(provider: Provider, apiKey: string, baseUrl: string, ingredients: string[]) {
  // First try built-in recipe library for faster result
  const builtin = matchBuiltinRecipe(ingredients);
  if (builtin) {
    await new Promise((r) => setTimeout(r, 1800)); // Keep cooking animation feel
    return builtin;
  }
  // Fall back to AI if no built-in match and API key is set
  if (!apiKey.trim()) {
    await new Promise((r) => setTimeout(r, 2200));
    return matchBuiltinRecipe(ingredients) || fallbackRecipe(ingredients);
  }
  if (provider === "openai") {
    const res = await fetch(baseUrl || "https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: promptFor(ingredients) }, { role: "user", content: `請用這些食材做菜：${ingredients.join("、")}` }],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json();
    return parseRecipe(data.choices?.[0]?.message?.content ?? "{}");
  }
  const url = baseUrl || `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: promptFor(ingredients) }] }], generationConfig: { responseMimeType: "application/json" } }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return parseRecipe(data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}");
};

function reorder(items: string[], fromItem: string, toItem: string) {
  const fromIndex = items.indexOf(fromItem);
  const toIndex = items.indexOf(toItem);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return items;
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function DishIllustration({ recipe, selected }: { recipe: Recipe; selected: string[] }) {
  const dish = recipe.dishName;
  const hasSeafood = selected.some((item) => ["蝦子", "蛤蜊", "鮭魚", "透抽", "蚵仔", "小卷", "干貝", "鱸魚", "鯛魚"].includes(item));
  const hasLeafy = selected.some((item) => ["高麗菜", "空心菜", "地瓜葉", "青蔥", "大白菜", "韭菜", "豆芽菜", "芹菜", "香菜", "九層塔", "地瓜葉"].includes(item));
  const hasEgg = selected.some((item) => ["雞蛋", "皮蛋", "鹹蛋", "雞蛋豆腐"].includes(item));
  const hasRice = selected.includes("白飯") || /丼|飯|燴飯/.test(dish);
  const hasNoodle = selected.some((item) => ["麵條", "意麵", "泡麵", "冬粉", "米粉", "烏龍麵", "油麵", "水餃", "餛飩"].includes(item)) || /麵|粉/.test(dish);
  const hasSoup = /湯|鍋|煮|燉|羹/.test(dish);
  const hasGrill = /烤|炙|燒|串/.test(dish);
  const hasSteam = /蒸/.test(dish);
  const hasFry = /炸|酥/.test(dish);
  const hasMushroom = selected.some((item) => ["金針菇", "香菇", "杏鮑菇", "鴻禧菇", "木耳"].includes(item));
  const hasMeat = selected.some((item) => ["豬肉片", "五花肉", "絞肉", "豬小排", "豬肝", "大腸", "雞胸肉", "雞腿肉", "雞翅", "牛肉片", "牛腱", "鴨肉", "香腸", "貢丸", "培根", "火腿"].includes(item));
  const hasTofu = selected.some((item) => ["傳統豆腐", "嫩豆腐", "雞蛋豆腐", "百頁豆腐", "豆皮", "豆乾", "油豆腐", "臭豆腐"].includes(item));
  const hasPickle = selected.some((item) => ["泡菜", "酸菜", "榨菜", "菜脯"].includes(item));
  const hasCorn = selected.includes("玉米");
  const hasPotato = selected.some((item) => ["馬鈴薯", "地瓜", "南瓜"].includes(item));
  const layout: "bowl" | "plate" | "pot" | "grill" | "steam" | "stir" = hasSteam ? "steam" : hasFry ? "grill" : hasSoup ? "pot" : hasGrill ? "grill" : hasRice || hasNoodle ? "bowl" : "plate";

  return (
    <div className="sketch-card relative overflow-hidden p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="label-row">料理完成圖</div>
        <span className="handdrawn-badge rounded-full px-2 py-1 text-[11px] font-black">依菜名變化構圖</span>
      </div>
      <div className="relative mx-auto h-60 max-w-[300px] rounded-[2rem] bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.95),rgba(255,243,217,0.88)_44%,rgba(236,204,149,0.94)_70%,rgba(221,178,111,0.98)_100%)] shadow-[inset_0_6px_12px_rgba(255,255,255,0.42),0_18px_34px_rgba(143,95,47,0.18)]">
        <svg viewBox="0 0 320 240" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <ellipse cx="160" cy="206" rx="118" ry="22" fill="rgba(121,74,39,0.12)" />

          {layout === "bowl" && (
            <g>
              <ellipse cx="160" cy="126" rx="120" ry="66" fill="#f8f1df" stroke="#7a4a2b" strokeWidth="5" />
              <ellipse cx="160" cy="127" rx="95" ry="44" fill={hasRice ? '#fff9f0' : '#f2d577'} stroke="#7a4a2b" strokeWidth="3.5" />
              {hasRice && <><path d="M90 124c18-7 35-7 52 0 16-7 33-7 50 0 18-8 34-8 49 0" stroke="#f1ede3" strokeWidth="10" strokeLinecap="round" fill="none" /><path d="M102 140c14-6 28-6 43 0 13-6 27-6 42 0 14-6 28-6 40 0" stroke="#f1ede3" strokeWidth="9" strokeLinecap="round" fill="none" /></>}
              {hasNoodle && <><path d="M86 116c24-13 58-15 89-9 22-8 46-7 67 5" stroke="#f0c65f" strokeWidth="8" strokeLinecap="round" fill="none" /><path d="M92 130c22-10 49-11 77-3 26-7 48-6 64 3" stroke="#f0c65f" strokeWidth="8" strokeLinecap="round" fill="none" /><path d="M98 144c18-8 38-8 58-1 20-6 39-6 54 1" stroke="#f0c65f" strokeWidth="7" strokeLinecap="round" fill="none" /></>}
            </g>
          )}

          {layout === "plate" && (
            <g>
              <ellipse cx="160" cy="132" rx="126" ry="54" fill="#fff6e8" stroke="#7a4a2b" strokeWidth="5" />
              <ellipse cx="160" cy="132" rx="92" ry="34" fill="#fffdf7" stroke="#d8b48b" strokeWidth="3" />
              <path d="M92 137c14-19 34-30 54-30 17 0 30 7 39 21 8 13 16 19 28 22 13 2 24-1 33-11 9-10 18-14 28-12 7 2 13 7 16 14-7 10-16 16-28 18-14 3-29 0-43-8-13 8-28 12-45 12-30 0-57-10-82-26Z" fill="#91583a" stroke="#7a4a2b" strokeWidth="4" />
            </g>
          )}

          {layout === "pot" && (
            <g>
              <ellipse cx="160" cy="140" rx="122" ry="24" fill="#4a2d1c" opacity="0.14" />
              <rect x="70" y="86" width="180" height="92" rx="26" fill="#5b341e" stroke="#7a4a2b" strokeWidth="5" />
              <ellipse cx="160" cy="92" rx="100" ry="26" fill="#6f4025" stroke="#7a4a2b" strokeWidth="4" />
              <ellipse cx="160" cy="94" rx="88" ry="18" fill="#d8a064" stroke="#7a4a2b" strokeWidth="3" />
              <path d="M88 92c16 7 32 9 49 4 15 6 32 8 49 4 17 6 32 6 46 0" stroke="#f4d59d" strokeWidth="7" strokeLinecap="round" fill="none" />
              <path d="M58 108c-18 3-23 12-23 22 0 10 9 18 23 18M262 108c18 3 23 12 23 22 0 10-9 18-23 18" stroke="#7a4a2b" strokeWidth="5" fill="none" strokeLinecap="round" />
            </g>
          )}

          {layout === "grill" && (
            <g>
              <rect x="68" y="92" width="184" height="96" rx="18" fill="#413027" stroke="#7a4a2b" strokeWidth="5" />
              <rect x="82" y="106" width="156" height="68" rx="12" fill="#2f2b29" stroke="#7a4a2b" strokeWidth="3" />
              <path d="M94 118h132M94 134h132M94 150h132M94 166h132" stroke="#70645d" strokeWidth="4" />
              <path d="M110 182c8-10 13-17 18-28M154 182c8-10 13-17 18-28M198 182c8-10 13-17 18-28" stroke="#ffb05f" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
            </g>
          )}

          {layout === "steam" && (
            <g>
              <ellipse cx="160" cy="148" rx="112" ry="24" fill="#4a2d1c" opacity="0.10" />
              <rect x="68" y="82" width="184" height="94" rx="20" fill="#e8dcc8" stroke="#7a4a2b" strokeWidth="5" />
              <ellipse cx="160" cy="86" rx="96" ry="22" fill="#dfd0b8" stroke="#7a4a2b" strokeWidth="4" />
              <path d="M98 56c8-12 18-16 28-10 10 6 10 18 2 24M162 52c8-14 20-18 30-10 10 8 8 20-2 28M212 60c6-10 14-14 22-8 8 6 6 16-2 22" stroke="#d4d4d4" strokeWidth="5" strokeLinecap="round" opacity="0.6" fill="none" />
              <path d="M108 66c6-8 14-10 20-5 6 5 4 12-4 16M172 62c6-10 16-12 22-5 6 7 4 14-4 18M206 64c4-8 10-10 16-5 6 5 4 10-2 14" stroke="#e8e0d0" strokeWidth="4" strokeLinecap="round" opacity="0.5" fill="none" />
              <ellipse cx="160" cy="96" rx="78" ry="16" fill="#fff9f0" stroke="#7a4a2b" strokeWidth="3.5" />
              <path d="M100 92c12 6 26 8 40 4 14 5 28 6 44 2 14 5 28 5 38-2" stroke="#ece4d4" strokeWidth="6" strokeLinecap="round" fill="none" />
            </g>
          )}

          {hasMeat && (
            <g>
              <path d="M92 123c15-13 34-16 47-9 11 6 10 18-2 26-14 10-35 11-45 3-9-7-8-12 0-20Z" fill="#d68673" stroke="#7a4a2b" strokeWidth="4" />
              <path d="M117 115c7 6 11 11 15 22" stroke="#ffe8d3" strokeWidth="3" fill="none" />
              <path d="M168 110c16-14 33-15 46-7 12 7 10 19-3 28-14 10-34 10-45 0-10-8-8-14 2-21Z" fill={layout === 'grill' ? '#c85e39' : '#b95f3e'} stroke="#7a4a2b" strokeWidth="4" />
              <path d="M180 117c8 6 13 12 16 22" stroke="#f5c59f" strokeWidth="3" fill="none" />
            </g>
          )}

          {hasSeafood && (
            <g>
              <path d="M118 158c8-15 24-23 37-20 11 3 13 13 6 22-8 11-24 16-36 12-10-4-14-6-7-14Z" fill="#f1a07a" stroke="#7a4a2b" strokeWidth="4" />
              <path d="M123 163c8 0 13 3 14 8" stroke="#7a4a2b" strokeWidth="2.6" fill="none" />
              <path d="M196 155c0-16 12-26 25-26s25 10 25 26h-50Z" fill="#ddb7a2" stroke="#7a4a2b" strokeWidth="4" />
              <path d="M201 155c4 7 9 10 20 10 10 0 15-3 20-10" fill="#f0d1c7" stroke="#7a4a2b" strokeWidth="4" />
            </g>
          )}

          {hasLeafy && (
            <g>
              <path d="M91 102c12-17 27-23 41-17 12 5 14 18 3 28-12 11-31 11-40 1-8-8-10-5-17 1" fill="#84b96a" stroke="#7a4a2b" strokeWidth="4" />
              <path d="M196 96c14-16 29-20 42-12 12 8 11 20 0 30-11 10-29 7-38-7" fill="#8fc270" stroke="#7a4a2b" strokeWidth="4" />
            </g>
          )}

          {hasMushroom && (
            <g>
              <path d="M140 88c4-10 13-15 24-15s20 5 24 15h-48Z" fill="#8c654b" stroke="#7a4a2b" strokeWidth="4" />
              <path d="M151 88v15M165 88v18M179 88v15" stroke="#e8d8c7" strokeWidth="3.2" strokeLinecap="round" />
            </g>
          )}

          {hasTofu && (
            <g>
              <rect x="120" y="171" width="28" height="18" rx="5" fill="#fff8ee" stroke="#7a4a2b" strokeWidth="4" />
              <rect x="156" y="168" width="34" height="20" rx="6" fill="#efd178" stroke="#7a4a2b" strokeWidth="4" />
              <rect x="198" y="170" width="30" height="18" rx="6" fill="#f2ddb2" stroke="#7a4a2b" strokeWidth="4" />
            </g>
          )}

          {hasEgg && (
            <g>
              <ellipse cx="140" cy="136" rx="16" ry="12" fill="#fff5e4" stroke="#7a4a2b" strokeWidth="4" />
              <circle cx="140" cy="136" r="6" fill="#efbb3f" />
              <ellipse cx="222" cy="120" rx="17" ry="13" fill="#f6d57a" stroke="#7a4a2b" strokeWidth="4" />
            </g>
          )}

          {layout === 'grill' && <path d="M102 109c8 10 15 12 26 9M188 108c9 10 17 12 29 9" stroke="#ffd18f" strokeWidth="5" strokeLinecap="round" opacity="0.85" />}
          {layout === 'pot' && <path d="M118 67c6-10 15-14 22-10M160 60c5-12 16-16 23-10M199 67c6-9 14-11 20-7" stroke="#fff5e4" strokeWidth="4" strokeLinecap="round" opacity="0.9" />}
          {layout !== 'pot' && <path d="M95 82c16 10 30 13 44 8M211 82c13 10 25 13 39 10" stroke="#8fc46d" strokeWidth="7" strokeLinecap="round" />}
        </svg>
      </div>
      <p className="mt-3 text-sm leading-7 text-[#74452a]">{recipe.platingNotes}</p>
    </div>
  );
}

function CookingMiniAnimation({ selected, mode }: { selected: string[]; mode: CookingMode }) {
  const tokens = selected.slice(0, 6);
  return (
    <div className="pointer-events-none absolute inset-0">
      {tokens.map((item, index) => (
        <div
          key={item}
          className={`cooking-token absolute rounded-full bg-[#fff6e8] px-2 py-1 text-[11px] font-black text-[#7b4a2b] shadow-[0_8px_14px_rgba(128,83,42,0.12)] ${mode === "stir" ? "cooking-token-stir" : mode === "boil" ? "cooking-token-boil" : "cooking-token-grill"}`}
          style={{ left: `${15 + (index % 3) * 22}%`, top: `${18 + Math.floor(index / 3) * 18}%`, animationDelay: `${index * 0.35}s` }}
        >
          {item}
        </div>
      ))}
      <div className={`absolute left-1/2 top-[26%] h-18 w-18 -translate-x-1/2 rounded-full blur-xl ${mode === "stir" ? "bg-[radial-gradient(circle,rgba(255,255,255,0.82),rgba(255,233,186,0.2)_55%,transparent_75%)] animate-pulse" : mode === "boil" ? "bg-[radial-gradient(circle,rgba(255,255,255,0.92),rgba(214,242,255,0.28)_52%,transparent_75%)] boil-core" : "bg-[radial-gradient(circle,rgba(255,214,160,0.82),rgba(255,122,61,0.18)_52%,transparent_75%)] grill-core"}`} />
    </div>
  );
}

// ===== 內建食譜庫（150道）=====
export const builtinRecipes: Recipe[] = [
  // ===== 肉類為主（豬肉） =====
  {
    dishName: "琥珀醬香豬肉丼",
    cookingTime: "25 分鐘",
    shibaTalk: "五花肉裹上琥珀色醬汁，配白飯可以連扒三碗汪！這道是阿柴的看板招牌，老闆吃過都指定加點～",
    ingredientsUsed: ["五花肉", "洋蔥", "雞蛋", "白飯", "青蔥"],
    seasoningNotes: ["醬油 2 大匙、味醂 1 大匙、米酒 1 大匙", "糖 1 小匙，讓醬汁濃稠帶光澤", "收汁前淋一圈醬油膏增加厚度"],
    platingNotes: "盛進深色丼碗，白飯鋪底、五花肉片堆疊成小山，醬汁均勻裹在肉片上閃閃發亮，正中間放一顆溫泉蛋黃，撒上翠綠蔥花，旁邊配兩片醃蘿蔔點綴汪！",
    cookingSteps: [
      "【前置備料】五花肉切成 0.5 公分厚片，洋蔥逆紋切絲，青蔥切花，雞蛋分開蛋黃蛋白。",
      "【五花肉預處理】鍋中不放油，直接將五花肉片平鋪下去，用中火逼出油脂，煎到兩面金黃微焦，夾起備用。",
      "【炒洋蔥】用逼出的豬油炒洋蔥絲，中火炒到透明微焦，釋放天然甜味。",
      "【調醬汁】在碗中混合醬油 2 大匙、味醂 1 大匙、米酒 1 大匙、糖 1 小匙，攪拌均勻。",
      "【合併燉煮】將五花肉倒回鍋中，倒入醬汁，轉小火慢慢收汁 3 分鐘，讓肉片吸滿醬色。",
      "【蛋白處理】在鍋邊淋入蛋白，稍微攪拌成蛋白絲，增加口感層次。",
      "【火候關鍵】當醬汁從稀變濃、泡泡變大變密的時候代表快好了，不要收到全乾，留一些醬汁拌飯。",
      "【盛盤】白飯盛入碗中，鋪上醬香五花肉，中間放蛋黃，撒上大量蔥花，最後淋上一匙鍋底醬汁。",
    ],
  },
  {
    dishName: "阿柴薑汁燒肉",
    cookingTime: "20 分鐘",
    shibaTalk: "薑汁燒肉是日式便當王者，但阿柴加了一點台式靈魂，醬油香整個衝出來汪！",
    ingredientsUsed: ["豬肉片", "洋蔥", "大蒜", "白飯"],
    seasoningNotes: ["醬油 2 大匙、味醂 1 大匙、米酒 1 大匙", "生薑泥 1 大匙（現磨）", "糖 1/2 小匙平衡鹹味"],
    platingNotes: "白飯墊底，薑汁豬肉片層層疊放，醬汁自然流淌到飯上，旁邊放一點高麗菜絲增加爽脆感，撒上七味粉和蔥花點綴汪！",
    cookingSteps: [
      "【前置備料】豬肉片用廚房紙巾吸乾水分，洋蔥切薄絲，大蒜切末，生薑磨成泥。",
      "【調醬汁】醬油 2 大匙、味醂 1 大匙、米酒 1 大匙、糖 1/2 小匙、薑泥 1 大匙，攪拌均勻備用。",
      "【熱鍋】鍋中下 1 大匙油，中火加熱到油紋浮現。",
      "【爆香】先下蒜末炒香約 15 秒，再加入洋蔥絲炒到微軟。",
      "【煎肉片】將豬肉片一片片展開鋪入鍋中，不要疊放，中大火煎 20 秒後翻面。",
      "【下醬汁】肉片變色後倒入醬汁，轉大火快速翻炒，讓每片肉都裹上醬色。",
      "【收汁】約 30 秒後醬汁變濃稠，肉片邊緣呈現誘人的焦糖色即可關火。",
      "【盛盤】白飯裝碗，鋪上薑汁燒肉，淋上鍋底剩餘醬汁，撒上蔥花或七味粉。",
    ],
  },
  {
    dishName: "台式滷肉燥",
    cookingTime: "60 分鐘",
    shibaTalk: "阿柴的滷肉燥是慢火熬出來的，膠質全化在醬汁裡，淋在飯上那個光澤…老闆請給我一碗汪！",
    ingredientsUsed: ["絞肉", "紅蔥頭", "大蒜", "香菇", "白飯"],
    seasoningNotes: ["醬油 3 大匙、醬油膏 1 大匙", "冰糖 1 大匙（比砂糖更亮）", "白胡椒 1/2 小匙、五香粉 1/4 小匙"],
    platingNotes: "白飯盛碗後壓實倒扣在盤中，從周圍淋上滷肉燥，醬汁自然流下覆蓋半個飯面，旁邊放一顆滷蛋和燙青菜，最後撒一點白芝麻汪！",
    cookingSteps: [
      "【前置備料】紅蔥頭切薄片，大蒜切末，乾香菇泡軟後切小丁（約 3-4 朵）。",
      "【煸豬油】鍋中下 1 大匙油，用小火慢慢煸紅蔥頭，直到金黃酥脆，撈起一半備用。",
      "【炒肉】同一鍋轉中大火，下絞肉炒散，炒到肉色變白、水分收乾、開始出油。",
      "【爆香】加入蒜末和香菇丁，翻炒約 2 分鐘直到香氣四溢。",
      "【調味下醬】加入醬油 3 大匙、醬油膏 1 大匙、冰糖 1 大匙，翻炒讓糖融化、肉末上色。",
      "【加水燉煮】加入 400ml 熱水，轉小火蓋鍋蓋燉 40 分鐘。期間偶爾攪拌避免黏鍋。",
      "【最後調味】開鍋蓋轉中火收汁 5 分鐘，加入白胡椒和五香粉，試味道調整。",
      "【盛盤】白飯盛碗，淋上滿滿滷肉燥和醬汁，再放上之前撈起的酥脆紅蔥頭，搭配半顆滷蛋。",
    ],
  },
  {
    dishName: "蒜苗炒五花肉",
    cookingTime: "15 分鐘",
    shibaTalk: "五花肉煎到恰恰、蒜苗的嗆辣香氣衝出來，這道菜一上桌白飯就不夠了汪！",
    ingredientsUsed: ["五花肉", "大蒜", "青蔥", "白飯"],
    seasoningNotes: ["醬油 1.5 大匙、米酒 1 大匙", "白胡椒 1/2 小匙", "少許糖提味"],
    platingNotes: "五花肉焦香金黃、蒜苗翠綠，整道菜盛進淺盤中堆成小山，醬汁微微裹在肉片上，配上一碗冒煙的白飯就是完美的一餐汪！",
    cookingSteps: [
      "【前置備料】五花肉切薄片，青蔥切段蔥白蔥綠分開，大蒜切片。",
      "【乾煎五花肉】鍋不放油，直接下五花肉片，中火煎到兩面金黃、油脂逼出。",
      "【爆香】用鍋中豬油爆香蒜片和蔥白段，聞到香味約 30 秒。",
      "【調味】加入醬油沿鍋邊嗆入、米酒 1 大匙，快速翻炒。",
      "【下蔥綠】最後加入蔥綠段，大火快炒 20 秒，保持翠綠。",
      "【收尾】撒上白胡椒粉，試味道可加少糖，翻炒均勻即可。",
      "【視覺判斷】五花肉邊緣微焦有酥脆感、蒜苗仍保持翠綠就是最佳時機。",
      "【盛盤】盛進淺盤，趁熱上桌，肉片和蒜苗交錯堆疊，醬汁薄薄一層。",
    ],
  },
  {
    dishName: "泡菜炒豬肉",
    cookingTime: "15 分鐘",
    shibaTalk: "泡菜和豬肉是韓式經典組合，阿柴加了一點台式醬油調味，酸辣鹹香一次滿足汪！",
    ingredientsUsed: ["豬肉片", "泡菜", "洋蔥", "青蔥"],
    seasoningNotes: ["韓式泡菜半碗含湯汁", "醬油 1 小匙、糖 1/2 小匙", "麻油 1 小匙收尾"],
    platingNotes: "盛進白色淺盤，豬肉片和紅通通的泡菜交織，湯汁帶點橘紅色光澤，撒上青蔥段和白芝麻，旁邊可以放一顆煎蛋汪！",
    cookingSteps: [
      "【前置備料】豬肉片解凍後用 1 小匙醬油和米酒抓醃 5 分鐘，洋蔥切絲。",
      "【熱鍋】鍋中下 1 大匙油，中大火加熱。",
      "【炒洋蔥】洋蔥絲下鍋，炒到透明微甜。",
      "【煎肉片】豬肉片鋪平下鍋，煎到兩面金黃，約 2 分鐘。",
      "【下泡菜】泡菜連同湯汁一起倒入鍋中，大火翻炒均勻。",
      "【調味】加糖 1/2 小匙中和酸味，如果太乾可加 2 大匙水。",
      "【收尾】關火前淋上麻油，撒上青蔥段翻拌一下。",
      "【盛盤】趁熱盛盤，肉片和泡菜堆疊，淋上鍋底紅色醬汁，撒白芝麻。",
    ],
  },
  {
    dishName: "香腸炒飯",
    cookingTime: "15 分鐘",
    shibaTalk: "香腸的油脂香完全炒進飯裡，每一粒米都閃閃發亮，是阿柴深夜食堂的人氣王汪！",
    ingredientsUsed: ["香腸", "雞蛋", "白飯", "青蔥", "大蒜"],
    seasoningNotes: ["醬油 1 大匙（從鍋邊嗆入）", "白胡椒 1/2 小匙", "鹽少許，因香腸已有鹹味"],
    platingNotes: "盛進深色陶盤，炒飯粒粒分明、金黃色澤，香腸切片均勻分布在飯中，上面撒一把翠綠蔥花，鍋氣十足汪！",
    cookingSteps: [
      "【前置備料】香腸先蒸或煮 5 分鐘，放涼後切小圓片。蔥切花、蒜切末。",
      "【炒蛋】鍋中下 2 大匙油，中大火把蛋液炒散，半熟狀態就起鍋。",
      "【爆香】同一鍋補少量油，下蒜末爆香，約 15 秒。",
      "【炒香腸】下香腸片，中火煎到兩面微焦，逼出油脂。",
      "【炒飯】倒入冷白飯（隔夜飯最佳），大火快速翻炒，讓每粒飯都裹上油脂，炒散不要結塊。",
      "【調味】沿鍋邊嗆入醬油 1 大匙，快速翻拌均勻，讓醬香均勻分布。",
      "【合併】蛋倒回鍋中，和飯一起拌炒均勻，撒白胡椒和鹽。",
      "【盛盤】關火撒上大量蔥花，翻拌兩下後盛盤，炒飯在盤中堆成拱形。",
    ],
  },
  {
    dishName: "貢丸湯",
    cookingTime: "15 分鐘",
    shibaTalk: "簡單的貢丸湯，重點是湯頭要有大骨甜味，阿柴偷偷加了秘密武器～喝一口就暖到肚子汪！",
    ingredientsUsed: ["貢丸", "白蘿蔔", "青蔥", "芹菜"],
    seasoningNotes: ["鹽 1 小匙、白胡椒 1/2 小匙", "雞高湯塊或柴魚片提鮮", "香油幾滴收尾"],
    platingNotes: "盛進日式湯碗，清澈金黃的湯頭飄著三顆碩大貢丸，白蘿蔔半透明入口即化，撒上青蔥花和芹菜末，滴兩滴香油在湯面汪！",
    cookingSteps: [
      "【前置備料】白蘿蔔去皮切成半月形薄片，青蔥切花、芹菜切末。",
      "【煮湯底】鍋中加 800ml 水，放入柴魚片或半塊雞湯塊，中小火煮 5 分鐘。",
      "【下蘿蔔】白蘿蔔片放入湯中，中小火煮到半透明（約 8 分鐘）。",
      "【下貢丸】貢丸洗淨後表面劃十字花，放入湯中煮到浮起（約 3 分鐘）。",
      "【調味】加鹽和白胡椒調味，試味道調整鹹淡。",
      "【視覺判斷】貢丸浮起且膨脹、蘿蔔半透明就是熟了。",
      "【收尾】關火後滴入幾滴香油，撒上蔥花和芹菜末。",
      "【盛碗】將貢丸和蘿蔔先盛進碗中，再注入熱湯，最後頂端灑蔥花。",
    ],
  },
  {
    dishName: "香腸炒高麗菜",
    cookingTime: "12 分鐘",
    shibaTalk: "香腸的油脂炒進高麗菜裡，菜甜肉香合而為一，簡單卻讓人停不下筷子汪！",
    ingredientsUsed: ["香腸", "高麗菜", "大蒜", "紅蘿蔔"],
    seasoningNotes: ["鹽 1/2 小匙、白胡椒少許", "米酒 1 小匙提香", "可不加醬油，保留清爽色澤"],
    platingNotes: "盛進白色平盤，高麗菜清亮翠綠帶點微焦邊緣，香腸片點綴其間，紅蘿蔔絲增添色彩，簡單清爽的家常感汪！",
    cookingSteps: [
      "【前置備料】香腸蒸熟後斜切片，高麗菜用手撕成小片（比刀切更好吃），紅蘿蔔切細絲，大蒜切片。",
      "【逼油】鍋中不放油，下香腸片用中小火慢慢煎到兩面微焦出油。",
      "【爆香】用鍋中的香腸油爆香蒜片，約 20 秒。",
      "【炒紅蘿蔔】先下紅蘿蔔絲炒軟，約 1 分鐘。",
      "【下高麗菜】轉大火，下高麗菜快速翻炒，讓每片葉子都裹到油。",
      "【調味】沿鍋邊嗆米酒，加鹽和白胡椒，翻炒均勻。",
      "【視覺判斷】高麗菜稍微變軟還帶點脆度時就要關火。",
      "【盛盤】盛進平盤，香腸片均勻分布，菜葉翠綠油亮。",
    ],
  },
  {
    dishName: "日式叉燒肉",
    cookingTime: "90 分鐘",
    shibaTalk: "用五花肉慢滷的日式叉燒，冰過切片配拉麵或直接下酒都無敵，阿柴偷偷加了一顆八角汪！",
    ingredientsUsed: ["五花肉", "大蒜", "青蔥", "白飯"],
    seasoningNotes: ["醬油 4 大匙、味醂 2 大匙、米酒 2 大匙", "糖 1 大匙", "八角 1 顆、薑片 3 片"],
    platingNotes: "叉燒切片後整齊排列在盤中或拉麵碗上，肉片邊緣帶深褐色醬色、中間粉紅，醬汁濃稠光亮，撒上蔥花和白芝麻，旁邊放半顆溏心蛋汪！",
    cookingSteps: [
      "【前置備料】五花肉整塊用棉繩綁緊定型，用叉子在表面戳洞幫助入味。",
      "【表面煎上色】鍋中下少許油，中火將五花肉每一面都煎到金黃上色。",
      "【煮滷汁】加入醬油、味醂、米酒、糖、八角、薑片，加水到肉的一半高度。",
      "【燉煮】大火煮滾後轉小火，蓋上烘焙紙（落蓋），慢燉 60 分鐘。",
      "【翻面】中途翻面一次讓兩邊均勻入味。",
      "【浸泡】關火後讓肉繼續浸泡在滷汁中自然冷卻，至少 30 分鐘。",
      "【切片】冷卻後的叉燒用利刀切薄片，約 0.5 公分厚。",
      "【盛盤】叉燒片整齊排列，淋少許滷汁，撒蔥花和白芝麻。",
    ],
  },
  {
    dishName: "肉絲炒豆乾",
    cookingTime: "15 分鐘",
    shibaTalk: "豆乾和肉絲的組合是經典台式家常菜，簡單下飯又便宜，阿柴食堂必備平民美食汪！",
    ingredientsUsed: ["豬肉片", "豆乾", "大蒜", "青蔥"],
    seasoningNotes: ["醬油 1.5 大匙、醬油膏 1 小匙", "白胡椒 1/2 小匙", "糖 1/2 小匙"],
    platingNotes: "盛進白色淺碟，豆乾金黃、肉絲醬色均勻，蔥花點綴其間，看起來樸實但香氣逼人，白飯殺手無誤汪！",
    cookingSteps: [
      "【前置備料】豬肉片切成絲，豆乾切成薄片再切絲，大蒜切末，青蔥切段。",
      "【醃肉】肉絲加 1 小匙醬油、少許白胡椒和米酒抓醃 5 分鐘。",
      "【炒豆乾】鍋中下 2 大匙油，中火將豆乾絲煎到兩面金黃微焦，盛起備用。",
      "【炒肉絲】同一鍋補少許油，中大火將肉絲炒到變色斷生。",
      "【爆香】下蒜末和蔥白段爆香，約 20 秒。",
      "【合併】豆乾絲倒回鍋中，和肉絲一起大火翻炒。",
      "【調味】加入醬油、醬油膏、糖、白胡椒，沿鍋邊嗆入少許水，翻炒均勻。",
      "【盛盤】撒上蔥綠段，翻兩下即可盛盤。",
    ],
  },

  // ===== 雞肉類 =====
  {
    dishName: "三杯雞",
    cookingTime: "30 分鐘",
    shibaTalk: "麻油、醬油、米酒各一杯，是台灣經典的三杯精神。阿柴版加了九層塔和薑片，香到隔壁桌來敲門汪！",
    ingredientsUsed: ["雞腿肉", "大蒜", "青蔥", "九層塔"],
    seasoningNotes: ["麻油 2 大匙、醬油 2 大匙、米酒 3 大匙", "冰糖 1 大匙", "薑片 6 片、辣椒少許"],
    platingNotes: "盛進燒熱的陶鍋或鐵鍋，雞肉深褐色醬色油亮，九層塔的翠綠點綴其間，滋滋作響上桌，香氣撲鼻，配白飯無敵汪！",
    cookingSteps: [
      "【前置備料】雞腿肉剁成塊狀（約 4 公分大小），薑切片，大蒜整顆輕拍不切碎，九層塔取葉片。",
      "【煸薑】冷鍋下麻油，小火慢慢煸薑片，直到薑片邊緣微捲曲。",
      "【爆蒜】下拍過的大蒜，繼續小火煎到蒜表面金黃。",
      "【煎雞肉】轉中火，雞皮朝下放入雞肉塊，煎到兩面金黃上色。",
      "【下調味】加入冰糖炒到融化，再加入醬油和米酒，翻炒均勻。",
      "【燉煮】蓋鍋蓋轉小火燉 10 分鐘，讓雞肉入味。",
      "【收汁】開鍋蓋轉大火收汁，直到醬汁變濃稠裹在雞肉上。",
      "【盛盤】關火前放入九層塔葉，快速翻拌兩下，蓋上鍋蓋悶 10 秒讓香氣融合，整鍋上桌。",
    ],
  },
  {
    dishName: "台式蔥油雞",
    cookingTime: "40 分鐘",
    shibaTalk: "雞腿肉用蔥油淋過的瞬間，那個滋滋聲和香氣，是阿柴記憶中最幸福的聲音汪！",
    ingredientsUsed: ["雞腿肉", "青蔥", "大蒜", "小黃瓜"],
    seasoningNotes: ["鹽 1/2 小匙、白胡椒 1/2 小匙", "香油 2 大匙、橄欖油 1 大匙", "醬油膏 1 大匙（沾醬用）"],
    platingNotes: "雞腿切片後整齊排列在白盤中，雞皮金黃、肉質白嫩，翠綠蔥油醬鋪滿雞肉表面，醬油膏沿盤邊畫一圈，旁邊擺幾片小黃瓜清爽解膩汪！",
    cookingSteps: [
      "【前置備料】雞腿肉用鹽和米酒抹勻，醃 10 分鐘。青蔥和蒜全部切成細末混合。",
      "【蒸雞】雞腿肉放入盤中，大火蒸 20 分鐘到全熟。",
      "【冰鎮】蒸好的雞腿立刻泡冰水或冷藏 10 分鐘，讓皮變脆。",
      "【切雞】雞腿順紋切成約 1.5 公分厚的片狀，整齊排盤。",
      "【做蔥油】蔥蒜末中加入鹽和白胡椒，混勻。",
      "【淋油】鍋中加熱香油和橄欖油到微微冒煙，直接淋在蔥蒜末上，瞬間激發香氣。",
      "【組合】將蔥油醬鋪在雞肉上，醬油膏淋在旁邊裝飾。",
      "【盛盤】小黃瓜切片圍在盤邊，最後可撒一些紅辣椒絲點綴。",
    ],
  },
  {
    dishName: "宮保雞丁",
    cookingTime: "20 分鐘",
    shibaTalk: "花生脆、雞肉嫩、辣椒香，阿柴版的宮保雞丁醬汁比例完美，每一塊都讓人想喝啤酒汪！",
    ingredientsUsed: ["雞胸肉", "花生", "青蔥", "大蒜"],
    seasoningNotes: ["醬油 2 大匙、醋 1 大匙、糖 1 大匙", "米酒 1 大匙、太白粉 1 小匙", "乾辣椒 5-6 根、花椒少許"],
    platingNotes: "白色圓盤中，雞丁醬色油亮均勻裹覆，花生粒粒酥脆分布在雞丁之間，乾辣椒點綴增添色彩，醬汁濃稠巴在每塊雞肉上汪！",
    cookingSteps: [
      "【前置備料】雞胸肉切丁（約 2 公分），用 1 小匙醬油和太白粉抓醃。花生用烤箱或乾鍋烘香。",
      "【調醬汁】碗中混合醬油、醋、糖、米酒和少量水，備用。",
      "【過油】鍋中下油 2 大匙，中大火將雞丁翻炒到表面金黃、八分熟，盛起。",
      "【爆花椒】轉小火，下花椒粒慢慢炒出香味後撈除（或直接使用花椒油）。",
      "【爆辣椒】下乾辣椒段和蒜末，小火炒到辣椒變深紅。",
      "【合併】轉大火，雞丁倒回鍋中，倒入醬汁快速翻炒。",
      "【收汁】炒到醬汁濃稠包裹每塊雞丁，約 30 秒。",
      "【盛盤】關火，拌入花生和蔥段，盛盤上桌。",
    ],
  },
  {
    dishName: "醬燒雞腿排",
    cookingTime: "25 分鐘",
    shibaTalk: "雞腿排煎到皮酥肉嫩，醬油和米酒的香氣滲進每一絲肉裡，便宜又大碗的王者汪！",
    ingredientsUsed: ["雞腿肉", "大蒜", "青蔥", "高麗菜"],
    seasoningNotes: ["醬油 2 大匙、味醂 1 大匙、米酒 1 大匙", "糖 1 小匙、薑泥 1 小匙", "白芝麻少許"],
    platingNotes: "雞腿排斜切成厚片，保持雞皮朝上的整齊排列，醬色深褐油亮，旁邊放一撮清爽的高麗菜絲，撒上白芝麻和蔥花，經典日式便當風格汪！",
    cookingSteps: [
      "【前置備料】雞腿肉用刀背拍鬆，兩面均勻灑鹽和胡椒。高麗菜切細絲泡冰水。",
      "【煎雞皮】鍋中不放油，雞皮朝下放入，中小火慢慢煎到金黃酥脆（約 6 分鐘）。",
      "【翻面】翻面繼續煎 4 分鐘，讓肉全熟。",
      "【爆香】將雞肉推到鍋邊，下蒜末爆香約 15 秒。",
      "【下醬汁】混合醬油、味醂、米酒、糖、薑泥，倒入鍋中。",
      "【收汁】轉中大火，不斷將醬汁淋在雞腿上，直到醬汁變濃稠。",
      "【切片】雞腿取出稍微放涼 2 分鐘，斜切成厚片。",
      "【盛盤】高麗菜絲瀝乾鋪底，雞腿排整齊排列在菜絲上，淋上鍋中剩餘醬汁，撒芝麻和蔥花。",
    ],
  },
  {
    dishName: "雞絲涼拌小黃瓜",
    cookingTime: "15 分鐘",
    shibaTalk: "夏天必備清爽料理，雞絲嫩、小黃瓜脆、醬汁酸辣開胃，阿柴自己一盤就嗑光汪！",
    ingredientsUsed: ["雞胸肉", "小黃瓜", "大蒜", "白飯"],
    seasoningNotes: ["醬油 1 大匙、白醋 1 大匙、糖 1 小匙", "辣油 1 小匙、香油 1 小匙", "芝麻醬 1 大匙"],
    platingNotes: "白色淺盤中，雞絲蓬鬆堆疊、小黃瓜薄片交錯排列，醬汁從頂端淋下自然流淌，撒上白芝麻和蔥花，清爽的夏日風情汪！",
    cookingSteps: [
      "【前置備料】雞胸肉放入冷水中，加少許鹽和米酒，中火煮到滾後關火悶 10 分鐘。",
      "【剝雞絲】雞胸取出放涼，用手撕成細絲。",
      "【備小黃瓜】小黃瓜用刨刀刨成薄片或切絲，加少許鹽抓醃出水後瀝乾。",
      "【調醬汁】芝麻醬先用 1 大匙熱水調開，再加入醬油、醋、糖、辣油、香油、蒜末攪拌均勻。",
      "【擺盤】雞絲鋪底，小黃瓜絲放在雞絲上。",
      "【淋醬】將醬汁均勻淋在雞絲和小黃瓜上。",
      "【融合】拌勻後靜置 2 分鐘讓雞絲吸收醬汁。",
      "【盛盤】最後撒上白芝麻和蔥花，可再加一點辣椒絲裝飾。",
    ],
  },
  {
    dishName: "麻油雞湯",
    cookingTime: "35 分鐘",
    shibaTalk: "冷冷的天來一碗麻油雞，從胃暖到腳趾頭。阿柴用雞腿肉煮，肉嫩湯濃，喝一口就停不下來汪！",
    ingredientsUsed: ["雞腿肉", "老薑", "白飯", "米酒"],
    seasoningNotes: ["黑麻油 3 大匙、米酒 300ml", "鹽少許", "冰糖 1 小匙"],
    platingNotes: "盛進深色砂鍋或湯碗，金黃色麻油湯頭清澈油亮，雞腿肉塊浮沉其中，老薑片散落，湯面泛著微微的麻油光澤，配一碗白飯超享受汪！",
    cookingSteps: [
      "【前置備料】雞腿肉剁大塊，老薑切片（約 10 片）。",
      "【煸薑】冷鍋下黑麻油，小火慢慢煸薑片，直到薑片邊緣微捲、香氣散出。",
      "【煎雞肉】轉中火，放入雞腿塊，雞皮朝下煎到金黃。",
      "【下米酒】倒入米酒 300ml，大火煮滾讓酒精揮發。",
      "【加水】加入 500ml 熱水，再次煮滾後轉小火。",
      "【燉煮】蓋鍋蓋小火燉 20 分鐘，讓雞肉軟嫩入味。",
      "【調味】加鹽和冰糖調味，試味道調整。",
      "【盛碗】盛進深碗，確認每碗都有雞肉和薑片，湯要蓋過食材。",
    ],
  },
  {
    dishName: "親子丼",
    cookingTime: "15 分鐘",
    shibaTalk: "雞肉和雞蛋的親子組合，甜甜鹹鹹的日式醬汁拌飯，阿柴每次煮都會多吃一碗汪！",
    ingredientsUsed: ["雞腿肉", "雞蛋", "洋蔥", "白飯"],
    seasoningNotes: ["醬油 2 大匙、味醂 2 大匙", "高湯（或水）100ml", "糖 1/2 小匙"],
    platingNotes: "丼碗中白飯鋪底，雞肉和半熟蛋覆蓋整個飯面，蛋液半凝半流、金黃誘人，洋蔥絲隱藏在蛋液之下，醬汁滲入白飯中，頂端撒少許七味粉和海苔絲汪！",
    cookingSteps: [
      "【前置備料】雞腿肉切小塊，洋蔥切薄絲，雞蛋打散（蛋黃稍微保留一點完整度）。",
      "【煮醬汁】在小鍋中混合醬油、味醂、高湯和糖，中火煮滾。",
      "【下洋蔥】洋蔥絲放入醬汁中，煮到透明變軟。",
      "【下雞肉】雞肉塊放入，中火煮 5 分鐘至全熟。",
      "【第一次淋蛋】將一半蛋液均勻淋在鍋中，蓋鍋蓋悶 20 秒。",
      "【第二次淋蛋】開蓋後淋入剩餘蛋液，集中在中央，蓋鍋蓋悶 10 秒。",
      "【火候判斷】蛋要呈現半熟狀態，蛋白凝固但蛋黃還微微流動。",
      "【盛盤】白飯盛碗，將鍋中雞肉和蛋完整滑到飯上，醬汁一起淋入，撒七味粉和海苔絲。",
    ],
  },

  // ===== 牛肉類 =====
  {
    dishName: "洋蔥炒牛肉",
    cookingTime: "12 分鐘",
    shibaTalk: "牛肉片大火快炒、洋蔥甜脆，阿柴的醬汁比例是獨門秘方，保證牛肉嫩到入口即化汪！",
    ingredientsUsed: ["牛肉片", "洋蔥", "大蒜", "青蔥"],
    seasoningNotes: ["醬油 1.5 大匙、蠔油 1 小匙", "米酒 1 大匙、糖 1/2 小匙", "太白粉 1 小匙（抓肉）"],
    platingNotes: "盛進白色淺盤，牛肉片醬色均勻油亮，洋蔥絲半透明帶點焦糖色，蔥花點綴其上，醬汁薄薄一層反射光澤，配白飯或下酒都完美汪！",
    cookingSteps: [
      "【前置備料】牛肉片用 1 小匙醬油、1 小匙太白粉和少許米酒抓醃 5 分鐘。",
      "【調醬汁】碗中混合醬油、蠔油、米酒、糖和 2 大匙水。",
      "【過油】鍋中下 2 大匙油，中大火將牛肉片快速炒到七分熟（約 30 秒），盛起。",
      "【炒洋蔥】同一鍋補少許油，下洋蔥絲中火炒到透明微焦。",
      "【爆香】下蒜末爆香約 15 秒。",
      "【合併】牛肉倒回鍋中，轉大火快速翻炒。",
      "【下醬汁】倒入醬汁，快速翻拌 20 秒讓醬汁裹上牛肉。",
      "【盛盤】關火撒上蔥段，翻兩下即可。",
    ],
  },
  {
    dishName: "牛肉炒空心菜",
    cookingTime: "12 分鐘",
    shibaTalk: "空心菜的脆和牛肉的嫩，加上沙茶醬的濃郁香氣，是熱炒店的必點招牌汪！",
    ingredientsUsed: ["牛肉片", "空心菜", "大蒜", "辣椒"],
    seasoningNotes: ["沙茶醬 1 大匙、醬油 1 大匙", "米酒 1 大匙、糖 1/2 小匙", "太白粉 1 小匙（抓肉）"],
    platingNotes: "寬口淺盤中，空心菜翠綠油亮鋪底、牛肉片醬色均勻在上層，沙茶的香氣混合蔬菜的清甜，紅辣椒絲點綴增添色彩汪！",
    cookingSteps: [
      "【前置備料】牛肉片用醬油和太白粉抓醃，空心菜洗淨切段（梗和葉分開）。",
      "【過油】鍋中下 2 大匙油，中大火將牛肉炒到七分熟盛起。",
      "【爆香】同一鍋用餘油爆香蒜末和辣椒片。",
      "【炒菜梗】先下空心菜梗，大火炒 30 秒。",
      "【下菜葉】再下空心菜葉，持續大火快炒。",
      "【調味】加入沙茶醬和醬油，快速翻炒均勻。",
      "【合併】牛肉倒回鍋中，轉大火快炒 20 秒。",
      "【盛盤】確認菜葉不過熟保持翠綠，立刻盛盤。",
    ],
  },
  {
    dishName: "牛丼",
    cookingTime: "20 分鐘",
    shibaTalk: "薄切牛肉片和洋蔥在醬汁中慢慢煮到入味，最後鋪在白飯上，阿柴版本的牛丼完全不輸吉野家汪！",
    ingredientsUsed: ["牛肉片", "洋蔥", "白飯", "雞蛋"],
    seasoningNotes: ["醬油 3 大匙、味醂 2 大匙、米酒 1 大匙", "高湯（或水）200ml", "糖 1 大匙、薑泥 1 小匙"],
    platingNotes: "丼碗中白飯盛到八分滿，洋蔥牛肉滿滿鋪蓋飯面，醬汁自然地從肉片間滲入白飯，中間放一顆溫泉蛋或撒一把蔥花，旁邊配紅薑絲汪！",
    cookingSteps: [
      "【前置備料】洋蔥切薄絲，牛肉片如果太長可切成適口大小。",
      "【煮醬汁】鍋中加入高湯、醬油、味醂、米酒、糖和薑泥，中火煮滾。",
      "【煮洋蔥】洋蔥絲放入醬汁中，中小火煮到透明變軟（約 5 分鐘）。",
      "【煮牛肉】將牛肉片一片片展開放入鍋中，不要一次全倒。",
      "【烹煮】中火煮到牛肉變色（約 2 分鐘），過程中用筷子撥散。",
      "【收汁】稍微開大火收一下汁，保留約一半的醬汁拌飯。",
      "【視覺判斷】牛肉變色且醬汁濃縮到稍微濃稠即可。",
      "【盛盤】白飯盛碗，鋪上牛肉和洋蔥，淋上醬汁，打一顆蛋黃或撒蔥花。",
    ],
  },

  // ===== 海鮮類 =====
  {
    dishName: "蒜蓉蒸蝦",
    cookingTime: "15 分鐘",
    shibaTalk: "鮮蝦開背鋪上滿滿蒜蓉，蒸好那一瞬間的香氣，阿柴覺得是世界上最幸福的香味汪！",
    ingredientsUsed: ["蝦子", "大蒜", "青蔥", "冬粉"],
    seasoningNotes: ["醬油 1 大匙、米酒 1 大匙", "蠔油 1 小匙、糖 1/2 小匙", "香油 1 小匙"],
    platingNotes: "白色長盤中，開背蝦整齊排成兩列，金黃蒜蓉鋪在每隻蝦背上，翠綠蔥花灑落其上，盤底冬粉吸飽鮮甜湯汁，晶瑩剔透汪！",
    cookingSteps: [
      "【前置備料】蝦子剪去鬚腳、開背去腸泥，大蒜切成細末。冬粉泡軟剪短。",
      "【鋪底】冬泡軟的冬粉鋪在盤底，淋上少許醬油和香油。",
      "【排蝦】開背蝦整齊排列在冬粉上，蝦背朝上張開。",
      "【做蒜蓉醬】蒜末中加入醬油、米酒、蠔油、糖和少許油，拌勻。",
      "【鋪蒜蓉】將蒜蓉醬均勻鋪在每隻蝦的背上。",
      "【蒸】大火蒸 6 分鐘（不要過久，蝦肉會老）。",
      "【出鍋】蒸好後取出，撒上大量蔥花。",
      "【淋熱油】鍋中燒熱 1 大匙油到冒煙，淋在蔥花上激發香氣。",
    ],
  },
  {
    dishName: "塔香蛤蜊",
    cookingTime: "10 分鐘",
    shibaTalk: "蛤蜊開口的那一刻，鮮甜的湯汁和九層塔的香氣融為一體，阿柴每次都先把湯喝光汪！",
    ingredientsUsed: ["蛤蜊", "大蒜", "九層塔", "辣椒"],
    seasoningNotes: ["醬油 1 大匙、米酒 2 大匙", "蠔油 1 小匙", "糖 1/2 小匙、白胡椒少許"],
    platingNotes: "黑色鐵鍋或淺盤中，蛤蜊全部開口、飽滿多汁，醬汁和蛤蜊湯汁混合成淺褐色湯底，九層塔葉翠綠漂浮在其間，紅辣椒絲點綴，湯汁鮮甜可以直接喝汪！",
    cookingSteps: [
      "【前置備料】蛤蜊泡鹽水吐沙至少 30 分鐘，蒜切末，辣椒切片。",
      "【爆香】鍋中下 1 大匙油，中火爆香蒜末和辣椒片約 20 秒。",
      "【下蛤蜊】蛤蜊瀝乾後倒入鍋中，轉大火。",
      "【嗆米酒】沿鍋邊嗆入米酒，蓋上鍋蓋悶 1 分鐘。",
      "【調味】開蓋後加入醬油、蠔油和糖，快速翻炒。",
      "【視覺判斷】蛤蜊全部開口就是熟了，不要煮太久會縮水。",
      "【下九層塔】關火前放入九層塔葉，翻拌均勻。",
      "【盛盤】連湯汁一起盛入盤中，撒少許白胡椒。",
    ],
  },
  {
    dishName: "香煎鮭魚",
    cookingTime: "18 分鐘",
    shibaTalk: "鮭魚煎到皮酥肉嫩，擠一點檸檬汁就完美。阿柴的秘訣是鍋要夠熱才能煎出金黃脆皮汪！",
    ingredientsUsed: ["鮭魚", "大蒜", "檸檬"],
    seasoningNotes: ["鹽 1/2 小匙、黑胡椒少許", "橄欖油 1 大匙", "奶油 1 小匙（增添香氣）"],
    platingNotes: "白色長盤中，金黃酥脆的鮭魚排放在中央，魚皮朝上展現完美的脆皮紋理，旁邊擺檸檬角和一撮簡單的生菜沙拉，清爽又高級汪！",
    cookingSteps: [
      "【前置備料】鮭魚排擦乾水分，兩均勻灑鹽和黑胡椒，靜置 5 分鐘。",
      "【熱鍋】不沾鍋中下橄欖油，中大火加熱到油微微冒煙。",
      "【下魚】魚皮朝下放入鍋中，輕輕按壓讓魚皮均勻接觸鍋面。",
      "【煎魚皮】中大火煎 4-5 分鐘，不要翻動，讓魚皮煎到金黃酥脆。",
      "【翻面】小心翻面，繼續煎 3 分鐘。",
      "【加奶油】放入奶油和蒜末，將鍋子傾斜，用湯匙將融化的奶油淋在魚肉上（約 1 分鐘）。",
      "【熟度判斷】用筷子戳魚肉最厚處，能輕鬆穿透且肉質不透明就是熟了。",
      "【盛盤】魚排盛盤，擠上檸檬汁，旁邊搭配檸檬角和簡單蔬菜。",
    ],
  },
  {
    dishName: "透抽炒時蔬",
    cookingTime: "12 分鐘",
    shibaTalk: "透抽的火候是關鍵，阿柴練了很久才能炒出又脆又嫩的完美口感，搭配鮮蔬一起炒超爽口汪！",
    ingredientsUsed: ["透抽", "小黃瓜", "紅蘿蔔", "大蒜"],
    seasoningNotes: ["鹽 1/2 小匙、白胡椒 1/2 小匙", "米酒 1 大匙", "香油 1 小匙"],
    platingNotes: "白色淺盤中，透抽的雪白切花和翠綠小黃瓜、橘紅胡蘿蔔形成漂亮對比，食材各自保持口感，薄鹽調味清爽無負擔汪！",
    cookingSteps: [
      "【前置備料】透抽洗淨去皮、劃花刀後切塊。小黃瓜和紅蘿蔔切片。",
      "【燙透抽】滾水中加少許米酒，透抽燙 20 秒撈起（先燙再炒比較不會出水）。",
      "【爆香】鍋中下 1 大匙油，中火爆香蒜末。",
      "【炒紅蘿蔔】先下紅蘿蔔片炒 1 分鐘。",
      "【炒小黃瓜】下小黃瓜片，大火快炒 30 秒。",
      "【合併】透抽倒回鍋中，轉大火快炒。",
      "【調味】加入鹽、白胡椒、米酒，快速翻拌均勻。",
      "【盛盤】淋少許香油提味，立刻盛盤（透抽炒久會老）。",
    ],
  },
  {
    dishName: "鮭魚炒飯",
    cookingTime: "15 分鐘",
    shibaTalk: "鮭魚的油脂和蛋香融合在一起，每一粒米飯都裹上了金黃色，是阿柴最喜歡的奢侈炒飯汪！",
    ingredientsUsed: ["鮭魚", "雞蛋", "白飯", "青蔥", "洋蔥"],
    seasoningNotes: ["鹽 1/2 小匙、白胡椒 1/2 小匙", "醬油 1 小匙", "奶油 1 小匙"],
    platingNotes: "盛進陶盤中，炒飯粒粒金黃分明，大塊鮭魚肉均勻分布在飯中，洋蔥和蔥花點綴其中，表面微微泛著油光，香氣四溢汪！",
    cookingSteps: [
      "【前置備料】鮭魚抹鹽後，入鍋煎到兩面金黃，去皮剝碎。洋蔥切丁，蔥切花。",
      "【炒蛋】鍋中下 2 大匙油，中大火將蛋液炒到半熟盛起。",
      "【炒洋蔥】同鍋補少許油，下洋蔥丁炒到透明。",
      "【炒飯】倒入白飯，大火快速翻炒，將飯粒炒散。",
      "【加鮭魚】加入剝碎的鮭魚肉，和飯一起拌炒均勻。",
      "【調味】加入鹽、白胡椒和少許醬油，從鍋邊嗆入。",
      "【合併】蛋倒回鍋中，快速翻炒均勻。",
      "【盛盤】關火撒上蔥花，翻拌兩下盛盤。",
    ],
  },
  {
    dishName: "鮮蝦粉絲煲",
    cookingTime: "20 分鐘",
    shibaTalk: "粉絲吸飽了蝦頭的鮮味和醬油的鹹香，每一口都是滿滿的海味，是阿柴宴客必備的大菜汪！",
    ingredientsUsed: ["蝦子", "冬粉", "大蒜", "青蔥"],
    seasoningNotes: ["醬油 2 大匙、蠔油 1 大匙", "米酒 1 大匙、糖 1 小匙", "白胡椒 1/2 小匙、香油少許"],
    platingNotes: "黑色砂鍋中，粉絲呈現誘人的醬油色、晶瑩剔透，鮮蝦整齊排列在上面，紅白相間，撒上大量蔥花和少許辣椒絲，鍋氣從縫隙中飄出汪！",
    cookingSteps: [
      "【前置備料】蝦子剪鬚開背去腸泥，冬粉泡冷水 10 分鐘後剪半，蒜切末、蔥切花。",
      "【煎蝦】鍋中下 1 大匙油，中大火將蝦子煎到兩面變紅約 30 秒，盛起。",
      "【爆香】用鍋中餘油爆香蒜末。",
      "【調醬汁】加入醬油、蠔油、米酒、糖、白胡椒和 200ml 水，煮滾。",
      "【下粉絲】將泡軟的冬粉放入醬汁中，中火煮到粉絲吸飽湯汁（約 3 分鐘）。",
      "【回鍋蝦】將蝦子排回鍋中，蓋鍋蓋悶 1 分鐘。",
      "【收汁】開蓋稍微收汁，保留少許湯汁讓粉絲滋潤。",
      "【盛盤】倒入砂鍋或深盤，撒上大量蔥花，淋少許香油。",
    ],
  },
  {
    dishName: "蛤蜊絲瓜",
    cookingTime: "15 分鐘",
    shibaTalk: "絲瓜的清甜加上蛤蜊的鮮，完全不需要太多調味，天然的鮮味就是最好的味道汪！",
    ingredientsUsed: ["蛤蜊", "絲瓜", "大蒜", "老薑"],
    seasoningNotes: ["鹽 1/2 小匙", "米酒 1 大匙", "香油少許"],
    platingNotes: "白色湯碗或淺盤中，絲瓜半透明翠綠、蛤蜊飽滿開口，清澈的湯汁帶著絲瓜和蛤蜊的鮮甜，薑絲漂浮其間，湯汁可以直接喝汪！",
    cookingSteps: [
      "【前置備料】絲瓜去皮切滾刀塊，蛤蜊吐沙洗淨，老薑切絲。",
      "【爆香】鍋中下 1 大匙油，小火爆香薑絲約 30 秒。",
      "【炒絲瓜】下絲瓜塊，中火翻炒到表面微軟約 2 分鐘。",
      "【加水】加入 100ml 水或高湯，蓋鍋蓋中火煮 3 分鐘。",
      "【下蛤蜊】蛤蜊瀝乾後放入鍋中，蓋鍋蓋悶煮。",
      "【視覺判斷】蛤蜊開口後立刻關火，避免肉縮。",
      "【調味】加入鹽和米酒調味，輕輕攪拌。",
      "【盛盤】盛進湯碗中，淋少許香油，撒上一些薑絲裝飾。",
    ],
  },
  {
    dishName: "鮪魚蛋吐司",
    cookingTime: "10 分鐘",
    shibaTalk: "鮪魚罐頭加蛋壓進吐司裡，煎到金黃酥脆，是阿柴最愛的早餐，簡單但幸福汪！",
    ingredientsUsed: ["鮪魚罐頭", "雞蛋", "吐司", "洋蔥"],
    seasoningNotes: ["黑胡椒少許", "美乃滋 1 大匙", "鹽少許"],
    platingNotes: "吐司對半切開，剖面可看到金黃色的蛋和鮪魚內餡，吐司表面煎到酥脆金黃，放在木盤上，旁邊配幾片小黃瓜和番茄，簡單又豐盛的早餐汪！",
    cookingSteps: [
      "【前置備料】鮪魚罐頭瀝乾油分，洋蔥切碎末。",
      "【拌餡】鮪魚、洋蔥末、美乃滋、黑胡椒混合拌勻。",
      "【組合】兩片吐司中間放上鮪魚餡，鋪平。",
      "【蛋液】雞蛋打散，將吐司兩面沾滿蛋液。",
      "【熱鍋】平底鍋中下 1 大匙奶油，中火加熱融化。",
      "【煎吐司】放入沾滿蛋液的吐司，中小火煎到兩面金黃（每面約 2-3 分鐘）。",
      "【視覺判斷】吐司表面金黃酥脆、蛋液完全凝固。",
      "【盛盤】對半切開，擺盤上桌。",
    ],
  },

  // ===== 蔬菜類 =====
  {
    dishName: "蒜炒空心菜",
    cookingTime: "8 分鐘",
    shibaTalk: "大火快炒的空心菜，脆甜爽口，蒜香滿滿。阿柴阿嬤說炒青菜就是要大火才好吃汪！",
    ingredientsUsed: ["空心菜", "大蒜", "辣椒"],
    seasoningNotes: ["鹽 1/2 小匙、白胡椒少許", "米酒 1 小匙", "油 1.5 大匙"],
    platingNotes: "白色淺盤中，空心菜翠綠油亮，蒜末均勻分布，菜梗還帶一點脆度，盤底有少許清澈的湯汁，簡單卻經典汪！",
    cookingSteps: [
      "【前置備料】空心菜洗淨切段，梗和葉分開，大蒜拍碎切末。",
      "【大火熱鍋】鍋中加入油，開大火加熱到油微微冒煙。",
      "【爆蒜】下蒜末和辣椒，大火爆香約 10 秒。",
      "【炒菜梗】先下空心菜梗，大火翻炒 20 秒。",
      "【下菜葉】再下菜葉部分，持續大火翻炒。",
      "【調味】沿鍋邊嗆入米酒，加入鹽和白胡椒。",
      "【快速翻炒】保持大火翻拌約 30 秒，讓調味均勻。",
      "【盛盤】菜葉變軟但仍翠綠時立刻關火盛盤，不要過熟。",
    ],
  },
  {
    dishName: "奶油玉米炒蛋",
    cookingTime: "8 分鐘",
    shibaTalk: "奶油的香氣和玉米的甜，配上滑嫩的炒蛋，簡單的食材組合卻讓人一口接一口汪！",
    ingredientsUsed: ["雞蛋", "玉米粒", "奶油"],
    seasoningNotes: ["鹽 1/4 小匙", "白胡椒少許", "鮮奶 1 大匙（讓蛋更嫩）"],
    platingNotes: "白色淺盤中，金黃色的炒蛋蓬鬆柔軟，玉米粒均勻分布在蛋液中，奶油香氣撲鼻，表面微微泛著油光，簡單的幸福汪！",
    cookingSteps: [
      "【前置備料】雞蛋打散加入少許鹽、白胡椒和鮮奶，攪拌均勻。玉米粒瀝乾水分。",
      "【融奶油】鍋中放入奶油，中小火加熱到融化。",
      "【炒玉米】先下玉米粒，中火翻炒約 1 分鐘。",
      "【下蛋液】將蛋液均勻倒入鍋中，覆蓋玉米粒。",
      "【攪拌】用鍋鏟從外圍向中心輕輕推，讓蛋液均勻受熱。",
      "【火候控制】蛋開始凝固時轉小火，避免過老。",
      "【視覺判斷】蛋呈現半凝固狀態、還帶一點濕潤感時就要關火。",
      "【盛盤】趁熱盛盤，餘溫會讓蛋繼續熟成到完美狀態。",
    ],
  },
  {
    dishName: "涼拌小黃瓜",
    cookingTime: "15 分鐘",
    shibaTalk: "冰涼脆爽的小黃瓜，配上蒜蓉和醋的酸香，夏天最開胃的小菜，阿柴一次可以嗑掉三條汪！",
    ingredientsUsed: ["小黃瓜", "大蒜", "辣椒"],
    seasoningNotes: ["白醋 2 大匙、糖 1 大匙", "鹽 1/2 小匙", "香油 1 小匙、辣油少許"],
    platingNotes: "白色小碟中，小黃瓜塊翠綠、表面因拍碎形成不規則的裂紋，蒜末和辣椒碎點綴其上，醬汁清澈包裹每塊小黃瓜，冰涼上桌就是夏天汪！",
    cookingSteps: [
      "【前置備料】小黃瓜洗淨，用刀背拍碎後切段（約 4 公分）。",
      "【殺青】小黃瓜加鹽抓勻，靜置 10 分鐘讓多餘水分釋出。",
      "【瀝乾】將小黃瓜出的水倒掉，用冷開水沖洗一下再瀝乾。",
      "【調醬汁】碗中混合白醋、糖、蒜末、辣椒碎，攪拌到糖融化。",
      "【拌合】將醬汁倒入小黃瓜中，拌勻。",
      "【入味】放入冰箱冷藏至少 10 分鐘。",
      "【最後調味】取出後淋上香油和辣油，再次拌勻。",
      "【盛盤】盛進小碟中，冰涼上桌。",
    ],
  },
  {
    dishName: "皮蛋豆腐",
    cookingTime: "5 分鐘",
    shibaTalk: "冰涼的嫩豆腐配上Q彈的皮蛋，淋上醬油膏和柴魚片，阿柴覺得這是全台灣最強的涼拌菜汪！",
    ingredientsUsed: ["嫩豆腐", "皮蛋", "青蔥", "柴魚片"],
    seasoningNotes: ["醬油膏 2 大匙", "香油 1 小匙", "七味粉少許"],
    platingNotes: "白色淺盤中，冰涼的嫩豆腐完整倒扣在中央，皮蛋切成半月形整齊排列在豆腐周圍，頂端放上大量柴魚片隨著熱氣微微舞動，撒上蔥花和七味粉，醬油膏沿盤邊畫圈汪！",
    cookingSteps: [
      "【前置備料】嫩豆腐從盒中取出，用冷開水沖一下，放入冰箱冰鎮。皮蛋剝殼。",
      "【切皮蛋】皮蛋用線或刀子切成半月形薄片（刀沾水比較不會黏）。",
      "【擺盤】冰鎮後的嫩豆腐放在盤子正中央。",
      "【排列】皮蛋片整齊排列在豆腐周圍。",
      "【淋醬】均勻淋上醬油膏。",
      "【加柴魚】在豆腐頂端放上一大把柴魚片。",
      "【點綴】撒上蔥花和七味粉。",
      "【上桌】淋上香油後立刻上桌，柴魚片還在舞動的時候最美味。",
    ],
  },
  {
    dishName: "味噌湯",
    cookingTime: "15 分鐘",
    shibaTalk: "用柴魚高湯當底的味噌湯，嫩豆腐和蔥花的簡單組合，是阿柴食堂永遠不缺席的湯品汪！",
    ingredientsUsed: ["嫩豆腐", "青蔥", "洋蔥"],
    seasoningNotes: ["味噌 2 大匙（白味噌為佳）", "柴魚片 1 把", "鹽少許"],
    platingNotes: "日式湯碗中，湯色金黃帶濁、味噌香氣柔和，嫩豆腐塊方正浮沉，蔥花翠綠散落湯面，幾片柴魚片在湯中飄逸，簡單但溫暖汪！",
    cookingSteps: [
      "【前置備料】嫩豆腐切小丁（約 1 公分），青蔥切花。",
      "【煮高湯】鍋中加 600ml 水，放入一把柴魚片，中火煮到微滾後關火，過濾取湯。",
      "【煮洋蔥】洋蔥切薄絲放入高湯中，中火煮 3 分鐘到軟甜。",
      "【下豆腐】豆腐丁放入湯中，小火煮 2 分鐘。",
      "【調味】將味噌放在湯勺中，在湯中慢慢攪拌溶解。",
      "【注意】味噌不要煮滾太久，香味會流失。",
      "【試味道】嘗一下鹹淡，若不夠可補少許鹽。",
      "【盛碗】盛入碗中，撒上大量蔥花。",
    ],
  },
  {
    dishName: "蔥花蛋炒飯",
    cookingTime: "10 分鐘",
    shibaTalk: "最簡單的蛋炒飯，只要蛋香和蔥花就夠了。阿柴的版本是每一粒米都閃閃發亮汪！",
    ingredientsUsed: ["雞蛋", "白飯", "青蔥", "大蒜"],
    seasoningNotes: ["鹽 1/2 小匙、白胡椒 1/2 小匙", "醬油 1 小匙（從鍋邊嗆入）"],
    platingNotes: "白色深盤中，炒飯粒粒分明、金黃色澤均勻，翠綠的蔥花散布其間，沒有多餘的配料，就是最純粹的蛋炒飯美學汪！",
    cookingSteps: [
      "【前置備料】雞蛋打散，青蔥切花，蒜切末。",
      "【熱鍋】鍋中下 2.5 大匙油，大火加熱到冒煙。",
      "【炒蛋】倒入蛋液，快速攪散炒到半熟。",
      "【下飯】立刻倒入白飯，大火快速翻炒。",
      "【炒散】用鍋鏟將飯壓散、翻炒，讓每粒米都裹上蛋液。",
      "【爆香】加入蒜末，繼續大火翻炒約 2 分鐘。",
      "【調味】沿鍋邊嗆入醬油，加入鹽和白胡椒，快速拌勻。",
      "【盛盤】關火，撒入大量蔥花，翻拌幾下後盛盤。",
    ],
  },
  {
    dishName: "地瓜葉拌蒜蓉",
    cookingTime: "10 分鐘",
    shibaTalk: "地瓜葉燙過後拌上蒜蓉醬油，簡單又營養，是阿柴食堂最受歡迎的青菜汪！",
    ingredientsUsed: ["地瓜葉", "大蒜", "辣椒"],
    seasoningNotes: ["醬油膏 1 大匙、醬油 1 小匙", "香油 1 大匙", "鹽少許（燙菜用）"],
    platingNotes: "白色淺盤中，地瓜葉翠綠整齊排列，蒜蓉醬油從頂端淋下自然流淌，紅辣椒絲點綴其上，菜葉上泛著香油的光澤，簡單家常的台灣味汪！",
    cookingSteps: [
      "【前置備料】地瓜葉洗淨，取嫩葉和嫩莖部分。大蒜切成細末。",
      "【調醬汁】碗中混合醬油膏、醬油、香油、蒜末、少許糖，攪拌均勻。",
      "【燙菜】大鍋中加水煮滾，加少許鹽和油。",
      "【燙地瓜葉】地瓜葉放入滾水中，燙約 40 秒（不要過久）。",
      "【冰鎮】撈出後立刻泡冰水或沖冷水，保持翠綠和脆度。",
      "【瀝乾】充分瀝乾水分，放入盤中。",
      "【淋醬】將蒜蓉醬汁均勻淋在地瓜葉上。",
      "【盛盤】撒上辣椒絲點綴，趁溫熱或常溫上桌。",
    ],
  },
  {
    dishName: "金針菇炒蛋",
    cookingTime: "10 分鐘",
    shibaTalk: "金針菇和雞蛋的組合軟嫩滑口，簡單調味就很好吃，是阿柴肚子餓時的快速救星汪！",
    ingredientsUsed: ["金針菇", "雞蛋", "青蔥", "大蒜"],
    seasoningNotes: ["鹽 1/2 小匙、白胡椒 1/2 小匙", "醬油 1 小匙", "香油少許"],
    platingNotes: "淺盤中，金黃的炒蛋和白色的金針菇交織，翠綠的蔥花灑落其上，炒蛋軟嫩、金針菇帶些許脆度，清淡卻美味汪！",
    cookingSteps: [
      "【前置備料】金針菇切除根部後剝散，雞蛋打散，青蔥切花。",
      "【炒金針菇】鍋中下 1 大匙油，中火將金針菇炒到出水變軟。",
      "【調味金針菇】加入少許鹽和白胡椒，拌炒均勻後盛起。",
      "【炒蛋】同一鍋補 1 大匙油，中大火倒入蛋液。",
      "【半熟時加菇】蛋半凝固時將金針菇倒回鍋中。",
      "【拌炒】快速翻炒讓蛋和菇均勻混合。",
      "【調味】加入醬油沿鍋邊嗆入，撒少許白胡椒。",
      "【盛盤】關火撒上蔥花，淋少許香油即可。",
    ],
  },
  {
    dishName: "台式泡菜炒肉",
    cookingTime: "12 分鐘",
    shibaTalk: "台式泡菜的酸脆配上肉片的鹹香，酸酸鹹鹹超開胃，阿柴每次都忍不住多扒幾口飯汪！",
    ingredientsUsed: ["豬肉片", "高麗菜", "紅蘿蔔", "大蒜"],
    seasoningNotes: ["白醋 1 大匙、糖 1 大匙", "鹽 1/2 小匙", "辣椒少許"],
    platingNotes: "白色大盤中，高麗菜和紅蘿蔔呈現漂亮的粉紅色（泡菜色澤），肉片醬色均勻分布，湯汁微酸帶甜，是一道色彩繽紛的開胃菜汪！",
    cookingSteps: [
      "【前置備料】高麗菜和紅蘿蔔切絲，用鹽抓醃 10 分鐘後擠出水分。",
      "【做泡菜汁】擠出的菜汁加白醋和糖，攪拌溶解。",
      "【醃肉】豬肉片用少許醬油和太白粉抓醃。",
      "【炒肉】鍋中下油，中大火將肉片炒到變色盛起。",
      "【炒菜】同一鍋下高麗菜和紅蘿蔔絲，大火翻炒 1 分鐘。",
      "【合併】肉片倒回鍋中，倒入泡菜汁。",
      "【調味】加辣椒和鹽調味，大火快速翻炒到湯汁收乾一點。",
      "【盛盤】趁熱盛盤，菜肉均勻分布。",
    ],
  },
  {
    dishName: "豆皮炒高麗菜",
    cookingTime: "12 分鐘",
    shibaTalk: "豆皮吸收了高麗菜的甜味和醬汁的鹹香，軟中帶Q，比肉還受歡迎汪！",
    ingredientsUsed: ["豆皮", "高麗菜", "紅蘿蔔", "大蒜"],
    seasoningNotes: ["醬油 1 大匙、鹽 1/2 小匙", "白胡椒少許", "香油少許"],
    platingNotes: "白色淺盤中，金黃的豆皮和翠綠的高麗菜相互交疊，紅蘿蔔絲增添色彩，整體清爽不油膩，是一道美味又健康的家常菜汪！",
    cookingSteps: [
      "【前置備料】豆皮切成寬條，高麗菜用手撕成小片，紅蘿蔔切絲。",
      "【煎豆皮】鍋中下少許油，中火將豆皮兩面煎到金黃微焦，盛起。",
      "【爆香】同一鍋補少許油，爆香蒜末。",
      "【炒紅蘿蔔】先下紅蘿蔔絲，炒約 1 分鐘。",
      "【炒高麗菜】轉大火下高麗菜，快速翻炒到微軟。",
      "【合併】豆皮倒回鍋中，大火翻炒均勻。",
      "【調味】加入醬油、鹽和白胡椒，沿鍋邊嗆入少許水。",
      "【盛盤】關火前淋少許香油，翻拌後盛盤。",
    ],
  },
  {
    dishName: "杏鮑菇炒蒜苗",
    cookingTime: "12 分鐘",
    shibaTalk: "杏鮑菇切片後煎到金黃，口感像干貝一樣鮮美，配上蒜苗的香氣，素食也可以很享受汪！",
    ingredientsUsed: ["杏鮑菇", "大蒜", "青蔥", "辣椒"],
    seasoningNotes: ["醬油 1.5 大匙、米酒 1 大匙", "奶油 1 小匙", "黑胡椒少許"],
    platingNotes: "白色淺盤中，杏鮑菇片兩面金黃、邊緣微焦，蒜苗翠綠點綴其間，奶油香氣混著醬油香，看起來就像高級鐵板料理汪！",
    cookingSteps: [
      "【前置備料】杏鮑菇洗淨擦乾，斜切成約 0.8 公分厚片。蒜苗切斜段。",
      "【煎杏鮑菇】鍋中下 1 大匙油，中大火將杏鮑菇片兩面煎到金黃（每面約 2 分鐘）。",
      "【調味】加入醬油和米酒，快速翻炒讓菇片吸收醬汁。",
      "【加奶油】放入奶油，融化後翻拌均勻。",
      "【炒蒜苗】下蒜苗段，大火快炒 30 秒。",
      "【調味】撒上黑胡椒，試味道調整。",
      "【視覺判斷】菇片金黃油亮、蒜苗翠綠微脆。",
      "【盛盤】整齊排盤或隨意盛入盤中，撒少許辣椒絲。",
    ],
  },
  {
    dishName: "香菇雞湯",
    cookingTime: "40 分鐘",
    shibaTalk: "乾香菇的濃郁香氣和雞肉的鮮甜，一起慢燉出一鍋金黃色的好湯，阿柴最愛冬天來一碗汪！",
    ingredientsUsed: ["雞腿肉", "香菇", "老薑", "紅蘿蔔"],
    seasoningNotes: ["鹽 1 小匙", "米酒 2 大匙", "枸杞少許"],
    platingNotes: "砂鍋或湯碗中，金黃清澈的湯頭飄著香菇和雞肉，香菇表面浮著油光，雞肉軟嫩、紅蘿蔔塊增添甜味，湯面泛著薄薄一層雞油光澤汪！",
    cookingSteps: [
      "【前置備料】乾香菇泡水至軟（約 20 分鐘），雞腿剁塊。老薑切片。",
      "【燙雞肉】雞肉放入冷水鍋中，煮滾後撈出洗淨浮沫。",
      "【爆香】鍋中下少許油，小火煸香薑片約 1 分鐘。",
      "【炒雞肉】下雞肉塊，中火翻炒到表面微金黃。",
      "【加水】加入 1000ml 熱水，放入香菇（連同泡香菇的水一起）。",
      "【燉煮】大火煮滾後轉小火，蓋鍋蓋燉 25 分鐘。",
      "【調味】加入米酒、鹽和枸杞，再煮 5 分鐘。",
      "【盛碗】盛進湯碗中，確認每碗都有雞肉和香菇，湯要蓋過食材。",
    ],
  },
  {
    dishName: "紅燒白蘿蔔",
    cookingTime: "25 分鐘",
    shibaTalk: "白蘿蔔用醬油和冰糖慢煮到半透明，吸飽了醬汁的鹹甜味，比肉還好吃汪！",
    ingredientsUsed: ["白蘿蔔", "紅蘿蔔", "大蒜", "青蔥"],
    seasoningNotes: ["醬油 2 大匙、冰糖 1 大匙", "米酒 1 大匙", "八角 1 顆"],
    platingNotes: "深碗中，白蘿蔔塊呈現漂亮的琥珀色半透明狀，醬汁濃稠光亮，紅蘿蔔點綴色彩，撒上青蔥花，溫暖樸實的日式風情汪！",
    cookingSteps: [
      "【前置備料】白蘿蔔去皮切成厚塊（約 3 公分），紅蘿蔔滾刀切塊。",
      "【煎表面】鍋中下 1 大匙油，中火將蘿蔔塊表面煎到微金黃。",
      "【加調味】加入醬油、冰糖、米酒和八角。",
      "【加水】加入 200ml 水（約蘿蔔一半高度）。",
      "【燉煮】大火煮滾後轉小火，蓋鍋蓋燉 15 分鐘。",
      "【翻面】開蓋將蘿蔔翻面，讓兩面均勻入味。",
      "【收汁】轉中火收汁到醬汁濃稠，蘿蔔呈現半透明。",
      "【盛盤】盛進深碗，淋上鍋底醬汁，撒蔥花。",
    ],
  },
  {
    dishName: "絲瓜麵線",
    cookingTime: "15 分鐘",
    shibaTalk: "絲瓜的清甜和麵線的軟滑，簡單煮一煮就是阿柴記憶中阿嬤的味道汪！",
    ingredientsUsed: ["絲瓜", "麵線", "大蒜", "蛤蜊"],
    seasoningNotes: ["鹽 1/2 小匙、白胡椒少許", "米酒 1 大匙", "香油 1 小匙"],
    platingNotes: "深碗中，絲瓜半透明翠綠、麵線雪白軟滑，蛤蜊開口點綴其間，清澈的湯汁帶點絲瓜的天然甜味，是一碗溫暖的台灣家常味汪！",
    cookingSteps: [
      "【前置備料】絲瓜去皮切半圓片，蛤蜊吐沙洗淨。",
      "【爆香】鍋中下 1 大匙油，中火爆香蒜末約 20 秒。",
      "【炒絲瓜】下絲瓜片，中火翻炒到表面微軟（約 2 分鐘）。",
      "【加水】加入 400ml 水或高湯，蓋鍋蓋煮 3 分鐘。",
      "【下蛤蜊】蛤蜊放入鍋中，煮到開口。",
      "【煮麵線】另起一鍋水煮麵線約 2 分鐘，撈起放入碗中。",
      "【調味】絲瓜湯中加入鹽和白胡椒調味。",
      "【盛碗】將絲瓜湯倒入裝有麵線的碗中，淋香油，撒蔥花。",
    ],
  },
  {
    dishName: "奶油蒜香杏鮑菇",
    cookingTime: "12 分鐘",
    shibaTalk: "杏鮑菇用奶油煎到金黃，撒上蒜末和黑胡椒，香氣逼人到隔壁桌會抗議汪！",
    ingredientsUsed: ["杏鮑菇", "大蒜", "奶油"],
    seasoningNotes: ["鹽 1/2 小匙、黑胡椒 1/2 小匙", "巴西里少許（可略）"],
    platingNotes: "白色淺盤中，杏鮑菇片金黃油亮、邊緣微焦帶奶油色澤，蒜末均勻分布在每片菇上，黑胡椒點點散布，高級餐廳的前菜感汪！",
    cookingSteps: [
      "【前置備料】杏鮑菇洗淨擦乾，斜切成 0.8 公分厚片。蒜切細末。",
      "【熱鍋】平底鍋中下 1 大匙橄欖油，中大火加熱。",
      "【煎菇】杏鮑菇片平鋪鍋中，不要重疊，煎 2 分鐘到金黃。",
      "【翻面】翻面繼續煎 2 分鐘，直到兩面金黃。",
      "【加奶油】放入奶油，融化後翻拌讓每片菇都裹上奶油。",
      "【加蒜末】撒上蒜末，翻拌約 30 秒到蒜香飄出。",
      "【調味】均勻撒上鹽和黑胡椒。",
      "【盛盤】整齊排列在盤中，可撒少許巴西里碎點綴。",
    ],
  },
  {
    dishName: "番茄炒蛋",
    cookingTime: "12 分鐘",
    shibaTalk: "番茄的酸甜和雞蛋的滑嫩，是台灣家常菜的經典不敗款，阿柴每次煮都會被掃盤汪！",
    ingredientsUsed: ["雞蛋", "番茄"],
    seasoningNotes: ["鹽 1/2 小匙、糖 1 大匙", "番茄醬 1 大匙（增加色澤）", "青蔥少許"],
    platingNotes: "白色淺盤中，金黃蓬鬆的炒蛋和紅潤的番茄塊交織，醬汁帶著番茄的天然紅色，撒上翠綠蔥花，簡單卻讓人有滿滿的幸福感汪！",
    cookingSteps: [
      "【前置備料】番茄去蒂切塊（約 2 公分），雞蛋打散加少許鹽。",
      "【炒蛋】鍋中下 2 大匙油，中大火將蛋液炒到八分熟（仍帶濕潤），盛起。",
      "【炒番茄】用餘油炒番茄塊，中火炒到軟化出汁（約 3 分鐘）。",
      "【調味】加入糖和番茄醬，攪拌均勻。",
      "【合併】將炒蛋倒回鍋中，和番茄輕輕拌炒。",
      "【融合】讓蛋吸收番茄的汁液，約 30 秒。",
      "【調味】試味道後補鹽，若太酸可再加糖。",
      "【盛盤】撒上蔥花，趁熱上桌。",
    ],
  },
  {
    dishName: "櫻花蝦高麗菜",
    cookingTime: "10 分鐘",
    shibaTalk: "櫻花蝦的香氣和海味炒進高麗菜裡，簡單卻高級，是阿柴食堂的隱藏菜單汪！",
    ingredientsUsed: ["高麗菜", "大蒜", "青蔥"],
    seasoningNotes: ["鹽 1/2 小匙", "米酒 1 大匙", "櫻花蝦 2 大匙"],
    platingNotes: "白色淺盤中，高麗菜翠綠油亮，粉紅色的櫻花蝦點綴其間，蒜末和金黃色的蝦米增添色彩層次，清爽又充滿海味汪！",
    cookingSteps: [
      "【前置備料】高麗菜用手撕成小片，櫻花蝦稍微沖水瀝乾。",
      "【爆香】鍋中下 1.5 大匙油，中火爆香蒜末。",
      "【炒櫻花蝦】下櫻花蝦，小火炒到酥脆出香（約 1 分鐘）。",
      "【下高麗菜】轉大火，下高麗菜快速翻炒。",
      "【調味】沿鍋邊嗆入米酒，加入鹽調味。",
      "【快速翻炒】大火持續翻炒到高麗菜微軟但還保持脆度。",
      "【視覺判斷】菜葉翠綠油亮、櫻花蝦均勻分布。",
      "【盛盤】盛入盤中，不要炒太久保持高麗菜的脆度。",
    ],
  },
  {
    dishName: "九層塔炒蛋",
    cookingTime: "8 分鐘",
    shibaTalk: "九層塔的濃烈香氣和雞蛋的滑嫩完美結合，阿柴覺得這是台灣最強的香料蛋料理汪！",
    ingredientsUsed: ["雞蛋", "九層塔"],
    seasoningNotes: ["鹽 1/2 小匙、白胡椒少許", "醬油 1 小匙", "油 2 大匙"],
    platingNotes: "白色淺盤中，金黃蓬鬆的炒蛋中鑲嵌著翠綠的九層塔葉，蛋的表面微微金黃、內部仍保持軟嫩，九層塔的香氣隨著熱氣上升汪！",
    cookingSteps: [
      "【前置備料】雞蛋打散，九層塔取葉片洗淨瀝乾。蛋液中加入鹽和白胡椒調味。",
      "【熱鍋】鍋中下 2 大匙油，大火加熱到微冒煙。",
      "【下蛋液】倒入蛋液，快速攪拌讓蛋液均勻受熱。",
      "【半熟加九層塔】蛋半凝固時，放入九層塔葉。",
      "【拌炒】快速翻拌，讓九層塔均勻分布在蛋中。",
      "【調味】沿鍋邊淋入少許醬油提香。",
      "【火候控制】蛋還有點濕潤時就要關火，餘溫會讓蛋繼續熟成。",
      "【盛盤】盛入盤中，趁熱享用。",
    ],
  },
  {
    dishName: "醬油炒麵",
    cookingTime: "12 分鐘",
    shibaTalk: "油麵在大火爆炒下帶點焦香，醬油和豬油的香氣完美結合，是台灣夜市最經典的味道汪！",
    ingredientsUsed: ["麵條", "高麗菜", "豬肉片", "青蔥"],
    seasoningNotes: ["醬油 2 大匙、醬油膏 1 大匙", "白胡椒 1/2 小匙", "烏醋 1 小匙"],
    platingNotes: "白色深盤中，油麵條均勻上色呈現醬色光澤，高麗菜絲翠綠、肉絲點綴其間，表面微微透著油光，是一盤讓人懷念的台灣炒麵汪！",
    cookingSteps: [
      "【前置備料】高麗菜切絲，豬肉片切絲用少許醬油抓醃，蔥切段。",
      "【煮麵】滾水中煮油麵約 1 分鐘（不要全熟），撈起瀝乾。",
      "【炒肉】鍋中下 2 大匙油，中大火將肉絲炒到變色。",
      "【炒菜】下高麗菜絲，大火快炒到微軟。",
      "【下麵】油麵放入鍋中，大火翻炒均勻。",
      "【調味】加入醬油、醬油膏和白胡椒，快速翻炒讓醬色均勻。",
      "【鍋氣】大火持續翻炒到麵條邊緣微焦、香氣四溢。",
      "【盛盤】關火前淋上烏醋，撒蔥段，翻拌後盛盤。",
    ],
  },
  {
    dishName: "雞絲乾拌麵",
    cookingTime: "15 分鐘",
    shibaTalk: "雞絲嫩、醬汁香、麵條Q，每一口都拌勻了醬料的精華，是阿柴消夜的首選汪！",
    ingredientsUsed: ["雞胸肉", "麵條", "小黃瓜", "青蔥"],
    seasoningNotes: ["醬油 2 大匙、烏醋 1 大匙", "芝麻醬 1.5 大匙、糖 1 小匙", "辣油 1 小匙、蒜泥 1 小匙"],
    platingNotes: "寬口碗中，白色麵條上鋪著嫩雞絲和翠綠小黃瓜絲，深色醬汁從頂端淋下自然流淌，撒上白芝麻和蔥花，攪拌的瞬間香氣爆發汪！",
    cookingSteps: [
      "【前置備料】雞胸肉放入冷水中，加鹽和米酒，煮滾後關火悶 10 分鐘，取出剝絲。",
      "【切小黃瓜】小黃瓜切細絲，泡冰水後瀝乾。",
      "【調醬】芝麻醬用熱水調開，加入醬油、烏醋、糖、蒜泥、辣油。",
      "【煮麵】滾水中煮麵條，依照包裝時間減 30 秒（保留一點硬度）。",
      "【瀝乾】麵條撈起後充分瀝乾水分。",
      "【拌醬】將醬汁倒入麵條中，拌勻。",
      "【鋪料】雞絲和小黃瓜絲放在麵條上。",
      "【盛盤】撒上白芝麻和蔥花，上桌後再攪拌一次。",
    ],
  },
  {
    dishName: "泡麵升級版",
    cookingTime: "10 分鐘",
    shibaTalk: "泡麵也可以很講究！加一顆蛋和一些配料，就是阿柴深夜食堂的私房料理汪！",
    ingredientsUsed: ["泡麵", "雞蛋", "青蔥", "起司"],
    seasoningNotes: ["調味包只用一半（減少鈉含量）", "白胡椒少許", "香油幾滴"],
    platingNotes: "湯碗中，泡麵金黃Q彈，半熟蛋黃在中央像一顆太陽，起司片半融化覆蓋在麵上，撒上翠綠蔥花，簡單的升級卻大大滿足汪！",
    cookingSteps: [
      "【前置備料】青蔥切花，起司片準備好。",
      "【煮水】鍋中加 400ml 水煮滾。",
      "【煮泡麵】放入麵體，煮 1 分鐘後稍微撥散。",
      "【加調味】加入一半調味包和油包，攪拌均勻。",
      "【加蛋】在湯麵中央打入一顆雞蛋，蓋鍋蓋悶 1 分鐘。",
      "【加起司】放上起司片，關火，蓋鍋蓋悶 30 秒讓起司融化。",
      "【調味】撒上白胡椒和蔥花。",
      "【盛碗】直接連鍋或盛入大碗，淋幾滴香油。",
    ],
  },
  {
    dishName: "冬粉炒高麗菜",
    cookingTime: "12 分鐘",
    shibaTalk: "冬粉吸飽了高麗菜的水分和醬油的鹹香，Q彈入味，比肉還搶手汪！",
    ingredientsUsed: ["冬粉", "高麗菜", "紅蘿蔔", "大蒜"],
    seasoningNotes: ["醬油 2 大匙、醬油膏 1 小匙", "白胡椒 1/2 小匙", "香油 1 小匙"],
    platingNotes: "白色淺盤中，透明的冬粉呈現迷人的醬油色、晶瑩Q彈，和高麗菜絲、紅蘿蔔絲均勻交織，表面泛著油光，樸實但美味汪！",
    cookingSteps: [
      "【前置備料】冬粉泡冷水 10 分鐘至軟，剪成適口長度。高麗菜和紅蘿蔔切絲。",
      "【炒菜】鍋中下 1.5 大匙油，中火爆香蒜末。下紅蘿蔔絲和高麗菜絲，大火快炒到微軟。",
      "【下冬粉】泡軟瀝乾的冬粉放入鍋中。",
      "【調味】加入醬油、醬油膏和白胡椒。",
      "【拌炒】用筷子或鍋鏟將冬粉和菜絲拌勻，讓冬粉均勻上色。",
      "【加水】如果太乾可加 2-3 大匙水，幫助冬粉吸收調味。",
      "【視覺判斷】冬粉呈現均勻醬色、Q彈不軟爛。",
      "【盛盤】關火前淋香油，拌勻後盛盤。",
    ],
  },
  {
    dishName: "鹹蛋炒苦瓜",
    cookingTime: "15 分鐘",
    shibaTalk: "鹹蛋黃的鹹香完美包覆苦瓜，把苦味變得溫和，連不敢吃苦瓜的人都會愛上汪！",
    ingredientsUsed: ["鹹蛋", "大蒜", "辣椒"],
    seasoningNotes: ["鹽少許（鹹蛋已有鹹度）", "糖 1/2 小匙", "米酒 1 大匙"],
    platingNotes: "白色盤中，苦瓜片呈現翠綠色澤、均勻裹上金黃色的鹹蛋黃碎末，看起來就像金沙一般閃耀，紅辣椒絲點綴增添色彩汪！",
    cookingSteps: [
      "【前置備料】苦瓜去籽切薄片，鹹蛋將蛋白蛋黃分開、蛋黃壓碎。",
      "【燙苦瓜】滾水中加少許鹽和油，苦瓜燙 1 分鐘去苦味，撈起瀝乾。",
      "【炒蛋黃】鍋中下 2 大匙油，小火將鹹蛋黃炒到起泡冒金沙。",
      "【爆香】下蒜末和辣椒，炒出香氣。",
      "【下苦瓜】轉中火，下苦瓜片翻炒均勻。",
      "【加蛋白】將鹹蛋白切碎加入鍋中，輕輕拌炒。",
      "【調味】加糖中和苦味，沿鍋邊嗆米酒。",
      "【盛盤】翻炒均勻後盛盤，金沙均勻裹在每片苦瓜上。",
    ],
  },
  {
    dishName: "百頁豆腐滷味",
    cookingTime: "20 分鐘",
    shibaTalk: "百頁豆腐吸飽了滷汁的精華，QQ彈彈的口感配上醬油香，阿柴食堂的滷味台必備汪！",
    ingredientsUsed: ["百頁豆腐", "大蒜", "青蔥"],
    seasoningNotes: ["醬油 3 大匙、醬油膏 1 大匙", "冰糖 1 大匙", "八角 1 顆、滷包少許"],
    platingNotes: "深碗中，百頁豆腐呈現深褐色、表面光滑油亮，滷汁濃稠有光澤，撒上翠綠蔥花和少許辣椒，旁邊可以放一些酸菜增加口感層次汪！",
    cookingSteps: [
      "【前置備料】百頁豆腐切厚片（約 2 公分），表面劃刀幫助入味。",
      "【煎表面】鍋中下 1 大匙油，中火將百頁豆腐兩面煎到金黃。",
      "【調滷汁】加入醬油、醬油膏、冰糖、八角、蒜末和水 300ml。",
      "【滷煮】大火煮滾後轉小火，蓋鍋蓋滷 12 分鐘。",
      "【翻面】中途翻面一次讓兩邊均勻入味。",
      "【收汁】開蓋轉中火收汁到滷汁變濃稠。",
      "【浸泡】關火後讓豆腐在滷汁中浸泡 5 分鐘。",
      "【盛盤】取出百頁豆腐切片，淋上滷汁，撒蔥花和辣椒。",
    ],
  },
  {
    dishName: "酥炸杏鮑菇",
    cookingTime: "15 分鐘",
    shibaTalk: "杏鮑菇裹上薄薄的粉漿炸到金黃酥脆，咬下去裡面還會噴汁，阿柴偷吃好幾塊汪！",
    ingredientsUsed: ["杏鮑菇", "雞蛋", "胡椒粉"],
    seasoningNotes: ["鹽 1/2 小匙、白胡椒 1 小匙", "蒜粉 1 小匙", "椒鹽粉適量（沾料）"],
    platingNotes: "白色大盤鋪上吸油紙，金黃酥脆的炸杏鮑菇堆疊成小山，表面撒上椒鹽粉和少許辣椒粉，旁邊放一碟塔塔醬或番茄醬沾食汪！",
    cookingSteps: [
      "【前置備料】杏鮑菇切滾刀塊（約 3 公分），用鹽和胡椒抓醃。",
      "【調粉漿】麵粉 4 大匙、蛋液 1 顆、水少許攪拌成濃稠粉漿。",
      "【裹漿】杏鮑菇塊均勻裹上粉漿。",
      "【熱油】鍋中倒入油，加熱到 170 度（筷子插入冒細泡）。",
      "【炸第一遍】杏鮑菇分批入鍋，中火炸 3 分鐘到金黃，撈起。",
      "【炸第二遍】轉大火提高油溫，再次入鍋炸 30 秒到酥脆。",
      "【瀝油】撈起後放在吸油紙上瀝油。",
      "【盛盤】趁熱撒上椒鹽粉和蒜粉，盛盤上桌。",
    ],
  },
  {
    dishName: "起司蔥蛋",
    cookingTime: "8 分鐘",
    shibaTalk: "牽絲的起司和蔥蛋結合在一起，每一口都可以拉絲，阿柴最喜歡的療癒系料理汪！",
    ingredientsUsed: ["雞蛋", "起司", "青蔥"],
    seasoningNotes: ["鹽 1/4 小匙", "白胡椒少許", "奶油 1 小匙"],
    platingNotes: "白色平盤中，金黃的蔥蛋表面微焦，切開的瞬間起司緩緩流出，翠綠蔥花散布其間，是一道視覺和味覺都超滿足的料理汪！",
    cookingSteps: [
      "【前置備料】雞蛋打散，青蔥切花，起司撕成小片。",
      "【調蛋液】蛋液中加入鹽、白胡椒和蔥花，攪拌均勻。",
      "【熱鍋】鍋中下奶油，中小火加熱到融化。",
      "【下蛋液】將蛋液倒入鍋中，均勻鋪平。",
      "【鋪起司】在蛋液半凝固時，將起司片鋪在蛋的上半部。",
      "【對折】用鍋鏟將蛋皮對折，蓋住起司。",
      "【煎到金黃】兩面各煎約 1 分鐘到金黃色。",
      "【盛盤】盛入盤中，切開讓起司流出來。",
    ],
  },
  {
    dishName: "蜂蜜芥末烤雞翅",
    cookingTime: "30 分鐘",
    shibaTalk: "蜂蜜芥末醬烤出來的雞翅，外皮甜香微焦、肉質嫩到流汁，阿柴烤盤從沒空過汪！",
    ingredientsUsed: ["雞腿肉", "大蒜", "蜂蜜"],
    seasoningNotes: ["蜂蜜 2 大匙、法式芥末 1 大匙", "醬油 1 大匙、橄欖油 1 大匙", "黑胡椒少許"],
    platingNotes: "白色長盤鋪上生菜葉，烤雞翅整齊排列，表面金黃油亮帶有焦糖色澤，蜂蜜芥末醬微微黏稠包裹在雞皮上，撒上白芝麻和巴西里碎，看起來就是居酒屋等級汪！",
    cookingSteps: [
      "【前置備料】雞翅洗淨擦乾，用叉子在表面戳洞。",
      "【調醬】蜂蜜、芥末醬、醬油、橄欖油、蒜末混合拌勻。",
      "【醃製】雞翅放入醬料中抓勻，冷藏醃至少 20 分鐘。",
      "【預熱】烤箱預熱 200 度。",
      "【擺盤】烤盤鋪烘焙紙，雞翅排列整齊不重疊。",
      "【烤第一面】放入烤箱烤 15 分鐘到表面金黃。",
      "【翻面】取出翻面，刷上一層剩餘醬料，再烤 10 分鐘。",
      "【盛盤】取出後撒上白芝麻，盛盤上桌。",
    ],
  },
  {
    dishName: "乾煸四季豆",
    cookingTime: "15 分鐘",
    shibaTalk: "四季豆乾煸到表面微焦起皺，拌上蒜末和辣椒，越嚼越香，阿柴可以配兩碗飯汪！",
    ingredientsUsed: ["絞肉", "大蒜", "辣椒"],
    seasoningNotes: ["醬油 1 大匙、糖 1/2 小匙", "白胡椒少許", "鹽 1/4 小匙"],
    platingNotes: "白色淺盤中，四季豆呈現微焦的金黃色、表皮微微起皺，絞肉末均勻散布其上，蒜末和紅辣椒點綴，是一道香氣十足的下飯菜汪！",
    cookingSteps: [
      "【前置備料】四季豆洗淨去頭尾，瀝乾水分。蒜切末，辣椒切圈。",
      "【乾煸】鍋中下 2 大匙油，中火將四季豆煎到表皮微焦起皺（約 5 分鐘），不時翻動。",
      "【盛起】四季豆盛起備用。",
      "【炒肉】用鍋中餘油，下絞肉炒到酥香出油。",
      "【爆香】加入蒜末和辣椒，炒出香氣。",
      "【合併】四季豆倒回鍋中，大火快速翻炒。",
      "【調味】加入醬油、糖、鹽和白胡椒，翻炒均勻。",
      "【盛盤】確認四季豆均勻裹上調味，盛盤上桌。",
    ],
  },
  {
    dishName: "豆芽菜炒蛋",
    cookingTime: "8 分鐘",
    shibaTalk: "豆芽菜的清脆和雞蛋的軟嫩，簡單的組合卻讓人一吃就停不下來汪！",
    ingredientsUsed: ["雞蛋", "大蒜"],
    seasoningNotes: ["鹽 1/2 小匙、白胡椒少許", "米酒 1 小匙"],
    platingNotes: "白色淺盤中，黃白相間的炒蛋蓬鬆柔軟，清脆的豆芽菜鑲嵌在蛋中，蒜香清爽，是一道簡單又美味的家常菜汪！",
    cookingSteps: [
      "【前置備料】豆芽菜洗淨瀝乾，雞蛋打散加鹽，蒜切末。",
      "【炒蛋】鍋中下 2 大匙油，中大火將蛋液炒到半熟盛起。",
      "【炒豆芽】同一鍋補少許油，大火快炒豆芽菜約 30 秒。",
      "【加蒜】下蒜末拌炒 10 秒。",
      "【調味】加入鹽和白胡椒，沿鍋邊嗆入米酒。",
      "【合併】將炒蛋倒回鍋中。",
      "【快速拌炒】大火翻炒均勻約 15 秒。",
      "【盛盤】趁豆芽還保有脆度時盛盤。",
    ],
  },
  {
    dishName: "櫻花蝦炒飯",
    cookingTime: "12 分鐘",
    shibaTalk: "櫻花蝦的鮮香和蛋炒飯結合，每一口都吃得到海味，是阿柴食堂的人氣炒飯汪！",
    ingredientsUsed: ["白飯", "雞蛋", "青蔥", "大蒜"],
    seasoningNotes: ["鹽 1/2 小匙、白胡椒 1/2 小匙", "醬油 1 小匙", "櫻花蝦 2 大匙"],
    platingNotes: "白色深盤中，炒飯粒粒金黃分明，粉紅色的櫻花蝦和翠綠的蔥花均勻分布，每一粒米都閃耀著油光，海味和蛋香完美融合汪！",
    cookingSteps: [
      "【前置備料】雞蛋打散，青蔥切花，櫻花蝦稍微沖水瀝乾。",
      "【炒櫻花蝦】鍋中下 1 大匙油，小火將櫻花蝦炒到酥脆，盛起備用。",
      "【炒蛋】補 1.5 大匙油，中大火將蛋液炒到半熟。",
      "【下飯】倒入白飯，大火快速翻炒炒散。",
      "【調味】加入鹽、白胡椒，沿鍋邊嗆入醬油。",
      "【拌炒】持續大火翻炒到飯粒乾爽分明。",
      "【加櫻花蝦】關火前將櫻花蝦和蔥花倒入，快速翻拌均勻。",
      "【盛盤】盛入盤中，頂端可再放少許櫻花蝦點綴。",
    ],
  },
  {
    dishName: "紅燒豆腐",
    cookingTime: "18 分鐘",
    shibaTalk: "傳統豆腐煎到金黃再紅燒，外酥內嫩，醬汁濃郁，是阿柴阿嬤的拿手好菜汪！",
    ingredientsUsed: ["傳統豆腐", "大蒜", "青蔥", "辣椒"],
    seasoningNotes: ["醬油 2 大匙、醬油膏 1 大匙", "糖 1 小匙、米酒 1 大匙", "白胡椒少許"],
    platingNotes: "淺盤中，豆腐塊金黃方正、醬色均勻油亮，醬汁濃稠包裹每塊豆腐，翠綠蔥花和紅辣椒點綴其間，是樸實又美味的家常菜汪！",
    cookingSteps: [
      "【前置備料】傳統豆腐切成厚塊（約 2x3 公分），用紙巾吸乾水分。",
      "【煎豆腐】鍋中下 2 大匙油，中火將豆腐塊各面煎到金黃酥脆。",
      "【爆香】將豆腐推到鍋邊，下蒜末和辣椒爆香。",
      "【調味】加入醬油、醬油膏、糖和米酒。",
      "【加水】加入 100ml 水，輕輕搖晃鍋子讓調味均勻。",
      "【燉煮】中火煮 5 分鐘，不時翻面讓兩邊均勻入味。",
      "【收汁】轉大火收汁到醬汁濃稠，輕輕翻動讓豆腐裹上醬汁。",
      "【盛盤】盛入盤中，撒上蔥花。",
    ],
  },
  {
    dishName: "蚵仔煎",
    cookingTime: "15 分鐘",
    shibaTalk: "阿柴版的蚵仔煎，外酥內軟、蚵仔飽滿鮮甜，淋上甜辣醬就是台灣夜市的味道汪！",
    ingredientsUsed: ["雞蛋", "地瓜葉"],
    seasoningNotes: ["甜辣醬 2 大匙", "醬油膏 1 大匙", "糖 1/2 小匙"],
    platingNotes: "白色平盤中，金黃微焦的蚵仔煎整片盛入，表面交織著翠綠的青菜和飽滿的蚵仔，淋上紅色甜辣醬和醬油膏相間的醬料，經典夜市風汪！",
    cookingSteps: [
      "【前置備料】地瓜葉洗淨切段，蚵仔用鹽水輕柔洗淨瀝乾。",
      "【調粉漿】地瓜粉 4 大匙、水 6 大匙、少許鹽攪拌均勻。",
      "【熱鍋】平底鍋下 2 大匙油，中大火加熱。",
      "【煎蚵仔】蚵仔先下鍋煎約 30 秒。",
      "【下粉漿】將粉漿攪拌後倒入鍋中，均勻覆蓋蚵仔。",
      "【加菜】在粉漿上鋪上地瓜葉。",
      "【打蛋】淋上打散的蛋液，蓋鍋蓋悶 1 分鐘。",
      "【翻面盛盤】煎到邊緣金黃酥脆後翻面再煎 30 秒，盛盤淋醬。",
    ],
  },
  {
    dishName: "香菇滷肉燥",
    cookingTime: "50 分鐘",
    shibaTalk: "加了香菇的滷肉燥比原版更有層次，菇的香氣和絞肉的油脂完美融合，是阿柴的升級版汪！",
    ingredientsUsed: ["絞肉", "香菇", "大蒜", "白飯"],
    seasoningNotes: ["醬油 3 大匙、醬油膏 1 大匙", "冰糖 1 大匙", "八角 1 顆、白胡椒 1/2 小匙"],
    platingNotes: "白飯盛碗後淋上滿滿的香菇肉燥，香菇丁和肉末均勻分布，醬汁深褐色油亮濃稠，撒上蔥花和少許白芝麻，旁邊配半顆滷蛋和黃蘿蔔汪！",
    cookingSteps: [
      "【前置備料】乾香菇泡軟切小丁（香菇水保留），蒜切末，紅蔥頭切片。",
      "【煸紅蔥頭】鍋中下油，小火將紅蔥頭煸到金黃酥脆。",
      "【炒肉】轉中火，下絞肉炒散到變色出油。",
      "【爆香】加入香菇丁和蒜末，炒出香氣約 2 分鐘。",
      "【調味】加冰糖炒融化，再加入醬油和醬油膏上色。",
      "【加水】加入香菇水和 300ml 熱水，放入八角。",
      "【燉煮】大火煮滾後轉小火，蓋鍋蓋燉 30 分鐘。",
      "【收汁】開蓋轉中火收汁到濃稠，調味後盛盤淋飯。",
    ],
  },
  {
    dishName: "薑絲炒大腸",
    cookingTime: "15 分鐘",
    shibaTalk: "大腸用薑絲和醋爆炒，酸香開胃、Q彈有嚼勁，是阿柴店裡最受歡迎的下酒菜汪！",
    ingredientsUsed: ["大腸", "老薑", "辣椒"],
    seasoningNotes: ["白醋 2 大匙、醬油 1 大匙", "糖 1 小匙、米酒 1 大匙", "鹽少許"],
    platingNotes: "白色淺盤中，大腸切段呈現誘人的醬色，薑絲金黃細長與大腸交錯，辣椒片點綴其間，醬汁微酸帶鹹香，是一道超下飯的客家經典汪！",
    cookingSteps: [
      "【前置備料】大腸用鹽和麵粉反覆搓洗乾淨，煮 20 分鐘至軟後切段。",
      "【薑絲】老薑切細絲。",
      "【乾煸大腸】鍋中不放油，中火將大腸煸到表面微焦出油。",
      "【爆薑絲】加入薑絲，炒到薑絲邊緣微捲。",
      "【調味】加入醬油、白醋、糖和米酒。",
      "【拌炒】大火快速翻炒到醬汁收乾。",
      "【加辣椒】下辣椒片拌炒均勻。",
      "【盛盤】趁熱盛盤，薑絲大腸交錯堆疊。",
    ],
  },
  {
    dishName: "塔香茄子",
    cookingTime: "15 分鐘",
    shibaTalk: "茄子軟嫩入味、九層塔香氣濃郁，阿柴用一個小撇步讓茄子不變色，紫色亮晶晶上桌汪！",
    ingredientsUsed: ["茄子", "大蒜", "九層塔"],
    seasoningNotes: ["醬油 2 大匙、蠔油 1 小匙", "糖 1 小匙、米酒 1 大匙", "鹽少許"],
    platingNotes: "白色淺盤中，茄子呈現漂亮的深紫色，油亮飽滿，九層塔翠綠點綴，蒜末均勻分布，醬汁微微濃稠包裹每塊茄子，看起來就超下飯汪！",
    cookingSteps: [
      "【前置備料】茄子去蒂切滾刀塊，泡鹽水 5 分鐘防止變色。蒜切末。",
      "【瀝乾】茄子撈起充分瀝乾水分（可用廚房紙巾按壓）。",
      "【過油】鍋中下 3 大匙油，中大火將茄子炸到表面皺縮變軟（約 3 分鐘）。",
      "【瀝油】茄子撈起瀝油。",
      "【爆香】鍋中留 1 大匙油，下蒜末爆香。",
      "【下茄子】茄子倒回鍋中，快速翻炒。",
      "【調味】加入醬油、蠔油、糖和米酒，翻炒到茄子均勻上色。",
      "【盛盤】關火前放入九層塔葉拌炒幾下，盛盤。",
    ],
  },
  {
    dishName: "麻婆豆腐",
    cookingTime: "15 分鐘",
    shibaTalk: "麻辣鹹香的醬汁包裹著嫩豆腐，花椒的麻和辣椒的辣在舌尖跳舞，阿柴每次都要多吃半碗飯汪！",
    ingredientsUsed: ["嫩豆腐", "絞肉", "青蔥", "大蒜"],
    seasoningNotes: ["辣豆瓣醬 1.5 大匙、醬油 1 大匙", "花椒粉 1/2 小匙、糖 1/2 小匙", "太白粉水勾芡"],
    platingNotes: "深盤中，嫩豆腐塊浸泡在紅通通的麻辣醬汁中，表面泛著油光，絞肉末散布其間，撒上翠綠蔥花和少許花椒粉，紅綠交錯超誘人汪！",
    cookingSteps: [
      "【前置備料】嫩豆腐切小方塊（約 2 公分），放入鹽水中浸泡備用。絞肉用少許醬油抓醃。",
      "【炒肉】鍋中下 1.5 大匙油，中火將絞肉炒到酥香出油。",
      "【爆香】加入蒜末和辣豆瓣醬，小火炒出紅油（約 1 分鐘）。",
      "【加水】加入 200ml 水或高湯，煮滾。",
      "【下豆腐】豆腐瀝乾水分後，輕輕滑入鍋中。",
      "【燉煮】中小火煮 5 分鐘，輕輕晃動鍋子讓豆腐均勻入味（不要用鍋鏟翻動）。",
      "【勾芡】淋入太白粉水勾薄芡，輕輕推勻。",
      "【盛盤】盛入深盤，撒上花椒粉和蔥花。",
    ],
  },
  {
    dishName: "培根高麗菜",
    cookingTime: "10 分鐘",
    shibaTalk: "培根的煙燻油脂炒進高麗菜裡，菜甜肉香，簡單又讓人滿足汪！",
    ingredientsUsed: ["高麗菜", "大蒜", "黑胡椒"],
    seasoningNotes: ["鹽 1/4 小匙（培根已有鹹度）", "黑胡椒少許", "米酒 1 小匙"],
    platingNotes: "白色淺盤中，高麗菜翠綠油亮，培根片焦香酥脆散布其間，黑胡椒點點分布，蒜香和煙燻味完美結合，是一道快速又美味的下飯菜汪！",
    cookingSteps: [
      "【前置備料】高麗菜用手撕成小片，培根切小片，大蒜切片。",
      "【炒培根】鍋中不放油，中火將培根煎到酥脆出油。",
      "【爆香】用培根油爆香蒜片，約 15 秒。",
      "【下高麗菜】轉大火，下高麗菜快速翻炒。",
      "【調味】沿鍋邊嗆入米酒，撒黑胡椒和少許鹽。",
      "【快速翻炒】大火持續翻炒到高麗菜微軟。",
      "【視覺判斷】高麗菜翠綠油亮、培根焦脆。",
      "【盛盤】趁高麗菜還保有脆度時盛盤。",
    ],
  },
  {
    dishName: "蠔油牛肉",
    cookingTime: "12 分鐘",
    shibaTalk: "蠔油的鮮甜加上牛肉的嫩滑，是港式茶餐廳的經典，阿柴版本更下飯汪！",
    ingredientsUsed: ["牛肉片", "青蔥", "大蒜"],
    seasoningNotes: ["蠔油 2 大匙、醬油 1/2 小匙", "糖 1/2 小匙、米酒 1 大匙", "太白粉 1 小匙（抓肉）"],
    platingNotes: "白色淺盤中，牛肉片醬色油亮、口感嫩滑，醬汁濃稠巴在每片肉上，翠綠的青蔥段點綴其間，簡單但高級的中菜感汪！",
    cookingSteps: [
      "【前置備料】牛肉片用醬油和太白粉抓醃 10 分鐘。",
      "【過油】鍋中下 2 大匙油，中大火將牛肉快速炒到七分熟，盛起。",
      "【爆香】用鍋中餘油爆香蒜末。",
      "【調醬汁】碗中混合蠔油、醬油、糖、米酒和 2 大匙水。",
      "【下醬汁】將醬汁倒入鍋中煮滾。",
      "【牛肉回鍋】牛肉倒回鍋中，大火快速翻炒 20 秒。",
      "【收汁】炒到醬汁濃稠包裹牛肉。",
      "【盛盤】撒上蔥段，翻拌後盛盤。",
    ],
  },
  {
    dishName: "蒜泥白肉",
    cookingTime: "25 分鐘",
    shibaTalk: "五花肉煮到軟嫩後切薄片，淋上蒜味醬油，就是台灣最強的白肉料理汪！",
    ingredientsUsed: ["五花肉", "大蒜", "小黃瓜", "薑"],
    seasoningNotes: ["醬油膏 2 大匙、醬油 1 大匙", "蒜泥 2 大匙、糖 1 小匙", "香油 1 小匙、烏醋 1 小匙"],
    platingNotes: "白色長盤中，五花肉薄片整齊排列，粉白色的肉片層層疊疊，淋上濃郁的蒜泥醬油膏，小黃瓜片墊底或圍邊增加清爽感，最後撒上蔥花和辣椒絲汪！",
    cookingSteps: [
      "【前置備料】五花肉整塊放入冷水中，加薑片和米酒，中火煮到滾。",
      "【煮肉】轉小火煮 20 分鐘，用筷子可輕鬆穿透即可。",
      "【冰鎮】煮好的肉泡冰水 10 分鐘，讓肉質緊實好切。",
      "【切片】順紋切成薄片（約 0.3 公分）。",
      "【做蒜泥醬】蒜頭磨成泥，加入醬油膏、醬油、糖、烏醋和香油，攪拌均勻。",
      "【擺盤】小黃瓜片鋪盤底，五花肉片整齊排列在上。",
      "【淋醬】將蒜泥醬均勻淋在肉片上。",
      "【盛盤】撒上蔥花和辣椒絲點綴，即可上桌。",
    ],
  },
  {
    dishName: "蝦仁滑蛋",
    cookingTime: "12 分鐘",
    shibaTalk: "蝦仁的鮮甜和滑嫩的蛋完美結合，阿柴的版本是蛋要夠滑、蝦要夠大汪！",
    ingredientsUsed: ["蝦子", "雞蛋", "青蔥"],
    seasoningNotes: ["鹽 1/2 小匙、白胡椒少許", "米酒 1 小匙", "太白粉少許（抓蝦）"],
    platingNotes: "白色淺盤中，金黃滑嫩的炒蛋堆成小山，大蝦仁均勻分布在蛋中、粉紅飽滿，翠綠蔥花點綴其上，蛋的表面還帶一點濕潤光澤汪！",
    cookingSteps: [
      "【前置備料】蝦仁開背去腸泥，用鹽和太白粉輕輕抓洗後瀝乾。",
      "【醃蝦】蝦仁用少許鹽、白胡椒和米酒醃 5 分鐘。",
      "【燙蝦】滾水中燙蝦仁 20 秒到變色，撈起瀝乾。",
      "【調蛋液】雞蛋打散，加鹽、白胡椒和 1 大匙水。",
      "【熱鍋】鍋中下 2.5 大匙油，中大火加熱到微冒煙。",
      "【下蛋液】倒入蛋液，快速攪拌到半凝固。",
      "【加蝦仁】在蛋還濕潤時加入蝦仁，快速拌炒 15 秒。",
      "【盛盤】蛋不要炒太乾，還有點濕潤時關火盛盤，撒蔥花。",
    ],
  },
  {
    dishName: "魚香茄子",
    cookingTime: "15 分鐘",
    shibaTalk: "魚香其實沒有魚，但辣豆瓣醬和醋調出的魚香味，比魚還下飯汪！",
    ingredientsUsed: ["茄子", "絞肉", "大蒜", "青蔥"],
    seasoningNotes: ["辣豆瓣醬 1.5 大匙、醬油 1 大匙", "白醋 1 大匙、糖 1 大匙", "米酒 1 大匙、太白粉水勾芡"],
    platingNotes: "白色淺盤中，茄子軟嫩深紫色油亮飽滿，絞肉末散布其間，醬汁紅亮濃稠包裹著每塊茄子，撒上翠綠蔥花，魚香撲鼻超開胃汪！",
    cookingSteps: [
      "【前置備料】茄子去蒂切長條（約 6×2 公分），泡鹽水後瀝乾。",
      "【過油】鍋中下 3 大匙油，中大火將茄子炸軟（約 3 分鐘），撈起瀝油。",
      "【炒肉】鍋中留 1 大匙油，下絞肉炒到酥香。",
      "【爆香】加入蒜末和辣豆瓣醬，小火炒出紅油。",
      "【調味】加入醬油、醋、糖、米酒和 100ml 水，煮滾。",
      "【下茄子】茄子倒回鍋中，中火煮 3 分鐘入味。",
      "【勾芡】淋入太白粉水勾薄芡，讓醬汁巴在茄子上。",
      "【盛盤】撒上蔥花，盛盤上桌。",
    ],
  },
  {
    dishName: "鹽酥雞",
    cookingTime: "25 分鐘",
    shibaTalk: "雞胸肉醃過後裹上薄薄的粉，炸到金黃酥脆，撒上椒鹽，是阿柴最愛的台灣宵夜汪！",
    ingredientsUsed: ["雞胸肉", "大蒜", "九層塔"],
    seasoningNotes: ["醬油 2 大匙、蒜泥 1 大匙", "五香粉 1/2 小匙、白胡椒 1/2 小匙", "地瓜粉適量（裹粉）"],
    platingNotes: "寬口盤鋪上吸油紙，金黃酥脆的鹽酥雞堆疊成小山，九層塔葉炸到酥脆點綴其間，撒上椒鹽粉和少許辣椒粉，旁邊放一碟番茄醬或胡椒鹽沾食汪！",
    cookingSteps: [
      "【前置備料】雞胸肉切塊（約 3 公分），用醬油、蒜泥、五香粉和白胡椒醃至少 15 分鐘。",
      "【裹粉】醃好的雞肉均勻裹上地瓜粉，靜置 3 分鐘讓粉回潮。",
      "【熱油】鍋中倒入油，加熱到 170 度。",
      "【炸第一遍】雞肉分批入鍋，中火炸 3 分鐘到金黃，撈起。",
      "【炸九層塔】九層塔葉入鍋炸 10 秒，撈起。",
      "【炸第二遍】轉大火提高油溫，雞肉再次入鍋炸 30 秒到酥脆。",
      "【瀝油】撈起後放在吸油紙上瀝油。",
      "【盛盤】趁熱撒上椒鹽粉，和九層塔一起盛盤。",
    ],
  },
  {
    dishName: "菜脯蛋",
    cookingTime: "10 分鐘",
    shibaTalk: "鹹香的菜脯和雞蛋煎成金黃色的菜脯蛋，是台灣最古早味的便當菜汪！",
    ingredientsUsed: ["雞蛋", "青蔥"],
    seasoningNotes: ["菜脯 3 大匙（先泡水去鹹）", "白胡椒少許", "鹽少許（菜脯有鹹度）"],
    platingNotes: "白色平盤中，菜脯蛋煎到兩面金黃、邊緣酥脆，切開後內層蓬鬆柔軟，菜脯和蔥花均勻分布在蛋中，就是最經典的台灣味汪！",
    cookingSteps: [
      "【前置備料】菜脯洗淨泡水 10 分鐘去鹹味，瀝乾後切碎。青蔥切花。",
      "【炒菜脯】鍋中下少許油，小火將菜脯炒到乾爽出香（約 2 分鐘）。",
      "【調蛋液】雞蛋打散，加入炒好的菜脯、蔥花和白胡椒，拌勻。",
      "【熱鍋】鍋中下 2 大匙油，中大火加熱到微冒煙。",
      "【下蛋液】將蛋液倒入鍋中，均勻鋪平。",
      "【煎到金黃】中火煎到邊緣金黃、底部凝固（約 2 分鐘）。",
      "【翻面】小心翻面，續煎 1 分鐘到金黃。",
      "【盛盤】盛入盤中，可切成三角形擺盤。",
    ],
  },
  {
    dishName: "紅燒牛肉麵",
    cookingTime: "90 分鐘",
    shibaTalk: "牛腱肉慢燉到軟爛，湯頭濃郁帶著中藥香氣，配上寬麵和酸菜，是阿柴的招牌牛肉麵汪！",
    ingredientsUsed: ["牛肉片", "白飯", "青蔥", "紅蘿蔔"],
    seasoningNotes: ["醬油 4 大匙、辣豆瓣醬 1 大匙", "冰糖 1 大匙、米酒 2 大匙", "滷包 1 個、花椒 1/2 小匙"],
    platingNotes: "大碗中，金黃清澈的牛肉湯頭飄著油光，牛腱肉塊軟嫩、紅蘿蔔點綴其間，粗麵條浸泡在湯中，撒上翠綠蔥花和酸菜，一碗滿足汪！",
    cookingSteps: [
      "【前置備料】牛腱肉切大塊，冷水入鍋煮滾後洗淨浮沫。",
      "【炒豆瓣醬】鍋中下油，小火炒香辣豆瓣醬和冰糖。",
      "【炒牛肉】下牛肉塊，中火翻炒到表面上色。",
      "【加調味】加入醬油、米酒、滷包、花椒和 1500ml 水。",
      "【燉煮】大火煮滾後轉小火，蓋鍋蓋燉 60 分鐘。",
      "【加蘿蔔】紅蘿蔔滾刀切塊，加入鍋中續燉 20 分鐘。",
      "【煮麵】另起鍋煮麵條，撈起放入碗中。",
      "【盛碗】麵上擺牛肉塊和紅蘿蔔，注入熱湯，撒蔥花和酸菜。",
    ],
  },
  {
    dishName: "玉米濃湯",
    cookingTime: "20 分鐘",
    shibaTalk: "濃稠香甜的玉米濃湯，加點奶油和蛋花，阿柴喝完會舔碗底汪！",
    ingredientsUsed: ["玉米粒", "雞蛋", "奶油"],
    seasoningNotes: ["鹽 1/2 小匙、白胡椒少許", "鮮奶 100ml", "太白粉水勾芡"],
    platingNotes: "湯碗中，金黃濃稠的玉米濃湯泛著奶油光澤，蛋花如雲朵般漂浮其中，表面撒上少許黑胡椒和巴西里碎，奶香四溢汪！",
    cookingSteps: [
      "【前置備料】玉米粒瀝乾，雞蛋打散。",
      "【炒奶油】鍋中放入奶油，小火融化。",
      "【炒玉米】下玉米粒，中火炒約 2 分鐘。",
      "【加水】加入 400ml 水和高湯塊，煮滾。",
      "【加鮮奶】倒入鮮奶，攪拌均勻，轉小火。",
      "【勾芡】淋入太白粉水，邊倒邊攪拌到濃稠。",
      "【淋蛋花】將蛋液緩緩倒入，用筷子輕輕攪拌成蛋花。",
      "【盛碗】加鹽和白胡椒調味，盛碗後表面撒少許黑胡椒。",
    ],
  },
  {
    dishName: "蒜蓉蒸絲瓜",
    cookingTime: "12 分鐘",
    shibaTalk: "絲瓜清甜、蒜蓉濃香，簡單用蒸的就很好吃，是阿柴夏天最愛的清爽料理汪！",
    ingredientsUsed: ["絲瓜", "大蒜", "粉絲"],
    seasoningNotes: ["醬油 1 大匙、蠔油 1 小匙", "糖 1/2 小匙", "香油 1 小匙"],
    platingNotes: "白色長盤中，絲瓜翠綠的環狀整齊排列，金黃蒜蓉鋪在每片絲瓜上，粉絲吸飽了鮮甜的湯汁鋪底，撒上紅辣椒絲和蔥花，清爽又美味汪！",
    cookingSteps: [
      "【前置備料】絲瓜去皮切成厚圓片（約 2 公分），大蒜切細末。粉絲泡軟鋪盤底。",
      "【調蒜蓉醬】蒜末中加入醬油、蠔油、糖和少許油，拌勻。",
      "【擺盤】絲瓜片整齊排列在粉絲上。",
      "【鋪蒜蓉】將蒜蓉醬均勻鋪在每片絲瓜上。",
      "【蒸】放入蒸鍋，大火蒸 8 分鐘。",
      "【出鍋】取出後撒上蔥花和辣椒絲。",
      "【淋熱油】鍋中燒熱 1 大匙油和香油，淋在絲瓜上激發香氣。",
      "【上桌】趁熱上桌，絲瓜軟嫩清甜。",
    ],
  },
  {
    dishName: "椒鹽排骨",
    cookingTime: "30 分鐘",
    shibaTalk: "排骨醃過後炸到金黃酥脆，撒上椒鹽和蒜末，是阿柴食堂最暢銷的下酒菜汪！",
    ingredientsUsed: ["豬肉片", "大蒜", "辣椒"],
    seasoningNotes: ["醬油 1.5 大匙、米酒 1 大匙", "白胡椒 1/2 小匙、蒜粉 1/2 小匙", "地瓜粉適量（裹粉）"],
    platingNotes: "長盤中鋪上吸油紙，金黃酥脆的排骨堆疊成山，蒜末和椒鹽均勻灑在表面，紅辣椒和青蔥點綴，香氣四溢，讓人忍不住先偷吃一塊汪！",
    cookingSteps: [
      "【前置備料】肋排切小段（約 4 公分），用醬油、米酒、白胡椒、蒜末醃 15 分鐘。",
      "【裹粉】排骨均裹上地瓜粉，靜置 3 分鐘回潮。",
      "【熱油】鍋中油加熱到 170 度。",
      "【炸第一遍】排骨入鍋，中火炸 4 分鐘到金黃，撈起。",
      "【炸第二遍】轉大火提高油溫，再次入鍋炸 1 分鐘到酥脆。",
      "【瀝油】撈起後在吸油紙上瀝油。",
      "【拌料】鍋中留少許油，爆香蒜末和辣椒，關火後放入排骨翻拌。",
      "【盛盤】撒上椒鹽粉，盛盤上桌。",
    ],
  },
  {
    dishName: "雪菜炒肉絲",
    cookingTime: "12 分鐘",
    shibaTalk: "雪菜的鹹香和肉絲的嫩滑，簡單炒一炒就是一碗白飯殺手，阿柴阿嬤的味道汪！",
    ingredientsUsed: ["豬肉片", "大蒜", "辣椒"],
    seasoningNotes: ["醬油 1 大匙、糖 1/2 小匙", "米酒 1 大匙", "白胡椒少許"],
    platingNotes: "白色淺盤中，雪菜翠綠切得細碎，肉絲醬色均勻散布其間，辣椒絲點綴，雪菜特有的鹹香和肉香融合，簡單卻讓人懷念汪！",
    cookingSteps: [
      "【前置備料】豬肉片切絲，用醬油和太白粉抓醃。雪菜洗淨擠乾水分後切碎。",
      "【炒肉】鍋中下 1.5 大匙油，中大火將肉絲炒到變色盛起。",
      "【炒雪菜】用鍋中餘油，中火炒雪菜約 2 分鐘到香味散出。",
      "【爆香】加入蒜末和辣椒，炒出香氣。",
      "【合併】肉絲倒回鍋中，大火快速翻炒。",
      "【調味】加入糖和白胡椒，沿鍋邊嗆入米酒。",
      "【拌炒】翻炒均勻約 30 秒。",
      "【盛盤】趁熱盛盤，雪菜翠綠、肉絲入味。",
    ],
  },
  {
    dishName: "滷雞腿",
    cookingTime: "40 分鐘",
    shibaTalk: "雞腿用滷汁慢慢煮到入味，皮Q肉嫩，阿柴便當店的冠軍單品汪！",
    ingredientsUsed: ["雞腿肉", "大蒜", "白飯"],
    seasoningNotes: ["醬油 4 大匙、醬油膏 1 大匙", "冰糖 1 大匙、米酒 2 大匙", "八角 2 顆、薑片 3 片"],
    platingNotes: "深盤中，雞腿呈現深琥珀色、醬汁油亮濃稠，雞皮光滑飽滿，肉質軟嫩用筷子即可撥開，淋上滷汁、撒上蔥花，配白飯就是最強便當汪！",
    cookingSteps: [
      "【前置備料】雞腿洗淨擦乾，用叉子在表面戳洞。",
      "【煎表面】鍋中下少許油，中火將雞腿各面煎到金黃。",
      "【調滷汁】加入醬油、醬油膏、冰糖、米酒、八角、薑片和水 500ml。",
      "【煮滾】大火煮滾。",
      "【滷煮】轉小火，蓋鍋蓋滷 25 分鐘，中途翻面一次。",
      "【浸泡】關火後讓雞腿在滷汁中浸泡 10 分鐘。",
      "【收汁】取出雞腿，滷汁轉中火收濃。",
      "【盛盤】雞腿盛盤，淋上濃縮滷汁，撒蔥花。",
    ],
  },
  {
    dishName: "金沙南瓜",
    cookingTime: "20 分鐘",
    shibaTalk: "南瓜炸到金黃，再用鹹蛋黃炒出金沙，每一塊都裹滿金沙，香甜鹹酥阿柴好愛汪！",
    ingredientsUsed: ["鹹蛋", "大蒜"],
    seasoningNotes: ["鹽少許（鹹蛋已有鹹度）", "糖 1/2 小匙", "白胡椒少許"],
    platingNotes: "白色淺盤中，南瓜塊金黃酥脆，表面均勻裹上金沙般的鹹蛋黃碎末，閃耀著金黃色光澤，撒上蔥花和辣椒絲，看起來精緻又可口汪！",
    cookingSteps: [
      "【前置備料】南瓜去皮去籽切成厚塊（約 2 公分），鹹蛋黃壓碎。",
      "【炸南瓜】鍋中油加熱到 160 度，南瓜塊炸 3 分鐘到金黃熟透，撈起。",
      "【瀝油】南瓜放在吸油紙上瀝油。",
      "【炒金沙】鍋中留 1 大匙油，小火將鹹蛋黃炒到起泡。",
      "【爆香】加入蒜末炒香。",
      "【下南瓜】南瓜塊放入鍋中，輕輕翻拌讓每塊均勻裹上金沙。",
      "【調味】撒少許糖和白胡椒，拌勻。",
      "【盛盤】盛入盤中，趁熱享用。",
    ],
  },
  {
    dishName: "台式涼拌洋蔥",
    cookingTime: "20 分鐘",
    shibaTalk: "洋蔥泡冰水去除嗆味後，拌上柴魚醬油，清爽開胃的夏天涼拌菜汪！",
    ingredientsUsed: ["洋蔥", "柴魚片", "青蔥"],
    seasoningNotes: ["醬油 2 大匙、白醋 1 大匙", "糖 1 大匙", "香油 1 小匙、七味粉少許"],
    platingNotes: "白色小碗中，洋蔥絲冰鎮後呈現半透明狀、清脆爽口，柴魚片在頂端微微舞動，醬汁清澈包裹著洋蔥，撒上七味粉和蔥花，日式風情滿滿汪！",
    cookingSteps: [
      "【前置備料】洋蔥對半切後逆紋切成細絲。",
      "【冰鎮】洋蔥絲放入冰水中浸泡 10 分鐘（去除嗆辣味）。",
      "【瀝乾】洋蔥絲撈起充分瀝乾水分。",
      "【調醬汁】碗中混合醬油、白醋、糖和香油，攪拌到糖融化。",
      "【拌合】將醬汁倒入洋蔥絲中，拌勻。",
      "【入味】放入冰箱冷藏 10 分鐘。",
      "【盛盤】取出後盛入小碗中。",
      "【點綴】頂端放上柴魚片和蔥花，撒七味粉。",
    ],
  },
  {
    dishName: "糖醋里肌",
    cookingTime: "25 分鐘",
    shibaTalk: "里肌肉炸到金黃酥脆，裹上酸甜的糖醋醬，每一塊都閃閃發亮，阿柴的小朋友最愛汪！",
    ingredientsUsed: ["豬肉片", "雞蛋", "青蔥"],
    seasoningNotes: ["番茄醬 3 大匙、白醋 2 大匙、糖 2 大匙", "醬油 1 大匙", "太白粉水勾芡"],
    platingNotes: "白色長盤中，金黃酥脆的里肌肉塊均勻裹上紅潤的糖醋醬，醬汁濃稠油亮，撒上翠綠蔥花和白芝麻，糖醋香氣撲鼻，讓人食指大動汪！",
    cookingSteps: [
      "【前置備料】豬肉片切塊（約 3 公分），用醬油、米酒和蛋液醃 10 分鐘。",
      "【裹粉】肉塊均勻裹上太白粉或地瓜粉。",
      "【炸肉】油加熱到 170 度，肉塊炸 3 分鐘到金黃熟透，撈起。",
      "【炸第二遍】轉大火，再次炸 30 秒到酥脆。",
      "【調醬汁】碗中混合番茄醬、白醋、糖、醬油和 100ml 水。",
      "【煮醬】鍋中下少許油，倒入醬汁煮滾，勾薄芡。",
      "【裹醬】將炸好的肉塊倒入鍋中，快速翻拌讓每塊裹上醬汁。",
      "【盛盤】撒上蔥花和白芝麻，趁熱上桌。",
    ],
  },
  {
    dishName: "清蒸鱸魚",
    cookingTime: "20 分鐘",
    shibaTalk: "鱸魚清蒸最能吃出魚的鮮甜，阿柴的蔥絲和醬汁是靈魂，宴客必備的大菜汪！",
    ingredientsUsed: ["鮭魚", "青蔥", "老薑"],
    seasoningNotes: ["醬油 2 大匙、米酒 2 大匙", "蠔油 1 小匙", "香油 1 大匙（淋熱油用）"],
    platingNotes: "白色長魚盤中，魚身完整、肉質雪白嫩滑，蔥絲和薑絲堆疊在魚背上，醬油湯汁清澈見底，淋上熱油的瞬間滋滋作響，香氣四溢汪！",
    cookingSteps: [
      "【前置備料】魚身兩側各劃三刀，塞入薑片。蔥白切段鋪盤底。",
      "【調味】魚身抹上少許鹽和米酒，靜置 5 分鐘。",
      "【蒸】放入蒸鍋，大火蒸 10 分鐘（視魚大小調整）。",
      "【倒水】蒸好後倒掉盤中的腥水。",
      "【鋪蔥絲】魚身鋪上大量蔥絲和薑絲。",
      "【調醬汁】醬油、蠔油、米酒混合後淋在魚四周。",
      "【淋油】鍋中燒熱香油和少許油到冒煙，淋在蔥絲上。",
      "【上桌】趁熱上桌，魚肉軟嫩鮮甜。",
    ],
  },
  {
    dishName: "螞蟻上樹",
    cookingTime: "15 分鐘",
    shibaTalk: "冬粉絲吸飽了辣豆瓣醬和絞肉的香氣，就像螞蟻爬在樹上一樣，超下飯汪！",
    ingredientsUsed: ["絞肉", "冬粉", "青蔥", "大蒜"],
    seasoningNotes: ["辣豆瓣醬 1.5 大匙、醬油 1 大匙", "糖 1/2 小匙、米酒 1 大匙", "香油少許"],
    platingNotes: "白色淺盤中，冬粉呈現均勻的紅褐色、Q彈有光澤，絞肉末散布其間像螞蟻般攀附在冬粉上，撒上翠綠蔥花，香辣誘人汪！",
    cookingSteps: [
      "【前置備料】冬粉泡冷水至軟後剪半。絞肉用少許醬油抓醃。",
      "【炒肉】鍋中下 1.5 大匙油，中火將絞肉炒到酥香。",
      "【爆香】加入蒜末和辣豆瓣醬，小火炒出紅油。",
      "【加水】加入 200ml 水或高湯，煮滾。",
      "【調味】加入醬油、糖和米酒。",
      "【下冬粉】冬粉瀝乾放入鍋中，中火煮到吸飽湯汁（約 3 分鐘）。",
      "【收汁】開大火收汁到醬汁濃稠、冬粉入味。",
      "【盛盤】關火撒上蔥花，淋少許香油翻拌後盛盤。",
    ],
  },
  {
    dishName: "剝皮辣椒雞湯",
    cookingTime: "40 分鐘",
    shibaTalk: "剝皮辣椒的微辣和雞湯的鮮甜，喝起來順口又暖身，是阿柴冬天的私房湯品汪！",
    ingredientsUsed: ["雞腿肉", "香菇", "老薑"],
    seasoningNotes: ["剝皮辣椒 5-6 條（含湯汁）", "鹽 1/2 小匙", "米酒 2 大匙"],
    platingNotes: "砂鍋或湯碗中，金黃清澈的湯頭飄著淡淡的辣味，雞腿肉軟嫩、剝皮辣椒沉浮其間，湯面泛著薄薄一層雞油，喝一口全身都暖起來汪！",
    cookingSteps: [
      "【前置備料】雞腿剁塊，剝皮辣椒切段，老薑切片。",
      "【燙雞肉】雞肉塊冷水入鍋煮滾，洗淨浮沫。",
      "【爆香】鍋中下少許油，小火煸香薑片。",
      "【炒雞肉】下雞肉塊，中火炒到表面微金黃。",
      "【加水】加入 1000ml 熱水，煮滾後轉小火。",
      "【燉煮】蓋鍋蓋燉 25 分鐘。",
      "【加辣椒】加入剝皮辣椒（含湯汁）和米酒，續煮 5 分鐘。",
      "【盛碗】加鹽調味，盛碗上桌。",
    ],
  },
  {
    dishName: "炸醬麵",
    cookingTime: "30 分鐘",
    shibaTalk: "豆干丁和絞肉炒出濃郁炸醬，配著麵條和清爽的小黃瓜絲，每一口都是老北京的味道汪！",
    ingredientsUsed: ["絞肉", "豆乾", "小黃瓜", "麵條"],
    seasoningNotes: ["甜麵醬 2 大匙、豆瓣醬 1 大匙", "醬油 1 大匙、糖 1 大匙", "水 200ml"],
    platingNotes: "寬口碗中，白色麵條上鋪著深褐色的炸醬，旁邊整齊擺放翠綠的小黃瓜絲和銀芽，配色鮮明，攪拌後每根麵條都裹上濃郁醬香汪！",
    cookingSteps: [
      "【前置備料】豆乾切小丁，小黃瓜切細絲，蒜切末。",
      "【炒豆乾】鍋中下 2 大匙油，中火將豆乾丁煎到金黃微焦，盛起。",
      "【炒肉】同一鍋補少許油，下絞肉炒到酥香出油。",
      "【爆香】加蒜末炒香。",
      "【調醬】加入甜麵醬和豆瓣醬，小火炒出醬香約 2 分鐘。",
      "【加豆乾】豆乾倒回鍋中，加水煮滾後轉小火燉 15 分鐘。",
      "【煮麵】另起鍋煮麵條，撈起瀝乾。",
      "【盛碗】麵條盛碗，鋪上炸醬和小黃瓜絲，拌勻後食用。",
    ],
  },
  {
    dishName: "鹹酥蝦",
    cookingTime: "12 分鐘",
    shibaTalk: "蝦子用蒜頭和椒鹽爆炒到酥脆，連殼都可以一起吃，阿柴的下酒菜首選汪！",
    ingredientsUsed: ["蝦子", "大蒜", "青蔥"],
    seasoningNotes: ["鹽 1/2 小匙、白胡椒 1 小匙", "蒜粉 1/2 小匙", "米酒 1 大匙"],
    platingNotes: "白色長盤中，蝦子金黃酥脆、蒜末均勻分布在每隻蝦上，椒鹽香氣濃郁，蔥花和辣椒絲點綴，蝦殼閃耀著油亮光澤，連殼一起嗑超涮嘴汪！",
    cookingSteps: [
      "【前置備料】蝦子剪去鬚腳和尖刺，開背去腸泥，瀝乾水分。",
      "【炸蝦】油加熱到 180 度，蝦子炸 1 分鐘到殼酥，撈起。",
      "【瀝油】蝦子放在吸油紙上。",
      "【爆香】鍋中留少許油，中火爆香蒜末和辣椒。",
      "【下蝦】蝦子倒回鍋中，大火快速翻炒。",
      "【調味】撒上鹽、白胡椒和蒜粉，沿鍋邊嗆入米酒。",
      "【快速拌炒】持續大火翻拌約 30 秒讓調味均勻。",
      "【盛盤】關火撒上蔥花，盛盤上桌。",
    ],
  },
  {
    dishName: "培根奶油義大利麵",
    cookingTime: "20 分鐘",
    shibaTalk: "奶油白醬的濃郁搭配培根的煙燻鹹香，阿柴版本的義大利麵簡單又幸福汪！",
    ingredientsUsed: ["麵條", "培根", "雞蛋", "奶油"],
    seasoningNotes: ["鹽 1/2 小匙、黑胡椒 1/2 小匙", "鮮奶 150ml", "起司粉少許"],
    platingNotes: "白色深盤中，義大利麵條均勻裹上 creamy 的白醬，培根塊金黃焦脆散布其間，表面撒上黑胡椒和起司粉，簡單卻讓人滿足的一盤汪！",
    cookingSteps: [
      "【前置備料】培根切小塊，蒜切片。",
      "【煮麵】滾水中加鹽，煮義大利麵至 al dente（保留約 1 分鐘硬度），撈起保留半杯煮麵水。",
      "【煎培根】鍋中不放油，中火將培根煎到酥脆出油，盛起。",
      "【爆香】用培根油爆香蒜片。",
      "【做白醬】加入鮮奶和少許煮麵水，煮到微滾。",
      "【下麵】義大利麵放入鍋中，轉中火拌炒。",
      "【調味】加鹽和黑胡椒調味，若太乾可再加煮麵水。",
      "【盛盤】盛入盤中，撒上培根塊、起司粉和黑胡椒。",
    ],
  },
  {
    dishName: "蔥爆牛肉",
    cookingTime: "12 分鐘",
    shibaTalk: "大火快炒的蔥爆牛肉，蔥的香氣和牛肉的嫩滑，是阿柴熱炒排行榜第一名汪！",
    ingredientsUsed: ["牛肉片", "洋蔥", "大蒜", "辣椒"],
    seasoningNotes: ["醬油 2 大匙、蠔油 1 小匙", "糖 1/2 小匙、米酒 1 大匙", "太白粉 1 小匙（抓肉）"],
    platingNotes: "白色淺盤中，牛肉片醬色油亮、嫩滑入味，大量的青蔥段翠綠交錯，洋蔥絲半透明散布其間，醬汁濃稠巴在肉和蔥上，香氣撲鼻汪！",
    cookingSteps: [
      "【前置備料】牛肉片用醬油和太白粉抓醃 10 分鐘。青蔥切段，蔥白蔥綠分開。",
      "【過油】鍋中下 2 大匙油，中大火將牛肉快速炒到七分熟，盛起。",
      "【爆蔥白】用鍋中餘油，下蔥白段爆香約 20 秒。",
      "【調味】加入蠔油、醬油、糖和米酒，煮滾。",
      "【牛肉回鍋】牛肉倒回鍋中，大火快速翻炒 20 秒。",
      "【下蔥綠】加入蔥綠段，持續大火快炒。",
      "【收汁】炒到醬汁濃稠包裹牛肉和蔥。",
      "【盛盤】趁熱盛盤，蔥還保持翠綠脆度。",
    ],
  },
  {
    dishName: "藥燉排骨",
    cookingTime: "90 分鐘",
    shibaTalk: "排骨和中藥材一起慢燉，湯頭溫潤甘甜，冬天來一碗全身都暖了汪！",
    ingredientsUsed: ["豬肉片", "白蘿蔔", "老薑"],
    seasoningNotes: ["藥燉包 1 包（當歸、黃耆、枸杞等）", "米酒 3 大匙", "鹽 1 小匙"],
    platingNotes: "砂鍋或湯碗中，深琥珀色的藥燉湯頭清澈溫潤，排骨肉軟嫩入口即化，白蘿蔔塊半透明吸滿湯汁，枸杞點綴其間，中藥香氣溫暖怡人汪！",
    cookingSteps: [
      "【前置備料】排骨剁小塊，冷水入鍋煮滾後撈起洗淨。白蘿蔔切大塊。",
      "【爆香】鍋中下少許油，中火爆香薑片。",
      "【炒排骨】下排骨塊，翻炒到表面微金黃。",
      "【加水】加入 1500ml 熱水和米酒。",
      "【下藥材】放入藥燉包，大火煮滾後轉小火。",
      "【燉煮】蓋鍋蓋燉 50 分鐘。",
      "【加蘿蔔】加入白蘿蔔塊，續燉 20 分鐘到軟透。",
      "【盛碗】取出藥包，加鹽調味，盛碗趁熱喝。",
    ],
  },
  {
    dishName: "椒麻雞",
    cookingTime: "30 分鐘",
    shibaTalk: "雞腿排炸到金黃酥脆，淋上酸辣椒麻醬汁，是阿柴泰式料理的招牌菜汪！",
    ingredientsUsed: ["雞腿肉", "高麗菜", "大蒜"],
    seasoningNotes: ["魚露 2 大匙、檸檬汁 2 大匙", "糖 1 大匙、辣椒 1 大匙", "花椒粉 1/2 小匙、蒜末 1 大匙"],
    platingNotes: "白色長盤中，高麗菜絲鋪底，金黃酥脆的雞腿排斜切成厚片整齊排列，深色的椒麻醬汁從頂端淋下，撒上花生碎和香菜，酸辣香氣四溢汪！",
    cookingSteps: [
      "【前置備料】雞腿肉用刀背拍鬆，用鹽和胡椒醃 10 分鐘。高麗菜切細絲泡冰水。",
      "【裹粉】雞腿均勻沾上地瓜粉，靜置 3 分鐘回潮。",
      "【炸雞】油加熱到 170 度，雞腿炸 6 分鐘到金黃熟透，撈起。",
      "【切雞】雞腿稍微放涼後斜切成厚片。",
      "【調醬汁】碗中混合魚露、檸檬汁、糖、蒜末、辣椒碎和花椒粉，攪拌到糖融化。",
      "【擺盤】高麗菜絲瀝乾鋪盤底，雞腿排整齊排列。",
      "【淋醬】將椒麻醬汁均勻淋在雞腿上。",
      "【盛盤】撒上花生碎和香菜，立刻上桌。",
    ],
  },
  {
    dishName: "沙茶牛肉",
    cookingTime: "12 分鐘",
    shibaTalk: "沙茶的濃郁香氣和牛肉的嫩滑，大火快炒一氣呵成，是阿柴最自豪的熱炒功夫菜汪！",
    ingredientsUsed: ["牛肉片", "空心菜", "大蒜", "辣椒"],
    seasoningNotes: ["沙茶醬 2 大匙、醬油 1 大匙", "糖 1/2 小匙、米酒 1 大匙", "太白粉 1 小匙（抓肉）"],
    platingNotes: "白色淺盤中，牛肉片嫩滑醬色均勻，空心菜翠綠油亮，沙茶醬的褐色醬汁包裹著食材，蒜末和辣椒點綴，香氣濃郁超下飯汪！",
    cookingSteps: [
      "【前置備料】牛肉片用醬油和太白粉抓醃 10 分鐘。空心菜切段。",
      "【過油】鍋中下 2 大匙油，中大火將牛肉炒到七分熟，盛起。",
      "【爆香】用鍋中餘油爆香蒜末和辣椒。",
      "【炒菜】下空心菜梗先炒 20 秒，再下菜葉炒 20 秒。",
      "【調味】加入沙茶醬、醬油、糖和米酒，翻炒均勻。",
      "【牛肉回鍋】牛肉倒回鍋中，大火快速翻炒 20 秒。",
      "【融合】沙茶醬均勻裹上牛肉和空心菜。",
      "【盛盤】趁熱盛盤，空心菜保持翠綠脆度。",
    ],
  },
  {
    dishName: "和風洋蔥沙拉",
    cookingTime: "15 分鐘",
    shibaTalk: "洋蔥冰鎮後淋上和風醬，清爽開胃，阿柴最喜歡的日式沙拉汪！",
    ingredientsUsed: ["洋蔥", "高麗菜", "紅蘿蔔"],
    seasoningNotes: ["日式醬油 2 大匙、味醂 1 大匙", "白醋 1 大匙、香油 1 小匙", "白芝麻少許"],
    platingNotes: "白色大碗中，清澈的醬汁泛著光澤，洋蔥絲、高麗菜絲和紅蘿蔔絲色彩繽紛堆疊，頂端撒上白芝麻和柴魚片，清爽日式風格汪！",
    cookingSteps: [
      "【前置備料】洋蔥逆紋切細絲，高麗菜切細絲，紅蘿蔔切細絲。",
      "【冰鎮】所有蔬菜絲泡冰水 10 分鐘，增加脆度。",
      "【瀝乾】蔬菜絲充分瀝乾水分。",
      "【調醬汁】日式醬油、味醂、白醋和香油混合攪拌均勻。",
      "【擺盤】蔬菜絲在盤中堆疊成小山。",
      "【淋醬】將和風醬汁均勻淋在蔬菜上。",
      "【點綴】撒上白芝麻和柴魚片。",
      "【上桌】冰涼上桌，清脆爽口。",
    ],
  },
  {
    dishName: "碗粿",
    cookingTime: "40 分鐘",
    shibaTalk: "在來米漿蒸到Q彈，鋪上肉燥和菜脯，是阿柴最懷念的台灣古早味小吃汪！",
    ingredientsUsed: ["絞肉", "香菇"],
    seasoningNotes: ["醬油 2 大匙、醬油膏 1 大匙", "糖 1 小匙、白胡椒 1/2 小匙", "水 300ml（做米漿）"],
    platingNotes: "小碗中，碗粿表面光滑Q彈、呈現淺褐色，肉燥和香菇丁鋪在頂端，淋上醬油膏和少許蒜蓉，撒上香菜，用竹籤切開的瞬間香氣四溢汪！",
    cookingSteps: [
      "【前置備料】在來米粉 200g 加 300ml 水攪拌成米漿。乾香菇泡軟切丁。",
      "【炒肉燥】鍋中下油，中火將絞肉炒散，加入香菇丁和醬油、糖，炒到入味。",
      "【拌米漿】將炒好的肉燥（含汁）倒入米漿中拌勻，加白胡椒調味。",
      "【裝碗】將米漿分裝進小碗中，約八分滿。",
      "【蒸】放入蒸鍋，大火蒸 25 分鐘。",
      "【檢查】用竹籤插入中央，沒沾生漿就是熟了。",
      "【冷卻】取出放涼至室溫。",
      "【盛盤】倒扣取出或用碗直接上桌，淋醬油膏、撒香菜。",
    ],
  },
  {
    dishName: "韓式泡菜鍋",
    cookingTime: "25 分鐘",
    shibaTalk: "泡菜、豆腐和豬肉片一起煮成暖呼呼的泡菜鍋，酸辣過癮，阿柴冬天必煮汪！",
    ingredientsUsed: ["泡菜", "豬肉片", "嫩豆腐", "青蔥"],
    seasoningNotes: ["韓式辣醬 1 大匙、醬油 1 大匙", "糖 1 小匙", "麻油 1 小匙"],
    platingNotes: "砂鍋中，紅通通的湯頭滾著泡菜和肉片，嫩豆腐塊浮沉其間，青蔥段翠綠點綴，湯面泛著紅油光澤，熱騰騰地上桌，超級開胃汪！",
    cookingSteps: [
      "【前置備料】泡菜切段，豬肉片解凍，嫩豆腐切塊，青蔥切段。",
      "【炒泡菜】鍋中下少許麻油，中火將泡菜炒出香氣（約 2 分鐘）。",
      "【調味】加入韓式辣醬、醬油和糖，翻炒均勻。",
      "【加水】加入 500ml 水，煮滾。",
      "【煮肉】湯滾後放入豬肉片，煮到變色。",
      "【下豆腐】放入豆腐塊，中小火煮 5 分鐘入味。",
      "【最後調味】試味道調整鹹辣度，加少許麻油。",
      "【盛鍋】盛進砂鍋或深碗，撒上青蔥段，趁熱享用。",
    ],
  },
  {
    dishName: "苦瓜鑲肉",
    cookingTime: "30 分鐘",
    shibaTalk: "苦瓜環中塞入調味過的絞肉，蒸到軟嫩，肉汁和苦瓜的甘甜融合在一起汪！",
    ingredientsUsed: ["絞肉", "香菇", "青蔥"],
    seasoningNotes: ["醬油 1.5 大匙、米酒 1 大匙", "白胡椒 1/2 小匙、香油 1 小匙", "太白粉 1 小匙"],
    platingNotes: "白色長盤中，翠綠的苦瓜環整齊排列，中間鑲著飽滿的肉餡，蒸好後醬汁清澈透亮，撒上紅辣椒絲和蔥花，好看又好吃汪！",
    cookingSteps: [
      "【前置備料】苦瓜去籽切成厚環狀（約 3 公分），燙 1 分鐘去苦味。",
      "【調肉餡】絞肉中加入醬油、米酒、白胡椒、香油、太白粉和蔥花，拌勻攪打出黏性。",
      "【鑲肉】苦瓜環內壁抹少許太白粉，將肉餡填入壓緊。",
      "【排盤】鑲好的苦瓜環整齊排列在盤中。",
      "【調醬汁】醬油 1 大匙、水 100ml、糖少許混合。",
      "【淋醬】將醬汁淋在苦瓜上。",
      "【蒸】放入蒸鍋，大火蒸 20 分鐘。",
      "【盛盤】取出後將盤中湯汁淋回苦瓜上，撒蔥花裝飾。",
    ],
  },
  {
    dishName: "塔香蛤蜊豆腐煲",
    cookingTime: "15 分鐘",
    shibaTalk: "蛤蜊的鮮、豆腐的嫩、九層塔的香，一鍋到底的超鮮美組合汪！",
    ingredientsUsed: ["蛤蜊", "嫩豆腐", "大蒜", "九層塔"],
    seasoningNotes: ["醬油 1 大匙、蠔油 1 小匙", "米酒 1 大匙、糖 1/2 小匙", "太白粉水勾芡"],
    platingNotes: "黑色砂鍋中，蛤蜊飽滿開口、豆腐塊嫩白滑嫩，醬汁濃稠油亮包裹著食材，翠綠的九層塔葉點綴其上，滋滋作響上桌，鮮味滿分汪！",
    cookingSteps: [
      "【前置備料】蛤蜊吐沙洗淨，嫩豆腐切塊，蒜切末。",
      "【爆香】鍋中下 1 大匙油，中火爆香蒜末。",
      "【煎豆腐】豆腐塊放入鍋中，中火煎到兩面微金黃。",
      "【調味】加入醬油、蠔油、糖和水 100ml，煮滾。",
      "【下蛤蜊】蛤蜊放入鍋中，蓋鍋蓋悶 2 分鐘。",
      "【視覺判斷】蛤蜊開口後，淋入太白粉水勾薄芡。",
      "【下九層塔】關火前放入九層塔葉，輕輕翻拌。",
      "【盛鍋】盛入砂鍋或深盤中，趁熱上桌。",
    ],
  },
  {
    dishName: "芋頭米粉湯",
    cookingTime: "40 分鐘",
    shibaTalk: "芋頭煮到鬆軟化在湯中，米粉吸滿了芋頭和香菇的香氣，阿柴的療癒系湯麵汪！",
    ingredientsUsed: ["米粉", "香菇", "青蔥"],
    seasoningNotes: ["鹽 1 小匙、白胡椒 1/2 小匙", "油蔥酥 1 大匙", "芹菜末少許"],
    platingNotes: "大湯碗中，米粉雪白軟滑、湯頭呈現芋頭天然的淡紫色，芋頭塊鬆軟入口即化，香菇和油蔥酥點綴其中，撒上芹菜末和蔥花，溫暖又滿足汪！",
    cookingSteps: [
      "【前置備料】芋頭去皮切塊（約 2 公分），乾香菇泡軟切片，米粉泡軟。",
      "【炸芋頭】油加熱到 160 度，芋頭塊炸 3 分鐘到表面金黃（可讓湯不混濁）。",
      "【爆香】鍋中下油，爆香香菇片和油蔥酥。",
      "【加水】加入 1000ml 高湯或水，煮滾。",
      "【下芋頭】芋頭塊放入湯中，中火煮 15 分鐘到鬆軟。",
      "【下米粉】米粉瀝乾放入湯中，煮 5 分鐘到軟。",
      "【調味】加鹽和白胡椒調味。",
      "【盛碗】盛入大碗中，撒芹菜末和蔥花。",
    ],
  },
  {
    dishName: "麻油川七",
    cookingTime: "8 分鐘",
    shibaTalk: "川七用麻油和老薑快炒，口感滑脆帶著麻油香，是阿柴最喜歡的滋補青菜汪！",
    ingredientsUsed: ["老薑"],
    seasoningNotes: ["黑麻油 2 大匙", "鹽 1/2 小匙", "米酒 1 大匙"],
    platingNotes: "白色淺盤中，川七葉片翠綠油亮，老薑片金黃微焦，麻油香氣濃郁，菜葉表面泛著光澤，簡單卻讓人感受到溫暖的台灣味汪！",
    cookingSteps: [
      "【前置備料】川七洗淨瀝乾，老薑切薄片。",
      "【煸薑】冷鍋下黑麻油，小火慢慢煸薑片到邊緣微捲。",
      "【轉大火】將火力轉到最大。",
      "【下川七】川七放入鍋中，大火快速翻炒。",
      "【調味】沿鍋邊嗆入米酒，加鹽。",
      "【快速翻炒】持續大火翻拌約 30 秒。",
      "【視覺判斷】川七變軟但還保持翠綠色，不要炒太久。",
      "【盛盤】趁熱盛盤，麻油香氣最濃的時候上桌。",
    ],
  },
  {
    dishName: "香煎豆腐佐蒜蓉醬",
    cookingTime: "15 分鐘",
    shibaTalk: "傳統豆腐煎到金黃酥脆，配上濃郁的蒜蓉醬油，簡單又滿足汪！",
    ingredientsUsed: ["傳統豆腐", "大蒜", "青蔥"],
    seasoningNotes: ["醬油膏 2 大匙、醬油 1 大匙", "蒜泥 1 大匙、糖 1/2 小匙", "香油 1 小匙"],
    platingNotes: "白色淺盤中，金黃酥脆的豆腐塊整齊排列，表面煎到微焦帶有漂亮的烤色，蒜蓉醬油從頂端淋下自然流淌，撒上蔥花和辣椒絲，看起來就超下飯汪！",
    cookingSteps: [
      "【前置備料】傳統豆腐切成厚片（約 1.5 公分），用紙巾吸乾水分。",
      "【煎豆腐】鍋中下 2 大匙油，中火將豆腐片兩面煎到金黃酥脆（每面約 3 分鐘）。",
      "【翻面技巧】煎到一面金黃再翻面，不要一直翻動。",
      "【排盤】煎好的豆腐整齊排入盤中。",
      "【調醬汁】碗中混合醬油膏、醬油、蒜泥、糖和香油，攪拌均勻。",
      "【淋醬】將蒜蓉醬汁均勻淋在豆腐上。",
      "【點綴】撒上蔥花和辣椒絲。",
      "【上桌】趁熱上桌，外酥內嫩超好吃。",
    ],
  },
  {
    dishName: "麻辣燙",
    cookingTime: "20 分鐘",
    shibaTalk: "麻辣湯底煮各式配料，麻香辣爽，阿柴每次煮都越吃越上癮汪！",
    ingredientsUsed: ["高麗菜", "金針菇", "豆皮", "火鍋料"],
    seasoningNotes: ["麻辣醬 2 大匙、辣豆瓣醬 1 大匙", "花椒 1 小匙、薑片 3 片", "醬油 1 大匙"],
    platingNotes: "大碗中，紅通通的麻辣湯頭飄著花椒和辣椒，各種配料豐富堆疊，高麗菜翠綠、菇類軟滑、豆皮金黃吸滿湯汁，湯面紅油發亮，灑上蔥花和香菜汪！",
    cookingSteps: [
      "【前置備料】高麗菜切大塊，金針菇去根撥散，豆皮切寬條，火鍋料解凍。",
      "【炒底料】鍋中下 2 大匙油，小火炒香花椒、薑片和麻辣醬，直到紅油浮現。",
      "【調味】加入辣豆瓣醬和醬油，炒出香氣。",
      "【加湯底】加入 800ml 高湯或水，大火煮滾後轉小火煮 5 分鐘。",
      "【煮配料】先下高麗菜和豆皮，煮 3 分鐘。",
      "【下金針菇和火鍋料】續煮 3 分鐘到全部熟透。",
      "【調味】試味道調整辣度和鹹度。",
      "【盛碗】盛入大碗中，撒上大量蔥花和香菜。",
    ],
  },
  {
    dishName: "奶油玉米濃湯",
    cookingTime: "20 分鐘",
    shibaTalk: "香甜濃郁的奶油玉米濃湯，加點吐司丁就是完美的早餐或消夜汪！",
    ingredientsUsed: ["玉米粒", "奶油", "雞蛋", "吐司"],
    seasoningNotes: ["鹽 1/2 小匙、白胡椒少許", "鮮奶 200ml", "糖 1/2 小匙"],
    platingNotes: "湯碗中，金黃濃稠的湯汁泛著奶油光澤，玉米粒飽滿散布，蛋花如絲綢般柔滑，表面烤過的吐司丁金黃酥脆漂浮其上，奶香四溢汪！",
    cookingSteps: [
      "【前置備料】玉米粒瀝乾，雞蛋打散，吐司切小丁。",
      "【烤吐司丁】烤箱預熱 180 度，吐司丁烤 5 分鐘到金黃酥脆。",
      "【炒奶油】鍋中放入奶油，小火融化。",
      "【炒玉米】下玉米粒，中火炒約 2 分鐘。",
      "【加湯底】加入 400ml 水和高湯塊，煮滾。",
      "【加鮮奶】倒入鮮奶，轉小火，加鹽和糖調味。",
      "【淋蛋花】將蛋液緩緩倒入，用筷子輕輕攪拌成蛋花。",
      "【盛碗】盛入湯碗中，放上烤吐司丁，撒白胡椒。",
    ],
  },
  {
    dishName: "榨菜肉絲麵",
    cookingTime: "20 分鐘",
    shibaTalk: "榨菜的鹹脆和肉絲的嫩滑，配上清甜湯頭，一碗讓人滿足的台灣湯麵汪！",
    ingredientsUsed: ["豬肉片", "麵條", "青蔥"],
    seasoningNotes: ["醬油 1 大匙、糖 1/2 小匙", "白胡椒 1/2 小匙", "香油少許"],
    platingNotes: "大湯碗中，清澈的湯頭金黃透亮，白色麵條浸泡其中，榨菜肉絲鋪在麵上，翠綠的蔥花和少許辣椒絲點綴，樸實但讓人懷念的好味道汪！",
    cookingSteps: [
      "【前置備料】豬肉片切絲用醬油抓醃，榨菜切片後泡水 5 分鐘去鹹。",
      "【炒肉】鍋中下 1 大匙油，中大火將肉絲炒到變色。",
      "【炒榨菜】加入榨菜絲，翻炒約 2 分鐘出香。",
      "【調味】加入糖和白胡椒，翻炒均勻，盛起備用。",
      "【煮湯底】同一鍋加水 500ml 和高湯塊，煮滾。",
      "【煮麵】另起鍋煮麵條，撈起放入湯碗。",
      "【組合】將滾燙的湯頭注入麵碗中。",
      "【鋪料】將榨菜肉絲鋪在麵上，撒蔥花，淋少許香油。",
    ],
  },
  {
    dishName: "蛋包飯",
    cookingTime: "20 分鐘",
    shibaTalk: "番茄醬炒飯用蛋皮包起來，淋上番茄醬，是阿柴從小吃到大的幸福料理汪！",
    ingredientsUsed: ["雞蛋", "白飯", "雞胸肉", "洋蔥"],
    seasoningNotes: ["番茄醬 3 大匙、鹽 1/2 小匙", "白胡椒少許", "奶油 1 小匙"],
    platingNotes: "白色橢圓盤中，金黃色的蛋皮光滑飽滿包裹著炒飯，頂端淋上紅色番茄醬和少許美乃滋，旁邊配一些生菜沙拉，經典的日式洋食風格汪！",
    cookingSteps: [
      "【前置備料】雞胸肉切小丁，洋蔥切碎。",
      "【炒飯】鍋中下 1.5 大匙油，中大火先炒洋蔥和雞肉丁。",
      "【調味】加入番茄醬 2 大匙，炒勻後倒入白飯，大火翻炒。",
      "【調味】加鹽和白胡椒，炒到飯粒均勻上色，盛起。",
      "【做蛋皮】雞蛋打散。鍋中下奶油，小火融化後倒入蛋液，迅速轉動鍋子攤平。",
      "【鋪飯】蛋皮半凝固時，將炒飯放在蛋皮中央。",
      "【包起來】用鍋鏟將蛋皮兩側向中央折起，倒扣入盤中。",
      "【盛盤】在蛋包飯上淋番茄醬，畫出喜歡的圖案。",
    ],
  },
  {
    dishName: "泰式酸辣蝦湯",
    cookingTime: "20 分鐘",
    shibaTalk: "酸辣鮮香的泰式湯頭，蝦子彈牙、菇類軟滑，阿柴喝完會把湯底也喝光汪！",
    ingredientsUsed: ["蝦子", "金針菇", "檸檬"],
    seasoningNotes: ["魚露 2 大匙、檸檬汁 2 大匙", "泰式辣醬 1 大匙、糖 1 小匙", "香茅 1 根、南薑 3 片"],
    platingNotes: "湯碗中，紅通通的酸辣湯頭清澈透亮，蝦子鮮紅飽滿、金針菇雪白軟滑，檸檬片和香茅漂浮其間，表面泛著紅油光澤，酸辣香氣撲鼻汪！",
    cookingSteps: [
      "【前置備料】蝦子開背去腸泥，金針菇去根撥散，檸檬切角。",
      "【煮香茅】鍋中加 600ml 水，放入香茅段和南薑片，煮 5 分鐘。",
      "【調味】加入泰式辣醬、魚露和糖，攪拌均勻。",
      "【煮菇】下金針菇，煮 2 分鐘。",
      "【煮蝦】蝦子放入鍋中，煮到變色彎曲（約 2 分鐘）。",
      "【加檸檬】關火後擠入檸檬汁，攪拌均勻。",
      "【調味】試味道調整酸辣鹹度。",
      "【盛碗】盛入湯碗中，放上檸檬片和香菜裝飾。",
    ],
  },
  {
    dishName: "奶油白醬燉雞",
    cookingTime: "30 分鐘",
    shibaTalk: "雞腿肉用奶油白醬慢燉到軟嫩，醬汁濃郁奶香四溢，配飯或麵都超搭汪！",
    ingredientsUsed: ["雞腿肉", "洋蔥", "奶油", "香菇"],
    seasoningNotes: ["鹽 1/2 小匙、白胡椒 1/2 小匙", "鮮奶 200ml", "起司粉少許"],
    platingNotes: "白色深盤中，雞腿肉金黃軟嫩浸泡在 creamy 的白醬中，香菇和洋蔥分布其間，醬汁濃稠帶有光澤，撒上巴西里碎和黑胡椒，看起來就像高級餐廳的菜汪！",
    cookingSteps: [
      "【前置備料】雞腿肉切塊，洋蔥切丁，香菇切片。",
      "【煎雞肉】鍋中下 1 大匙油，中大火將雞肉各面煎到金黃，盛起。",
      "【炒洋蔥】同一鍋補少許油，中火將洋蔥丁炒到透明。",
      "【炒香菇】下香菇片，炒到軟香。",
      "【做白醬】加入奶油融化後，撒入 1 大匙麵粉炒勻，慢慢倒入鮮奶攪拌。",
      "【合併】雞肉倒回鍋中，轉小火煮 15 分鐘。",
      "【調味】加鹽和白胡椒調味。",
      "【盛盤】盛入盤中，撒上起司粉和巴西里碎。",
    ],
  },
  {
    dishName: "薑母鴨",
    cookingTime: "60 分鐘",
    shibaTalk: "麻油和老薑燉煮鴨肉，湯頭濃郁暖身，是阿柴冬天最愛的進補聖品汪！",
    ingredientsUsed: ["雞腿肉", "老薑", "高麗菜"],
    seasoningNotes: ["黑麻油 4 大匙、米酒 300ml", "鹽 1 小匙", "冰糖 1 大匙"],
    platingNotes: "砂鍋中，深褐色的湯頭麻油香氣濃郁，鴨肉塊軟爛入味，老薑片和金黃色的湯汁交融，高麗菜翠綠浮沉，湯面泛著麻油光澤，溫暖進補汪！",
    cookingSteps: [
      "【前置備料】鴨肉剁塊，老薑拍碎切片。高麗菜切大塊。",
      "【煸薑】冷鍋下黑麻油，小火慢慢煸薑片到金黃微焦。",
      "【炒鴨肉】轉中火，下鴨肉塊炒到表面金黃。",
      "【下米酒】倒入米酒，大火煮滾。",
      "【加水】加入 1000ml 熱水，放入冰糖。",
      "【燉煮】大火煮滾後轉小火，蓋鍋蓋燉 35 分鐘。",
      "【加菜】開蓋加入高麗菜，續煮 5 分鐘。",
      "【調味】加鹽調味，盛入砂鍋中上桌。",
    ],
  },
  {
    dishName: "日式咖哩雞",
    cookingTime: "40 分鐘",
    shibaTalk: "咖哩塊融合了洋蔥和雞肉的甜味，濃郁的醬汁淋在白飯上，阿柴可以吃三盤汪！",
    ingredientsUsed: ["雞腿肉", "洋蔥", "紅蘿蔔", "白飯"],
    seasoningNotes: ["咖哩塊 3 塊（中辣）", "醬油 1 小匙、蜂蜜 1 小匙", "奶油 1 小匙"],
    platingNotes: "深盤中，濃稠的咖哩醬呈現深褐色光澤，雞肉塊軟嫩、紅蘿蔔和洋蔥融化在醬汁中，白飯盛在旁邊或盤中，撒上少許巴西里碎，經典日式咖哩飯汪！",
    cookingSteps: [
      "【前置備料】雞腿肉切塊，洋蔥切丁，紅蘿蔔滾刀切塊。",
      "【炒洋蔥】鍋中下 1 大匙油，中火將洋蔥丁炒到焦糖色（約 8 分鐘）。",
      "【炒雞肉】下雞肉塊，中火炒到表面金黃。",
      "【炒紅蘿蔔】下紅蘿蔔塊，翻炒約 2 分鐘。",
      "【加水】加入 600ml 水，大火煮滾後轉小火煮 15 分鐘。",
      "【加咖哩塊】關火，加入咖哩塊攪拌到完全融化。",
      "【調味】加入醬油和蜂蜜提味，小火再煮 5 分鐘。",
      "【盛盤】白飯盛盤，淋上咖哩醬，旁邊可放一些福神漬。",
    ],
  },
  {
    dishName: "豆豉蒸排骨",
    cookingTime: "30 分鐘",
    shibaTalk: "豆豉的鹹香和排骨的肉汁完美融合，蒸好後醬汁濃郁，是一道白飯殺手汪！",
    ingredientsUsed: ["豬肉片", "大蒜", "辣椒"],
    seasoningNotes: ["豆豉 1 大匙、醬油 1 大匙", "糖 1/2 小匙、米酒 1 大匙", "太白粉 1 小匙"],
    platingNotes: "白色淺盤中，排骨蒸到軟嫩、醬汁清澈油亮，豆豉和蒜末散布其上，紅辣椒絲點綴，撒上蔥花，排骨肉用筷子一撥就骨肉分離汪！",
    cookingSteps: [
      "【前置備料】排骨剁小塊，泡冷水 10 分鐘去血水，瀝乾。",
      "【調味】排骨加入醬油、米酒、糖、太白粉、豆豉、蒜末和辣椒，拌勻醃 10 分鐘。",
      "【排盤】將排骨平鋪在淺盤中。",
      "【蒸】放入蒸鍋，大火蒸 20 分鐘。",
      "【檢查】用筷子戳排骨，能輕鬆穿透就是熟了。",
      "【出鍋】取出後撒上大量蔥花。",
      "【淋油】鍋中燒熱少許油，淋在蔥花上激發香氣。",
      "【上桌】趁熱上桌，醬汁可以拌飯。",
    ],
  },

  // ===== 更多飯麵主食 =====
  {
    dishName: "咖哩炒麵",
    cookingTime: "15 分鐘",
    shibaTalk: "咖哩粉和油麵大火快炒，香氣濃郁帶點微辣，阿柴的創意台式炒麵汪！",
    ingredientsUsed: ["麵條", "高麗菜", "豬肉片", "洋蔥"],
    seasoningNotes: ["咖哩粉 1.5 大匙、醬油 1 大匙", "鹽 1/2 小匙", "白胡椒少許"],
    platingNotes: "白色深盤中，油麵均勻裹上金黃色的咖哩醬色，高麗菜絲翠綠、肉絲散布其間，咖哩香氣濃郁撲鼻，是一盤色香味俱全的創意炒麵汪！",
    cookingSteps: [
      "【前置備料】高麗菜切絲，豬肉片切絲，洋蔥切絲。",
      "【煮麵】油麵燙 30 秒瀝乾。",
      "【炒肉】鍋中下 1.5 大匙油，中大火將肉絲炒到變色。",
      "【炒洋蔥】下洋蔥絲炒到透明。",
      "【炒高麗菜】下高麗菜絲，大火快炒到微軟。",
      "【下咖哩】撒入咖哩粉，快速翻炒出香氣。",
      "【下麵】油麵放入鍋中，加醬油和鹽，大火翻炒均勻。",
      "【盛盤】撒白胡椒，翻炒後盛盤。",
    ],
  },
  {
    dishName: "味噌拉麵",
    cookingTime: "25 分鐘",
    shibaTalk: "味噌湯頭濃郁鹹香，配上五花肉片和半熟蛋，阿柴的拉麵不輸日本店家汪！",
    ingredientsUsed: ["麵條", "五花肉", "雞蛋", "青蔥"],
    seasoningNotes: ["味噌 2 大匙（混合白味噌和紅味噌）", "醬油 1 大匙、糖 1/2 小匙", "奶油 1 小匙"],
    platingNotes: "大碗中，濃郁的味噌湯頭呈現淺褐色、表面泛著油脂光澤，叉燒片整齊排列、半熟蛋對切金黃誘人，翠綠蔥花和少許白芝麻點綴，玉米粒增添甜味汪！",
    cookingSteps: [
      "【前置備料】五花肉可用叉燒做法或直接煎到金黃切片。雞蛋煮 6 分鐘做溏心蛋。",
      "【炒配料】鍋中下少許油，中火炒洋蔥絲和蒜末到香。",
      "【調湯底】加入 600ml 高湯，煮滾後轉小火。",
      "【調味】味噌放在湯勺中在湯裡攪拌溶解，加醬油和糖。",
      "【煮麵】另起鍋煮拉麵麵條，撈起瀝乾。",
      "【組合】麵條放入碗中。",
      "【注入湯頭】將滾燙的味噌湯注入碗中。",
      "【鋪料】放上叉燒片、對切的溏心蛋、奶油和蔥花。",
    ],
  },
  {
    dishName: "紅油抄手",
    cookingTime: "20 分鐘",
    shibaTalk: "餛飩煮熟後淋上辣油醬汁，麻辣鹹香，一口一個超過癮汪！",
    ingredientsUsed: ["絞肉", "大蒜", "青蔥"],
    seasoningNotes: ["辣油 3 大匙、醬油 1 大匙、烏醋 1 大匙", "糖 1 小匙、花椒粉 1/2 小匙", "蒜泥 1 小匙"],
    platingNotes: "白色淺盤中，白嫩的餛飩整齊排列，深紅色的辣油醬汁淋在上面，撒上大量翠綠蔥花和少許花生碎，紅綠白三色對比強烈，香氣四溢汪！",
    cookingSteps: [
      "【前置備料】絞肉用醬油、白胡椒、香油和蔥花拌勻成餡。",
      "【包餛飩】取餛飩皮包入肉餡，對折捏緊。",
      "【煮餛飩】滾水中煮餛飩約 3 分鐘到浮起，撈起瀝乾。",
      "【調醬汁】碗中混合辣油、醬油、烏醋、糖、花椒粉和蒜泥，攪拌均勻。",
      "【擺盤】餛飩整齊排列在盤中。",
      "【淋醬】將醬汁均勻淋在餛飩上。",
      "【點綴】撒上大量蔥花和少許花生碎。",
      "【上桌】趁熱上桌，拌勻後食用。",
    ],
  },
  {
    dishName: "大阪燒",
    cookingTime: "25 分鐘",
    shibaTalk: "高麗菜和麵糊煎到金黃，淋上醬油和美乃滋，柴魚片在上面跳舞，阿柴的日式鐵板燒汪！",
    ingredientsUsed: ["高麗菜", "雞蛋", "麵條"],
    seasoningNotes: ["大阪燒醬 2 大匙、美乃滋 1 大匙", "鹽 1/2 小匙", "柴魚片少許、海苔粉少許"],
    platingNotes: "白色平盤中，金黃色的大阪燒表面交織著深褐色的醬汁和白色的美乃滋，柴魚片在熱氣上舞動，撒上翠綠海苔粉和青蔥，看起來超熱鬧汪！",
    cookingSteps: [
      "【前置備料】高麗菜切碎丁。",
      "【調麵糊】麵粉 4 大匙、水 4 大匙、蛋 1 顆、鹽少許，攪拌均勻。",
      "【拌料】高麗菜碎加入麵糊中拌勻。",
      "【熱鍋】平底鍋下 2 大匙油，中火加熱。",
      "【煎餅】將麵糊倒入鍋中，整理成圓餅狀，中小火煎 5 分鐘。",
      "【翻面】小心翻面，續煎 4 分鐘到金黃。",
      "【刷醬】表面刷上大阪燒醬，擠上美乃滋。",
      "【盛盤】盛入盤中，撒上柴魚片和海苔粉。",
    ],
  },
  {
    dishName: "壽喜燒",
    cookingTime: "20 分鐘",
    shibaTalk: "醬油和糖調出的壽喜燒醬汁，涮牛肉片沾生蛋黃，阿柴的幸福就這麼簡單汪！",
    ingredientsUsed: ["牛肉片", "洋蔥", "高麗菜", "雞蛋"],
    seasoningNotes: ["醬油 4 大匙、味醂 3 大匙、糖 1 大匙", "米酒 2 大匙", "水 200ml"],
    platingNotes: "黑色鐵鍋中，牛肉片在醬汁中滋滋作響，洋蔥絲半透明、高麗菜翠綠、豆腐金黃，一顆生蛋黃在旁邊，食材浸泡在深褐色的壽喜燒醬汁中汪！",
    cookingSteps: [
      "【前置備料】洋蔥切絲，高麗菜切大塊，豆腐切片煎到金黃。",
      "【調醬汁】碗中混合醬油、味醂、糖、米酒和水。",
      "【熱鍋】壽喜燒鍋或平底鍋中下少許油，中火加熱。",
      "【炒洋蔥】下洋蔥絲炒到透明。",
      "【鋪料】將高麗菜、豆腐整齊排入鍋中。",
      "【倒醬汁】將壽喜燒醬汁倒入鍋中，煮滾。",
      "【涮牛肉】牛肉片一片片放入，涮到變色即可。",
      "【沾食】牛肉沾生蛋黃後食用，超滑嫩！",
    ],
  },
  {
    dishName: "醬爆雞丁",
    cookingTime: "15 分鐘",
    shibaTalk: "雞丁用甜麵醬爆炒，醬香濃郁肉嫩滑，配飯或下酒都一流汪！",
    ingredientsUsed: ["雞胸肉", "小黃瓜", "大蒜"],
    seasoningNotes: ["甜麵醬 2 大匙、醬油 1 大匙", "糖 1 大匙、米酒 1 大匙", "太白粉 1 小匙（抓肉）"],
    platingNotes: "白色淺盤中，雞丁醬色深褐油亮，小黃瓜丁翠綠清脆，醬汁濃稠巴在每塊雞肉上，蒜末點綴其間，撒上少許白芝麻，香味濃郁汪！",
    cookingSteps: [
      "【前置備料】雞胸肉切丁用醬油和太白粉抓醃 10 分鐘。小黃瓜切丁。",
      "【過油】鍋中下 2 大匙油，中大火將雞丁炒到表面金黃，盛起。",
      "【爆香】用鍋中餘油爆香蒜末。",
      "【調醬】加入甜麵醬、醬油和糖，小火炒出醬香。",
      "【下雞丁】雞丁倒回鍋中，大火翻炒均勻。",
      "【下小黃瓜】小黃瓜丁放入鍋中，快速翻炒 30 秒。",
      "【調味】沿鍋邊嗆入米酒，快速翻拌。",
      "【盛盤】撒白芝麻，盛盤上桌。",
    ],
  },
  {
    dishName: "蒲燒鯛魚腹",
    cookingTime: "15 分鐘",
    shibaTalk: "鯛魚腹煎到金黃後刷上蒲燒醬汁，魚肉細嫩醬香濃郁，阿柴的平價鰻魚飯汪！",
    ingredientsUsed: ["白飯"],
    seasoningNotes: ["醬油 2 大匙、味醂 2 大匙、糖 1 大匙", "米酒 1 大匙", "白芝麻少許"],
    platingNotes: "白色長盤中，鯛魚腹金黃油亮、蒲燒醬色深褐帶光澤，魚肉細嫩排列在白飯上，撒上白芝麻和海苔絲，旁邊放少許紅薑絲，看起來就像高級鰻魚飯汪！",
    cookingSteps: [
      "【前置備料】鯛魚腹擦乾水分，兩面灑少許鹽。",
      "【調蒲燒醬】醬油、味醂、糖和米酒混合，小火煮到稍微濃稠。",
      "【煎魚】鍋中下 1 大匙油，中火將鯛魚腹煎到兩面金黃（每面約 3 分鐘）。",
      "【刷醬】將蒲燒醬刷在魚的兩面。",
      "【收汁】翻面續煎到醬汁微微焦香。",
      "【盛飯】白飯盛碗或盤中。",
      "【鋪魚】鯛魚腹放在飯上。",
      "【點綴】淋上剩餘蒲燒醬，撒白芝麻和海苔絲。",
    ],
  },
  {
    dishName: "蒜香白酒蛤蜊麵",
    cookingTime: "20 分鐘",
    shibaTalk: "白酒的香氣和蛤蜊的鮮甜，搭配蒜香和辣椒，是阿柴的義式海鮮麵汪！",
    ingredientsUsed: ["蛤蜊", "麵條", "大蒜", "辣椒"],
    seasoningNotes: ["白酒 100ml", "鹽 1/2 小匙、黑胡椒少許", "橄欖油 2 大匙"],
    platingNotes: "白色深盤中，義大利麵條均勻裹上蒜香橄欖油，蛤蜊飽滿開口散布其間，紅辣椒片和巴西里碎點綴，清澈的湯汁帶著白酒香氣汪！",
    cookingSteps: [
      "【前置備料】蛤蜊吐沙洗淨，蒜切片，辣椒切碎。",
      "【煮麵】滾水中加鹽，煮義大利麵至 al dente，保留煮麵水。",
      "【爆香】鍋中下橄欖油，小火爆香蒜片和辣椒。",
      "【下蛤蜊】轉大火，下蛤蜊和白酒，蓋鍋蓋悶 2 分鐘。",
      "【視覺判斷】蛤蜊開口後，將煮好的麵條放入鍋中。",
      "【拌炒】大火快速翻炒，若太乾可加少許煮麵水。",
      "【調味】加鹽和黑胡椒調味。",
      "【盛盤】盛入盤中，撒上巴西里碎。",
    ],
  },
  {
    dishName: "起司漢堡排",
    cookingTime: "25 分鐘",
    shibaTalk: "牛豬混合的漢堡排煎到金黃多汁，鋪上起司的瞬間融化，阿柴的洋食私房菜汪！",
    ingredientsUsed: ["絞肉", "洋蔥", "雞蛋", "起司"],
    seasoningNotes: ["鹽 1/2 小匙、黑胡椒 1/2 小匙", "醬油 1/2 小匙、肉豆蔻少許", "番茄醬 2 大匙、伍斯特醬 1 大匙"],
    platingNotes: "白色圓盤中，漢堡排厚實金黃、表面帶著烤紋，融化的起司緩緩流下覆蓋在肉排上，旁邊淋上番茄醬汁，配一撮生菜沙拉和烤蔬菜，看起來就是高級西餐廳的菜汪！",
    cookingSteps: [
      "【前置備料】洋蔥切碎末，用少許油炒到透明放涼。",
      "【混合肉餡】絞肉、炒洋蔥、蛋液、麵包粉、鹽、黑胡椒、肉豆蔻混合，攪拌到有黏性。",
      "【塑形】將肉餡分成等份，在手中拋打出空氣，塑成橢圓形。",
      "【煎漢堡排】鍋中下油，中大火將漢堡排表面煎到金黃（每面約 4 分鐘）。",
      "【蓋鍋蓋】轉小火，蓋鍋蓋悶煎 5 分鐘到內部熟透。",
      "【鋪起司】放上起司片，蓋鍋蓋悶 1 分鐘到融化。",
      "【調醬汁】鍋中混合番茄醬和伍斯特醬，煮到微滾。",
      "【盛盤】漢堡排盛盤，淋上醬汁，旁邊配生菜和薯泥。",
    ],
  },
  {
    dishName: "豬肝炒菠菜",
    cookingTime: "12 分鐘",
    shibaTalk: "豬肝要炒得嫩是功夫，阿柴的火候控制練了好久，配上菠菜補鐵又好吃汪！",
    ingredientsUsed: ["豬肝", "大蒜", "老薑", "辣椒"],
    seasoningNotes: ["醬油 1 大匙、米酒 1 大匙", "糖 1/2 小匙、白胡椒少許", "太白粉 1 小匙（抓豬肝）"],
    platingNotes: "白色淺盤中，豬肝薄片醬色均勻、口感滑嫩，菠菜翠綠油亮，蒜香和薑香融合，是一道營養滿分的家常菜汪！",
    cookingSteps: [
      "【前置備料】豬肝切片泡牛奶或鹽水 10 分鐘去腥，瀝乾用太白粉和米酒抓醃。",
      "【燙豬肝】滾水快速燙豬肝 15 秒，撈起瀝乾（半熟就好）。",
      "【爆香】鍋中下 2 大匙油，中火爆香薑片和蒜末。",
      "【炒菠菜】下菠菜大火快炒 30 秒到微軟。",
      "【合併】豬肝倒回鍋中，轉大火快速翻炒。",
      "【調味】加入醬油、糖、白胡椒和米酒，快速翻拌均勻。",
      "【視覺判斷】豬肝變色沒有血水、菠菜翠綠就是好了，不要炒太久。",
      "【盛盤】趁熱盛盤，豬肝嫩滑不柴。",
    ],
  },
  {
    dishName: "青椒炒肉絲",
    cookingTime: "12 分鐘",
    shibaTalk: "青椒的清脆和肉絲的嫩滑，簡單調味就很好吃，阿柴食堂的便當常客汪！",
    ingredientsUsed: ["豬肉片", "青椒", "大蒜", "辣椒"],
    seasoningNotes: ["醬油 1.5 大匙、蠔油 1 小匙", "米酒 1 大匙、糖 1/2 小匙", "太白粉 1 小匙（抓肉）"],
    platingNotes: "白色淺盤中，青椒翠綠脆亮、肉絲醬色均勻，蒜香和醬油香交織，簡單樸實卻讓人白飯一碗接一碗汪！",
    cookingSteps: [
      "【前置備料】豬肉片切絲用醬油和太白粉抓醃，青椒去籽切絲。",
      "【過油】鍋中下 1.5 大匙油，中大火將肉絲炒到變色，盛起。",
      "【爆香】用鍋中餘油爆香蒜末和辣椒。",
      "【炒青椒】下青椒絲，大火快炒 1 分鐘保持脆度。",
      "【合併】肉絲倒回鍋中，大火翻炒均勻。",
      "【調味】加入醬油、蠔油、糖和米酒，快速翻拌。",
      "【收汁】炒到醬汁均勻裹上食材。",
      "【盛盤】趁青椒還保有脆度時盛盤。",
    ],
  },
  {
    dishName: "韭菜炒鴨血",
    cookingTime: "12 分鐘",
    shibaTalk: "韭菜的香氣和鴨血的軟嫩，加上一點辣豆瓣醬，阿柴最愛的平民美食汪！",
    ingredientsUsed: ["韭菜", "大蒜", "辣椒", "老薑"],
    seasoningNotes: ["辣豆瓣醬 1 大匙、醬油 1 大匙", "糖 1/2 小匙、米酒 1 大匙", "白胡椒少許"],
    platingNotes: "白色淺盤中，深褐色的鴨血塊軟嫩入味，翠綠韭菜段交錯，醬汁濃郁微辣，撒上少許白芝麻，是一道超下飯的台式熱炒汪！",
    cookingSteps: [
      "【前置備料】鴨血切塊燙 1 分鐘去腥，韭菜切段，蒜切末。",
      "【爆香】鍋中下 1.5 大匙油，中火爆香蒜末、薑末和辣椒。",
      "【炒豆瓣】加入辣豆瓣醬，小火炒出紅油。",
      "【下鴨血】鴨血塊放入鍋中，輕輕翻炒避免破碎。",
      "【調味】加入醬油、糖、米酒和少許水，煮 3 分鐘入味。",
      "【下韭菜】轉大火，下韭菜段快速翻炒 20 秒。",
      "【調味】撒白胡椒，輕輕翻拌均勻。",
      "【盛盤】趁熱盛盤，韭菜翠綠、鴨血軟嫩。",
    ],
  },
  {
    dishName: "馬鈴薯燉肉",
    cookingTime: "35 分鐘",
    shibaTalk: "馬鈴薯和紅蘿蔔吸飽了醬油和肉汁，鬆軟入味，一鍋到底超方便汪！",
    ingredientsUsed: ["豬肉片", "馬鈴薯", "紅蘿蔔", "洋蔥"],
    seasoningNotes: ["醬油 3 大匙、味醂 2 大匙、米酒 1 大匙", "糖 1 大匙", "高湯 300ml"],
    platingNotes: "深碗中，馬鈴薯塊鬆軟金黃、紅蘿蔔香甜、肉片醬色油亮，湯汁濃郁甘甜，撒上青蔥和少許七味粉，就是一碗暖心的日式燉菜汪！",
    cookingSteps: [
      "【前置備料】馬鈴薯和紅蘿蔔去皮切滾刀塊，洋蔥切瓣，豬肉片切段。",
      "【煎肉】鍋中下 1 大匙油，中火將豬肉片煎到兩面金黃，盛起。",
      "【炒洋蔥】用鍋中餘油炒洋蔥到透明。",
      "【下馬鈴薯和紅蘿蔔】下鍋翻炒 2 分鐘。",
      "【加入調味】加入醬油、味醂、米酒、糖和高湯。",
      "【燉煮】大火煮滾後轉小火，蓋鍋蓋燉 20 分鐘。",
      "【回鍋肉】豬肉片倒回鍋中，續煮 5 分鐘。",
      "【盛盤】盛入深碗，撒上蔥花。",
    ],
  },
  {
    dishName: "地瓜甜湯",
    cookingTime: "25 分鐘",
    shibaTalk: "地瓜煮到鬆軟綿密，薑汁和冰糖的甜暖到心底，阿柴冬天的飯後甜點汪！",
    ingredientsUsed: ["地瓜", "老薑"],
    seasoningNotes: ["冰糖 3 大匙", "薑片 5 片"],
    platingNotes: "湯碗中，地瓜塊呈現金黃色半透明狀，湯汁清澈微黃帶薑汁香氣，地瓜鬆軟入口即化，溫暖又甜蜜的傳統點心汪！",
    cookingSteps: [
      "【前置備料】地瓜去皮切滾刀塊（約 3 公分），老薑切片。",
      "【煮水】鍋中加 800ml 水，放入薑片煮滾。",
      "【下地瓜】地瓜塊放入鍋中，大火煮滾。",
      "【轉小火】轉小火，蓋鍋蓋煮 15 分鐘。",
      "【加冰糖】加入冰糖，攪拌溶解。",
      "【續煮】繼續小火煮 5 分鐘到地瓜鬆軟。",
      "【視覺判斷】地瓜用筷子可輕鬆穿透就是好了。",
      "【盛碗】盛入碗中，熱熱的喝最好喝。",
    ],
  },
  {
    dishName: "木耳炒蛋",
    cookingTime: "10 分鐘",
    shibaTalk: "木耳的脆和雞蛋的軟嫩，簡單鹽調味就好吃，阿柴的健康快手菜汪！",
    ingredientsUsed: ["木耳", "雞蛋", "青蔥", "大蒜"],
    seasoningNotes: ["鹽 1/2 小匙、白胡椒少許", "米酒 1 小匙", "香油少許"],
    platingNotes: "白色淺盤中，金黃的炒蛋和深色木耳交織成漂亮對比，翠綠蔥花點綴，木耳爽脆、蛋香濃郁，清爽無負擔汪！",
    cookingSteps: [
      "【前置備料】木耳泡發後切絲，雞蛋打散加鹽，青蔥切花。",
      "【炒蛋】鍋中下 2 大匙油，中大火將蛋液炒到半熟，盛起。",
      "【炒木耳】同一鍋補少許油，下木耳絲大火快炒 1 分鐘。",
      "【爆香】加入蒜末炒香。",
      "【調味】沿鍋邊嗆入米酒，加鹽和白胡椒。",
      "【合併】炒蛋倒回鍋中，快速翻炒均勻。",
      "【最後調味】淋少許香油，翻炒幾下。",
      "【盛盤】撒上蔥花，盛盤上桌。",
    ],
  },
  {
    dishName: "滷牛腱",
    cookingTime: "90 分鐘",
    shibaTalk: "牛腱用滷包慢燉到軟嫩，冰過後切片就是最棒的冷盤，阿柴的下酒菜之王汪！",
    ingredientsUsed: ["牛腱", "大蒜", "老薑"],
    seasoningNotes: ["醬油 4 大匙、醬油膏 1 大匙", "冰糖 1 大匙、米酒 2 大匙", "滷包 1 個、八角 2 顆"],
    platingNotes: "白色長盤中，牛腱切片呈現漂亮的粉紅色橫切面，邊緣深褐色醬色，整齊排列成扇形，淋上少許滷汁、撒上蔥花和辣椒絲，旁邊配酸菜和蒜蓉醬油汪！",
    cookingSteps: [
      "【前置備料】牛腱整條用冷水浸泡 30 分鐘去血水。",
      "【燙牛腱】冷水入鍋煮滾後繼續煮 5 分鐘，洗淨浮沫。",
      "【調滷汁】鍋中加入 1000ml 水、醬油、醬油膏、冰糖、米酒、滷包、八角、蒜和薑片。",
      "【滷牛腱】放入牛腱，大火煮滾後轉小火，蓋鍋蓋滷 70 分鐘。",
      "【浸泡】關火後讓牛腱繼續浸泡在滷汁中自然冷卻。",
      "【冰鎮】連同滷汁一起放入冰箱冷藏至少 4 小時（更好切）。",
      "【切片】逆紋切成薄片（約 0.3 公分）。",
      "【盛盤】牛腱片整齊排盤，淋少許滷汁，撒蔥花和辣椒絲。",
    ],
  },
  {
    dishName: "三杯杏鮑菇",
    cookingTime: "15 分鐘",
    shibaTalk: "杏鮑菇用三杯的做法料理，比肉還香，阿柴的素食朋友指定必點汪！",
    ingredientsUsed: ["杏鮑菇", "老薑", "九層塔", "辣椒"],
    seasoningNotes: ["麻油 2 大匙、醬油 2 大匙、米酒 3 大匙", "冰糖 1 大匙", "黑胡椒少許"],
    platingNotes: "燒熱的陶鍋中，杏鮑菇塊金黃油亮、醬色均勻，九層塔翠綠點綴，麻油香氣濃郁，滋滋作響上桌就是最高享受汪！",
    cookingSteps: [
      "【前置備料】杏鮑菇切滾刀塊，老薑切片，九層塔取葉。",
      "【煸薑】冷鍋下麻油，小火慢慢煸薑片到邊緣微捲。",
      "【煎菇】轉中火，下杏鮑菇塊煎到各面金黃。",
      "【調味】加入冰糖炒融化，再加醬油和米酒。",
      "【燜煮】蓋鍋蓋轉小火悶 3 分鐘入味。",
      "【收汁】開蓋轉大火收汁到醬汁濃稠。",
      "【下九層塔】關火前放入九層塔和辣椒片，快速翻拌。",
      "【盛盤】盛入燒熱的陶鍋中，滋滋作響上桌。",
    ],
  },
  {
    dishName: "毛豆炒豆乾",
    cookingTime: "12 分鐘",
    shibaTalk: "毛豆和豆乾的雙豆組合，口感豐富又營養，是阿柴的便當常備菜汪！",
    ingredientsUsed: ["毛豆", "豆乾", "大蒜", "辣椒"],
    seasoningNotes: ["鹽 1/2 小匙、白胡椒 1/2 小匙", "醬油 1 小匙", "香油少許"],
    platingNotes: "白色淺盤中，翠綠的毛豆和金黃的豆乾丁交錯，蒜香和胡椒香點綴，是一道色彩繽紛又健康的素食料理汪！",
    cookingSteps: [
      "【前置備料】毛豆燙 3 分鐘撈起，豆乾切小丁，蒜切末。",
      "【煎豆乾】鍋中下 1.5 大匙油，中火將豆乾丁煎到金黃微焦。",
      "【爆香】加入蒜末和辣椒，炒出香氣。",
      "【下毛豆】毛豆放入鍋中，大火翻炒。",
      "【調味】加入鹽、白胡椒和醬油，翻炒均勻。",
      "【融合】持續翻炒約 1 分鐘讓味道融合。",
      "【最後調味】淋少許香油提味。",
      "【盛盤】趁熱或放涼當常備菜都好吃。",
    ],
  },
  {
    dishName: "鮮蝦餛飩湯",
    cookingTime: "15 分鐘",
    shibaTalk: "皮薄餡多的餛飩，配上清澈的湯頭和青菜，阿柴的輕食首選汪！",
    ingredientsUsed: ["餛飩", "青蔥", "芹菜"],
    seasoningNotes: ["鹽 1/2 小匙、白胡椒 1/2 小匙", "香油 1 小匙", "柴魚片少許"],
    platingNotes: "湯碗中，餛飩皮薄透光、內餡隱約可見，清澈的湯頭金黃透亮，翠綠的芹菜末和蔥花漂浮其上，滴兩滴香油在湯面，溫暖又滿足汪！",
    cookingSteps: [
      "【前置備料】餛飩從冷凍取出不需解凍，芹菜去葉切末，青蔥切花。",
      "【煮湯底】鍋中加 600ml 水，放入柴魚片煮滾後過濾。",
      "【煮餛飩】湯滾後放入餛飩，中火煮到浮起（約 4 分鐘）。",
      "【調味】加鹽和白胡椒調味。",
      "【碗底】碗中放入芹菜末和蔥花。",
      "【盛碗】將餛飩和湯一起盛入碗中。",
      "【點綴】淋上香油，撒少許白胡椒。",
      "【上桌】趁熱享用，餛飩皮滑餡鮮。",
    ],
  },
  {
    dishName: "涼拌木耳",
    cookingTime: "15 分鐘",
    shibaTalk: "木耳用酸辣醬汁涼拌，冰涼脆爽超開胃，阿柴夏天必做的涼菜汪！",
    ingredientsUsed: ["木耳", "大蒜", "辣椒", "香菜"],
    seasoningNotes: ["醬油 1 大匙、白醋 1 大匙、糖 1 大匙", "辣油 1 小匙、香油 1 小匙", "白芝麻少許"],
    platingNotes: "白色小碟中，木耳片呈現漂亮的深褐色、表面光滑，酸辣醬汁清澈包裹著每片木耳，撒上白芝麻、蒜末和香菜碎，冰涼上桌清爽開胃汪！",
    cookingSteps: [
      "【前置備料】木耳泡發後撕成小片，蒜切末，香菜切碎。",
      "【燙木耳】滾水中燙木耳 1 分鐘，撈起泡冰水。",
      "【瀝乾】木耳充分瀝乾水分。",
      "【調醬汁】碗中混合醬油、白醋、糖、辣油、香油和蒜末，攪拌到糖融化。",
      "【拌合】將醬汁倒入木耳中，拌勻。",
      "【入味】放入冰箱冷藏 10 分鐘。",
      "【最後調味】取出後再拌一次，確保入味均勻。",
      "【盛盤】盛入小碟，撒上白芝麻和香菜碎。",
    ],
  },
  {
    dishName: "福州乾拌麵",
    cookingTime: "12 分鐘",
    shibaTalk: "簡單的醬油醋乾拌麵，加上烏醋的酸香，是阿柴阿公從小吃到大懷念的味道汪！",
    ingredientsUsed: ["油麵", "青蔥", "大蒜"],
    seasoningNotes: ["醬油 2 大匙、烏醋 1 大匙", "豬油或香油 1 大匙", "白胡椒 1/2 小匙"],
    platingNotes: "寬口碗中，油麵條金黃Q彈，醬色均勻油亮，頂端放上大量蔥花和少許蒜末，看起來簡單卻讓人食指大動，拌開的瞬間香氣四溢汪！",
    cookingSteps: [
      "【前置備料】青蔥切花，蒜切末。",
      "【調醬汁】碗底放入醬油、烏醋、豬油（或香油）和白胡椒。",
      "【煮麵】滾水中煮油麵約 1 分鐘（不要過軟）。",
      "【瀝乾】麵條撈起後充分瀝乾水分。",
      "【拌入】將麵條放入碗中與醬汁拌勻。",
      "【鋪料】撒上大量蔥花和蒜末。",
      "【點綴】可加少許辣椒和榨菜絲增加口感。",
      "【上桌】趁熱拌勻享用，簡單卻美味。",
    ],
  },
  {
    dishName: "馬鈴薯沙拉",
    cookingTime: "25 分鐘",
    shibaTalk: "冰涼的馬鈴薯沙拉綿密滑順，加小黃瓜和火腿丁，阿柴野餐必備良伴汪！",
    ingredientsUsed: ["馬鈴薯", "小黃瓜", "火腿"],
    seasoningNotes: ["美乃滋 3 大匙", "鹽 1/4 小匙、白胡椒少許", "檸檬汁 1 小匙"],
    platingNotes: "白色碗中，馬鈴薯沙拉綿密雪白，翠綠的小黃瓜丁和粉紅的火腿丁點綴其間，表面撒少許黑胡椒，冰涼上桌清爽又滿足汪！",
    cookingSteps: [
      "【前置備料】馬鈴薯去皮切小塊，小黃瓜切薄片加鹽抓醃出水後瀝乾，火腿切小丁。",
      "【煮馬鈴薯】馬鈴薯塊放入冷水中，煮到筷子可穿透（約 15 分鐘）。",
      "【搗碎】馬鈴薯瀝乾後趁熱搗碎，保留一些顆粒感。",
      "【冷卻】放涼或冷藏降溫。",
      "【拌料】馬鈴薯泥中加入小黃瓜丁、火腿丁和美乃滋，拌勻。",
      "【調味】加鹽、白胡椒和檸檬汁調整味道。",
      "【冷藏】放入冰箱冷藏至少 30 分鐘。",
      "【盛盤】盛入碗中，撒少許黑胡椒點綴。",
    ],
  },
  {
    dishName: "花椰菜炒培根",
    cookingTime: "15 分鐘",
    shibaTalk: "花椰菜的清甜加上培根的鹹香，簡單水煮後拌炒就超級好吃汪！",
    ingredientsUsed: ["花椰菜", "培根", "大蒜", "紅蘿蔔"],
    seasoningNotes: ["鹽 1/2 小匙、白胡椒少許", "米酒 1 小匙", "香油少許"],
    platingNotes: "白色淺盤中，花椰菜翠綠潔白、培根焦香金黃，紅蘿蔔片點綴色彩，蒜香和培根香氣完美融合，簡單卻美味汪！",
    cookingSteps: [
      "【前置備料】花椰菜切成小朵，培根切小片，紅蘿蔔切片。",
      "【燙花椰菜】滾水中加少許鹽，燙花椰菜 2 分鐘，撈起瀝乾。",
      "【炒培根】鍋中不放油，中火將培根煎到酥脆出油。",
      "【爆香】用培根油爆香蒜末。",
      "【炒紅蘿蔔】下紅蘿蔔片翻炒 1 分鐘。",
      "【合併】花椰菜放入鍋中，大火翻炒。",
      "【調味】加鹽、白胡椒和米酒，快速翻拌均勻。",
      "【盛盤】關火前淋少許香油，盛盤。",
    ],
  },
  {
    dishName: "白菜滷",
    cookingTime: "25 分鐘",
    shibaTalk: "大白菜用扁魚和蝦米慢滷到軟爛，是台灣古早味的經典，阿柴阿嬤的拿手菜汪！",
    ingredientsUsed: ["大白菜", "蝦米", "大蒜", "乾香菇"],
    seasoningNotes: ["醬油 1 大匙、鹽 1/2 小匙", "白胡椒 1/2 小匙", "扁魚或蝦米提鮮"],
    platingNotes: "深碗中，大白菜滷到半透明軟爛、湯汁濃郁鮮甜，蝦米和香菇丁散布其間，撒上蔥花和少許白胡椒，道地的台灣古早味汪！",
    cookingSteps: [
      "【前置備料】大白菜切大塊，蝦米和乾香菇泡水後切碎。",
      "【爆香】鍋中下 2 大匙油，中火爆香蝦米和香菇碎。",
      "【炒白菜】下大白菜，大火翻炒到微軟。",
      "【調味】加入醬油，翻炒均勻。",
      "【加水】加入泡香菇的水和 100ml 水，煮滾。",
      "【燉煮】轉小火，蓋鍋蓋燉 15 分鐘到白菜軟爛。",
      "【調味】加鹽和白胡椒調味。",
      "【盛碗】盛入深碗中，撒上蔥花。",
    ],
  },
  {
    dishName: "酸菜炒肉片",
    cookingTime: "12 分鐘",
    shibaTalk: "酸菜的酸脆和豬肉片的鹹香，簡單快炒就是一碗白飯殺手汪！",
    ingredientsUsed: ["豬肉片", "酸菜", "辣椒", "大蒜"],
    seasoningNotes: ["糖 1 大匙、醬油 1 小匙", "白胡椒少許", "米酒 1 大匙"],
    platingNotes: "白色淺盤中，酸菜呈現淡黃色、肉片醬色均勻，辣椒絲點綴其間，酸菜的香氣和肉香融合，微酸帶鹹超級下飯汪！",
    cookingSteps: [
      "【前置備料】豬肉片用少許醬油抓醃，酸菜切片泡水 5 分鐘去鹹。",
      "【炒肉】鍋中下 1.5 大匙油，中大火將肉片炒到變色，盛起。",
      "【炒酸菜】用鍋中餘油，中火炒酸菜約 2 分鐘出香。",
      "【爆香】加入蒜末和辣椒炒香。",
      "【調味】加糖中和酸菜的鹹酸。",
      "【合併】肉片倒回鍋中，大火翻炒均勻。",
      "【調味】沿鍋邊嗆入米酒，撒白胡椒。",
      "【盛盤】趁熱盛盤。",
    ],
  },
  {
    dishName: "脆皮燒肉",
    cookingTime: "50 分鐘",
    shibaTalk: "五花肉烤到皮脆肉嫩，叉子在脆皮上敲出咚咚聲，阿柴覺得這是全世界最療癒的聲音汪！",
    ingredientsUsed: ["五花肉", "大蒜", "老薑"],
    seasoningNotes: ["鹽 1 小匙、五香粉 1/2 小匙", "白醋 1 大匙（刷皮用）", "米酒 1 大匙"],
    platingNotes: "白色長盤中，脆皮燒肉切片整齊排列，金黃酥脆的豬皮像餅乾一樣薄脆，肉質粉白肥瘦相間，沾一點蒜蓉醬油或芥末醬就是人間美味汪！",
    cookingSteps: [
      "【前置備料】五花肉整塊洗淨，放入冷水中加薑片和米酒煮 20 分鐘。",
      "【戳皮】取出後用廚房紙巾擦乾，用叉子在豬皮上均勻戳洞（越密越好）。",
      "【調味】肉面（非皮面）抹上鹽和五香粉，皮面刷上一層白醋。",
      "【風乾】放入冰箱冷藏風乾 4 小時或過夜（皮更脆的關鍵）。",
      "【預熱】烤箱預熱 200 度。",
      "【烤】豬皮朝上放入烤箱，烤 30 分鐘到皮開始起泡。",
      "【爆皮】轉 230 度，續烤 10 分鐘到豬皮金黃爆開。",
      "【盛盤】取出稍微放涼，切厚片排盤，沾蒜蓉醬油或海鹽享用。",
    ],
  },
  {
    dishName: "啤酒鴨",
    cookingTime: "60 分鐘",
    shibaTalk: "鴨肉用啤酒慢燉到軟爛，酒香和醬香完美融合，阿柴的聚會必備大菜汪！",
    ingredientsUsed: ["鴨肉", "老薑", "大蒜", "辣椒"],
    seasoningNotes: ["啤酒 1 罐（330ml）", "醬油 3 大匙、冰糖 1 大匙", "八角 2 顆、桂皮 1 小片"],
    platingNotes: "黑色砂鍋中，鴨肉塊深褐色醬色油亮，醬汁濃稠，啤酒的麥芽香氣融入湯汁中，撒上蔥花和辣椒，一鍋上桌氣勢滿分汪！",
    cookingSteps: [
      "【前置備料】鴨肉剁塊，冷水入鍋煮滾後洗淨浮沫。",
      "【煸薑】冷鍋下少許油，小火煸香薑片到邊緣微捲。",
      "【炒鴨】下鴨肉塊，中火炒到表面金黃出油。",
      "【調味】加入醬油和冰糖，翻炒上色。",
      "【下啤酒】倒入整罐啤酒，放入八角、桂皮和蒜頭。",
      "【燉煮】大火煮滾後轉小火，蓋鍋蓋燉 45 分鐘。",
      "【收汁】開蓋轉中火收汁到濃稠，加辣椒拌勻。",
      "【盛盤】盛入砂鍋或深盤，撒上蔥花上桌。",
    ],
  },
  {
    dishName: "蚵仔酥",
    cookingTime: "15 分鐘",
    shibaTalk: "蚵仔裹上地瓜粉炸到金黃酥脆，外酥內嫩，沾一點椒鹽就是台灣最強的下酒菜汪！",
    ingredientsUsed: ["蚵仔", "九層塔"],
    seasoningNotes: ["地瓜粉適量", "鹽 1/2 小匙、白胡椒 1 小匙", "椒鹽粉適量（沾料）"],
    platingNotes: "白色長盤鋪上吸油紙，金黃酥脆的蚵仔堆疊成小山，九層塔葉炸到酥脆點綴其間，撒上椒鹽粉和少許辣椒粉，旁邊放檸檬角沾食汪！",
    cookingSteps: [
      "【前置備料】蚵仔用鹽水輕輕洗淨，瀝乾水分（非常重要）。",
      "【裹粉】將蚵仔均勻裹上地瓜粉，輕輕抖掉多餘的粉。",
      "【熱油】鍋中倒入油，加熱到 170 度。",
      "【炸蚵仔】蚵仔分批入鍋，中火炸 2 分鐘到金黃，撈起。",
      "【炸九層塔】九層塔葉入鍋炸 10 秒，撈起。",
      "【炸第二遍】轉大火提高油溫，蚵仔再次入鍋炸 20 秒到酥脆。",
      "【瀝油】撈起後放在吸油紙上瀝油。",
      "【盛盤】趁熱撒上椒鹽粉，和九層塔一起盛盤。",
    ],
  },
  {
    dishName: "乾煎鯛魚",
    cookingTime: "15 分鐘",
    shibaTalk: "鯛魚用少許鹽和胡椒簡單乾煎，魚肉細嫩鮮甜，阿柴覺得原味才是最高境界汪！",
    ingredientsUsed: ["鯛魚", "大蒜"],
    seasoningNotes: ["鹽 1/2 小匙、白胡椒 1/2 小匙", "米酒 1 大匙", "檸檬汁少許"],
    platingNotes: "白色長盤中，鯛魚排金黃酥脆，魚皮微微焦香，魚肉雪白細嫩，旁邊放檸檬角和簡單的生菜沙拉，清爽又高級汪！",
    cookingSteps: [
      "【前置備料】鯛魚排擦乾水分，兩面均勻灑鹽和白胡椒。",
      "【熱鍋】不沾鍋中下 1.5 大匙油，中大火加熱到油微微冒煙。",
      "【下魚】魚排放入鍋中，不要移動，中火煎 3 分鐘。",
      "【翻面】小心翻面，續煎 3 分鐘到金黃。",
      "【加蒜】放入蒜末，利用餘油爆香。",
      "【嗆酒】沿鍋邊嗆入米酒，讓酒香滲入魚肉。",
      "【視覺判斷】魚排金黃、用筷子戳最厚處可輕鬆穿透。",
      "【盛盤】盛入盤中，擠上少許檸檬汁，搭配蔬菜享用。",
    ],
  },
  {
    dishName: "醬烤雞翅",
    cookingTime: "30 分鐘",
    shibaTalk: "雞翅用醬油和蜂蜜醃過再烤，甜鹹交織的醬色光澤，阿柴烤盤一出來就被搶光汪！",
    ingredientsUsed: ["雞翅", "大蒜"],
    seasoningNotes: ["醬油 3 大匙、蜂蜜 2 大匙", "米酒 1 大匙、蒜泥 1 大匙", "白芝麻少許"],
    platingNotes: "白色長盤中鋪上生菜，烤雞翅金黃油亮、醬色焦香，蜂蜜的甜在表面形成微焦的糖衣，撒上白芝麻和蔥花，看起來就是居酒屋等級汪！",
    cookingSteps: [
      "【前置備料】雞翅洗淨擦乾，用叉子在表面戳洞幫助入味。",
      "【調醬】碗中混合醬油、蜂蜜、米酒和蒜泥，攪拌均勻。",
      "【醃製】雞翅放入醬料中抓勻，冷藏醃至少 30 分鐘。",
      "【預熱】烤箱預熱 200 度。",
      "【擺盤】烤盤鋪烘焙紙，雞翅排列整齊不重疊。",
      "【烤】放入烤箱烤 15 分鐘。",
      "【刷醬翻面】取出刷上一層剩餘醬料，翻面再烤 10 分鐘。",
      "【盛盤】取出撒上白芝麻和蔥花，盛盤上桌。",
    ],
  },
  {
    dishName: "金沙筊白筍",
    cookingTime: "15 分鐘",
    shibaTalk: "筊白筍裹上鹹蛋黃的金沙，鹹香回甘，阿柴發明的這道菜連不愛吃筊白筍的人都愛上汪！",
    ingredientsUsed: ["鹹蛋", "大蒜", "青蔥"],
    seasoningNotes: ["鹽少許（鹹蛋已有鹹度）", "糖 1/2 小匙", "米酒 1 小匙"],
    platingNotes: "白色淺盤中，筊白筍塊金黃微焦，表面均勻裹上金沙般的鹹蛋黃碎末，閃耀著金黃色光澤，撒上青蔥花和少許辣椒絲，鹹香四溢超下飯汪！",
    cookingSteps: [
      "【前置備料】筊白筍去殼切滾刀塊，鹹蛋黃壓碎。",
      "【燙筊白筍】滾水中燙筊白筍 2 分鐘，撈起瀝乾。",
      "【煎筊白筍】鍋中下 1 大匙油，中火將筊白筍煎到表面微金黃，盛起。",
      "【炒金沙】鍋中補少許油，小火將鹹蛋黃炒到起泡冒金沙。",
      "【爆香】加入蒜末炒香。",
      "【合併】筊白筍倒回鍋中，輕輕翻拌讓每塊均勻裹上金沙。",
      "【調味】加少許糖，沿鍋邊嗆入米酒，拌勻。",
      "【盛盤】撒上蔥花，盛盤上桌。",
    ],
  },
  {
    dishName: "韓式炸雞",
    cookingTime: "30 分鐘",
    shibaTalk: "雞翅炸到酥脆後裹上韓式甜辣醬，每一口都酸甜辣酥脆，阿柴的韓劇追劇良伴汪！",
    ingredientsUsed: ["雞翅", "大蒜"],
    seasoningNotes: ["韓式辣醬 2 大匙、番茄醬 2 大匙", "蜂蜜 1 大匙、醬油 1 大匙", "地瓜粉適量"],
    platingNotes: "白色淺盤中，金黃酥脆的炸雞翅均勻裹上紅通通的韓式醬汁，醬汁濃稠油亮，撒上白芝麻和花生碎，旁邊放醃蘿蔔解膩汪！",
    cookingSteps: [
      "【前置備料】雞翅洗淨擦乾，用鹽和胡椒醃 10 分鐘。",
      "【裹粉】雞翅均勻裹上地瓜粉，靜置 3 分鐘回潮。",
      "【炸第一遍】油加熱到 170 度，雞翅炸 5 分鐘到金黃熟透，撈起。",
      "【炸第二遍】轉大火提高油溫，再次入鍋炸 1 分鐘到酥脆。",
      "【調醬】碗中混合韓式辣醬、番茄醬、蜂蜜、醬油和蒜末。",
      "【裹醬】鍋中下少許油，倒入醬汁小火加熱，放入炸雞快速翻拌。",
      "【均勻】讓每支雞翅均勻裹上醬汁。",
      "【盛盤】撒上白芝麻和花生碎，盛盤上桌。",
    ],
  },
  {
    dishName: "油豆腐鑲肉",
    cookingTime: "25 分鐘",
    shibaTalk: "油豆腐吸飽了肉汁和醬汁，一口咬下會爆汁，阿柴便當店的隱藏人氣王汪！",
    ingredientsUsed: ["油豆腐", "絞肉", "青蔥", "大蒜"],
    seasoningNotes: ["醬油 2 大匙、醬油膏 1 大匙", "糖 1 小匙、米酒 1 大匙", "太白粉少許"],
    platingNotes: "深盤中，金黃的油豆腐燉到醬色油亮，開口處露出飽滿的肉餡，醬汁濃稠包裹著豆腐，撒上翠綠蔥花，看起來樸實但味道超驚艷汪！",
    cookingSteps: [
      "【前置備料】油豆腐對角切開成三角型，用小湯匙挖出中間的豆腐形成袋子。",
      "【調肉餡】絞肉中加入醬油、米酒、白胡椒、蔥花和太白粉，攪拌出黏性。",
      "【鑲肉】將肉餡填入油豆腐中，壓緊實。",
      "【煎面】鍋中下 1.5 大匙油，中火將油豆腐肉餡面朝下煎到金黃。",
      "【調味】加入醬油、醬油膏、糖和水 200ml。",
      "【燉煮】蓋鍋蓋中火燉 10 分鐘，讓豆腐吸飽湯汁。",
      "【收汁】開蓋轉大火收汁到濃稠。",
      "【盛盤】盛入深盤，淋上鍋底醬汁，撒蔥花。",
    ],
  },
  {
    dishName: "玉米排骨湯",
    cookingTime: "40 分鐘",
    shibaTalk: "玉米的天然甜味和排骨的肉香一起燉，湯頭清甜到連喝三碗，阿柴冬天必煮汪！",
    ingredientsUsed: ["豬小排", "玉米", "紅蘿蔔", "老薑"],
    seasoningNotes: ["鹽 1 小匙", "米酒 1 大匙", "白胡椒少許"],
    platingNotes: "湯碗中，清澈金黃的湯頭飄著玉米和排骨，玉米金黃飽滿、排骨肉軟嫩、紅蘿蔔塊增添甜味，湯面泛著薄薄一層油脂光澤，鮮甜滿分汪！",
    cookingSteps: [
      "【前置備料】豬小排剁小段，冷水入鍋煮滾後洗淨浮沫。玉米切段，紅蘿蔔滾刀切塊。",
      "【爆香】鍋中下少許油，中火爆香薑片。",
      "【炒排骨】下排骨塊，翻炒到表面微金黃。",
      "【加水】加入 1000ml 熱水，大火煮滾。",
      "【下玉米】玉米段放入鍋中，轉小火。",
      "【燉煮】蓋鍋蓋燉 25 分鐘。",
      "【加紅蘿蔔】放入紅蘿蔔塊，續煮 10 分鐘。",
      "【盛碗】加鹽和米酒調味，盛碗後撒少許白胡椒。",
    ],
  },
  {
    dishName: "四季豆炒肉末",
    cookingTime: "12 分鐘",
    shibaTalk: "四季豆的清脆和絞肉的鹹香，加上蒜末爆香，是阿柴最愛的快手便當菜汪！",
    ingredientsUsed: ["四季豆", "絞肉", "大蒜", "辣椒"],
    seasoningNotes: ["醬油 1.5 大匙、蠔油 1 小匙", "糖 1/2 小匙、米酒 1 大匙", "白胡椒少許"],
    platingNotes: "白色淺盤中，四季豆翠綠油亮、切成小丁與絞肉末均勻交織，蒜香和醬色點綴，是一道色香味俱全的經典家常菜汪！",
    cookingSteps: [
      "【前置備料】四季豆去頭尾切小丁，大蒜切末。",
      "【燙四季豆】滾水中加少許鹽，燙四季豆 1 分鐘，撈起瀝乾。",
      "【炒肉】鍋中下 1.5 大匙油，中大火將絞肉炒到酥香出油。",
      "【爆香】加入蒜末和辣椒，炒出香氣。",
      "【合併】四季豆丁放入鍋中，大火翻炒。",
      "【調味】加入醬油、蠔油、糖和米酒，快速翻炒均勻。",
      "【收汁】大火翻炒到醬汁收乾包裹在食材上。",
      "【盛盤】撒少許白胡椒，盛盤上桌。",
    ],
  },
  {
    dishName: "清燉牛肉湯",
    cookingTime: "90 分鐘",
    shibaTalk: "牛腱和中藥材慢燉出的清湯，甘甜溫潤，阿柴感冒時阿嬤都會煮這鍋汪！",
    ingredientsUsed: ["牛腱", "老薑", "白蘿蔔", "青蔥"],
    seasoningNotes: ["鹽 1 小匙、米酒 2 大匙", "當歸 1 片、枸杞少許", "白胡椒 1/2 小匙"],
    platingNotes: "大碗中，清澈的琥珀色湯頭飄著淡淡的當歸香氣，牛腱切片軟嫩、白蘿蔔半透明入口即化，撒上翠綠蔥花和少許枸杞，溫暖滋補汪！",
    cookingSteps: [
      "【前置備料】牛腱整條泡水 30 分鐘去血水，冷水入鍋煮滾後洗淨。",
      "【切塊】牛腱切大塊（約 4 公分）。",
      "【煮湯】鍋中加入 1500ml 水，放入牛腱、薑片、米酒。",
      "【煮滾】大火煮滾後撈除浮沫。",
      "【燉煮】轉小火，蓋鍋蓋燉 60 分鐘。",
      "【加蘿蔔】白蘿蔔切大塊，放入鍋中續燉 20 分鐘。",
      "【調味】加鹽、白胡椒和枸杞調味。",
      "【盛碗】牛腱切片放入碗中，注入熱湯，撒蔥花。",
    ],
  },
  {
    dishName: "小卷米粉湯",
    cookingTime: "20 分鐘",
    shibaTalk: "小卷的鮮甜和米粉的軟滑，湯頭清澈鮮美，是阿柴對台南美食最深的記憶汪！",
    ingredientsUsed: ["小卷", "米粉", "青蔥", "芹菜"],
    seasoningNotes: ["鹽 1/2 小匙、白胡椒 1/2 小匙", "油蔥酥 1 大匙", "香油少許"],
    platingNotes: "大湯碗中，湯頭清澈金黃，米粉雪白軟滑，小卷Q彈鮮甜、紅白相間的紋路清晰可見，撒上芹菜末和油蔥酥，道地的台南味汪！",
    cookingSteps: [
      "【前置備料】小卷洗淨去內臟切圈，米粉泡軟剪短，芹菜切末。",
      "【煮湯底】鍋中加 600ml 水，放入油蔥酥煮滾。",
      "【煮米粉】米粉放入湯中，中火煮 3 分鐘。",
      "【下小卷】小卷圈放入鍋中，煮 1 分鐘（不要過久）。",
      "【調味】加鹽和白胡椒調味。",
      "【碗底】碗中放入芹菜末和蔥花。",
      "【盛碗】將米粉、小卷和湯一起盛入碗中。",
      "【點綴】淋少許香油，撒白胡椒。",
    ],
  },
  {
    dishName: "干貝蘿蔔絲湯",
    cookingTime: "20 分鐘",
    shibaTalk: "乾干貝的鮮味和白蘿蔔的清甜，煮出金黃色的湯頭，阿柴覺得這是世界上最溫柔的湯汪！",
    ingredientsUsed: ["干貝", "白蘿蔔", "老薑", "青蔥"],
    seasoningNotes: ["鹽 1/2 小匙", "米酒 1 大匙", "白胡椒少許"],
    platingNotes: "湯碗中，清澈金黃的湯頭飄著干貝絲和半透明的白蘿蔔絲，湯面泛著淡淡油光，薑絲和蔥花漂浮其間，喝一口滿滿的鮮甜汪！",
    cookingSteps: [
      "【前置備料】乾干貝泡水 10 分鐘後剝成絲，白蘿蔔切細絲，老薑切絲。",
      "【爆香】鍋中下少許油，小火煸香薑絲。",
      "【煮干貝】加入干貝絲和泡干貝的水，煮滾。",
      "【加水】加入 600ml 水，大火煮滾。",
      "【下蘿蔔絲】白蘿蔔絲放入鍋中，中火煮 8 分鐘到半透明。",
      "【調味】加鹽、米酒和白胡椒調味。",
      "【視覺判斷】蘿蔔絲半透明、湯頭金黃清澈。",
      "【盛碗】盛入碗中，撒上蔥花。",
    ],
  },
  {
    dishName: "五味花枝",
    cookingTime: "15 分鐘",
    shibaTalk: "花枝燙到Q彈，淋上五味醬（醬油膏、蒜泥、辣椒、醋、糖），阿柴的宴客冷盤必備汪！",
    ingredientsUsed: ["透抽", "大蒜", "辣椒", "青蔥"],
    seasoningNotes: ["醬油膏 2 大匙、番茄醬 1 大匙", "蒜泥 1 大匙、白醋 1 大匙、糖 1 大匙", "香油 1 小匙"],
    platingNotes: "白色長盤中，花枝切花後呈現漂亮的捲曲形狀，雪白Q彈，淋上紅褐色的五味醬，撒上蔥花和香菜，色彩鮮明、酸甜辣鹹一次滿足汪！",
    cookingSteps: [
      "【前置備料】透抽洗淨去皮，內面劃花刀後切塊。",
      "【調五味醬】碗中混合醬油膏、番茄醬、蒜泥、白醋、糖、香油和辣椒碎，攪拌均勻。",
      "【燙花枝】滾水中加少許米酒和薑片，花枝燙 40 秒到捲曲，撈起。",
      "【冰鎮】立刻泡冰水 10 秒，讓肉質更Q彈。",
      "【瀝乾】充分瀝乾水分。",
      "【擺盤】花枝整齊排列在盤中。",
      "【淋醬】將五味醬均勻淋在花枝上。",
      "【盛盤】撒上蔥花，可搭配生菜食用。",
    ],
  },
  {
    dishName: "麻油蚵仔麵線",
    cookingTime: "15 分鐘",
    shibaTalk: "麻油和老薑煸出香氣，蚵仔鮮嫩、麵線軟滑，是阿柴冬天最暖心的早餐汪！",
    ingredientsUsed: ["蚵仔", "麵線", "老薑"],
    seasoningNotes: ["黑麻油 2 大匙", "米酒 2 大匙", "鹽少許"],
    platingNotes: "湯碗中，麵線雪白軟滑浸泡在金黃色的麻油湯頭中，蚵仔飽滿鮮嫩、老薑片金黃焦香，湯面泛著麻油光澤，暖心又暖胃汪！",
    cookingSteps: [
      "【前置備料】蚵仔用鹽水輕輕洗淨瀝乾，老薑切片。",
      "【煸薑】冷鍋下黑麻油，小火慢慢煸香薑片到邊緣微捲。",
      "【煎蚵仔】轉中火，放入蚵仔煎 30 秒，輕輕翻面。",
      "【加水】加入 400ml 水和米酒，煮滾。",
      "【煮麵線】放入麵線，煮 1 分鐘（麵線很快熟）。",
      "【調味】試味道後加少許鹽（麵線本身有鹹度）。",
      "【視覺判斷】麵線變軟、蚵仔飽滿即可關火。",
      "【盛碗】盛入碗中，趁熱享用，麻油香氣最濃。",
    ],
  },
  {
    dishName: "臭豆腐炒高麗菜",
    cookingTime: "15 分鐘",
    shibaTalk: "臭豆腐的獨特香氣炒進高麗菜裡，愛的人很愛，阿柴就是那個愛到不行的汪！",
    ingredientsUsed: ["臭豆腐", "高麗菜", "大蒜", "青蔥"],
    seasoningNotes: ["醬油 1 大匙、辣豆瓣醬 1 小匙", "糖 1/2 小匙", "白胡椒少許"],
    platingNotes: "白色淺盤中，臭豆腐塊金黃微焦、高麗菜翠綠油亮，兩種質地和香氣在口中碰撞，蒜香和微辣醬汁融合，是一道越吃越上癮的創意料理汪！",
    cookingSteps: [
      "【前置備料】臭豆腐切塊（約 3 公分），高麗菜用手撕成小片。",
      "【煎豆腐】鍋中下 2 大匙油，中火將臭豆腐各面煎到金黃酥脆，盛起。",
      "【爆香】用鍋中餘油爆香蒜末。",
      "【炒高麗菜】轉大火，下高麗菜快速翻炒到微軟。",
      "【調味】加入辣豆瓣醬和醬油，翻炒均勻。",
      "【合併】臭豆腐倒回鍋中，大火翻炒。",
      "【調味】加糖和白胡椒，翻拌均勻。",
      "【盛盤】撒上蔥花，盛盤上桌。",
    ],
  },
  {
    dishName: "鴻禧菇炒水蓮",
    cookingTime: "10 分鐘",
    shibaTalk: "水蓮的清脆和鴻禧菇的軟滑，簡單用蒜和鹽調味，阿柴最愛的健康蔬食汪！",
    ingredientsUsed: ["鴻禧菇", "大蒜", "辣椒"],
    seasoningNotes: ["鹽 1/2 小匙", "米酒 1 小匙", "香油少許"],
    platingNotes: "白色淺盤中，水蓮翠綠細長、清脆爽口，鴻禧菇雪白軟滑點綴其間，紅辣椒絲增添色彩，簡單清爽無負擔汪！",
    cookingSteps: [
      "【前置備料】水蓮洗淨切段，鴻禧菇去除根部剝散，大蒜切片。",
      "【炒菇】鍋中下 1 大匙油，中火將鴻禧菇炒到微軟出水。",
      "【爆香】加入蒜片和辣椒，炒出香氣。",
      "【下水蓮】轉大火，下水蓮快速翻炒。",
      "【調味】沿鍋邊嗆入米酒，加鹽調味。",
      "【快速翻炒】大火持續翻炒約 30 秒。",
      "【視覺判斷】水蓮變翠綠但還保持脆度。",
      "【盛盤】關火前淋少許香油，盛盤上桌。",
    ],
  },
  {
    dishName: "剝皮辣椒蒸鱸魚",
    cookingTime: "20 分鐘",
    shibaTalk: "鱸魚清蒸配上剝皮辣椒的微辣，魚肉嫩滑、湯汁鮮甜，阿柴的私房宴客菜汪！",
    ingredientsUsed: ["鱸魚", "大蒜", "青蔥", "老薑"],
    seasoningNotes: ["醬油 2 大匙、米酒 2 大匙", "剝皮辣椒 3 條（含湯汁）", "香油 1 大匙"],
    platingNotes: "白色長魚盤中，鱸魚完整、肉質雪白嫩滑，剝皮辣椒和蔥絲堆疊在魚背上，醬油湯汁清澈見底，淋上熱油的瞬間滋滋作響，香氣四溢汪！",
    cookingSteps: [
      "【前置備料】鱸魚洗淨，兩側各劃三刀，塞入薑片。",
      "【調味】魚身抹上少許鹽和米酒。",
      "【鋪料】剝皮辣椒切段放在魚身上，淋上剝皮辣椒湯汁。",
      "【蒸】放入蒸鍋，大火蒸 12 分鐘（視魚大小調整）。",
      "【倒水】蒸好後倒掉盤中的腥水。",
      "【鋪蔥絲】魚身鋪上大量蔥絲和蒜末。",
      "【調醬油】沿盤邊淋入醬油。",
      "【淋油】鍋中燒熱香油和少許油到冒煙，淋在蔥絲上激發香氣。",
    ],
  },
];

function scoreRecipe(recipe: Recipe, selected: string[]): number {
  return recipe.ingredientsUsed.filter((ing) => selected.includes(ing)).length;
}

function matchBuiltinRecipe(selected: string[]): Recipe | null {
  if (!selected.length) return null;
  const scored = builtinRecipes
    .map((r) => ({ recipe: r, score: scoreRecipe(r, selected) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
  if (!scored.length) return null;
  // If tie, pick the one with fewer total ingredients (more targeted)
  const bestScore = scored[0].score;
  const tied = scored.filter((r) => r.score === bestScore);
  tied.sort((a, b) => a.recipe.ingredientsUsed.length - b.recipe.ingredientsUsed.length);
  return tied[0].recipe;
}

function suggestIngredients(recipe: Recipe): string[] {
  return recipe.ingredientsUsed;
}

/** 找出與目前食譜最相似的 N 道食譜（依共享食材數排序） */
function findSimilarRecipes(recipe: Recipe, count: number = 3): Recipe[] {
  return builtinRecipes
    .filter((r) => r.dishName !== recipe.dishName)
    .map((r) => ({ recipe: r, score: scoreRecipe(r, recipe.ingredientsUsed) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((r) => r.recipe);
}

export default function Home() {
  console.log("HOME_COMPONENT_LOADED_12345");
  const [screen, setScreen] = useState<Screen>("home");
  const [activeTab, setActiveTab] = useState("meat");
  const [selected, setSelected] = useState<string[]>([]);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [provider, setProvider] = useState<Provider>(() => (localStorage.getItem("sk-provider") as Provider) || "openai");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("sk-key") || "");
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem("sk-url") || "");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statusText, setStatusText] = useState("正在整理冰箱情報...");
  const [showAd, setShowAd] = useState(false);
  const [canCloseAd, setCanCloseAd] = useState(false);
  const [cookingMode, setCookingMode] = useState<CookingMode>("stir");
  const [cookingStep, setCookingStep] = useState<number | null>(null);
  const [ingredientOrders, setIngredientOrders] = useState<Record<string, string[]>>(categoryOrderMap);
  const [tabOrder, setTabOrder] = useState<string[]>(tabOrderSeed);
  const [draggingTab, setDraggingTab] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<SavedRecipe[]>(() => JSON.parse(localStorage.getItem("sk-fav") || "[]"));
  const [diary, setDiary] = useState<SavedRecipe[]>(() => JSON.parse(localStorage.getItem("sk-diary") || "[]"));
  const [showFav, setShowFav] = useState(false);
  const [showDiary, setShowDiary] = useState(false);
  const [sharing, setSharing] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const current = useMemo(() => categories.find(([key]) => key === activeTab) || categories[0], [activeTab]);
  const currentItems = ingredientOrders[activeTab] || current[3];
  const orderedTabs = tabOrder.map((key) => categories.find(([k]) => k === key)!).filter(Boolean);

  useEffect(() => localStorage.setItem("sk-provider", provider), [provider]);
  useEffect(() => localStorage.setItem("sk-key", apiKey), [apiKey]);
  useEffect(() => localStorage.setItem("sk-url", baseUrl), [baseUrl]);

  useEffect(() => {
    if (screen !== "cooking") return;
    let dead = false;
    let apiDone = false;
    let adDone = false;
    const goIfReady = () => { if (!dead && apiDone && adDone) setScreen("menu"); };
    setShowAd(true);
    setCanCloseAd(false);
    setStatusText("大將正在起鍋爆香中...");
    const t1 = window.setTimeout(() => setCanCloseAd(true), 1800);
    const t2 = window.setTimeout(() => { adDone = true; setShowAd(false); goIfReady(); }, 3200);
    fetchRecipe(provider, apiKey, baseUrl, selected).then((r) => {
      if (dead) return;
      setRecipe(r);
      setStatusText("香氣差不多了，正在裝盤...");
      apiDone = true;
      // auto-add to diary
      const did = Date.now().toString();
      const dEntry: SavedRecipe = { ...r, savedAt: new Date().toISOString(), id: did };
      setDiary(prev => {
        const n = [dEntry, ...prev].slice(0, 30);
        localStorage.setItem("sk-diary", JSON.stringify(n));
        return n;
      });
      goIfReady();
    }).catch(() => {
      if (dead) return;
      if (matchBuiltinRecipe(selected)) {
        setRecipe(matchBuiltinRecipe(selected)!);
        toast.success("內建食譜庫已為你找到合適料理汪！");
        apiDone = true;
        goIfReady();
      } else {
        toast.error("AI 連線失敗，先用示範食譜救場汪！");
        setRecipe(fallbackRecipe(selected));
        apiDone = true;
        goIfReady();
      }
    });
    return () => { dead = true; clearTimeout(t1); clearTimeout(t2); };
  }, [screen, provider, apiKey, baseUrl, selected]);

  const toggle = (item: string) => setSelected((prev) => prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]);
  const start = () => {
    if (!selected.length) return toast.warning("先選幾樣食材再請大將出手吧！");
    setRecipe(null);
    setScreen("cooking");
  };
  const resetAll = () => { setSelected([]); setRecipe(null); setActiveTab("meat"); setIngredientOrders(categoryOrderMap); setTabOrder(tabOrderSeed); setScreen("home"); };
  const handleTabDrop = (targetKey: string) => {
    if (!draggingTab || draggingTab === targetKey) return;
    setTabOrder((prev) => reorder(prev, draggingTab, targetKey));
    setDraggingTab(null);
  };
  const closeAd = () => { if (!canCloseAd) return; setShowAd(false); setCanCloseAd(false); };
  const isFav = (id: string) => favorites.some(f => f.id === id);
  const saveFav = () => {
    if (!recipe) return;
    const id = Date.now().toString();
    const saved: SavedRecipe = { ...recipe, savedAt: new Date().toISOString(), id };
    const next = [saved, ...favorites].slice(0, 20);
    setFavorites(next);
    localStorage.setItem("sk-fav", JSON.stringify(next));
    toast.success("❤️ 已收藏到我的酒單！");
  };
  const unFav = (id: string) => {
    const next = favorites.filter(f => f.id !== id);
    setFavorites(next);
    localStorage.setItem("sk-fav", JSON.stringify(next));
    toast.success("已從收藏中移除～");
  };
  const addDiary = () => {
    if (!recipe) return;
    const id = Date.now().toString();
    const saved: SavedRecipe = { ...recipe, savedAt: new Date().toISOString(), id };
    const next = [saved, ...diary].slice(0, 30);
    setDiary(next);
    localStorage.setItem("sk-diary", JSON.stringify(next));
  };
  const shareRecipe = async () => {
    if (!recipe || !shareRef.current) return;
    setSharing(true);
    try {
      // 開一個新視窗來生成分享圖（避免干擾主畫面）
      const shareWin = window.open("", "_blank", "width=500,height=800");
      if (!shareWin) { toast.error("請允許彈出視窗來分享汪！"); setSharing(false); return; }
      shareWin.document.write(`
        <!DOCTYPE html><html lang="zh-Hant"><head><meta charset="UTF-8">
        <title>阿柴食堂 - ${recipe.dishName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700;900&family=Noto+Serif+TC:wght@700;900&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Noto Sans TC', sans-serif; background: #f8ead0; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
          .card { max-width: 420px; width: 100%; background: #FDF8EB; border-radius: 2.4rem; overflow: hidden; padding: 24px; box-shadow: 0 20px 40px rgba(80,40,10,0.15); }
          h1 { font-family: 'Noto Serif TC', serif; font-size: 26px; font-weight: 900; color: #5d311b; text-align: center; }
          .badge { display: inline-block; background: #fff3d8; border-radius: 20px; padding: 6px 14px; font-size: 12px; font-weight: 700; color: #885c39; }
          .section { margin-top: 16px; }
          .section h3 { font-size: 13px; font-weight: 700; color: #ac6d35; letter-spacing: 0.12em; margin-bottom: 8px; }
          .step { background: #fff8ee; border-radius: 14px; padding: 10px 14px; margin-bottom: 8px; font-size: 13px; line-height: 1.8; color: #6f4125; }
          .ing { display: inline-block; background: #f3dfbe; border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 700; color: #74452a; margin: 2px; }
          .footer { text-align: center; margin-top: 20px; padding-top: 16px; border-top: 2px dashed #d8b486; font-size: 13px; font-weight: 700; color: #885c39; }
          .time { text-align: center; font-size: 15px; font-weight: 900; color: #5f3219; margin-top: 8px; }
          .shiba { text-align: center; font-size: 14px; line-height: 1.8; color: #74452a; margin-top: 8px; font-weight: 700; padding: 10px; background: #fff3d8; border-radius: 14px; }
        </style></head><body>
        <div class="card">
          <div class="badge" style="text-align:center;display:block;width:fit-content;margin:0 auto;">🏮 IZAKAYA MODE</div>
          <h1 style="margin-top:12px;">${recipe.dishName}</h1>
          <div class="time">⏱ ${recipe.cookingTime}</div>
          <div class="shiba">${recipe.shibaTalk}</div>
          <div class="section">
            <h3>🥘 食材</h3>
            ${recipe.ingredientsUsed.map(i => `<span class="ing">${i}</span>`).join("")}
          </div>
          <div class="section">
            <h3>🧂 調味重點</h3>
            ${recipe.seasoningNotes.map(n => `<div class="step">${n}</div>`).join("")}
          </div>
          <div class="section">
            <h3>📋 料理步驟</h3>
            ${recipe.cookingSteps.map((s, i) => `<div class="step"><strong>Step ${i+1}</strong> ${s}</div>`).join("")}
          </div>
          <div class="footer">🐾 阿柴食堂 · Shiba Kitchen 🐾</div>
        </div></body></html>
      `);
      shareWin.document.close();
      toast.success("📸 食譜已開新分頁！可截圖分享或列印汪！");
    } catch (e) {
      toast.error("分享失敗汪～請截圖手動分享！");
    }
    setSharing(false);
  };
  const loadRecipe = (r: SavedRecipe) => {
    setRecipe(r);
    setSelected(r.ingredientsUsed);
    setScreen("menu");
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8ead0_0%,#fdf8eb_28%,#f7ead3_100%)] p-4 text-[#5f361d]">
      <div className="handdrawn-paper mx-auto max-w-[430px] overflow-hidden rounded-[2.4rem] bg-[#FDF8EB]">
        {screen === "home" && (
          <div className="relative min-h-screen overflow-hidden pb-32">
            <div className="grain-overlay" />
            <div className="px-5 pt-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-full border border-[#e4caa0] bg-white/65 px-4 py-2 text-[11px] font-black tracking-[0.28em] text-[#885c39]">IZAKAYA MODE</div>
                <div className="flex gap-2">
                  <button onClick={() => setShowFav(true)} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d4b48c] bg-white/70 text-[#b86423]"><span className="text-lg">❤️</span></button>
                  <button onClick={() => setShowDiary(true)} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d4b48c] bg-white/70 text-[#b86423]"><span className="text-lg">📓</span></button>
                  <button onClick={() => setSettingsOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d4b48c] bg-white/70"><Settings2 className="h-5 w-5" /></button>
                </div>
              </div>
              <div className="text-center">
                <div className="scribble-circle mx-auto mb-5 h-42 w-42 overflow-hidden rounded-full bg-[#fff8ea]">
                  <img src={mascotImage} alt="阿柴主廚插圖" className="h-full w-full object-cover" />
                </div>
                <h1 className="font-serif-jp text-[2.2rem] font-black tracking-[0.12em] text-[#5d311b]">阿柴食堂</h1>
                <div className="handdrawn-badge mx-auto mt-3 inline-flex rounded-full px-5 py-2 text-[1rem] font-bold">老闆，今天冰箱剩什麼？汪！</div>
              </div>
              <div className="handdrawn-tabbar mt-6 flex gap-2 overflow-x-auto rounded-[2rem] p-2">
                {orderedTabs.map(([key, label, emoji]) => (
                  <button
                    key={key}
                    draggable
                    onDragStart={() => setDraggingTab(key)}
                    onDragEnd={() => setDraggingTab(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleTabDrop(key)}
                    onClick={() => setActiveTab(key)}
                    className={`handdrawn-tab shrink-0 rounded-full px-4 py-3 text-sm font-black transition ${activeTab === key ? "handdrawn-tab-active text-white" : "handdrawn-tab-idle"}`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <GripVertical className="h-3.5 w-3.5 opacity-70" />
                      <span>{emoji}</span>
                      <span>{label}</span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="handdrawn-panel mt-4 rounded-[2rem] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black tracking-[0.22em] text-[#a06a39]">INGREDIENT DRAWER</p>
                    <h2 className="mt-1 text-lg font-black text-[#5c3a21]">{current[1]}</h2>
                  </div>
                  <div className="handdrawn-badge rounded-full px-3 py-1 text-xs font-bold">已選 {selected.length} 項</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {currentItems.map((item) => {
                    const on = selected.includes(item);
                    return (
                      <button
                        key={item}
                        onClick={() => toggle(item)}
                        className={`group relative overflow-hidden rounded-[1.55rem] border-2 border-dashed px-4 py-4 text-left transition ${on ? "border-[#bb7540] bg-[linear-gradient(180deg,#8b5430,#6d3f1f)] text-white shadow-[0_16px_28px_rgba(108,63,29,0.24)]" : "border-[#d8b48b] bg-[linear-gradient(180deg,#fffdf8,#fff2de)] text-[#6b4024] shadow-[0_10px_18px_rgba(129,82,42,0.08)]"}`}
                      >
                        <div className={`absolute inset-0 opacity-90 ${on ? "bg-[radial-gradient(circle_at_top_right,rgba(255,223,170,0.22),transparent_42%)]" : "bg-[radial-gradient(circle_at_top_right,rgba(255,228,176,0.40),transparent_42%)]"}`} />
                        <div className="absolute -right-2 -top-2 h-9 w-9 rounded-full bg-[#fff6e6]/80 blur-md" />
                        <div className="relative flex items-start gap-3">
                          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] border-2 border-dashed text-[1.35rem] rotate-[-4deg] ${on ? "border-white/35 bg-white/14" : "border-[#e7c39d] bg-[#fff7e8]"}`}>{<IngredientSketch item={item} active={on} />}</span>
                          <div className="min-w-0">
                            <div className="text-[15px] font-black tracking-[0.02em]">{item}</div>
                            <div className={`mt-1 text-[11px] font-bold ${on ? "text-[#ffe6bf]" : "text-[#b07a48]"}`}>{on ? "阿柴已收到這份食材" : "手繪食材小卡"}</div>
                            <div className="mt-2 flex items-center gap-2">
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${on ? "bg-white/12 text-[#fff4df]" : "bg-[#f8e4bf] text-[#8d5a2e]"}`}>{on ? "✓ 已選" : "+ 點選加入"}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="sketch-card mt-5 p-4">
                <div className="mb-3 text-sm font-black tracking-[0.14em] text-[#7c4c2b]">今日備料籃</div>
                {selected.length ? <div className="flex flex-wrap gap-2">{selected.map((item) => <span key={item} className="rounded-full bg-[#f3dfbe] px-3 py-1 text-sm font-bold">{item}</span>)}</div> : <p className="text-sm leading-7 text-[#926844]">先挑幾樣冰箱現有食材吧，阿柴才知道今晚該端什麼下酒菜汪！</p>}
              </div>
            </div>
            <div className="fixed bottom-6 left-1/2 z-20 w-[calc(100%-2rem)] max-w-[398px] -translate-x-1/2 px-2 rotate-[-0.6deg]">
              <button onClick={start} className="handdrawn-button flex w-full items-center gap-3 rounded-[2rem] px-5 py-5 text-white">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/14"><Soup className="h-6 w-6" /></span>
                <span className="flex-1 text-center text-[1.28rem] font-black">大將，今晚吃什麼？</span>
                <span className="rounded-2xl border border-white/20 bg-[#6b2f08]/28 px-3 py-1 text-sm font-black">{selected.length}</span>
              </button>
            </div>
          </div>
        )}

        {screen === "cooking" && (
          <div className="relative min-h-screen overflow-hidden px-6 py-8 text-center">
            <div className="grain-overlay" />
            <button onClick={() => setScreen("home")} className="handdrawn-badge relative z-10 mb-8 rounded-full px-4 py-2 text-sm font-bold">← 返回上一頁</button>
            <div className="relative z-10 flex min-h-[78vh] flex-col items-center justify-center">
              <div className="relative mb-7 flex h-62 w-62 items-center justify-center rounded-full border border-[#f3d3a0] bg-[radial-gradient(circle_at_50%_35%,rgba(255,250,239,0.98),rgba(247,222,170,0.92)_60%,rgba(209,140,74,0.20)_100%)] shadow-[0_22px_55px_rgba(163,103,47,0.22)]">
                <CookingMiniAnimation selected={selected} mode={cookingMode} />
                <div className="pan" />
                <div className="steam steam-1" /><div className="steam steam-2" /><div className="steam steam-3" />
                <div className="relative z-10 h-40 w-40 overflow-hidden rounded-full border-[6px] border-[#fff2d9]"><img src={mascotImage} alt="炒菜中的阿柴大將" className="h-full w-full object-cover" /></div>
                <div className="absolute right-7 top-22 z-20 animate-bob"><ChefHat className="h-9 w-9 text-[#72401f]" /></div>
              </div>
              <h2 className="font-serif-jp text-[1.9rem] font-black tracking-[0.08em]">阿柴料理研發中</h2>
              <p className="mt-4 max-w-[280px] text-base leading-8 text-[#764a2b]">大將正在瘋狂研發私房菜，請幫阿柴加油打氣汪...</p>
              <p className="mt-3 text-sm font-bold text-[#a86a39]">{statusText}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {([
                  ["stir", "翻炒"],
                  ["boil", "煮滾"],
                  ["grill", "烤香"],
                ] as [CookingMode, string][]).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setCookingMode(mode)}
                    className={`rounded-full px-4 py-2 text-sm font-black transition ${cookingMode === mode ? "handdrawn-button text-white" : "handdrawn-badge text-[#74452a]"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-4 text-xs font-bold tracking-[0.12em] text-[#9e6b3d]">料理中模式可切換：翻炒、煮滾、烤香</div>
              <div className="mt-8 flex flex-wrap justify-center gap-2">{selected.map((item) => <span key={item} className="rounded-full bg-[#fff2d8] px-3 py-1 text-sm font-bold">{item}</span>)}</div>
            </div>
            {showAd && <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#2f1507]/55 p-5"><div className="handdrawn-paper w-full max-w-[320px] rounded-[2rem] p-5 text-left"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-black tracking-[0.22em] text-[#a06530]">ADMOB INTERSTITIAL</p><button disabled={!canCloseAd} onClick={closeAd} className={`rounded-full border px-3 py-1 text-xs font-black ${canCloseAd ? "border-[#a66127] bg-[#6a3b1c] text-white" : "border-[#d6b48b] bg-white/70 text-[#9a734e]"}`}>{canCloseAd ? "關閉" : "播放中"}</button></div><div className="sketch-card p-4"><p className="text-lg font-black">阿柴深夜食堂限定券</p><p className="mt-2 text-sm leading-6 text-[#815234]">這裡是 AdMob 插頁廣告佔位示意；上線時可替換成真正的 Interstitial SDK 觸發點。</p><div className="handdrawn-wood mt-4 rounded-[1.2rem] p-4 text-white"><p className="text-sm font-black tracking-[0.14em]">BUY 1 GET SNACK</p><p className="mt-3 text-xl font-black">看完阿柴，今晚再加一道串燒！</p></div></div></div></div>}
          </div>
        )}

        {screen === "menu" && recipe && (
          <div className="relative min-h-screen overflow-hidden px-5 py-5">
            <div className="grain-overlay" />
            <div className="relative z-10 mb-4 flex items-center justify-between"><div><p className="text-xs font-black tracking-[0.22em] text-[#9d6634]">CHEF RECIPE RESULT</p><h2 className="mt-1 font-serif-jp text-[1.8rem] font-black">阿柴私房菜單</h2></div><div className="handdrawn-badge rounded-full px-3 py-1 text-xs font-black">{selected.length} 項食材</div></div>
            <div className="handdrawn-wood relative z-10 max-h-[calc(100vh-9rem)] overflow-y-auto rounded-[2rem] p-[2px]">
              <div className="handdrawn-paper wood-card max-h-[calc(100vh-9rem)] overflow-y-auto rounded-[2rem] p-5">
                <div className="grid gap-4">
                  <DishIllustration recipe={recipe} selected={selected} />
                  <div className="sketch-card p-4"><div className="label-row">菜名</div><div className="mt-2 text-2xl font-black text-[#5f3219]">{recipe.dishName}</div></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sketch-card p-4"><div className="label-row"><Timer className="h-4 w-4" /> 烹飪時間</div><div className="mt-2 text-lg font-black">{recipe.cookingTime}</div></div>
                    <div className="sketch-card p-4"><div className="label-row">🍳 難易度</div><p className="mt-2 text-sm leading-7 font-bold text-[#74452a]">步驟 {recipe.cookingSteps.length} 道 · 適合中級料理人</p></div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sketch-card p-4"><div className="label-row">本次使用食材</div><div className="mt-3 flex flex-wrap gap-2">{recipe.ingredientsUsed.map((item) => <span key={item} className="rounded-full bg-[#f3dfbe] px-3 py-1 text-sm font-bold text-[#74452a]">{item}</span>)}</div></div>
                    <div className="sketch-card p-4"><div className="label-row">調味重點</div><div className="mt-3 space-y-2">{recipe.seasoningNotes.map((note, i) => <div key={i} className="rounded-2xl bg-[#fff8ee] px-3 py-2 text-sm font-bold text-[#74452a]">{note}</div>)}</div></div>
                  </div>
                  {/* 小秘訣專區 */}
                  <div className="rounded-[1.5rem] border border-[#d8b486] bg-white/55 p-4">
                    <div className="label-row">💡 小柴子的料理小秘訣</div>
                    <div className="mt-4 flex flex-col gap-3">
                      <div className="sketch-card flex gap-3 p-4">
                        <span className="mt-0.5 text-xl">🐶</span>
                        <div>
                          <div className="mb-1 text-sm font-black text-[#8b5430]">大將的話</div>
                          <p className="text-sm leading-7 text-[#6f4125]">{recipe.shibaTalk}</p>
                        </div>
                      </div>
                      {recipe.platingNotes && (
                        <div className="sketch-card flex gap-3 p-4">
                          <span className="mt-0.5 text-xl">🍽️</span>
                          <div>
                            <div className="mb-1 text-sm font-black text-[#8b5430]">擺盤小技巧</div>
                            <p className="text-sm leading-7 text-[#6f4125]">{recipe.platingNotes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="rounded-[1.5rem] border border-[#d8b486] bg-white/55 p-4"><div className="flex items-center justify-between"><div className="label-row">料理步驟</div><button onClick={() => setCookingStep(0)} className="rounded-full bg-[#8b5430] px-4 py-2 text-xs font-black text-white shadow-[0_4px_10px_rgba(139,84,48,0.3)] hover:bg-[#6d3f1f] transition-all active:scale-95">👨‍🍳 開始料理</button></div><div className="mt-4 space-y-4">{recipe.cookingSteps.map((step, i) => <div key={i} className="sketch-card p-4"><div className="mb-2 flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8b5430] text-xs font-black text-white">{(i + 1).toString().padStart(2, "0")}</span><span className="text-sm font-black tracking-[0.12em] text-[#ac6d35]">步驟 {i + 1}</span></div><p className="text-sm leading-7 text-[#6f4125]">{step}</p></div>)}</div></div>
                  {/* 相似食譜推薦 */}
                  {(() => {
                    const similar = findSimilarRecipes(recipe, 3);
                    if (similar.length === 0) return null;
                    return (
                      <div className="rounded-[1.5rem] border border-[#d8b486] bg-white/55 p-4">
                        <div className="label-row">🍽️ 相似食譜推薦</div>
                        <div className="mt-4 flex flex-col gap-3">
                          {similar.map((sr) => (
                            <button key={sr.dishName} onClick={() => setRecipe(sr)} className="sketch-card flex items-center gap-3 p-3 text-left transition hover:bg-[#fff2de] active:scale-[0.98]">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3dfbe] text-base">🍳</div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-black text-[#5f3219]">{sr.dishName}</div>
                                <div className="mt-0.5 text-[11px] font-bold text-[#a06a39]">{sr.cookingTime} · 共享 {scoreRecipe(sr, recipe.ingredientsUsed)} 種食材</div>
                              </div>
                              <span className="text-lg">→</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
            <div className="relative z-10 mt-5 flex gap-3">
              <button onClick={saveFav} className="handdrawn-button flex flex-1 items-center justify-center gap-3 rounded-[1.7rem] px-5 py-4 text-base font-black text-white"><span className="text-lg">❤️</span> 收藏食譜</button>
              <button onClick={shareRecipe} disabled={sharing} className="handdrawn-button flex flex-1 items-center justify-center gap-3 rounded-[1.7rem] px-5 py-4 text-base font-black text-white"><Share2 className="h-5 w-5" /> {sharing ? "分享中..." : "分享食譜"}</button>
              <button onClick={resetAll} className="handdrawn-button flex flex-1 items-center justify-center gap-3 rounded-[1.7rem] px-5 py-4 text-base font-black text-white"><RefreshCcw className="h-5 w-5" /> 返回廚房</button>
            </div>
          </div>
        )}
      </div>

      {settingsOpen && <div className="fixed inset-0 z-50 flex items-end bg-[#2f1507]/50 p-4"><div className="handdrawn-paper mx-auto w-full max-w-[430px] rounded-[2rem] p-5"><div className="mb-4 flex items-start justify-between"><div><p className="text-xs font-black tracking-[0.22em] text-[#a06a39]">AI CONNECTOR</p><h3 className="mt-1 text-xl font-black">API 設定</h3><p className="mt-1 text-sm leading-6 text-[#896141]">可選 OpenAI 或 Gemini。沒填金鑰時，會走內建示範食譜。</p></div><button onClick={() => setSettingsOpen(false)} className="rounded-full border border-[#dcb890] p-2"><X className="h-4 w-4" /></button></div><div className="mb-4 grid grid-cols-2 gap-3">{(["openai", "gemini"] as Provider[]).map((p) => <button key={p} onClick={() => setProvider(p)} className={`rounded-[1.2rem] border px-4 py-3 text-left font-bold ${provider === p ? "border-[#b86b2e] bg-[#6a3d1d] text-white" : "border-[#d6b48b] bg-white text-[#6f4427]"}`}>{p.toUpperCase()}</button>)}</div><label className="mb-3 block"><span className="mb-1 block text-sm font-bold">API Key</span><input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="貼上你的 API Key" className="handdrawn-badge w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none" /></label><label className="block"><span className="mb-1 block text-sm font-bold">自訂 Base URL（可留空）</span><input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder={provider === "openai" ? "https://api.openai.com/v1/chat/completions" : "https://generativelanguage.googleapis.com/..."} className="handdrawn-badge w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none" /></label></div></div>}

      {showFav && <div className="fixed inset-0 z-50 flex items-end bg-[#2f1507]/50 p-4" onClick={() => setShowFav(false)}>
        <div className="handdrawn-paper mx-auto w-full max-w-[430px] max-h-[70vh] overflow-y-auto rounded-[2rem] p-5" onClick={e => e.stopPropagation()}>
          <div className="mb-4 flex items-center justify-between">
            <div><p className="text-xs font-black tracking-[0.22em] text-[#a06a39]">MY RECIPE</p><h3 className="mt-1 text-xl font-black">❤️ 我的酒單</h3></div>
            <button onClick={() => setShowFav(false)} className="rounded-full border border-[#dcb890] p-2"><X className="h-4 w-4" /></button>
          </div>
          {favorites.length === 0 ? (
            <div className="sketch-card p-6 text-center"><p className="text-sm leading-7 text-[#815234]">還沒有收藏的食譜～快去請阿柴大將做菜吧汪！</p></div>
          ) : (
            <div className="space-y-3">{favorites.map(f => (
              <div key={f.id} className="sketch-card flex items-center justify-between p-4">
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => { loadRecipe(f); setShowFav(false); }}>
                  <div className="text-base font-black text-[#5f3219]">{f.dishName}</div>
                  <div className="mt-1 text-xs font-bold text-[#a06a39]">{new Date(f.savedAt).toLocaleDateString("zh-TW")} · {f.cookingTime}</div>
                </div>
                <button onClick={() => unFav(f.id)} className="ml-2 rounded-full border border-[#dcb890] px-3 py-1 text-xs font-bold text-[#b86423]">移除</button>
              </div>
            ))}</div>
          )}
        </div>
      </div>}

      {showDiary && <div className="fixed inset-0 z-50 flex items-end bg-[#2f1507]/50 p-4" onClick={() => setShowDiary(false)}>
        <div className="handdrawn-paper mx-auto w-full max-w-[430px] max-h-[70vh] overflow-y-auto rounded-[2rem] p-5" onClick={e => e.stopPropagation()}>
          <div className="mb-4 flex items-center justify-between">
            <div><p className="text-xs font-black tracking-[0.22em] text-[#a06a39]">COOKING LOG</p><h3 className="mt-1 text-xl font-black">📓 料理日記</h3></div>
            <button onClick={() => setShowDiary(false)} className="rounded-full border border-[#dcb890] p-2"><X className="h-4 w-4" /></button>
          </div>
          {diary.length === 0 ? (
            <div className="sketch-card p-6 text-center"><p className="text-sm leading-7 text-[#815234]">還沒有料理紀錄～讓阿柴大將為你煮一頓吧汪！</p></div>
          ) : (
            <div className="space-y-3">{diary.map(f => (
              <div key={f.id} className="sketch-card flex items-center justify-between p-4">
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => { loadRecipe(f); setShowDiary(false); }}>
                  <div className="text-base font-black text-[#5f3219]">{f.dishName}</div>
                  <div className="mt-1 text-xs font-bold text-[#a06a39]">{new Date(f.savedAt).toLocaleDateString("zh-TW")} · 食材：{f.ingredientsUsed.slice(0,4).join("、")}{f.ingredientsUsed.length > 4 ? "..." : ""}</div>
                </div>
              </div>
            ))}</div>
          )}
        </div>
      </div>}

      {/* 👨‍🍳 步驟料理助手 */}
      {cookingStep !== null && recipe && (
        <div className="fixed inset-0 z-50 flex items-end bg-[#2f1507]/60 p-4">
          <div className="handdrawn-paper mx-auto w-full max-w-[430px] max-h-[82vh] overflow-y-auto rounded-[2rem] p-6" onClick={(e) => e.stopPropagation()}>
            {/* 進度條 */}
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-black tracking-[0.12em] text-[#a06a39]">料理進行中</span>
                <span className="text-sm font-black text-[#8b5430]">步驟 {cookingStep + 1} / {recipe.cookingSteps.length}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#f3dfbe]">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,#8b5430,#c4895a)] transition-all duration-500" style={{ width: `${((cookingStep + 1) / recipe.cookingSteps.length) * 100}%` }} />
              </div>
            </div>

            {/* 步驟標題 */}
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8b5430] text-lg font-black text-white">
                {(cookingStep + 1).toString().padStart(2, "0")}
              </span>
              <div>
                <div className="text-xs font-black tracking-[0.12em] text-[#ac6d35]">STEP {cookingStep + 1}</div>
                <div className="text-sm font-bold text-[#7a4b2b]">總共 {recipe.cookingSteps.length} 個步驟</div>
              </div>
            </div>

            {/* 步驟內容 */}
            <div className="sketch-card mb-6 min-h-[160px] p-5">
              <p className="text-base leading-8 text-[#5f361d]">{recipe.cookingSteps[cookingStep]}</p>
            </div>

            {/* 導航按鈕 */}
            <div className="flex gap-3">
              <button
                onClick={() => setCookingStep((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))}
                disabled={cookingStep === 0}
                className={`flex flex-1 items-center justify-center gap-2 rounded-[1.7rem] px-5 py-4 text-base font-black transition-all active:scale-95 ${
                  cookingStep === 0
                    ? "cursor-not-allowed bg-[#e8d5b8] text-[#b08a62]"
                    : "handdrawn-badge text-[#74452a]"
                }`}
              >
                ⬅ 上一步
              </button>
              {cookingStep < recipe.cookingSteps.length - 1 ? (
                <button
                  onClick={() => setCookingStep((prev) => (prev !== null ? prev + 1 : prev))}
                  className="handdrawn-button flex flex-1 items-center justify-center gap-2 rounded-[1.7rem] px-5 py-4 text-base font-black text-white transition-all active:scale-95"
                >
                  下一步 ➡
                </button>
              ) : (
                <button
                  onClick={() => setCookingStep(null)}
                  className="handdrawn-button flex flex-1 items-center justify-center gap-2 rounded-[1.7rem] px-5 py-4 text-base font-black text-white transition-all active:scale-95"
                >
                  ✅ 完成料理
                </button>
              )}
            </div>

            {/* 關閉按鈕 */}
            <button
              onClick={() => setCookingStep(null)}
              className="mt-4 w-full rounded-full border border-[#dcb890] px-5 py-3 text-sm font-bold text-[#8d6139] transition-all active:scale-95"
            >
              關閉料理模式
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

