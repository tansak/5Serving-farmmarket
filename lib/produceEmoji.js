const CATEGORY_FALLBACK = {
  Vegetables: "🥦", Fruits: "🍎", Grains: "🌾", Pulses: "🫘",
  Dairy: "🥛", Herbs: "🌿", Spices: "🌶️", Roots: "🥕",
};

// Ordered keyword → emoji lookup. First matching keyword (substring, case-insensitive) wins.
const NAME_MATCHES = [
  [["tomato"], "🍅"],
  [["potato", "aloo"], "🥔"],
  [["onion", "ulli"], "🧅"],
  [["garlic", "belluli"], "🧄"],
  [["ginger", "shunti"], "🫚"],
  [["radish", "raddish", "mullangi"], "🥕"],
  [["carrot", "gajar"], "🥕"],
  [["beetroot", "beet"], "🥕"],
  [["turnip"], "🥕"],
  [["sweet potato", "yam"], "🍠"],
  [["cabbage"], "🥬"],
  [["cauliflower"], "🥦"],
  [["broccoli"], "🥦"],
  [["spinach", "palak", "soppu", "dill", "greens", "methi"], "🥬"],
  [["brinjal", "eggplant", "baingan"], "🍆"],
  [["cucumber"], "🥒"],
  [["bottle gourd", "lauki"], "🥒"],
  [["ridge gourd", "turai", "beerakaya"], "🥒"],
  [["bitter gourd", "karela"], "🥒"],
  [["pumpkin"], "🎃"],
  [["capsicum", "bell pepper"], "🫑"],
  [["chilli", "chili", "mirchi"], "🌶️"],
  [["bean"], "🫛"],
  [["peas", "matar"], "🫛"],
  [["corn", "maize"], "🌽"],
  [["drumstick", "moringa"], "🥬"],
  [["okra", "bhindi", "ladies finger"], "🫑"],
  [["coconut"], "🥥"],
  [["mango"], "🥭"],
  [["banana"], "🍌"],
  [["apple"], "🍎"],
  [["grape"], "🍇"],
  [["orange", "mosambi"], "🍊"],
  [["lemon", "lime"], "🍋"],
  [["watermelon"], "🍉"],
  [["melon"], "🍈"],
  [["papaya"], "🍈"],
  [["guava"], "🍈"],
  [["pomegranate"], "🍎"],
  [["jackfruit"], "🍈"],
  [["rice"], "🌾"],
  [["wheat"], "🌾"],
  [["ragi"], "🌾"],
  [["jowar", "millet"], "🌾"],
  [["dal", "chana", "toor", "moong", "urad", "rajma", "chickpea"], "🫘"],
  [["milk"], "🥛"],
  [["curd", "yogurt", "buttermilk"], "🥣"],
  [["ghee", "paneer", "cheese"], "🧈"],
  [["curry leaves"], "🌿"],
  [["mint", "pudina"], "🌿"],
  [["coriander", "dhania", "kothimbir", "cilantro"], "🌿"],
  [["basil", "tulsi"], "🌿"],
  [["turmeric", "haldi"], "🌶️"],
];

export function getProduceEmoji(name, category) {
  const n = (name || "").toLowerCase();
  for (const [keywords, emoji] of NAME_MATCHES) {
    if (keywords.some(k => n.includes(k))) return emoji;
  }
  return CATEGORY_FALLBACK[category] || "🌱";
}
