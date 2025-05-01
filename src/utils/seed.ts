import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import slugify from "slugify";
import { logger } from "./logger";

const prisma = new PrismaClient();

async function seed() {
  try {
    logger.info("Starting database seeding...");

    // Create admin users
    const adminUsers = [
      {
        email: "admin@example.com",
        password: "admin123",
        firstName: "Admin",
        lastName: "User",
      },
      {
        email: "sarah.admin@example.com",
        password: "admin456",
        firstName: "Sarah",
        lastName: "Johnson",
      },
      {
        email: "tech.admin@example.com",
        password: "admin789",
        firstName: "Michael",
        lastName: "Chen",
      },
    ];

    for (const admin of adminUsers) {
      const hashedPassword = await argon2.hash(admin.password);
      await prisma.user.upsert({
        where: { email: admin.email },
        update: {},
        create: {
          email: admin.email,
          password: hashedPassword,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: "ADMIN",
        },
      });
    }
    logger.info(`Created ${adminUsers.length} admin users`);

    // Create customer users
    const customerUsers = [
      {
        email: "customer@example.com",
        password: "customer123",
        firstName: "Test",
        lastName: "Customer",
      },
      {
        email: "john.doe@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
      },
      {
        email: "jane.smith@example.com",
        password: "password456",
        firstName: "Jane",
        lastName: "Smith",
      },
      {
        email: "robert.johnson@example.com",
        password: "password789",
        firstName: "Robert",
        lastName: "Johnson",
      },
      {
        email: "emily.davis@example.com",
        password: "emilypwd",
        firstName: "Emily",
        lastName: "Davis",
      },
      {
        email: "david.wilson@example.com",
        password: "davidpwd",
        firstName: "David",
        lastName: "Wilson",
      },
      {
        email: "sophia.brown@example.com",
        password: "sophiapwd",
        firstName: "Sophia",
        lastName: "Brown",
      },
      {
        email: "daniel.miller@example.com",
        password: "danielpwd",
        firstName: "Daniel",
        lastName: "Miller",
      },
      {
        email: "olivia.taylor@example.com",
        password: "oliviapwd",
        firstName: "Olivia",
        lastName: "Taylor",
      },
      {
        email: "james.anderson@example.com",
        password: "jamespwd",
        firstName: "James",
        lastName: "Anderson",
      },
    ];

    for (const customer of customerUsers) {
      const hashedPassword = await argon2.hash(customer.password);
      await prisma.user.upsert({
        where: { email: customer.email },
        update: {},
        create: {
          email: customer.email,
          password: hashedPassword,
          firstName: customer.firstName,
          lastName: customer.lastName,
          role: "CUSTOMER",
        },
      });
    }
    logger.info(`Created ${customerUsers.length} customer users`);

    // Create categories
    const categories = [
      { name: "Electronics" },
      { name: "Clothing" },
      { name: "Books" },
      { name: "Home & Kitchen" },
      { name: "Beauty & Personal Care" },
      { name: "Sports & Outdoors" },
      { name: "Toys & Games" },
      { name: "Automotive" },
    ];

    for (const category of categories) {
      const slug = slugify(category.name, { lower: true });
      await prisma.category.upsert({
        where: { slug },
        update: {},
        create: {
          name: category.name,
          slug,
        },
      });
    }
    logger.info(`Created ${categories.length} categories`);

    // Get category IDs
    const categoryMap = new Map();
    for (const category of categories) {
      const slug = slugify(category.name, { lower: true });
      const categoryRecord = await prisma.category.findUnique({
        where: { slug },
      });
      if (categoryRecord) {
        categoryMap.set(category.name, categoryRecord.id);
      }
    }

    // Create products
    const products = [
      // Electronics
      {
        name: "Smartphone X",
        description:
          "Latest smartphone with advanced features including 5G connectivity, 6.7-inch OLED display, and triple camera system.",
        price: 699.99,
        images: [
          "https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 50,
        categoryId: categoryMap.get("Electronics"),
      },
      {
        name: "Laptop Pro",
        description:
          "Powerful laptop for professionals with 16GB RAM, 512GB SSD, and dedicated graphics card.",
        price: 1299.99,
        images: [
          "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 30,
        categoryId: categoryMap.get("Electronics"),
      },
      {
        name: "Wireless Earbuds",
        description:
          "High-quality wireless earbuds with noise cancellation and 24-hour battery life.",
        price: 149.99,
        images: [
          "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 100,
        categoryId: categoryMap.get("Electronics"),
      },
      {
        name: "Smart Watch",
        description:
          "Feature-rich smartwatch with health tracking, GPS, and water resistance.",
        price: 249.99,
        images: [
          "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 60,
        categoryId: categoryMap.get("Electronics"),
      },
      {
        name: "Bluetooth Speaker",
        description:
          "Portable speaker with premium sound quality and 12-hour battery life.",
        price: 89.99,
        images: [
          "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 85,
        categoryId: categoryMap.get("Electronics"),
      },
      {
        name: "4K Smart TV",
        description:
          "55-inch 4K Ultra HD Smart TV with HDR and built-in streaming apps.",
        price: 599.99,
        images: [
          "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 25,
        categoryId: categoryMap.get("Electronics"),
      },
      {
        name: "Digital Camera",
        description:
          "24MP digital camera with 4K video recording and interchangeable lenses.",
        price: 799.99,
        images: [
          "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 20,
        categoryId: categoryMap.get("Electronics"),
      },
      {
        name: "Gaming Console",
        description:
          "Next-generation gaming console with 1TB storage and 4K gaming capability.",
        price: 499.99,
        images: [
          "https://images.unsplash.com/photo-1605901309584-818e25960a8f?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 15,
        categoryId: categoryMap.get("Electronics"),
      },
      {
        name: "Wireless Router",
        description:
          "Dual-band WiFi 6 router with gigabit speeds and wide coverage.",
        price: 129.99,
        images: [
          "https://images.unsplash.com/photo-1648428030158-56a973ac3705?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 40,
        categoryId: categoryMap.get("Electronics"),
      },
      {
        name: "Tablet Pro",
        description:
          "10.5-inch tablet with high-resolution display and all-day battery life.",
        price: 349.99,
        images: [
          "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 35,
        categoryId: categoryMap.get("Electronics"),
      },

      // Clothing
      {
        name: "Men's T-Shirt",
        description: "Comfortable cotton t-shirt available in multiple colors.",
        price: 24.99,
        images: [
          "https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 200,
        categoryId: categoryMap.get("Clothing"),
      },
      {
        name: "Women's Jeans",
        description: "Stylish and durable jeans with perfect fit.",
        price: 49.99,
        images: [
          "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 150,
        categoryId: categoryMap.get("Clothing"),
      },
      {
        name: "Women's Dress",
        description: "Elegant casual dress for all occasions.",
        price: 59.99,
        images: [
          "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 110,
        categoryId: categoryMap.get("Clothing"),
      },
      {
        name: "Men's Hoodie",
        description: "Comfortable and warm hoodie for everyday wear.",
        price: 39.99,
        images: [
          "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 130,
        categoryId: categoryMap.get("Clothing"),
      },
      {
        name: "Women's Blouse",
        description:
          "Lightweight and stylish blouse for professional settings.",
        price: 34.99,
        images: [
          "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 95,
        categoryId: categoryMap.get("Clothing"),
      },
      {
        name: "Men's Formal Shirt",
        description: "Classic formal shirt for business and special occasions.",
        price: 44.99,
        images: [
          "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 80,
        categoryId: categoryMap.get("Clothing"),
      },
      {
        name: "Women's Sweater",
        description: "Warm and cozy sweater for cold weather.",
        price: 54.99,
        images: [
          "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 70,
        categoryId: categoryMap.get("Clothing"),
      },
      {
        name: "Men's Jacket",
        description:
          "Waterproof jacket with thermal lining for outdoor activities.",
        price: 89.99,
        images: [
          "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 60,
        categoryId: categoryMap.get("Clothing"),
      },
      {
        name: "Women's Activewear Set",
        description: "Breathable and stretchy activewear set for workouts.",
        price: 69.99,
        images: [
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 85,
        categoryId: categoryMap.get("Clothing"),
      },
      {
        name: "Men's Swim Shorts",
        description: "Quick-dry swim shorts with comfortable fit.",
        price: 29.99,
        images: [
          "https://images.unsplash.com/photo-1565128939502-e6d2977d0217?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 100,
        categoryId: categoryMap.get("Clothing"),
      },

      // Books
      {
        name: "Programming Guide",
        description:
          "Comprehensive guide to modern programming languages and techniques.",
        price: 39.99,
        images: [
          "https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 75,
        categoryId: categoryMap.get("Books"),
      },
      {
        name: "Science Fiction Novel",
        description:
          "Bestselling science fiction novel set in a dystopian future.",
        price: 19.99,
        images: [
          "https://images.unsplash.com/photo-1518744386442-2d48ac47a7eb?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 120,
        categoryId: categoryMap.get("Books"),
      },
      {
        name: "Business Book",
        description: "Guide to entrepreneurship and business strategy.",
        price: 29.99,
        images: [
          "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 90,
        categoryId: categoryMap.get("Books"),
      },
      {
        name: "Cookbook",
        description: "Collection of gourmet recipes from around the world.",
        price: 24.99,
        images: [
          "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 65,
        categoryId: categoryMap.get("Books"),
      },
      {
        name: "Self-Help Book",
        description: "Guide to personal development and mindfulness.",
        price: 18.99,
        images: [
          "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 110,
        categoryId: categoryMap.get("Books"),
      },
      {
        name: "Historical Fiction",
        description: "Engaging novel set during World War II.",
        price: 22.99,
        images: [
          "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 85,
        categoryId: categoryMap.get("Books"),
      },
      {
        name: "Biography",
        description: "Inspiring life story of a renowned scientist.",
        price: 26.99,
        images: [
          "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 70,
        categoryId: categoryMap.get("Books"),
      },
      {
        name: "Fantasy Novel",
        description:
          "Epic fantasy adventure with magical creatures and heroic quests.",
        price: 21.99,
        images: [
          "https://images.unsplash.com/photo-1531901599143-df5010ab9438?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 95,
        categoryId: categoryMap.get("Books"),
      },

      // Home & Kitchen
      {
        name: "Coffee Maker",
        description: "Programmable coffee maker with thermal carafe.",
        price: 79.99,
        images: [
          "https://images.unsplash.com/photo-1570286424908-f8fd4d6700e8?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 45,
        categoryId: categoryMap.get("Home & Kitchen"),
      },
      {
        name: "Blender",
        description: "High-speed blender for smoothies and food preparation.",
        price: 69.99,
        images: [
          "https://images.unsplash.com/photo-1570275239925-4af0aa93a0dc?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 55,
        categoryId: categoryMap.get("Home & Kitchen"),
      },
      {
        name: "Cookware Set",
        description: "10-piece non-stick cookware set with glass lids.",
        price: 149.99,
        images: [
          "https://images.unsplash.com/photo-1584990347449-716dc5a82dd1?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 30,
        categoryId: categoryMap.get("Home & Kitchen"),
      },
      {
        name: "Bedding Set",
        description:
          "Luxury cotton bedding set with duvet cover and pillowcases.",
        price: 89.99,
        images: [
          "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 40,
        categoryId: categoryMap.get("Home & Kitchen"),
      },
      {
        name: "Smart Home Hub",
        description: "Central hub for controlling smart home devices.",
        price: 129.99,
        images: [
          "https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 25,
        categoryId: categoryMap.get("Home & Kitchen"),
      },
      {
        name: "Air Purifier",
        description: "HEPA air purifier for removing allergens and pollutants.",
        price: 119.99,
        images: [
          "https://images.unsplash.com/photo-1634542984003-e0fb8e200e91?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 35,
        categoryId: categoryMap.get("Home & Kitchen"),
      },
      {
        name: "Robot Vacuum",
        description:
          "Smart robot vacuum with mapping technology and app control.",
        price: 249.99,
        images: [
          "https://images.unsplash.com/photo-1589454174434-0cfa4b5ebe8d?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 20,
        categoryId: categoryMap.get("Home & Kitchen"),
      },

      // Beauty & Personal Care
      {
        name: "Facial Cleanser",
        description: "Gentle facial cleanser for all skin types.",
        price: 14.99,
        images: [
          "https://images.unsplash.com/photo-1556228578-8d89a1181d67?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 120,
        categoryId: categoryMap.get("Beauty & Personal Care"),
      },
      {
        name: "Hair Dryer",
        description:
          "Professional-grade hair dryer with multiple heat settings.",
        price: 59.99,
        images: [
          "https://images.unsplash.com/photo-1522338140262-f46f5913618a?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 65,
        categoryId: categoryMap.get("Beauty & Personal Care"),
      },
      {
        name: "Skincare Set",
        description:
          "Complete skincare routine with cleanser, toner, and moisturizer.",
        price: 49.99,
        images: [
          "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 80,
        categoryId: categoryMap.get("Beauty & Personal Care"),
      },
      {
        name: "Electric Toothbrush",
        description:
          "Rechargeable electric toothbrush with multiple cleaning modes.",
        price: 79.99,
        images: [
          "https://images.unsplash.com/photo-1559591937-abc3d90cee62?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 70,
        categoryId: categoryMap.get("Beauty & Personal Care"),
      },
      {
        name: "Perfume",
        description: "Luxury fragrance with notes of jasmine and sandalwood.",
        price: 89.99,
        images: [
          "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 55,
        categoryId: categoryMap.get("Beauty & Personal Care"),
      },

      // Sports & Outdoors
      {
        name: "Yoga Mat",
        description: "Non-slip yoga mat with carrying strap.",
        price: 29.99,
        images: [
          "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 100,
        categoryId: categoryMap.get("Sports & Outdoors"),
      },
      {
        name: "Fitness Tracker",
        description: "Waterproof fitness tracker with heart rate monitoring.",
        price: 79.99,
        images: [
          "https://images.unsplash.com/photo-1576243345690-4e4b79b63288?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 75,
        categoryId: categoryMap.get("Sports & Outdoors"),
      },
      {
        name: "Camping Tent",
        description: "4-person waterproof tent for outdoor adventures.",
        price: 129.99,
        images: [
          "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 40,
        categoryId: categoryMap.get("Sports & Outdoors"),
      },
      {
        name: "Mountain Bike",
        description: "All-terrain mountain bike with 21 speeds.",
        price: 399.99,
        images: [
          "https://images.unsplash.com/photo-1511994298241-608e28f14fde?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 15,
        categoryId: categoryMap.get("Sports & Outdoors"),
      },
      {
        name: "Basketball",
        description:
          "Official size and weight basketball for indoor and outdoor play.",
        price: 24.99,
        images: [
          "https://images.unsplash.com/photo-1519861531473-9200262188bf?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 60,
        categoryId: categoryMap.get("Sports & Outdoors"),
      },

      // Toys & Games
      {
        name: "Board Game",
        description: "Strategic board game for family game nights.",
        price: 34.99,
        images: [
          "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 85,
        categoryId: categoryMap.get("Toys & Games"),
      },
      {
        name: "Remote Control Car",
        description: "High-speed remote control car with rechargeable battery.",
        price: 49.99,
        images: [
          "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 50,
        categoryId: categoryMap.get("Toys & Games"),
      },
      {
        name: "Building Blocks Set",
        description: "Creative building blocks set with 500 pieces.",
        price: 39.99,
        images: [
          "https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 70,
        categoryId: categoryMap.get("Toys & Games"),
      },
      {
        name: "Puzzle",
        description: "1000-piece jigsaw puzzle with scenic landscape.",
        price: 19.99,
        images: [
          "https://images.unsplash.com/photo-1586163179753-7fc3b24d0c46?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 90,
        categoryId: categoryMap.get("Toys & Games"),
      },

      // Automotive
      {
        name: "Car Vacuum Cleaner",
        description: "Portable vacuum cleaner for car interiors.",
        price: 39.99,
        images: [
          "https://images.unsplash.com/photo-1616093875201-d6bf4d8e3fb6?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 60,
        categoryId: categoryMap.get("Automotive"),
      },
      {
        name: "Car Phone Mount",
        description: "Adjustable phone mount for dashboard or windshield.",
        price: 19.99,
        images: [
          "https://images.unsplash.com/photo-1617886322168-72b886573c3c?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 100,
        categoryId: categoryMap.get("Automotive"),
      },
      {
        name: "Tire Pressure Gauge",
        description: "Digital tire pressure gauge with backlit display.",
        price: 14.99,
        images: [
          "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 120,
        categoryId: categoryMap.get("Automotive"),
      },
      {
        name: "Car Wax",
        description: "Premium car wax for long-lasting shine and protection.",
        price: 24.99,
        images: [
          "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1000&auto=format&fit=crop",
        ],
        stock: 80,
        categoryId: categoryMap.get("Automotive"),
      },
    ];

    for (const product of products) {
      const slug = slugify(product.name, { lower: true });
      await prisma.product.upsert({
        where: { slug },
        update: {},
        create: {
          name: product.name,
          slug,
          description: product.description,
          price: product.price,
          images: product.images,
          stock: product.stock,
          categoryId: product.categoryId,
        },
      });
    }
    logger.info(`Created ${products.length} products`);

    // Create some reviews for products
    const reviews = [
      {
        userId: customerUsers[1].email, // john.doe@example.com
        productSlug: "smartphone-x",
        rating: 5,
        comment: "Amazing phone with great camera quality!",
      },
      {
        userId: customerUsers[2].email, // jane.smith@example.com
        productSlug: "smartphone-x",
        rating: 4,
        comment: "Good phone but battery life could be better.",
      },
      {
        userId: customerUsers[3].email, // robert.johnson@example.com
        productSlug: "laptop-pro",
        rating: 5,
        comment: "Perfect for my work needs. Fast and reliable.",
      },
      {
        userId: customerUsers[4].email, // emily.davis@example.com
        productSlug: "wireless-earbuds",
        rating: 4,
        comment:
          "Great sound quality but they're a bit uncomfortable after long use.",
      },
      {
        userId: customerUsers[5].email, // david.wilson@example.com
        productSlug: "smart-watch",
        rating: 5,
        comment: "Love the fitness tracking features!",
      },
    ];

    for (const review of reviews) {
      const user = await prisma.user.findUnique({
        where: { email: review.userId },
      });

      const product = await prisma.product.findUnique({
        where: { slug: review.productSlug },
      });

      if (user && product) {
        await prisma.review.upsert({
          where: {
            userId_productId: {
              userId: user.id,
              productId: product.id,
            },
          },
          update: {},
          create: {
            userId: user.id,
            productId: product.id,
            rating: review.rating,
            comment: review.comment,
          },
        });
      }
    }
    logger.info(`Created ${reviews.length} reviews`);

    // Update product average ratings
    const productsWithReviews = await prisma.product.findMany({
      where: {
        reviews: {
          some: {},
        },
      },
      include: {
        reviews: true,
      },
    });

    for (const product of productsWithReviews) {
      const totalRating = product.reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const avgRating = totalRating / product.reviews.length;

      await prisma.product.update({
        where: { id: product.id },
        data: {
          avgRating,
          ratingCount: product.reviews.length,
        },
      });
    }

    logger.info("Database seeding completed successfully");
  } catch (error) {
    logger.error("Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Failed to seed database:", error);
    process.exit(1);
  });
