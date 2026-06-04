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
import { builtinRecipes, matchBuiltinRecipe, scoreRecipe, suggestIngredients, findSimilarRecipes } from "@/data/recipes_data";

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
                  <div className="rounded-[1.5rem] border border-[#d8b486] bg-white/55 p-4"><div className="label-row">👨‍🍳 料理步驟</div><div className="mt-4 space-y-4">{recipe.cookingSteps.map((step, i) => <div key={i} className="sketch-card p-4"><div className="mb-2 flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8b5430] text-xs font-black text-white">{(i + 1).toString().padStart(2, "0")}</span><span className="text-sm font-black tracking-[0.12em] text-[#ac6d35]">步驟 {i + 1}</span></div><p className="text-sm leading-7 text-[#6f4125]">{step}</p></div>)}</div></div>
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


    </div>
  );
}

