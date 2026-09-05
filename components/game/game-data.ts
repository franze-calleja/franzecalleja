import profileData from "../../app/profile-data.json";

export interface WorldObject {
  id: string;
  name: string;
  type: "building" | "statue" | "banner" | "azra" | "landmark" | "arcade" | "stall";
  x: number; // pixel coordinate on map
  y: number;
  width: number;
  height: number;
  title: string;
  subtitle: string;
  iconName: string;
  description: string;
  interactionKey: "projects" | "devops" | "stack" | "experience" | "education" | "azra" | "about" | "gaming" | "contact" | "general" | "banner_mseuf" | "banner_raones" | "banner_ellipsense" | "banner_techbears" | "banner_lebron";
  metadata?: Record<string, unknown>;
}

export interface NPC {
  id: string;
  name: string;
  x: number;
  y: number;
  anchorX: number;
  anchorY: number;
  wanderRadius: number;
  direction: "down" | "up" | "left" | "right";
  spriteRow: number; // Row in Characters_V3_Colour.png (0..19)
  spriteType: "trainer" | "azra" | "scholar" | "engineer" | "cat" | "knight" | "sweetheart" | "dog";
  nameTag: string;
  dialogue: string[];
  interactionKey: "azra" | "about" | "experience" | "general" | "projects" | "education" | "contact";
}

export const MAP_TOTAL_WIDTH = 960;
export const MAP_TOTAL_HEIGHT = 760;

export interface Rect { x: number; y: number; w: number; h: number }

/** Pathway bounding boxes. Moved from game-canvas.tsx so terrain data lives
 *  with the rest of the map data. Values are unchanged. */
export const PATH_AREAS: Rect[] = [
  { x: 340, y: 300, w: 160, h: 160 }, // Central Plaza
  { x: 370, y: 440, w: 90, h: 280 },  // South Entrance
  { x: 375, y: 140, w: 80, h: 170 },  // North Trail to Village Post
  { x: 110, y: 150, w: 80, h: 120 },  // NW Trail
  { x: 110, y: 240, w: 260, h: 80 },  // West Trail
  { x: 470, y: 150, w: 100, h: 160 }, // NE Trail
  { x: 550, y: 150, w: 150, h: 80 },  // East Trail to Sanctuary
  { x: 690, y: 160, w: 90, h: 70 },   // East Trail to Career Archives
  { x: 120, y: 480, w: 270, h: 70 },  // SW Trail
  { x: 120, y: 530, w: 80, h: 120 },  // SW Trail to Dojo
  { x: 440, y: 470, w: 260, h: 70 },  // SE Trail
  { x: 560, y: 520, w: 120, h: 140 }, // SE Trail to Cottage
  { x: 660, y: 470, w: 160, h: 60 },  // Trail to Court
  { x: 730, y: 535, w: 90, h: 100 },  // Basketball Court
];

/**
 * Hand-placed tall-grass patches, sited in the open field pockets between
 * buildings and trails. Deliberately placed rather than scattered so nothing
 * important gets covered and NPC walk routes stay clear.
 */
export const TALL_GRASS_AREAS: Rect[] = [
  { x: 286, y: 48,  w: 58,  h: 88 },  // between Guild and Village Post
  { x: 236, y: 326, w: 98,  h: 146 }, // west of the plaza
  { x: 216, y: 570, w: 136, h: 130 }, // south-west field
  { x: 470, y: 566, w: 82,  h: 150 }, // south of the plaza approach
  { x: 704, y: 292, w: 86,  h: 80 },  // east, below the Archives
  { x: 832, y: 560, w: 92,  h: 156 }, // south-east corner
];

// Multi-species big trees (Grand Oak, Pine, Autumn Maple, Sakura). Moved
// from game-canvas.tsx so scenery data lives with the rest of the map data.
export const DECORATIVE_TREES = [
  { x: 860, y: 110, w: 64, h: 80, type: "grand_oak" as const },
  { x: 900, y: 220, w: 48, h: 78, type: "pine" as const },
  { x: 850, y: 310, w: 58, h: 74, type: "maple" as const },
  { x: 890, y: 440, w: 58, h: 74, type: "sakura" as const },
  { x: 840, y: 550, w: 64, h: 80, type: "grand_oak" as const },
  { x: 230, y: 140, w: 58, h: 74, type: "sakura" as const },
  { x: 15, y: 410, w: 48, h: 78, type: "pine" as const },
];

// Flower pot positions (strictly inside grass fields and garden pens)
export const FLOWER_POTS = [
  // 1. Right Side Fenced Garden Pen (Safely below Career Archives building at y: 275..343)
  { x: 810, y: 288, type: "rose" as const },
  { x: 844, y: 288, type: "sunflower" as const },
  { x: 810, y: 318, type: "lily" as const },
  { x: 844, y: 318, type: "orchid" as const },

  // 2. North-West Projects Fenced Garden Pen (Shifted into dedicated left garden pen)
  { x: 68, y: 56, type: "sunflower" as const },
  { x: 96, y: 56, type: "rose" as const },
  { x: 68, y: 84, type: "orchid" as const },
  { x: 96, y: 84, type: "lily" as const },

  // 3. Central Plaza Garden Planter Pots (Planted neatly beside the avenue)
  { x: 305, y: 280, type: "rose" as const },
  { x: 650, y: 280, type: "orchid" as const },
];

// Multi-species bushes (Berry Bush, Flowering Hedge, Wild Shrub)
export const DECORATIVE_BUSHES = [
  { x: 895, y: 270, type: "berry_bush" as const, berry: "#ef4444" },
  { x: 830, y: 370, type: "berry_bush" as const, berry: "#38bdf8" },
  { x: 880, y: 530, type: "flowering_hedge" as const, berry: "#f472b6" },
  { x: 780, y: 480, type: "flowering_hedge" as const, berry: "#ffffff" },
  { x: 50, y: 130, type: "wild_shrub" as const, berry: "#facc15" },
  { x: 330, y: 60, type: "berry_bush" as const, berry: "#facc15" },
  { x: 50, y: 530, type: "wild_shrub" as const, berry: "#ef4444" },
  { x: 490, y: 540, type: "flowering_hedge" as const, berry: "#38bdf8" },
];

// Rich 3D Village Outdoor Furniture
export interface VillageFurniture {
  id: string;
  type: "bench" | "chess_table" | "wishing_well" | "birdbath" | "streetlamp" | "barrel_stack";
  x: number;
  y: number;
  w: number;
  h: number;
}

export const VILLAGE_FURNITURE: VillageFurniture[] = [
  // 1. Cozy Park Benches (Oak Slats + Cast Iron Scrollwork)
  { id: "bench-nw", type: "bench", x: 195, y: 55, w: 42, h: 24 },
  { id: "bench-plaza-left", type: "bench", x: 260, y: 345, w: 42, h: 24 },
  { id: "bench-plaza-right", type: "bench", x: 650, y: 345, w: 42, h: 24 },
  { id: "bench-sw", type: "bench", x: 220, y: 630, w: 42, h: 24 },
  { id: "bench-se", type: "bench", x: 500, y: 610, w: 42, h: 24 },

  // 2. Carved Stone Chess / Picnic Tables with Stools
  { id: "chess-nw", type: "chess_table", x: 280, y: 145, w: 46, h: 32 },
  { id: "chess-east", type: "chess_table", x: 840, y: 435, w: 46, h: 32 },

  // 3. Ancient Village Wishing Well (North-East Grove near Sanctuary)
  { id: "well-ne", type: "wishing_well", x: 725, y: 70, w: 50, h: 56 },

  // 4. Carved Limestone Birdbaths with Bluebird
  { id: "birdbath-left", type: "birdbath", x: 240, y: 475, w: 30, h: 30 },
  { id: "birdbath-right", type: "birdbath", x: 700, y: 330, w: 30, h: 30 },

  // 5. Classic Wrought Iron Streetlamps (Warm Glowing Lanterns)
  { id: "lamp-nw", type: "streetlamp", x: 335, y: 190, w: 22, h: 48 },
  { id: "lamp-ne", type: "streetlamp", x: 625, y: 190, w: 22, h: 48 },
  { id: "lamp-sw", type: "streetlamp", x: 335, y: 450, w: 22, h: 48 },
  { id: "lamp-se", type: "streetlamp", x: 625, y: 450, w: 22, h: 48 },

  // 6. Rustic Harvest Oak Barrels & Fruit Crates
  { id: "barrels-sw", type: "barrel_stack", x: 275, y: 545, w: 40, h: 30 },
  { id: "barrels-se", type: "barrel_stack", x: 870, y: 595, w: 40, h: 30 },
];

// Pathway & Garden Fences with Dedicated Entrance Openings
export const PATHWAY_FENCES = [
  // 1. North-West Projects Border Fences (leaves x: 106..194 open for entrance)
  { x: 60, y: 170, w: 46, h: 18 },
  { x: 194, y: 170, w: 120, h: 18 },

  // 2. North-East AI Sanctuary Border Fences (leaves x: 546..660 open for entrance)
  { x: 470, y: 150, w: 76, h: 18 },
  { x: 700, y: 150, w: 45, h: 18 },

  // 3. South-West Academy Dojo Border Fences (leaves x: 116..200 open for entrance)
  { x: 60, y: 480, w: 56, h: 18 },
  { x: 200, y: 480, w: 136, h: 18 },

  // 4. South-East Gamer Cottage Border Fences (leaves x: 586..664 open for entrance)
  { x: 470, y: 470, w: 116, h: 18 },
  { x: 750, y: 470, w: 80, h: 18 },

  // 5. East Forest Grove Border Fences (leaves y: 340..370 open for entrance)
  { x: 900, y: 260, w: 18, h: 80 },
  { x: 900, y: 370, w: 18, h: 90 },

  // 6. Enclosed Garden Pens
  { x: 800, y: 275, w: 68, h: 68 },
  { x: 58, y: 46, w: 58, h: 62 },
];

// Player spawn in the open central fountain plaza
export const PLAYER_SPAWN_X = 408;
export const PLAYER_SPAWN_Y = 448;

export const WORLD_OBJECTS: WorldObject[] = [
  // 1. PROJECTS SHOWCASE GUILD (North-West Garden)
  {
    id: "projects-guild",
    name: "Projects Showcase Guild",
    type: "building",
    x: 70,
    y: 60,
    width: 140,
    height: 110,
    title: "Projects Showcase Guild",
    subtitle: "Enterprise Applications & Systems Archive",
    iconName: "FolderGit2",
    description: "Inspect Franze's featured applications, institutional platforms, and client repositories.",
    interactionKey: "projects",
    metadata: {
      projects: profileData.projects.items,
    },
  },

  // 2. VILLAGE TELEGRAPH & INQUIRIES LODGE (North Plaza Avenue at x:350, y:55)
  {
    id: "village-post",
    name: "Village Post & Inquiries Lodge",
    type: "building",
    x: 350,
    y: 55,
    width: 130,
    height: 95,
    title: "Village Post & Courier Lodge",
    subtitle: "Inquiries • Direct Dispatch • Resume • Socials",
    iconName: "Mail",
    description: "Send direct messages, dispatch inquiries to Franze, download the official CV transcript, or link to GitHub & LinkedIn.",
    interactionKey: "contact",
  },

  // 3. AZRA'S AI ARCANE SANCTUARY (North-East Overlook)
  {
    id: "azra-sanctuary",
    name: "AZRA's AI Arcane Sanctuary",
    type: "azra",
    x: 560,
    y: 45,
    width: 140,
    height: 125,
    title: "AZRA's AI Arcane Sanctuary",
    subtitle: "Powered by Google Gemini 2.5 Flash API",
    iconName: "Bot",
    description: "The arcane research hub of AZRA, Franze's dedicated AI companion. Talk in real-time about his architecture and projects.",
    interactionKey: "azra",
  },

  // 4. CAREER & EXPERIENCE ARCHIVES (East Quarter at x:750, y:150)
  {
    id: "career-archive",
    name: "Career & Work Experience Archives",
    type: "building",
    x: 750,
    y: 150,
    width: 140,
    height: 105,
    title: "Guildmaster Career & Work History",
    subtitle: "TechBears • R-A-ONES • Ellipsense • MSEUF-CI",
    iconName: "Briefcase",
    description: "Full professional track record, industry roles, engineering leadership, and client achievements.",
    interactionKey: "experience",
    metadata: {
      experience: profileData.experience.steps,
    },
  },

  // 5. DEVOPS & 24/7 POWER STATION (Mid-West Yard)
  {
    id: "devops-plant",
    name: "DevOps & Telemetry Power Station",
    type: "building",
    x: 60,
    y: 260,
    width: 140,
    height: 110,
    title: "Infrastructure & Telemetry Plant",
    subtitle: "Docker • Grafana • Prometheus • Loki • 99.9% Uptime",
    iconName: "Cpu",
    description: "High-availability containerized microservices and automated observability pipelines.",
    interactionKey: "devops",
    metadata: {
      metrics: [
        { label: "Docker Containers", value: "Image-Based Environments" },
        { label: "Metrics & Logs", value: "Prometheus + Grafana + Loki" },
        { label: "Host Monitoring", value: "Node Exporter & Alloy" },
        { label: "Uptime Sentinel", value: "Uptime Kuma (99.9% SLO)" },
      ],
    },
  },

  // 4. TECH ARSENAL STATUES (Organically scattered in garden alcoves)
  {
    id: "statue-nextjs",
    name: "React & Next.js Atom Monolith",
    type: "statue",
    x: 230,
    y: 80,
    width: 50,
    height: 65,
    title: "Frontend Engineering Pillar",
    subtitle: "React 19 • Next.js 16 • TypeScript • Tailwind CSS",
    iconName: "Code2",
    description: "Crafting fluid, accessible, and high-performance user interfaces with server-side rendering.",
    interactionKey: "stack",
  },
  {
    id: "statue-typescript",
    name: "TypeScript Systems Obelisk",
    type: "statue",
    x: 180,
    y: 310,
    width: 50,
    height: 65,
    title: "Type Safety & Architecture Obelisk",
    subtitle: "TypeScript • Node.js • TanStack • Clean Code",
    iconName: "Code2",
    description: "Strict static typing, robust domain models, and developer harness toolings.",
    interactionKey: "stack",
  },
  {
    id: "statue-postgres",
    name: "PostgreSQL & Database Relic",
    type: "statue",
    x: 180,
    y: 400,
    width: 50,
    height: 65,
    title: "Backend & Database Relic",
    subtitle: "PostgreSQL • MySQL • Prisma ORM • Redis",
    iconName: "Database",
    description: "Designing ACID-compliant schemas, complex queries, and resilient data layers.",
    interactionKey: "stack",
  },
  {
    id: "statue-docker",
    name: "Docker Whale Totem",
    type: "statue",
    x: 75,
    y: 400,
    width: 50,
    height: 65,
    title: "Containerization & Cloud Totem",
    subtitle: "Docker • CI/CD Pipelines • Linux Stacks",
    iconName: "Server",
    description: "Reproducible container builds, isolated runtimes, and zero-downtime deployments.",
    interactionKey: "devops",
  },

  // 5. GRAND ALIGNED AVENUE OF BANNERS (Inside the Right Grass Field at y: 380)
  {
    id: "banner-mseuf",
    name: "MSEUF-CI Royal Enterprise Banner",
    type: "banner",
    x: 530,
    y: 380,
    width: 48,
    height: 68,
    title: "MSEUF-CI Lead Fullstack Engineer",
    subtitle: "August 2025 - Present (Current Role)",
    iconName: "Award",
    description: "Leading internal enterprise software infrastructures, mission-critical portals, and production observability platforms.",
    interactionKey: "banner_mseuf",
  },
  {
    id: "banner-raones",
    name: "R-A-Ones Startup Guild Banner",
    type: "banner",
    x: 580,
    y: 380,
    width: 48,
    height: 68,
    title: "R-A-Ones Lead Software Engineer",
    subtitle: "January 2026 - Present (Startup Scale)",
    iconName: "Award",
    description: "Directing full-lifecycle development across high-throughput backend APIs, cloud architecture, and cross-platform mobile apps.",
    interactionKey: "banner_raones",
  },
  {
    id: "banner-ellipsense",
    name: "Ellipsense Freelance Alliance Banner",
    type: "banner",
    x: 630,
    y: 380,
    width: 48,
    height: 68,
    title: "Ellipsense Freelance Lead Developer",
    subtitle: "2023 - Present (Global Delivery)",
    iconName: "Award",
    description: "Leading a distributed engineering team delivering full-stack platforms and mobile solutions for global clients.",
    interactionKey: "banner_ellipsense",
  },
  {
    id: "banner-techbears",
    name: "Techbears Mobility Fleet Banner",
    type: "banner",
    x: 680,
    y: 380,
    width: 48,
    height: 68,
    title: "Techbears Solutions Web Developer",
    subtitle: "August 2025 - January 2026",
    iconName: "Award",
    description: "Engineered administrative dashboard and operations control center for a commercial ride-hailing transportation platform.",
    interactionKey: "banner_techbears",
  },
  {
    id: "banner-lebron",
    name: "The King #23 Championship Banner",
    type: "banner",
    x: 730,
    y: 380,
    width: 48,
    height: 68,
    title: "LeBron James GOAT Tribute Banner",
    subtitle: "Undisputed King of Basketball",
    iconName: "Award",
    description: "Loyal to LeBron James wherever he plays. 4x NBA Champion, 4x MVP, All-Time Scoring Leader.",
    interactionKey: "banner_lebron",
  },

  // 6. ACADEMY OF ENVERGA DOJO (South-West Cultural District)
  {
    id: "education-monument",
    name: "Academy of Enverga (Honors Dojo)",
    type: "building",
    x: 60,
    y: 560,
    width: 140,
    height: 110,
    title: "Academic Honors & Degree",
    subtitle: "Manuel S. Enverga University Foundation - Candelaria Inc.",
    iconName: "GraduationCap",
    description: "Bachelor of Science in Information Technology • Magna Cum Laude Honors.",
    interactionKey: "education",
    metadata: {
      education: profileData.education.items,
    },
  },

  // 7. FRANZE'S GAMER COTTAGE & THE GOAT BASKETBALL COURT (South-East Meadow)
  {
    id: "gaming-lounge",
    name: "Franze's Gamer Cottage",
    type: "arcade",
    x: 560,
    y: 535,
    width: 140,
    height: 110,
    title: "Franze's Off-Duty Lounge & Court",
    subtitle: "PS5 • NBA 2K • RDR2 • LeBron James GOAT Court",
    iconName: "Gamepad2",
    description: "Off-duty interests: Die-hard LeBron James fan (the undisputed GOAT), PS5 enthusiast (NBA 2K, Cult of the Lamb, Red Dead Redemption 2).",
    interactionKey: "gaming",
    metadata: {
      interests: profileData.interests,
    },
  },

  // 8. TOWN CENTER GRAND ROYAL FOUNTAIN (Centred in Plaza at x: 355, y: 325, w: 130, h: 105)
  {
    id: "center-fountain",
    name: "Grand Royal Fountain of Continuous Deployment",
    type: "landmark",
    x: 355,
    y: 325,
    width: 130,
    height: 105,
    title: "Grand Royal Fountain of Continuous Deployment",
    subtitle: "Cascading with clean architecture and zero-downtime releases.",
    iconName: "Sparkles",
    description: "Toss a lucky coin into the grand royal fountain for +10 to code review speed and 0 bug releases!",
    interactionKey: "general",
  },
];

export const NPCS: NPC[] = [
  // 1. AZRA AI Companion (Row 14: Arcane Wizard near Sanctuary)
  {
    id: "npc-azra",
    name: "AZRA (AI Companion)",
    nameTag: "AZRA [AI Agent]",
    x: 630,
    y: 185,
    anchorX: 630,
    anchorY: 185,
    wanderRadius: 32,
    direction: "down",
    spriteRow: 14,
    spriteType: "azra",
    interactionKey: "azra",
    dialogue: [
      "Greetings traveler! I am AZRA, Franze's dedicated AI companion.",
      "I am loaded with real-time knowledge of Franze's projects, technical stack, and system architecture.",
      "Ask me anything you'd like to know!",
    ],
  },
  // 2. Lead Architect Astro (Row 0: Adventurer Trainer near Projects Guild)
  {
    id: "npc-engineer",
    name: "Lead Architect Astro",
    nameTag: "Architect Astro 🛠️",
    x: 140,
    y: 185,
    anchorX: 140,
    anchorY: 185,
    wanderRadius: 36,
    direction: "down",
    spriteRow: 0,
    spriteType: "engineer",
    interactionKey: "projects",
    dialogue: [
      "Welcome to Franze Town!",
      "Head inside the Projects Guild to inspect live production portals and apps built with Next.js & React 19.",
    ],
  },
  // 3. SRE Node (Row 11: Armored Blue Engineer near DevOps Station)
  {
    id: "npc-devops",
    name: "SRE Node",
    nameTag: "SRE Node ⚡",
    x: 130,
    y: 385,
    anchorX: 130,
    anchorY: 385,
    wanderRadius: 36,
    direction: "down",
    spriteRow: 11,
    spriteType: "scholar",
    interactionKey: "about",
    dialogue: [
      "All telemetry systems are green! 🟢",
      "Prometheus, Grafana, and Loki are indexing live infrastructure metrics.",
    ],
  },
  // 4. Professor Niwdla (Row 1: Wise Elder & Academic Mentor near Academy of Enverga)
  {
    id: "npc-professor",
    name: "Professor Niwdla",
    nameTag: "Professor Niwdla 🎓",
    x: 220,
    y: 600,
    anchorX: 220,
    anchorY: 600,
    wanderRadius: 36,
    direction: "left",
    spriteRow: 1,
    spriteType: "scholar",
    interactionKey: "education",
    dialogue: [
      "Ah, welcome! Franze graduated with Magna Cum Laude honors at Manuel S. Enverga University Foundation!",
      "Inspect the Academy of Enverga to review his academic transcript and degree.",
    ],
  },
  // 5. Kisses the Shih Tzu (Near Central Fountain Plaza)
  {
    id: "npc-dog",
    name: "Kisses the Shih Tzu",
    nameTag: "Kisses 🐶",
    x: 478,
    y: 380,
    anchorX: 478,
    anchorY: 380,
    wanderRadius: 28,
    direction: "left",
    spriteRow: 0,
    spriteType: "dog",
    interactionKey: "general",
    dialogue: [
      "Woof! 🐶 (Kisses the cream Shih Tzu wags her fluffy plume tail and shakes her dark floppy ears happily!)",
      "She loves running around Franze Town, receiving belly rubs, and giving everyone cheerful puppy kisses! 💖",
    ],
  },
  // 6. Alliah Mikaela (Row 16: Blonde Girl with Red Headband & Pink Dress - Franze's Beloved GF & Fellow Developer)
  {
    id: "npc-allia",
    name: "Alliah Mikaela",
    nameTag: "Alliah 💖",
    x: 350,
    y: 390,
    anchorX: 350,
    anchorY: 390,
    wanderRadius: 28,
    direction: "down",
    spriteRow: 16,
    spriteType: "sweetheart",
    interactionKey: "about",
    dialogue: [
      "Hi there! I'm Alliah Mikaela, Franze's girlfriend! 💖✨",
      "I'm a passionate developer too! We both love building clean web apps and digital experiences.",
      "Check out my portfolio to see what I build: https://alliah-mikaela-revedezo.vercel.app/ 🚀",
      "I'm super proud of Franze and everything he creates. Have fun exploring Franze Town! 💕",
    ],
  },
];

export interface CharacterSkin {
  id: string;
  name: string;
  subtitle: string;
  role: string;
  spriteRow: number;
  spriteType: "player" | "dog" | "sweetheart" | "azra";
  customEffect?: "azra" | "allia" | "none";
  iconEmoji: string;
  themeColor: string;
  badge: string;
  description: string;
  previewColor: string;
}

export const CHARACTER_SKINS: CharacterSkin[] = [
  {
    id: "franze",
    name: "Franze",
    subtitle: "Lead Full-Stack Developer",
    role: "Town Creator & Architect",
    spriteRow: 2,
    spriteType: "player",
    customEffect: "none",
    iconEmoji: "🧢",
    themeColor: "from-blue-600 to-indigo-600",
    badge: "HERO ⚡",
    description: "The original Franze Town hero with his signature cap and developer jacket.",
    previewColor: "#3b82f6",
  },
  {
    id: "alliah",
    name: "Alliah Mikaela",
    subtitle: "Frontend & Full-Stack Developer",
    role: "Beloved Sweetheart & Dev",
    spriteRow: 16,
    spriteType: "sweetheart",
    customEffect: "allia",
    iconEmoji: "💖",
    themeColor: "from-pink-600 to-rose-600",
    badge: "SWEETHEART ✨",
    description: "Blonde hair, red headband, elegant pink dress, and sparkling heart aura particles.",
    previewColor: "#ec4899",
  },
  {
    id: "kisses",
    name: "Kisses the Shih Tzu",
    subtitle: "Fluffy Shih Tzu Puppy",
    role: "Town Mascot",
    spriteRow: 0,
    spriteType: "dog",
    customEffect: "none",
    iconEmoji: "🐶",
    themeColor: "from-amber-500 to-yellow-600",
    badge: "SHIH TZU 🐾",
    description: "Cream coat, signature dark ears, arched plume tail, red collar, and cheerful puppy kisses!",
    previewColor: "#f59e0b",
  },
  {
    id: "azra",
    name: "AZRA",
    subtitle: "Gemini AI Agent",
    role: "Arcane Intelligence Wizard",
    spriteRow: 14,
    spriteType: "azra",
    customEffect: "azra",
    iconEmoji: "🌌",
    themeColor: "from-cyan-600 to-teal-600",
    badge: "AI CORE 🔮",
    description: "Arcane sorceress in star robes with floating cyan orb and pulsing quantum aura.",
    previewColor: "#06b6d4",
  },
  {
    id: "astro",
    name: "Architect Astro",
    subtitle: "Lead Systems Architect",
    role: "Master Project Builder",
    spriteRow: 0,
    spriteType: "player",
    customEffect: "none",
    iconEmoji: "🛠️",
    themeColor: "from-sky-600 to-blue-700",
    badge: "ARCHITECT 📐",
    description: "Red cap adventurer trainer, master of Next.js architecture and distributed apps.",
    previewColor: "#0284c7",
  },
  {
    id: "node",
    name: "SRE Node",
    subtitle: "DevOps & Observability Sentinel",
    role: "Infrastructure Guardian",
    spriteRow: 11,
    spriteType: "player",
    customEffect: "none",
    iconEmoji: "⚡",
    themeColor: "from-emerald-600 to-green-700",
    badge: "DEVOPS 🟢",
    description: "Armored cyber engineer monitoring Docker, Prometheus, and Grafana telemetry 24/7.",
    previewColor: "#10b981",
  },
  {
    id: "niwdla",
    name: "Professor Niwdla",
    subtitle: "Academic Mentor & Scholar",
    role: "Magna Cum Laude Mentor",
    spriteRow: 1,
    spriteType: "player",
    customEffect: "none",
    iconEmoji: "🎓",
    themeColor: "from-amber-700 to-red-800",
    badge: "SCHOLAR 📜",
    description: "Wise elder scholar in lab coat guiding students through academic honors.",
    previewColor: "#b45309",
  },
  {
    id: "shinobi",
    name: "Cyber Shinobi",
    subtitle: "Microservice Shadow Assassin",
    role: "Zero-Latency Rogue",
    spriteRow: 7,
    spriteType: "player",
    customEffect: "none",
    iconEmoji: "🥷",
    themeColor: "from-purple-600 to-violet-900",
    badge: "SHINOBI ⚔️",
    description: "Swift purple shinobi executing async tasks with zero memory leaks and ultra-fast reflexes.",
    previewColor: "#8b5cf6",
  },
];

export const GUILD_INTERIOR_WIDTH = 700;
export const GUILD_INTERIOR_HEIGHT = 540;

export interface ProjectStation {
  id: string;
  projectIndex: number;
  name: string;
  shortTitle: string;
  tagline: string;
  category: string;
  x: number;
  y: number;
  width: number;
  height: number;
  techs: string[];
  color: string;
  iconName: string;
}

export const GUILD_PROJECT_STATIONS: ProjectStation[] = [
  {
    id: "station-website",
    projectIndex: 0,
    name: "MSEUF-Candelaria Institutional Portal & Custom CMS",
    shortTitle: "MSEUF-CI Portal",
    tagline: "Custom CMS & Multi-Tenant Portal",
    category: "Fullstack & Cloud",
    x: 130,
    y: 190,
    width: 64,
    height: 48,
    techs: ["Next.js 16", "React 19", "MySQL", "MinIO"],
    color: "#38bdf8",
    iconName: "Globe",
  },
  {
    id: "station-aem",
    projectIndex: 1,
    name: "AEM System — Algorithmic Educational Support",
    shortTitle: "AEM Core AI",
    tagline: "Algorithmic Risk Scoring & Intervention",
    category: "AI & Fullstack",
    x: 506,
    y: 190,
    width: 64,
    height: 48,
    techs: ["Next.js 16", "PostgreSQL", "Gemini API", "Docker"],
    color: "#a855f7",
    iconName: "Bot",
  },
  {
    id: "station-upfps",
    projectIndex: 2,
    name: "Unified Plant, Facilities, and Property System (UPFPS)",
    shortTitle: "UPFPS Enterprise",
    tagline: "Institutional Property & Asset Tracking",
    category: "Enterprise ERP",
    x: 130,
    y: 290,
    width: 64,
    height: 48,
    techs: ["Next.js 16", "React 19", "Prisma", "Express"],
    color: "#34d399",
    iconName: "Building2",
  },
  {
    id: "station-phd",
    projectIndex: 3,
    name: "PHD Map — Urban Parking Discovery & Reservation",
    shortTitle: "PHD Map Toronto",
    tagline: "Geospatial Parking Discovery & Booking",
    category: "Mobile & Cloud",
    x: 506,
    y: 290,
    width: 64,
    height: 48,
    techs: ["React Native", "Expo", "PostgreSQL", "Express"],
    color: "#f59e0b",
    iconName: "MapPin",
  },
  {
    id: "station-nfc",
    projectIndex: 4,
    name: "CITHM Smart NFC Attendance & Event Tracking",
    shortTitle: "Smart NFC IoT",
    tagline: "Hardware-Integrated Event Attendance",
    category: "IoT & Hardware",
    x: 130,
    y: 390,
    width: 64,
    height: 48,
    techs: ["Next.js 16", "Prisma 7", "Docker", "NFC Hardware"],
    color: "#ec4899",
    iconName: "Radio",
  },
  {
    id: "station-college-portal",
    projectIndex: 5,
    name: "EUC Academic & Admissions Portal",
    shortTitle: "EUC Academic Portal",
    tagline: "Digital Admissions & Enrollment Architecture",
    category: "Academic ERP",
    x: 506,
    y: 390,
    width: 64,
    height: 48,
    techs: ["Next.js 16", "MariaDB", "AWS S3", "Zod"],
    color: "#60a5fa",
    iconName: "GraduationCap",
  },
  {
    id: "station-master",
    projectIndex: -1,
    name: "Projects Showcase Master Codex",
    shortTitle: "Projects Archive",
    tagline: "Inspect All Production Repositories",
    category: "Master Terminal",
    x: 318,
    y: 275,
    width: 64,
    height: 48,
    techs: ["Next.js", "Docker", "React", "TypeScript"],
    color: "#fbbf24",
    iconName: "Layers",
  },
];

export const CONTROLS_GUIDE = [
  { key: "W / ↑", label: "Walk Up" },
  { key: "S / ↓", label: "Walk Down" },
  { key: "A / ←", label: "Walk Left" },
  { key: "D / →", label: "Walk Right" },
  { key: "Click / Tap", label: "Walk to Location" },
  { key: "Space / E", label: "Interact / Enter Building" },
  { key: "C", label: "Change Character Skin" },
  { key: "Shift / [B]", label: "Sprint / Run" },
  { key: "Esc", label: "Close Menu / Back" },
];
