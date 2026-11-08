/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Artwork {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  imageUrl: string;
  storagePath?: string;
  imagekitFileId?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isPublished: boolean;
  imageWidth: number;
  imageHeight: number;
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-animals',
    name: 'Animals',
    description: 'Cute, friendly animals and pets to color.',
    icon: '🐾',
    sortOrder: 1,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-flowers',
    name: 'Flowers',
    description: 'Blossoming flowers, pretty petals, and garden blooms.',
    icon: '🌸',
    sortOrder: 2,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-nature',
    name: 'Nature',
    description: 'Mountains, trees, sunny skies, and dinosaurs.',
    icon: '🌿',
    sortOrder: 3,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-vehicles',
    name: 'Road & Vehicles',
    description: 'Rockets, cars, trains, and speedy wheels.',
    icon: '🚀',
    sortOrder: 4,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-houses',
    name: 'Houses',
    description: 'Cozy cottages, fairy mushroom homes, and castles.',
    icon: '🏡',
    sortOrder: 5,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-birds',
    name: 'Birds',
    description: 'Chirping chicks, majestic owls, and flying friends.',
    icon: '🐦',
    sortOrder: 6,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-fruits',
    name: 'Fruits',
    description: 'Delicious apples, strawberries, and sweet bananas.',
    icon: '🍓',
    sortOrder: 7,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-sea',
    name: 'Sea Animals',
    description: 'Dolphins, starfish, friendly whales, and ocean fish.',
    icon: '🐬',
    sortOrder: 8,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

// Helper to encode SVG into crisp base64 data URI
function svgToDataUrl(svgString: string): string {
  const cleanSvg = svgString.trim().replace(/\n\s*/g, '');
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;
}

// 1. Happy Little Elephant
const SVG_ELEPHANT = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="#ffffff" />
  <!-- Hat -->
  <path d="M370 210 Q400 150 430 210 Z" fill="#ffffff" stroke="#000000" stroke-width="8" stroke-linejoin="round" />
  <circle cx="400" cy="150" r="14" fill="#ffffff" stroke="#000000" stroke-width="8" />
  <!-- Elephant Body -->
  <ellipse cx="400" cy="520" rx="190" ry="160" fill="#ffffff" stroke="#000000" stroke-width="8" />
  <!-- Back / Left Leg -->
  <rect x="270" y="580" width="70" height="130" rx="25" fill="#ffffff" stroke="#000000" stroke-width="8" />
  <!-- Front Left Leg -->
  <rect x="360" y="590" width="70" height="120" rx="25" fill="#ffffff" stroke="#000000" stroke-width="8" />
  <!-- Front Right Leg -->
  <rect x="450" y="590" width="70" height="120" rx="25" fill="#ffffff" stroke="#000000" stroke-width="8" />
  <!-- Toenails -->
  <ellipse cx="285" cy="695" rx="10" ry="8" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <ellipse cx="305" cy="695" rx="10" ry="8" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <ellipse cx="325" cy="695" rx="10" ry="8" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <ellipse cx="375" cy="695" rx="10" ry="8" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <ellipse cx="395" cy="695" rx="10" ry="8" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <ellipse cx="415" cy="695" rx="10" ry="8" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <ellipse cx="465" cy="695" rx="10" ry="8" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <ellipse cx="485" cy="695" rx="10" ry="8" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <ellipse cx="505" cy="695" rx="10" ry="8" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <!-- Large Left Ear -->
  <path d="M300 280 C180 230 160 410 280 440 Z" fill="#ffffff" stroke="#000000" stroke-width="8" stroke-linejoin="round" />
  <path d="M280 310 C210 280 200 380 270 410 Z" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <!-- Large Right Ear -->
  <path d="M500 280 C620 230 640 410 520 440 Z" fill="#ffffff" stroke="#000000" stroke-width="8" stroke-linejoin="round" />
  <path d="M520 310 C590 280 600 380 530 410 Z" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <!-- Elephant Head -->
  <circle cx="400" cy="340" r="130" fill="#ffffff" stroke="#000000" stroke-width="8" />
  <!-- Big Eyes -->
  <ellipse cx="355" cy="320" rx="20" ry="26" fill="#ffffff" stroke="#000000" stroke-width="7" />
  <ellipse cx="445" cy="320" rx="20" ry="26" fill="#ffffff" stroke="#000000" stroke-width="7" />
  <circle cx="360" cy="320" r="10" fill="#000000" />
  <circle cx="450" cy="320" r="10" fill="#000000" />
  <!-- Cheeks -->
  <ellipse cx="320" cy="360" rx="16" ry="10" fill="#ffffff" stroke="#000000" stroke-width="5" />
  <ellipse cx="480" cy="360" rx="16" ry="10" fill="#ffffff" stroke="#000000" stroke-width="5" />
  <!-- Trunk -->
  <path d="M380 390 C360 460 350 490 390 510 C420 520 430 470 420 390 Z" fill="#ffffff" stroke="#000000" stroke-width="8" stroke-linejoin="round" />
  <!-- Trunk Wrinkles -->
  <path d="M375 430 Q395 440 415 430" fill="none" stroke="#000000" stroke-width="6" />
  <path d="M370 465 Q390 475 410 465" fill="none" stroke="#000000" stroke-width="6" />
  <!-- Little Tail -->
  <path d="M580 500 Q620 510 630 550" fill="none" stroke="#000000" stroke-width="8" stroke-linecap="round" />
  <circle cx="632" cy="552" r="10" fill="#ffffff" stroke="#000000" stroke-width="6" />
</svg>
`;

// 2. Playful Kitten
const SVG_KITTEN = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="#ffffff" />
  <!-- Kitten Body -->
  <ellipse cx="380" cy="530" rx="160" ry="170" fill="#ffffff" stroke="#000000" stroke-width="8" />
  <!-- Ears -->
  <polygon points="270,250 320,130 380,220" fill="#ffffff" stroke="#000000" stroke-width="8" stroke-linejoin="round" />
  <polygon points="285,240 320,160 365,220" fill="#ffffff" stroke="#000000" stroke-width="6" stroke-linejoin="round" />
  <polygon points="430,220 490,130 540,250" fill="#ffffff" stroke="#000000" stroke-width="8" stroke-linejoin="round" />
  <polygon points="445,220 490,160 525,240" fill="#ffffff" stroke="#000000" stroke-width="6" stroke-linejoin="round" />
  <!-- Head -->
  <circle cx="400" cy="320" r="140" fill="#ffffff" stroke="#000000" stroke-width="8" />
  <!-- Big Anime Eyes -->
  <ellipse cx="340" cy="300" rx="24" ry="32" fill="#ffffff" stroke="#000000" stroke-width="7" />
  <ellipse cx="460" cy="300" rx="24" ry="32" fill="#ffffff" stroke="#000000" stroke-width="7" />
  <circle cx="344" cy="302" r="14" fill="#000000" />
  <circle cx="464" cy="302" r="14" fill="#000000" />
  <circle cx="338" cy="292" r="5" fill="#ffffff" />
  <circle cx="458" cy="292" r="5" fill="#ffffff" />
  <!-- Nose and Mouth -->
  <polygon points="390,340 410,340 400,352" fill="#ffffff" stroke="#000000" stroke-width="6" stroke-linejoin="round" />
  <path d="M400 352 Q385 375 370 365" fill="none" stroke="#000000" stroke-width="6" stroke-linecap="round" />
  <path d="M400 352 Q415 375 430 365" fill="none" stroke="#000000" stroke-width="6" stroke-linecap="round" />
  <!-- Whiskers -->
  <path d="M310 340 L220 330" fill="none" stroke="#000000" stroke-width="6" stroke-linecap="round" />
  <path d="M310 360 L210 370" fill="none" stroke="#000000" stroke-width="6" stroke-linecap="round" />
  <path d="M490 340 L580 330" fill="none" stroke="#000000" stroke-width="6" stroke-linecap="round" />
  <path d="M490 360 L590 370" fill="none" stroke="#000000" stroke-width="6" stroke-linecap="round" />
  <!-- Paws -->
  <ellipse cx="320" cy="670" rx="45" ry="35" fill="#ffffff" stroke="#000000" stroke-width="8" />
  <ellipse cx="440" cy="670" rx="45" ry="35" fill="#ffffff" stroke="#000000" stroke-width="8" />
  <!-- Ball of Yarn -->
  <circle cx="580" cy="620" r="70" fill="#ffffff" stroke="#000000" stroke-width="8" />
  <path d="M530 600 Q580 560 630 610" fill="none" stroke="#000000" stroke-width="6" />
  <path d="M540 640 Q590 670 625 615" fill="none" stroke="#000000" stroke-width="6" />
  <path d="M580 620 Q560 580 605 570" fill="none" stroke="#000000" stroke-width="6" />
  <path d="M520 650 Q490 690 460 680" fill="none" stroke="#000000" stroke-width="6" stroke-linecap="round" />
  <!-- Curled Tail -->
  <path d="M230 560 C170 540 160 430 220 420 C240 415 250 435 235 445 C195 470 200 530 245 540" fill="#ffffff" stroke="#000000" stroke-width="8" stroke-linejoin="round" />
</svg>
`;

// 3. Sunflower Garden & Butterflies
const SVG_SUNFLOWER = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="#ffffff" />
  <!-- Sun in sky -->
  <circle cx="150" cy="150" r="60" fill="#ffffff" stroke="#000000" stroke-width="8" />
  <path d="M150 60 L150 20" fill="none" stroke="#000000" stroke-width="7" stroke-linecap="round" />
  <path d="M150 240 L150 280" fill="none" stroke="#000000" stroke-width="7" stroke-linecap="round" />
  <path d="M60 150 L20 150" fill="none" stroke="#000000" stroke-width="7" stroke-linecap="round" />
  <path d="M240 150 L280 150" fill="none" stroke="#000000" stroke-width="7" stroke-linecap="round" />
  <path d="M85 85 L55 55" fill="none" stroke="#000000" stroke-width="7" stroke-linecap="round" />
  <path d="M215 215 L245 245" fill="none" stroke="#000000" stroke-width="7" stroke-linecap="round" />
  <path d="M85 215 L55 245" fill="none" stroke="#000000" stroke-width="7" stroke-linecap="round" />
  <path d="M215 85 L245 55" fill="none" stroke="#000000" stroke-width="7" stroke-linecap="round" />
  <!-- Stem -->
  <path d="M400 480 Q400 600 390 730" fill="none" stroke="#000000" stroke-width="12" stroke-linecap="round" />
  <!-- Leaves -->
  <path d="M395 560 Q300 520 280 600 Q360 620 395 580 Z" fill="#ffffff" stroke="#000000" stroke-width="8" stroke-linejoin="round" />
  <path d="M300 565 Q350 580 390 575" fill="none" stroke="#000000" stroke-width="5" />
  <path d="M400 620 Q500 580 520 660 Q440 680 400 640 Z" fill="#ffffff" stroke="#000000" stroke-width="8" stroke-linejoin="round" />
  <!-- Flower Petals -->
  <ellipse cx="400" cy="220" rx="35" ry="70" fill="#ffffff" stroke="#000000" stroke-width="7" />
  <ellipse cx="400" cy="500" rx="35" ry="70" fill="#ffffff" stroke="#000000" stroke-width="7" />
  <ellipse cx="260" cy="360" rx="70" ry="35" fill="#ffffff" stroke="#000000" stroke-width="7" />
  <ellipse cx="540" cy="360" rx="70" ry="35" fill="#ffffff" stroke="#000000" stroke-width="7" />
  <g transform="rotate(45 400 360)">
    <ellipse cx="400" cy="220" rx="35" ry="70" fill="#ffffff" stroke="#000000" stroke-width="7" />
    <ellipse cx="400" cy="500" rx="35" ry="70" fill="#ffffff" stroke="#000000" stroke-width="7" />
    <ellipse cx="260" cy="360" rx="70" ry="35" fill="#ffffff" stroke="#000000" stroke-width="7" />
    <ellipse cx="540" cy="360" rx="70" ry="35" fill="#ffffff" stroke="#000000" stroke-width="7" />
  </g>
  <!-- Center Face -->
  <circle cx="400" cy="360" r="100" fill="#ffffff" stroke="#000000" stroke-width="9" />
  <ellipse cx="365" cy="345" rx="14" ry="18" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <ellipse cx="435" cy="345" rx="14" ry="18" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <circle cx="368" cy="347" r="8" fill="#000000" />
  <circle cx="438" cy="347" r="8" fill="#000000" />
  <path d="M370 385 Q400 415 430 385" fill="none" stroke="#000000" stroke-width="6" stroke-linecap="round" />
  <!-- Butterfly -->
  <ellipse cx="640" cy="210" rx="8" ry="30" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <path d="M646 195 Q720 140 710 205 Q670 215 646 205 Z" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <path d="M646 215 Q710 230 690 270 Q660 260 644 225 Z" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <path d="M634 195 Q560 140 570 205 Q610 215 634 205 Z" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <path d="M634 215 Q570 230 590 270 Q620 260 636 225 Z" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <!-- Ground Hill -->
  <path d="M0 720 Q400 680 800 720 L800 800 L0 800 Z" fill="#ffffff" stroke="#000000" stroke-width="8" />
</svg>
`;

// 4. Cosmic Rocket
const SVG_ROCKET = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="#ffffff" />
  <!-- Stars -->
  <polygon points="160,180 175,220 215,220 185,245 195,285 160,260 125,285 135,245 105,220 145,220" fill="#ffffff" stroke="#000000" stroke-width="5" />
  <polygon points="660,140 670,165 695,165 675,180 682,205 660,190 638,205 645,180 625,165 650,165" fill="#ffffff" stroke="#000000" stroke-width="5" />
  <!-- Planet Saturn -->
  <ellipse cx="640" cy="620" rx="60" ry="60" fill="#ffffff" stroke="#000000" stroke-width="7" />
  <ellipse cx="640" cy="620" rx="110" ry="25" fill="none" stroke="#000000" stroke-width="7" />
  <!-- Rocket Booster Flame -->
  <path d="M370 630 Q400 740 400 770 Q400 740 430 630 Z" fill="#ffffff" stroke="#000000" stroke-width="8" stroke-linejoin="round" />
  <path d="M385 630 Q400 700 400 720 Q400 700 415 630 Z" fill="#ffffff" stroke="#000000" stroke-width="6" stroke-linejoin="round" />
  <!-- Fins -->
  <path d="M330 480 L230 590 L330 590 Z" fill="#ffffff" stroke="#000000" stroke-width="8" stroke-linejoin="round" />
  <path d="M470 480 L570 590 L470 590 Z" fill="#ffffff" stroke="#000000" stroke-width="8" stroke-linejoin="round" />
  <!-- Rocket Body -->
  <path d="M330 590 L330 330 C330 200 470 200 470 330 L470 590 Z" fill="#ffffff" stroke="#000000" stroke-width="8" stroke-linejoin="round" />
  <!-- Rocket Nosecone -->
  <path d="M330 320 C330 180 470 180 470 320 Z" fill="#ffffff" stroke="#000000" stroke-width="8" />
  <!-- Window Outer -->
  <circle cx="400" cy="380" r="50" fill="#ffffff" stroke="#000000" stroke-width="8" />
  <!-- Window Inner -->
  <circle cx="400" cy="380" r="35" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <!-- Small Window 2 -->
  <circle cx="400" cy="480" r="30" fill="#ffffff" stroke="#000000" stroke-width="7" />
  <!-- Engine Nozzle -->
  <polygon points="360,590 440,590 450,630 350,630" fill="#ffffff" stroke="#000000" stroke-width="8" stroke-linejoin="round" />
  <!-- Crescent Moon -->
  <path d="M150 560 A 60 60 0 1 0 210 620 A 45 45 0 1 1 150 560 Z" fill="#ffffff" stroke="#000000" stroke-width="6" />
</svg>
`;

// 5. Friendly Dinosaur
const SVG_DINO = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="#ffffff" />
  <!-- Back Spikes -->
  <polygon points="280,240 250,190 320,210" fill="#ffffff" stroke="#000000" stroke-width="7" stroke-linejoin="round" />
  <polygon points="340,190 320,130 380,165" fill="#ffffff" stroke="#000000" stroke-width="7" stroke-linejoin="round" />
  <polygon points="410,165 420,110 460,155" fill="#ffffff" stroke="#000000" stroke-width="7" stroke-linejoin="round" />
  <!-- Dinosaur Body & Long Neck -->
  <path d="M220 540 C140 500 80 560 130 620 C220 710 490 700 560 600 C580 570 570 510 520 440 C490 390 480 230 450 160 C420 120 370 120 340 160 C320 180 320 220 360 250 C380 260 410 320 410 410 C360 420 270 450 220 540 Z" fill="#ffffff" stroke="#000000" stroke-width="8" stroke-linejoin="round" />
  <!-- Dinosaur Belly Oval -->
  <ellipse cx="370" cy="560" rx="100" ry="80" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <!-- Eye -->
  <circle cx="370" cy="170" r="14" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <circle cx="372" cy="170" r="7" fill="#000000" />
  <!-- Cute Smile -->
  <path d="M350 210 Q370 225 390 205" fill="none" stroke="#000000" stroke-width="5" stroke-linecap="round" />
  <!-- Front Leg -->
  <rect x="420" y="600" width="60" height="90" rx="20" fill="#ffffff" stroke="#000000" stroke-width="8" />
  <!-- Back Leg -->
  <rect x="270" y="590" width="65" height="100" rx="20" fill="#ffffff" stroke="#000000" stroke-width="8" />
  <!-- Spots on Dino -->
  <circle cx="440" cy="490" r="16" fill="#ffffff" stroke="#000000" stroke-width="5" />
  <circle cx="320" cy="500" r="14" fill="#ffffff" stroke="#000000" stroke-width="5" />
  <circle cx="380" cy="470" r="20" fill="#ffffff" stroke="#000000" stroke-width="5" />
  <!-- Palm Tree in background -->
  <path d="M680 700 Q660 550 670 420" fill="none" stroke="#000000" stroke-width="12" />
  <path d="M670 420 Q610 360 570 400" fill="none" stroke="#000000" stroke-width="8" stroke-linecap="round" />
  <path d="M670 420 Q720 340 760 380" fill="none" stroke="#000000" stroke-width="8" stroke-linecap="round" />
  <path d="M670 420 Q690 320 670 290" fill="none" stroke="#000000" stroke-width="8" stroke-linecap="round" />
  <!-- Ground -->
  <path d="M0 690 Q400 660 800 690 L800 800 L0 800 Z" fill="#ffffff" stroke="#000000" stroke-width="8" />
</svg>
`;

// 6. Cozy Mushroom Cottage
const SVG_COTTAGE = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="#ffffff" />
  <!-- Chimney -->
  <rect x="280" y="160" width="50" height="120" fill="#ffffff" stroke="#000000" stroke-width="8" />
  <ellipse cx="305" cy="160" rx="28" ry="12" fill="#ffffff" stroke="#000000" stroke-width="7" />
  <path d="M305 130 Q330 100 310 70 Q340 40 320 20" fill="none" stroke="#000000" stroke-width="6" stroke-linecap="round" />
  <!-- Mushroom Cap / Roof -->
  <path d="M160 380 C160 170 640 170 640 380 Z" fill="#ffffff" stroke="#000000" stroke-width="9" stroke-linejoin="round" />
  <!-- Roof Spots -->
  <circle cx="280" cy="270" r="35" fill="#ffffff" stroke="#000000" stroke-width="7" />
  <circle cx="410" cy="230" r="45" fill="#ffffff" stroke="#000000" stroke-width="7" />
  <circle cx="530" cy="290" r="35" fill="#ffffff" stroke="#000000" stroke-width="7" />
  <circle cx="360" cy="330" r="25" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <!-- Mushroom Stem / House Wall -->
  <path d="M250 380 L230 680 L570 680 L550 380 Z" fill="#ffffff" stroke="#000000" stroke-width="8" stroke-linejoin="round" />
  <!-- Arched Wooden Door -->
  <path d="M350 680 L350 540 A 50 50 0 0 1 450 540 L450 680 Z" fill="#ffffff" stroke="#000000" stroke-width="8" />
  <circle cx="430" cy="600" r="8" fill="#ffffff" stroke="#000000" stroke-width="5" />
  <!-- Round Window Left -->
  <circle cx="290" cy="460" r="35" fill="#ffffff" stroke="#000000" stroke-width="7" />
  <line x1="255" y1="460" x2="325" y2="460" stroke="#000000" stroke-width="5" />
  <line x1="290" y1="425" x2="290" y2="495" stroke="#000000" stroke-width="5" />
  <!-- Round Window Right -->
  <circle cx="510" cy="460" r="35" fill="#ffffff" stroke="#000000" stroke-width="7" />
  <line x1="475" y1="460" x2="545" y2="460" stroke="#000000" stroke-width="5" />
  <line x1="510" y1="425" x2="510" y2="495" stroke="#000000" stroke-width="5" />
  <!-- Stepping Stones -->
  <ellipse cx="400" cy="710" rx="40" ry="16" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <ellipse cx="380" cy="745" rx="35" ry="14" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <!-- Grass ground -->
  <path d="M0 680 Q400 650 800 680 L800 800 L0 800 Z" fill="#ffffff" stroke="#000000" stroke-width="8" />
</svg>
`;

// 7. Singing Birds
const SVG_BIRDS = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="#ffffff" />
  <!-- Branch -->
  <path d="M80 520 Q350 490 750 510 L750 540 Q350 520 80 550 Z" fill="#ffffff" stroke="#000000" stroke-width="8" stroke-linejoin="round" />
  <!-- Leaves on branch -->
  <path d="M220 500 Q200 440 260 450 Q260 490 220 500 Z" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <path d="M600 500 Q650 450 670 480 Q640 520 600 500 Z" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <!-- Big Mama Bird Body -->
  <ellipse cx="340" cy="380" rx="110" ry="90" fill="#ffffff" stroke="#000000" stroke-width="8" />
  <!-- Mama Bird Head -->
  <circle cx="430" cy="320" r="65" fill="#ffffff" stroke="#000000" stroke-width="8" />
  <!-- Mama Bird Eye -->
  <circle cx="450" cy="310" r="12" fill="#ffffff" stroke="#000000" stroke-width="5" />
  <circle cx="453" cy="310" r="6" fill="#000000" />
  <!-- Mama Bird Beak -->
  <polygon points="495,310 545,325 495,340" fill="#ffffff" stroke="#000000" stroke-width="6" stroke-linejoin="round" />
  <!-- Mama Bird Wing -->
  <path d="M300 370 C280 430 380 440 380 370 C380 340 330 330 300 370 Z" fill="#ffffff" stroke="#000000" stroke-width="7" />
  <!-- Tail feathers -->
  <polygon points="230,370 170,330 180,380" fill="#ffffff" stroke="#000000" stroke-width="7" stroke-linejoin="round" />
  <!-- Little Chick Body -->
  <ellipse cx="580" cy="440" rx="55" ry="45" fill="#ffffff" stroke="#000000" stroke-width="7" />
  <!-- Little Chick Head -->
  <circle cx="620" cy="410" r="35" fill="#ffffff" stroke="#000000" stroke-width="7" />
  <circle cx="630" cy="405" r="8" fill="#ffffff" stroke="#000000" stroke-width="4" />
  <circle cx="632" cy="405" r="4" fill="#000000" />
  <polygon points="655,405 685,415 655,425" fill="#ffffff" stroke="#000000" stroke-width="5" stroke-linejoin="round" />
  <!-- Musical Notes -->
  <path d="M560 220 L610 200 L610 240 L560 260 Z" fill="#ffffff" stroke="#000000" stroke-width="5" />
  <ellipse cx="550" cy="270" rx="16" ry="12" fill="#ffffff" stroke="#000000" stroke-width="5" />
  <ellipse cx="600" cy="250" rx="16" ry="12" fill="#ffffff" stroke="#000000" stroke-width="5" />
</svg>
`;

// 8. Sweet Fruit Bowl
const SVG_FRUITS = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="#ffffff" />
  <!-- Fruit Bowl -->
  <path d="M220 480 C220 660 580 660 580 480 Z" fill="#ffffff" stroke="#000000" stroke-width="9" stroke-linejoin="round" />
  <ellipse cx="400" cy="480" rx="180" ry="25" fill="#ffffff" stroke="#000000" stroke-width="8" />
  <path d="M340 645 L320 700 L480 700 L460 645 Z" fill="#ffffff" stroke="#000000" stroke-width="8" stroke-linejoin="round" />
  <!-- Big Red Apple -->
  <path d="M300 370 C240 370 240 470 300 480 C340 485 360 480 370 450 C380 480 400 485 440 480 C500 470 500 370 440 370 C410 370 380 390 370 400 C360 390 330 370 300 370 Z" fill="#ffffff" stroke="#000000" stroke-width="8" stroke-linejoin="round" />
  <!-- Apple Stem & Leaf -->
  <path d="M370 400 Q365 330 385 310" fill="none" stroke="#000000" stroke-width="7" stroke-linecap="round" />
  <path d="M375 350 Q420 330 430 360 Q390 370 375 350 Z" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <!-- Banana -->
  <path d="M240 320 C320 340 440 420 460 510 C440 480 340 430 260 420 Z" fill="#ffffff" stroke="#000000" stroke-width="8" stroke-linejoin="round" />
  <!-- Strawberry -->
  <path d="M490 400 C470 410 460 460 500 485 C540 460 530 410 510 400 Z" fill="#ffffff" stroke="#000000" stroke-width="7" stroke-linejoin="round" />
  <circle cx="485" cy="430" r="4" fill="#000000" />
  <circle cx="505" cy="440" r="4" fill="#000000" />
  <circle cx="495" cy="460" r="4" fill="#000000" />
</svg>
`;

// 9. Dolphin & Starfish
const SVG_DOLPHIN = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="#ffffff" />
  <!-- Waves at bottom -->
  <path d="M0 620 Q100 580 200 620 Q300 660 400 620 Q500 580 600 620 Q700 660 800 620 L800 800 L0 800 Z" fill="#ffffff" stroke="#000000" stroke-width="8" />
  <path d="M0 680 Q100 640 200 680 Q300 720 400 680 Q500 640 600 680 Q700 720 800 680" fill="none" stroke="#000000" stroke-width="6" />
  <!-- Dolphin Body -->
  <path d="M200 480 C150 430 180 310 320 230 C450 150 620 220 620 330 C620 380 560 430 460 460 C380 485 270 510 200 480 Z" fill="#ffffff" stroke="#000000" stroke-width="8" stroke-linejoin="round" />
  <!-- Dolphin Snout -->
  <path d="M620 300 C660 305 680 320 670 335 C650 345 610 340 600 330 Z" fill="#ffffff" stroke="#000000" stroke-width="7" stroke-linejoin="round" />
  <!-- Dolphin Belly Patch -->
  <path d="M250 480 C340 450 480 440 560 380 C540 410 470 450 390 465 C320 480 270 485 250 480 Z" fill="#ffffff" stroke="#000000" stroke-width="6" />
  <!-- Dorsal Fin -->
  <path d="M410 210 Q450 130 500 170 Q460 215 440 215 Z" fill="#ffffff" stroke="#000000" stroke-width="7" stroke-linejoin="round" />
  <!-- Pectoral Fin -->
  <path d="M430 380 Q470 450 430 460 Q400 420 420 380 Z" fill="#ffffff" stroke="#000000" stroke-width="7" stroke-linejoin="round" />
  <!-- Fluke / Tail -->
  <path d="M210 475 Q150 430 110 470 Q160 495 190 490 Q150 540 120 570 Q170 535 220 505 Z" fill="#ffffff" stroke="#000000" stroke-width="7" stroke-linejoin="round" />
  <!-- Eye -->
  <circle cx="560" cy="290" r="12" fill="#ffffff" stroke="#000000" stroke-width="5" />
  <circle cx="563" cy="290" r="6" fill="#000000" />
  <!-- Happy Starfish on Wave -->
  <polygon points="180,670 200,695 230,685 215,715 235,740 205,735 185,760 180,730 150,725 175,705" fill="#ffffff" stroke="#000000" stroke-width="6" stroke-linejoin="round" />
  <circle cx="185" cy="715" r="4" fill="#000000" />
  <circle cx="195" cy="715" r="4" fill="#000000" />
  <!-- Bubbles -->
  <circle cx="680" cy="240" r="18" fill="#ffffff" stroke="#000000" stroke-width="5" />
  <circle cx="710" cy="180" r="12" fill="#ffffff" stroke="#000000" stroke-width="5" />
  <circle cx="660" cy="160" r="8" fill="#ffffff" stroke="#000000" stroke-width="4" />
</svg>
`;

export const INITIAL_ARTWORKS: Artwork[] = [
  {
    id: 'art-elephant',
    title: 'Happy Little Elephant',
    description: 'A cheerful cartoon elephant with huge floppy ears and a party hat!',
    categoryId: 'cat-animals',
    imageUrl: svgToDataUrl(SVG_ELEPHANT),
    difficulty: 'easy',
    isPublished: true,
    imageWidth: 800,
    imageHeight: 800,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'art-kitten',
    title: 'Playful Kitten with Yarn',
    description: 'An adorable kitten playing with a warm ball of yarn.',
    categoryId: 'cat-animals',
    imageUrl: svgToDataUrl(SVG_KITTEN),
    difficulty: 'easy',
    isPublished: true,
    imageWidth: 800,
    imageHeight: 800,
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
  {
    id: 'art-sunflower',
    title: 'Sunflower & Butterflies',
    description: 'A smiling sunny flower in the garden with fluttering butterflies.',
    categoryId: 'cat-flowers',
    imageUrl: svgToDataUrl(SVG_SUNFLOWER),
    difficulty: 'medium',
    isPublished: true,
    imageWidth: 800,
    imageHeight: 800,
    createdAt: '2026-01-03T00:00:00Z',
    updatedAt: '2026-01-03T00:00:00Z',
  },
  {
    id: 'art-rocket',
    title: 'Cosmic Space Rocket',
    description: 'Blast off past glittering stars and Saturn into outer space!',
    categoryId: 'cat-vehicles',
    imageUrl: svgToDataUrl(SVG_ROCKET),
    difficulty: 'medium',
    isPublished: true,
    imageWidth: 800,
    imageHeight: 800,
    createdAt: '2026-01-04T00:00:00Z',
    updatedAt: '2026-01-04T00:00:00Z',
  },
  {
    id: 'art-dino',
    title: 'Friendly Jungle Dino',
    description: 'A gentle long-necked dinosaur eating leaves in the prehistoric wild.',
    categoryId: 'cat-nature',
    imageUrl: svgToDataUrl(SVG_DINO),
    difficulty: 'easy',
    isPublished: true,
    imageWidth: 800,
    imageHeight: 800,
    createdAt: '2026-01-05T00:00:00Z',
    updatedAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'art-cottage',
    title: 'Fairy Mushroom Cottage',
    description: 'A magical mushroom house with circular windows and stone path.',
    categoryId: 'cat-houses',
    imageUrl: svgToDataUrl(SVG_COTTAGE),
    difficulty: 'hard',
    isPublished: true,
    imageWidth: 800,
    imageHeight: 800,
    createdAt: '2026-01-06T00:00:00Z',
    updatedAt: '2026-01-06T00:00:00Z',
  },
  {
    id: 'art-birds',
    title: 'Singing Mama & Baby Bird',
    description: 'A mama bird singing cheerful melodies to her baby on a green branch.',
    categoryId: 'cat-birds',
    imageUrl: svgToDataUrl(SVG_BIRDS),
    difficulty: 'medium',
    isPublished: true,
    imageWidth: 800,
    imageHeight: 800,
    createdAt: '2026-01-07T00:00:00Z',
    updatedAt: '2026-01-07T00:00:00Z',
  },
  {
    id: 'art-fruits',
    title: 'Fresh Sweet Fruit Bowl',
    description: 'Crisp apple, sweet banana, and juicy strawberry in a ceramic bowl.',
    categoryId: 'cat-fruits',
    imageUrl: svgToDataUrl(SVG_FRUITS),
    difficulty: 'easy',
    isPublished: true,
    imageWidth: 800,
    imageHeight: 800,
    createdAt: '2026-01-08T00:00:00Z',
    updatedAt: '2026-01-08T00:00:00Z',
  },
  {
    id: 'art-dolphin',
    title: 'Leaping Ocean Dolphin',
    description: 'A happy dolphin jumping over blue sea waves with a friendly starfish.',
    categoryId: 'cat-sea',
    imageUrl: svgToDataUrl(SVG_DOLPHIN),
    difficulty: 'medium',
    isPublished: true,
    imageWidth: 800,
    imageHeight: 800,
    createdAt: '2026-01-09T00:00:00Z',
    updatedAt: '2026-01-09T00:00:00Z',
  },
];
