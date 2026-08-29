const PRODUCTS = [
  {
    id: "amla-powder",
    name: "Pure Organic Amla Powder",
    category: "amla-products",
    price: 180,
    rating: 4.8,
    reviewsCount: 42,
    image: "images/amla-powder-v3.jpg",
    description: "Our organic Amla (Indian Gooseberry) powder is made by sun-drying premium gooseberries and grinding them traditionally. It retains maximum nutrients and has zero preservatives.",
    ingredients: "100% Sun-Dried Organic Indian Gooseberry (Amla)",
    benefits: ["Rich in Vitamin C and antioxidants", "Boosts natural immunity", "Improves hair growth & skin health", "Enhances digestion"],
    sizes: [
      { weight: "100g", price: 90 },
      { weight: "250g", price: 180 },
      { weight: "500g", price: 340 }
    ]
  },
  {
    id: "sweet-amla-candy",
    name: "Homemade Sweet Amla Candy",
    category: "amla-products",
    price: 150,
    rating: 4.9,
    reviewsCount: 38,
    image: "images/sweet-amla-candy.jpg",
    description: "Juicy amlas soaked in organic sugar syrup and sun-dried to perfection. A tasty, healthy treat for children and adults alike.",
    ingredients: "Organic Amla, Organic Sugar, Lemon Juice",
    benefits: ["Delicious daily source of Vitamin C", "No artificial colors or flavors", "Acts as a great digestive aid", "Kid-friendly healthy snack"],
    sizes: [
      { weight: "200g", price: 150 },
      { weight: "500g", price: 320 }
    ]
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
    ]
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
    ]
  },
  {
    id: "healthy-mix",
    name: "Homemade Healthy Mix (Sathu Maavu)",
    category: "healthy-mixes",
    price: 280,
    rating: 4.9,
    reviewsCount: 88,
    image: "images/healthy-mix.jpg",
    description: "A time-tested traditional formula comprising 18 natural ingredients: sprouted millets, grains, pulses, and nuts. Lightly roasted and finely ground for maximum nutrition and traditional flavor.",
    ingredients: "Sprouted Ragi, Bajra, Jowar, Wheat, Red Rice, Barley, Roasted Gram, Green Gram, Groundnuts, Almonds, Cashews, Cardamom, Dry Ginger, Sago",
    benefits: ["100% natural weight gainer for growing kids", "Complete balanced meal rich in fiber and vitamins", "Boosts energy and stamina", "No artificial sweeteners, colors, or preservatives"],
    sizes: [
      { weight: "500g", price: 280 },
      { weight: "1kg", price: 540 }
    ]
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
    ]
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
    ]
  },
  {
    id: "forest-honey",
    name: "Raw Wild Forest Honey",
    category: "other-organics",
    price: 290,
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
    ]
  }
];

window.PRODUCTS = PRODUCTS;
