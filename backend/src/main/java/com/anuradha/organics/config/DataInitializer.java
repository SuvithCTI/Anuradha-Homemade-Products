package com.anuradha.organics.config;

import com.anuradha.organics.entity.AuthProvider;
import com.anuradha.organics.entity.Product;
import com.anuradha.organics.entity.Role;
import com.anuradha.organics.entity.User;
import com.anuradha.organics.repository.ProductRepository;
import com.anuradha.organics.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            jdbcTemplate.execute("ALTER TABLE products ALTER COLUMN image TEXT;");
        } catch (Exception e) {
            logger.debug("Image column alter note: {}", e.getMessage());
        }
        seedAdminUser();
        seedInitialProducts();
    }

    private void seedAdminUser() {
        String adminEmail = "admin@anuradhaorganics.com";
        User admin = userRepository.findByEmail(adminEmail).orElseGet(User::new);
        admin.setFirstName("Admin");
        admin.setLastName("User");
        admin.setEmail(adminEmail);
        admin.setPassword(passwordEncoder.encode("Admin@123"));
        admin.setAuthProvider(AuthProvider.LOCAL);
        admin.setEmailVerified(true);
        admin.setRole(Role.ADMIN);

        userRepository.save(admin);
        logger.info(">>> Seeded/Updated admin account: {} / Admin@123 (ROLE_ADMIN)", adminEmail);

        // Ensure ONLY the single admin account exists
        List<User> allOtherUsers = userRepository.findAll().stream()
            .filter(u -> !adminEmail.equalsIgnoreCase(u.getEmail()))
            .toList();
        for (User u : allOtherUsers) {
            try {
                jdbcTemplate.update("DELETE FROM verification_tokens WHERE user_id = ?", u.getId());
                jdbcTemplate.update("DELETE FROM password_reset_tokens WHERE user_id = ?", u.getId());
                jdbcTemplate.update("DELETE FROM login_logs WHERE user_id = ?", u.getId());
                userRepository.delete(u);
            } catch (Exception e) {
                logger.debug("Cleanup user note: {}", e.getMessage());
            }
        }
    }

    private void seedInitialProducts() {
        if (productRepository.count() == 0) {
            List<Product> initialProducts = List.of(
                new Product(
                    "amla-powder",
                    "Pure Organic Amla Powder",
                    "amla-products",
                    180.0,
                    4.8,
                    42,
                    "images/amla-powder-v3.jpg",
                    "Our organic Amla (Indian Gooseberry) powder is made by sun-drying premium gooseberries and grinding them traditionally. It retains maximum nutrients and has zero preservatives.",
                    "100% Sun-Dried Organic Indian Gooseberry (Amla)",
                    "[\"Rich in Vitamin C and antioxidants\", \"Boosts natural immunity\", \"Improves hair growth & skin health\", \"Enhances digestion\"]",
                    "[{\"weight\":\"100g\",\"price\":90},{\"weight\":\"250g\",\"price\":180},{\"weight\":\"500g\",\"price\":340}]",
                    true,
                    true
                ),
                new Product(
                    "sweet-amla-candy",
                    "Homemade Sweet Amla Candy",
                    "amla-products",
                    150.0,
                    4.9,
                    38,
                    "images/sweet-amla-candy.jpg",
                    "Juicy amlas soaked in organic sugar syrup and sun-dried to perfection. A tasty, healthy treat for children and adults alike.",
                    "Organic Amla, Organic Sugar, Lemon Juice",
                    "[\"Delicious daily source of Vitamin C\", \"No artificial colors or flavors\", \"Acts as a great digestive aid\", \"Kid-friendly healthy snack\"]",
                    "[{\"weight\":\"200g\",\"price\":150},{\"weight\":\"500g\",\"price\":320}]",
                    true,
                    true
                ),
                new Product(
                    "nuts-powder",
                    "Sprouted Nuts & Seeds Powder",
                    "nuts-powders",
                    320.0,
                    4.9,
                    64,
                    "images/nuts-powder.jpg",
                    "A high-protein, nutrient-dense powder made from premium sprouted almonds, walnuts, pistachios, cashews, and pumpkin seeds. Ground carefully to preserve natural oils.",
                    "Sprouted Almonds, Sprouted Walnuts, Pistachios, Cashews, Sprouted Pumpkin Seeds, Cardamom",
                    "[\"Powerhouse of protein and vitamins\", \"Boosts brain health & memory in children\", \"Rich in healthy fats (Omega-3)\", \"Perfect additive to milk, smoothies, or porridges\"]",
                    "[{\"weight\":\"250g\",\"price\":320},{\"weight\":\"500g\",\"price\":600}]",
                    true,
                    true
                ),
                new Product(
                    "ragi-almond-powder",
                    "Sprouted Ragi & Almond Mix",
                    "nuts-powders",
                    240.0,
                    4.8,
                    51,
                    "images/ragi-almond-powder.jpg",
                    "Traditional weaning and wellness food. Sprouting increases ragi's calcium absorption threefold, blended with almonds to create a rich, creamy, and digestible health drink mix.",
                    "Sprouted Finger Millet (Ragi), Premium Almonds, Cardamom",
                    "[\"Exceptionally high in Calcium and Iron\", \"Easily digestible for infants and elderly\", \"Supports bone development\", \"Gluten-free nutrient booster\"]",
                    "[{\"weight\":\"250g\",\"price\":240},{\"weight\":\"500g\",\"price\":450}]",
                    true,
                    false
                ),
                new Product(
                    "healthy-mix",
                    "Homemade Healthy Mix (Sathu Maavu)",
                    "healthy-mixes",
                    280.0,
                    4.9,
                    88,
                    "images/healthy-mix.jpg",
                    "A time-tested traditional formula comprising 18 natural ingredients: sprouted millets, grains, pulses, and nuts. Lightly roasted and finely ground for maximum nutrition and traditional flavor.",
                    "Sprouted Ragi, Bajra, Jowar, Wheat, Red Rice, Barley, Roasted Gram, Green Gram, Groundnuts, Almonds, Cashews, Cardamom, Dry Ginger, Sago",
                    "[\"100% natural weight gainer for growing kids\", \"Complete balanced meal rich in fiber and vitamins\", \"Boosts energy and stamina\", \"No artificial sweeteners, colors, or preservatives\"]",
                    "[{\"weight\":\"500g\",\"price\":280},{\"weight\":\"1kg\",\"price\":540}]",
                    true,
                    true
                ),
                new Product(
                    "millet-health-mix",
                    "Multi-Millet Health Porridge Mix",
                    "healthy-mixes",
                    260.0,
                    4.7,
                    33,
                    "images/millet-health-mix.jpg",
                    "A diabetic-friendly and weight-loss supportive porridge mix made from 9 varieties of premium organic millets. Low glycemic index and rich in dietary fiber.",
                    "Finger Millet, Pearl Millet, Foxtail Millet, Little Millet, Kodo Millet, Barnyard Millet, Sorghum, Brown Top Millet, Cardamom",
                    "[\"Helps regulate blood sugar levels\", \"Keeps you full longer, helping in weight control\", \"Rich in iron, magnesium, and dietary fiber\", \"Excellent breakfast option for modern lifestyles\"]",
                    "[{\"weight\":\"500g\",\"price\":260},{\"weight\":\"1kg\",\"price\":500}]",
                    true,
                    false
                ),
                new Product(
                    "cow-ghee",
                    "Pure Homemade Cow Ghee (Bilona Method)",
                    "other-organics",
                    450.0,
                    5.0,
                    104,
                    "images/cow-ghee.jpg",
                    "Churned from cultured butter of grass-fed cows using the traditional Vedic Bilona method. Highly aromatic, grainy, and packed with healthy fats.",
                    "100% Clarified Butter (Cow Milk Fat)",
                    "[\"Traditional aroma and rich grainy texture\", \"Enhances digestion and nutrient absorption\", \"Good for joints, skin, and overall vitality\", \"Lactose and casein-free\"]",
                    "[{\"weight\":\"250ml\",\"price\":450},{\"weight\":\"500ml\",\"price\":850},{\"weight\":\"1L\",\"price\":1600}]",
                    true,
                    true
                ),
                new Product(
                    "forest-honey",
                    "Raw Wild Forest Honey",
                    "other-organics",
                    290.0,
                    4.9,
                    77,
                    "images/forest-honey.webp",
                    "100% pure, unfiltered, and unpasteurized honey sourced directly from forest beehives. Retains natural pollen, propolis, and royal jelly.",
                    "100% Raw Wild Forest Honey",
                    "[\"Natural energy booster and immunity builder\", \"Soothes cough and throat irritation\", \"Rich in natural enzymes and antioxidants\", \"Excellent natural sweetener\"]",
                    "[{\"weight\":\"250g\",\"price\":160},{\"weight\":\"500g\",\"price\":290},{\"weight\":\"1kg\",\"price\":550}]",
                    true,
                    true
                )
            );

            productRepository.saveAll(initialProducts);
            logger.info(">>> Seeded {} initial organic products into database", initialProducts.size());
        }
    }
}
