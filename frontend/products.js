/**
 * Products Definition & Fallback Catalogue
 * Anuradha Homemade Organic Products
 */

const PRODUCTS = [
  {
    id: "amla-powder",
    name: "Pure Organic Amla Powder",
    category: "amla-products",
    price: 100,
    rating: 4.8,
    reviewsCount: 42,
    image: "images/amla-powder.jpg",
    description: "100% pure sun-dried wild Indian gooseberry powder. Rich in natural Vitamin C and essential antioxidants for daily vitality.",
    ingredients: "100% Sun-Dried Organic Indian Gooseberry (Amla)",
    benefits: ["Rich in Vitamin C and antioxidants", "Boosts natural immunity", "Improves hair growth & skin health", "Enhances digestion"],
    sizes: [
      { weight: "100g", price: 100 },
      { weight: "250g", price: 200 },
      { weight: "500g", price: 380 }
    ],
    inStock: true,
    featured: true
  },
  {
    id: "sweet-amla-candy",
    name: "Wild Honey Soaked Amla Candy",
    category: "amla-products",
    price: 250,
    rating: 4.9,
    reviewsCount: 68,
    image: "images/sweet-amla-candy.jpg",
    description: "Fresh organic amla chunks steeped in raw forest honey for 60 days. A traditional Ayurvedic digestive candy.",
    ingredients: "Fresh Organic Amla, Raw Wild Forest Honey, Cardamom, Black Pepper",
    benefits: ["Steeped in raw wild honey for 60 days", "Rich source of Vitamin C & natural immunity builder", "Excellent digestive and appetite booster", "100% free from refined white sugar & artificial preservatives"],
    sizes: [
      { weight: "250g", price: 250 },
      { weight: "500g", price: 480 }
    ],
    inStock: true,
    featured: true
  },
  {
    id: "healthy-mix",
    name: "Traditional Sathu Maavu Health Mix",
    category: "healthy-mixes",
    price: 120,
    rating: 4.9,
    reviewsCount: 95,
    image: "images/healthy-mix.jpg",
    description: "Time-tested multigrain nutrition mix crafted with 18 sprouted grains, pulses, millets, and dry fruits.",
    ingredients: "Sprouted Ragi, Bajra, Jowar, Wheat, Red Rice, Barley, Roasted Gram, Green Gram, Groundnuts, Almonds, Cashews, Cardamom, Dry Ginger, Sago",
    benefits: ["18 sprouted grains, pulses, millets & nuts", "Complete wholesome nutrition for toddlers and adults", "High in natural dietary fiber, calcium & iron", "Zero chemical additives or artificial flavorings"],
    sizes: [
      { weight: "250g", price: 120 },
      { weight: "500g", price: 230 },
      { weight: "1kg", price: 450 }
    ],
    inStock: true,
    featured: true
  },
  {
    id: "nuts-powder",
    name: "Sprouted Nuts & Seeds Powder",
    category: "nuts-powders",
    price: 320,
    rating: 4.9,
    reviewsCount: 64,
    image: "images/nuts-powder.jpg",
    description: "A high-protein, nutrient-dense powder made from premium sprouted almonds, walnuts, pistachios, cashews, and pumpkin seeds. Ground carefully to preserve natural oils.",
    ingredients: "Sprouted Almonds, Sprouted Walnuts, Pistachios, Cashews, Sprouted Pumpkin Seeds, Cardamom",
    benefits: ["Powerhouse of protein and vitamins", "Boosts brain health & memory in children", "Rich in healthy fats (Omega-3)", "Perfect additive to milk, smoothies, or porridges"],
    sizes: [
      { weight: "250g", price: 320 },
      { weight: "500g", price: 600 }
    ],
    inStock: true,
    featured: true
  },
  {
    id: "ragi-almond-powder",
    name: "Sprouted Ragi & Almond Mix",
    category: "nuts-powders",
    price: 240,
    rating: 4.8,
    reviewsCount: 51,
    image: "images/ragi-almond-powder.jpg",
    description: "Traditional weaning and wellness food. Sprouting increases ragi's calcium absorption threefold, blended with almonds to create a rich, creamy, and digestible health drink mix.",
    ingredients: "Sprouted Finger Millet (Ragi), Premium Almonds, Cardamom",
    benefits: ["Exceptionally high in Calcium and Iron", "Easily digestible for infants and elderly", "Supports bone development", "Gluten-free nutrient booster"],
    sizes: [
      { weight: "250g", price: 240 },
      { weight: "500g", price: 450 }
    ],
    inStock: true,
    featured: true
  },
  {
    id: "millet-health-mix",
    name: "Multi-Millet Health Porridge Mix",
    category: "healthy-mixes",
    price: 260,
    rating: 4.7,
    reviewsCount: 33,
    image: "images/millet-health-mix.jpg",
    description: "A diabetic-friendly and weight-loss supportive porridge mix made from 9 varieties of premium organic millets. Low glycemic index and rich in dietary fiber.",
    ingredients: "Finger Millet, Pearl Millet, Foxtail Millet, Little Millet, Kodo Millet, Barnyard Millet, Sorghum, Brown Top Millet, Cardamom",
    benefits: ["Helps regulate blood sugar levels", "Keeps you full longer, helping in weight control", "Rich in iron, magnesium, and dietary fiber", "Excellent breakfast option for modern lifestyles"],
    sizes: [
      { weight: "500g", price: 260 },
      { weight: "1kg", price: 500 }
    ],
    inStock: true,
    featured: false
  },
  {
    id: "cow-ghee",
    name: "Pure Homemade Cow Ghee (Bilona Method)",
    category: "other-organics",
    price: 450,
    rating: 5.0,
    reviewsCount: 104,
    image: "images/cow-ghee.jpg",
    description: "Churned from cultured butter of grass-fed cows using the traditional Vedic Bilona method. Highly aromatic, grainy, and packed with healthy fats.",
    ingredients: "100% Clarified Butter (Cow Milk Fat)",
    benefits: ["Traditional aroma and rich grainy texture", "Enhances digestion and nutrient absorption", "Good for joints, skin, and overall vitality", "Lactose and casein-free"],
    sizes: [
      { weight: "250ml", price: 450 },
      { weight: "500ml", price: 850 },
      { weight: "1L", price: 1600 }
    ],
    inStock: true,
    featured: false
  },
  {
    id: "forest-honey",
    name: "Raw Wild Forest Honey",
    category: "other-organics",
    price: 160,
    rating: 4.9,
    reviewsCount: 77,
    image: "images/forest-honey.webp",
    description: "100% pure, unfiltered, and unpasteurized honey sourced directly from forest beehives. Retains natural pollen, propolis, and royal jelly.",
    ingredients: "100% Raw Wild Forest Honey",
    benefits: ["Natural energy booster and immunity builder", "Soothes cough and throat irritation", "Rich in natural enzymes and antioxidants", "Excellent natural sweetener"],
    sizes: [
      { weight: "250g", price: 160 },
      { weight: "500g", price: 290 },
      { weight: "1kg", price: 550 }
    ],
    inStock: true,
    featured: true
  }
];

window.PRODUCTS = PRODUCTS;
