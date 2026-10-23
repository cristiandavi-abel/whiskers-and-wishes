/**
 * Dados dos mapas, gatinhos, missões e colecionáveis.
 * Tudo aqui é fácil de editar: posições, falas, nomes e recompensas.
 */

export type TopAreaId = 'garden' | 'forest' | 'village';
export type AreaId = TopAreaId | 'trail';
export type CatVariant = 'cream' | 'orange' | 'gray' | 'brown' | 'white' | 'black';

export type PropKind =
  | 'tree-round'
  | 'tree-pine'
  | 'bush'
  | 'rock'
  | 'mushroom-red'
  | 'mushroom-teal'
  | 'flower-pink'
  | 'flower-yellow'
  | 'flower-blue'
  | 'lantern'
  | 'sign'
  | 'fence'
  | 'house-cottage'
  | 'house-tall'
  | 'stall'
  | 'well'
  | 'bench'
  | 'portal';

export type PropDef = {
  kind: PropKind;
  x: number;
  y: number;
  scale?: number;
  solid?: boolean;
  flipX?: boolean;
  tint?: number;
};

export type CatDef = {
  id: string;
  name: string;
  x: number;
  y: number;
  variant: CatVariant;
  lines: string[];
  questId?: string;
  requiresFlag?: string;
};

export type NpcDef = {
  id: string;
  name: string;
  x: number;
  y: number;
  variant: 'bunny' | 'bunny-pink';
  lines: string[];
  requiresFlag?: string;
};

export type StarDef = { id: string; x: number; y: number };

export type ItemDef = {
  id: string;
  label: string;
  x: number;
  y: number;
  texture: string;
  questId: string;
};

export type ExitDef = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  target: AreaId;
  targetSpawn: string;
  label: string;
  requiresQuest?: string;
  requiresFlag?: string;
  lockedText?: string;
};

export type SecretDef = {
  id: string;
  x: number;
  y: number;
  radius: number;
  flag: string;
  requiresQuest?: string;
  rewardStars: number;
  rewardCatId?: string;
  title: string;
  text: string;
  hint?: string;
};

export type InteractableDef = {
  id: string;
  name: string;
  x: number;
  y: number;
  radius?: number;
  lines: string[];
  once?: boolean;
  flag?: string;
  rewardStars?: number;
};

export type QuestDef = {
  id: string;
  title: string;
  giver: string;
  objective: string;
  start: string;
  waiting: string;
  complete: string;
  rewardStars: number;
  itemIds: string[];
  unlockFlag: string;
};

export type AreaDef = {
  id: TopAreaId;
  name: string;
  subtitle: string;
  music: 'garden' | 'forest' | 'village';
  width: number;
  height: number;
  tile: string;
  pathColor: number;
  pathEdge: number;
  pathRects: Array<{ x: number; y: number; w: number; h: number }>;
  clearings: Array<{ x: number; y: number; w: number; h: number }>;
  pond?: { x: number; y: number; rx: number; ry: number };
  spawns: Record<string, { x: number; y: number }>;
  props: PropDef[];
  cats: CatDef[];
  npcs: NpcDef[];
  stars: StarDef[];
  items: ItemDef[];
  exits: ExitDef[];
  secrets: SecretDef[];
  interactables: InteractableDef[];
  introFlag: string;
  introTitle: string;
  introLines: string[];
};

export const QUESTS: Record<string, QuestDef> = {
  mochi_toy: {
    id: 'mochi_toy',
    title: 'O peixinho da Mochi',
    giver: 'Mochi',
    objective: 'Encontre o peixinho de brinquedo perto do lago do jardim.',
    start:
      'Miau! Eu sou a Mochi. Eu estava brincando perto do lago e... meu peixinho de brinquedo desapareceu! Você procura para mim?',
    waiting:
      'Miau... ele é azul, tem uma caudinha e faz "blub" quando a gente aperta. Acho que ele caiu perto da água!',
    complete:
      'MEU PEIXINHO! Miau, muito obrigada! Você é oficialmente meu humano favorito. A Floresta Encantada fica a leste — o caminho já está aberto!',
    rewardStars: 2,
    itemIds: ['peixinho'],
    unlockFlag: 'gate_forest',
  },
  pipoca_lantern: {
    id: 'pipoca_lantern',
    title: 'A lanterna da Pipoca',
    giver: 'Pipoca',
    objective: 'Ache a lanterna da Pipoca entre os cogumelos brilhantes.',
    start:
      'Miau! Você viu uma lanterna dourada? Eu estava caçando vaga-lumes e deixei ela cair perto dos cogumelos grandes. Sem ela eu não consigo ler minhas histórias!',
    waiting:
      'Os cogumelos brilhantes ficam mais para o sul da floresta. A lanterna faz um brilho quentinho, tipo abraço de sol.',
    complete:
      'Minha lanterna! Miau, agora posso terminar o capítulo. A Vila Aconchegante fica a leste, e os habitantes adoram visitas. Vai lá!',
    rewardStars: 2,
    itemIds: ['lanterna'],
    unlockFlag: 'gate_village',
  },
  nuvem_glade: {
    id: 'nuvem_glade',
    title: 'A gatinha escondida',
    giver: 'Nuvem',
    objective: 'Procure Amora no canto sudeste da floresta.',
    start:
      'Miau... uma gatinha chamada Amora se escondeu atrás das árvores do canto sudeste. Ela é tímida. Se encontrar, diga que a vila inteira está esperando por ela.',
    waiting:
      'O canto sudeste tem uma clareira escondida, cheia de luzinhas. Amora adora lugares assim. Siga o brilho entre as árvores.',
    complete:
      'Você encontrou a Amora! Miau, que alívio. Agora ela pode voltar para a vila comigo. Obrigada de verdade — leve estas estrelinhas como agradecimento.',
    rewardStars: 3,
    itemIds: [],
    unlockFlag: 'amora_found',
  },
  biscoito_bells: {
    id: 'biscoito_bells',
    title: 'Os sinos do festival',
    giver: 'Biscoito',
    objective: 'Encontre os 3 sinos dourados espalhados pela vila.',
    start:
      'Miau! O Festival das Estrelas é hoje e eu perdi os três sinos dourados da praça. Sem eles, ninguém sabe quando começar a festa. Pode encontrá-los?',
    waiting:
      'Faltam sinos! Um deve estar perto das casas, outro perto do poço e o último lá no fundo da vila. Eles brilham, então não tem como errar.',
    complete:
      'Os três sinos! Miau, a festa pode começar! A Trilha das Estrelas fica no caminho do nordeste. Se você chegar ao portal, algo muito especial espera por você.',
    rewardStars: 3,
    itemIds: ['sino-1', 'sino-2', 'sino-3'],
    unlockFlag: 'gate_trail',
  },
};

export const ITEM_LABELS: Record<string, string> = {
  peixinho: 'Peixinho de brinquedo',
  lanterna: 'Lanterna dourada',
  'sino-1': 'Sino dourado',
  'sino-2': 'Sino dourado',
  'sino-3': 'Sino dourado',
};

export const CAT_TOTAL = 8;
export const STAR_TRAIL_TOTAL = 10;

const tree = (x: number, y: number, scale = 1, kind: PropKind = 'tree-round'): PropDef => ({
  kind,
  x,
  y,
  scale,
  solid: true,
});
const flower = (x: number, y: number, kind: PropKind = 'flower-pink', scale = 1): PropDef => ({ kind, x, y, scale });

const garden: AreaDef = {
  id: 'garden',
  name: 'Jardim dos Gatinhos',
  subtitle: 'onde tudo começa',
  music: 'garden',
  width: 1800,
  height: 1100,
  tile: 'tile-grass',
  pathColor: 0xd9bd8c,
  pathEdge: 0xc7a877,
  pathRects: [
    { x: 0, y: 540, w: 1800, h: 96 },
    { x: 430, y: 0, w: 104, h: 1100 },
    { x: 1180, y: 330, w: 90, h: 240 },
  ],
  clearings: [
    { x: 940, y: 610, w: 470, h: 300 },
    { x: 1440, y: 460, w: 380, h: 250 },
  ],
  pond: { x: 1470, y: 318, rx: 195, ry: 112 },
  spawns: {
    default: { x: 285, y: 720 },
    fromForest: { x: 1640, y: 575 },
  },
  props: [
    { kind: 'house-cottage', x: 1050, y: 292, solid: true },
    tree(90, 90), tree(300, 75), tree(620, 95, 1.1), tree(1520, 80), tree(1710, 130, 0.9),
    tree(70, 340), tree(85, 720, 1.15), tree(70, 990), tree(1715, 720, 1.05), tree(1735, 930),
    tree(720, 820), tree(810, 920, 0.9), tree(1250, 920), tree(360, 300, 0.9), tree(560, 330, 1.05),
    tree(1550, 780, 0.95), tree(1640, 980, 1.1),
    flower(150, 180), flower(210, 240, 'flower-yellow'), flower(320, 200, 'flower-blue'),
    flower(540, 720), flower(600, 780, 'flower-yellow'), flower(660, 700, 'flower-blue'),
    flower(880, 410), flower(940, 450, 'flower-yellow'), flower(1010, 400, 'flower-blue'),
    flower(1120, 620), flower(1180, 660, 'flower-yellow'), flower(1240, 610, 'flower-blue'),
    flower(1330, 940), flower(1420, 980, 'flower-yellow'), flower(1510, 920, 'flower-blue'),
    { kind: 'bench', x: 930, y: 760, solid: true },
    { kind: 'rock', x: 1620, y: 900 },
    { kind: 'bush', x: 500, y: 470, solid: true },
    { kind: 'bush', x: 1150, y: 850, solid: true },
    { kind: 'sign', x: 500, y: 662, solid: true },
    { kind: 'lantern', x: 400, y: 450 },
    { kind: 'lantern', x: 400, y: 780 },
    { kind: 'lantern', x: 1010, y: 480 },
    { kind: 'lantern', x: 1260, y: 700 },
    { kind: 'fence', x: 880, y: 380, solid: true },
    { kind: 'fence', x: 1130, y: 380, solid: true },
  ],
  cats: [
    {
      id: 'mochi',
      name: 'Mochi',
      x: 640,
      y: 665,
      variant: 'cream',
      questId: 'mochi_toy',
      lines: [
        'Miau! Você tem cara de quem sabe fazer carinho atrás das orelhas.',
        'Eu sou a Mochi. Especialista em sonecas, peixinhos de brinquedo e fingir que não derrubei nada.',
      ],
    },
    {
      id: 'tofu',
      name: 'Tofu',
      x: 980,
      y: 515,
      variant: 'gray',
      lines: [
        'Miau. Eu estava meditando sobre a gravidade. Conclusão: ela é muito forte e eu sou muito fofo.',
        'Dizem que existe um brilho escondido no canto nordeste do jardim. Eu não fui ver porque estava confortável.',
      ],
    },
    {
      id: 'pudim',
      name: 'Pudim',
      x: 1320,
      y: 850,
      variant: 'orange',
      lines: [
        'Miau! Se você encontrar três estrelinhas, pode pedir um desejo. Pelo menos foi o que o vento me contou.',
        'Eu pediria um pote de atum do tamanho de uma casa. Ou uma casa de atum. Ainda estou decidindo.',
      ],
    },
  ],
  npcs: [],
  stars: [
    { id: 'garden-1', x: 300, y: 420 },
    { id: 'garden-2', x: 760, y: 760 },
    { id: 'garden-3', x: 1210, y: 570 },
    { id: 'garden-4', x: 1640, y: 830 },
    { id: 'garden-5', x: 860, y: 160 },
  ],
  items: [
    { id: 'peixinho', label: 'Peixinho de brinquedo', x: 1330, y: 470, texture: 'fish-toy', questId: 'mochi_toy' },
  ],
  exits: [
    {
      id: 'to-forest',
      x: 1750,
      y: 540,
      width: 50,
      height: 190,
      target: 'forest',
      targetSpawn: 'fromGarden',
      label: 'Floresta Encantada',
      requiresQuest: 'mochi_toy',
      lockedText:
        'A trilha está coberta por uma névoa mágica. Talvez alguém no jardim saiba como abrir o caminho... A Mochi parecia preocupada.',
    },
  ],
  secrets: [
    {
      id: 'garden-secret',
      x: 1680,
      y: 170,
      radius: 52,
      flag: 'secret_garden',
      rewardStars: 1,
      title: 'Segredo do jardim',
      text: 'Atrás das árvores, um cantinho secreto brilha com poeira de estrela. Você encontrou uma estrelinha escondida!',
    },
  ],
  interactables: [
    {
      id: 'garden-sign',
      name: 'Placa antiga',
      x: 500,
      y: 650,
      radius: 60,
      lines: [
        '"Floresta Encantada, a leste. Cuidado com os cogumelos que espirram."',
        'Alguém desenhou um gatinho embaixo. Muito fofo. Provavelmente a Mochi.',
      ],
    },
  ],
  introFlag: 'intro_garden',
  introTitle: 'Jardim dos Gatinhos',
  introLines: [
    'Cristian chega a um pequeno mundo onde as flores parecem sussurrar e o ar cheira a chuva de verão.',
    'Uma placa diz: "Para encontrar o que procura, ajude quem precisa. As estrelas lembram o caminho."',
    'Talvez os gatinhos daqui saibam de alguma coisa.',
  ],
};

const forest: AreaDef = {
  id: 'forest',
  name: 'Floresta Encantada',
  subtitle: 'luzinhas entre os cogumelos',
  music: 'forest',
  width: 1900,
  height: 1200,
  tile: 'tile-forest',
  pathColor: 0xb79a6d,
  pathEdge: 0x9b8058,
  pathRects: [
    { x: -10, y: 545, w: 1000, h: 92 },
    { x: 760, y: 260, w: 96, h: 760 },
    { x: 1150, y: 545, w: 760, h: 92 },
  ],
  clearings: [
    { x: 1020, y: 660, w: 500, h: 330 },
    { x: 1620, y: 1010, w: 330, h: 250 },
    { x: 500, y: 950, w: 360, h: 240 },
  ],
  spawns: {
    default: { x: 140, y: 650 },
    fromGarden: { x: 140, y: 650 },
    fromVillage: { x: 1770, y: 650 },
  },
  props: [
    tree(80, 120, 1.1, 'tree-pine'), tree(230, 90, 1, 'tree-pine'), tree(400, 110), tree(580, 80, 1.1, 'tree-pine'),
    tree(760, 100), tree(940, 90, 1.15, 'tree-pine'), tree(1120, 120), tree(1320, 90, 1.05, 'tree-pine'),
    tree(1500, 110), tree(1700, 100, 1.1, 'tree-pine'), tree(1840, 190, 0.95),
    tree(90, 330, 1.05, 'tree-pine'), tree(200, 430), tree(70, 860, 1.15, 'tree-pine'), tree(160, 1010),
    tree(330, 360), tree(470, 250, 0.95), tree(650, 320, 1.05, 'tree-pine'), tree(1000, 300, 1.1),
    tree(1220, 260), tree(1400, 330, 0.95, 'tree-pine'), tree(1600, 300, 1.05), tree(1800, 420, 0.9),
    tree(1780, 760, 1.1, 'tree-pine'), tree(1840, 940, 1), tree(1500, 470, 0.9), tree(300, 1080, 1.1, 'tree-pine'),
    tree(560, 1080, 0.95), tree(1180, 970, 0.9, 'tree-pine'), tree(1300, 1080, 1.05),
    tree(1480, 900, 0.85, 'tree-pine'), tree(1620, 1120, 0.95),
    { kind: 'mushroom-red', x: 780, y: 900, scale: 1.2 },
    { kind: 'mushroom-red', x: 850, y: 950 },
    { kind: 'mushroom-teal', x: 940, y: 905, scale: 1.1 },
    { kind: 'mushroom-teal', x: 1040, y: 990, scale: 1.25 },
    { kind: 'mushroom-red', x: 1150, y: 930 },
    { kind: 'mushroom-teal', x: 1210, y: 1020, scale: 0.9 },
    { kind: 'mushroom-red', x: 430, y: 800 },
    { kind: 'mushroom-teal', x: 350, y: 860, scale: 1.1 },
    { kind: 'rock', x: 700, y: 760 },
    { kind: 'rock', x: 1380, y: 760, scale: 1.2 },
    { kind: 'bush', x: 480, y: 640, solid: true },
    { kind: 'bush', x: 1060, y: 470, solid: true },
    { kind: 'bush', x: 1560, y: 680, solid: true },
    { kind: 'bush', x: 1460, y: 1040, solid: true },
    { kind: 'lantern', x: 700, y: 590 },
    { kind: 'lantern', x: 1080, y: 620 },
    { kind: 'lantern', x: 1500, y: 590 },
    { kind: 'lantern', x: 1660, y: 970 },
    { kind: 'sign', x: 300, y: 660, solid: true },
    flower(250, 760, 'flower-blue'), flower(310, 720, 'flower-pink'), flower(900, 430, 'flower-blue'),
    flower(980, 460, 'flower-yellow'), flower(1420, 860, 'flower-blue'), flower(1550, 820, 'flower-pink'),
    flower(620, 1010, 'flower-yellow'), flower(1120, 800, 'flower-blue'),
  ],
  cats: [
    {
      id: 'pipoca',
      name: 'Pipoca',
      x: 520,
      y: 610,
      variant: 'orange',
      questId: 'pipoca_lantern',
      lines: [
        'Miau! Cuidado onde pisa: alguns cogumelos aqui espirram purpurina se você contar uma piada ruim.',
        'Eu estava lendo uma história de aventura. Já leu alguma? Eu leio principalmente as figuras.',
      ],
    },
    {
      id: 'nuvem',
      name: 'Nuvem',
      x: 1380,
      y: 480,
      variant: 'gray',
      questId: 'nuvem_glade',
      lines: [
        'Miau. A floresta fica mais quieta quando alguém está triste. Ultimamente ela está muito quieta.',
        'Você tem passos gentis. Isso ajuda os animais a confiarem em você.',
      ],
    },
  ],
  npcs: [],
  stars: [
    { id: 'forest-1', x: 280, y: 790 },
    { id: 'forest-2', x: 700, y: 420 },
    { id: 'forest-3', x: 1060, y: 720 },
    { id: 'forest-4', x: 1560, y: 860 },
    { id: 'forest-5', x: 1710, y: 520 },
    { id: 'forest-6', x: 1150, y: 320 },
  ],
  items: [
    {
      id: 'lanterna',
      label: 'Lanterna dourada',
      x: 1080,
      y: 1010,
      texture: 'lantern-item',
      questId: 'pipoca_lantern',
    },
  ],
  exits: [
    {
      id: 'to-garden',
      x: -20,
      y: 540,
      width: 50,
      height: 190,
      target: 'garden',
      targetSpawn: 'fromForest',
      label: 'Jardim dos Gatinhos',
    },
    {
      id: 'to-village',
      x: 1860,
      y: 540,
      width: 50,
      height: 200,
      target: 'village',
      targetSpawn: 'fromForest',
      label: 'Vila Aconchegante',
      requiresQuest: 'pipoca_lantern',
      lockedText:
        'O caminho para a vila está tomado por raízes mágicas. A Pipoca disse que conhece um jeito de abrir passagem...',
    },
  ],
  secrets: [
    {
      id: 'forest-glade',
      x: 1720,
      y: 1000,
      radius: 58,
      flag: 'forest_glade_found',
      requiresQuest: 'nuvem_glade',
      rewardStars: 3,
      rewardCatId: 'amora',
      title: 'Clareira escondida',
      text:
        'Entre as árvores, uma clareira cheia de vagalumes. Uma gatinha pequena levanta a cabeça: "Miau... a Nuvem mandou você?" Amora encontrou um lar de novo.',
      hint: 'A clareira parece mais brilhante quando alguém está procurando por ela.',
    },
  ],
  interactables: [
    {
      id: 'forest-stone',
      name: 'Pedra coberta de musgo',
      x: 900,
      y: 300,
      radius: 65,
      lines: [
        'A pedra tem marcas antigas. Você consegue ler: "Quem caminha devagar vê mais estrelas."',
        'Um pequeno cogumelo cresceu no formato de um coração. A floresta tem senso de humor.',
      ],
    },
  ],
  introFlag: 'intro_forest',
  introTitle: 'Floresta Encantada',
  introLines: [
    'A luz do sol atravessa as folhas em feixes dourados. Vaga-lumes dançam como pequenas constelações.',
    'Em algum lugar entre os cogumelos, alguém está esperando por ajuda.',
  ],
};

const village: AreaDef = {
  id: 'village',
  name: 'Vila Aconchegante',
  subtitle: 'casinhas, sinos e cheiro de pão',
  music: 'village',
  width: 2200,
  height: 1300,
  tile: 'tile-village',
  pathColor: 0xd6c6a4,
  pathEdge: 0xc1ad87,
  pathRects: [
    { x: -10, y: 610, w: 2220, h: 120 },
    { x: 980, y: 600, w: 130, h: 700 },
    { x: 1940, y: 200, w: 96, h: 470 },
  ],
  clearings: [
    { x: 1110, y: 660, w: 560, h: 330 },
    { x: 430, y: 430, w: 360, h: 260 },
  ],
  spawns: {
    default: { x: 160, y: 700 },
    fromForest: { x: 150, y: 700 },
    fromTrail: { x: 1990, y: 320 },
  },
  props: [
    { kind: 'house-cottage', x: 430, y: 360, solid: true },
    { kind: 'house-tall', x: 820, y: 330, solid: true },
    { kind: 'house-cottage', x: 1340, y: 370, solid: true, flipX: true },
    { kind: 'house-tall', x: 1760, y: 340, solid: true, flipX: true },
    { kind: 'house-cottage', x: 2050, y: 760, solid: true, scale: 0.9 },
    { kind: 'stall', x: 1510, y: 690, solid: true },
    { kind: 'well', x: 1120, y: 790, solid: true },
    { kind: 'bench', x: 900, y: 750, solid: true },
    { kind: 'bench', x: 1270, y: 880, solid: true },
    { kind: 'sign', x: 350, y: 720, solid: true },
    tree(90, 190), tree(220, 120), tree(620, 130, 0.95), tree(1050, 120), tree(1550, 120), tree(2000, 160),
    tree(120, 980), tree(240, 1120), tree(560, 1050), tree(900, 1150), tree(1450, 1100), tree(1850, 1150),
    tree(2130, 1050), tree(420, 900, 0.9), tree(1620, 980), tree(1870, 900, 0.9),
    { kind: 'bush', x: 300, y: 520, solid: true },
    { kind: 'bush', x: 660, y: 520, solid: true },
    { kind: 'bush', x: 1000, y: 520, solid: true },
    { kind: 'bush', x: 1500, y: 540, solid: true },
    { kind: 'bush', x: 1900, y: 560, solid: true },
    { kind: 'bush', x: 2050, y: 900, solid: true },
    { kind: 'rock', x: 700, y: 950, scale: 0.9 },
    { kind: 'rock', x: 1750, y: 820, scale: 0.8 },
    { kind: 'lantern', x: 600, y: 680 },
    { kind: 'lantern', x: 980, y: 670 },
    { kind: 'lantern', x: 1300, y: 680 },
    { kind: 'lantern', x: 1700, y: 690 },
    { kind: 'lantern', x: 2000, y: 540 },
    { kind: 'lantern', x: 1980, y: 250 },
    { kind: 'fence', x: 520, y: 480, solid: true },
    { kind: 'fence', x: 700, y: 470, solid: true },
    { kind: 'fence', x: 1240, y: 500, solid: true },
    { kind: 'fence', x: 1420, y: 520, solid: true },
    flower(540, 600, 'flower-yellow'), flower(580, 630, 'flower-pink'), flower(700, 620, 'flower-blue'),
    flower(950, 930, 'flower-pink'), flower(1010, 960, 'flower-yellow'), flower(1230, 990, 'flower-blue'),
    flower(1390, 630, 'flower-pink'), flower(1620, 860, 'flower-yellow'), flower(1770, 880, 'flower-blue'),
    flower(1850, 700, 'flower-pink'), flower(360, 980, 'flower-blue'),
  ],
  cats: [
    {
      id: 'biscoito',
      name: 'Biscoito',
      x: 720,
      y: 780,
      variant: 'brown',
      questId: 'biscoito_bells',
      lines: [
        'Miau! Bem-vindo à Vila Aconchegante! Cuidado para não tropeçar em um gatinho. Ou em três.',
        'Eu organizo o Festival das Estrelas todo ano. Sou ótimo com festas e péssimo com organização.',
      ],
    },
    {
      id: 'canela',
      name: 'Canela',
      x: 1460,
      y: 560,
      variant: 'white',
      lines: [
        'Miau. Eu vi você chegar. Tenho poderes. Ou talvez eu estivesse na janela. Nunca saberemos.',
        'O poço dos desejos fica no centro da praça. Dizem que ele gosta de ouvir segredos. Eu gosto de ouvir fofocas.',
      ],
    },
    {
      id: 'amora',
      name: 'Amora',
      x: 1260,
      y: 720,
      variant: 'black',
      requiresFlag: 'amora_found',
      lines: [
        'Miau... você é o humano que me encontrou na floresta! Obrigada. A Nuvem disse que eu podia ficar aqui.',
        'A vila é barulhenta, mas do jeito bom. Tem pão quentinho, sinos e um lugar no sol para dormir.',
      ],
    },
  ],
  npcs: [
    {
      id: 'vovo',
      name: 'Vovó Margarida',
      x: 1680,
      y: 800,
      variant: 'bunny-pink',
      lines: [
        'Ora, ora! Um viajante com poeira de estrela nos sapatos. Sente-se, meu bem. Já tomou chá de camomila?',
        'Todo mundo que passa por aqui está procurando alguma coisa. Os mais sortudos descobrem que já tinham o que precisavam.',
      ],
    },
    {
      id: 'tico',
      name: 'Tico',
      x: 1010,
      y: 940,
      variant: 'bunny',
      lines: [
        'Oi! Eu estou treinando para ser o coelho mais rápido da vila. Até agora, o vento ganhou todas.',
        'Se você for para a Trilha das Estrelas, cuidado com os cristais. Eles não mordem, mas empurram de volta pro começo. Muito rudimentar.',
      ],
    },
  ],
  stars: [
    { id: 'village-1', x: 300, y: 880 },
    { id: 'village-2', x: 780, y: 480 },
    { id: 'village-3', x: 1250, y: 980 },
    { id: 'village-4', x: 1850, y: 880 },
    { id: 'village-5', x: 2070, y: 330 },
  ],
  items: [
    { id: 'sino-1', label: 'Sino dourado', x: 370, y: 520, texture: 'bell', questId: 'biscoito_bells' },
    { id: 'sino-2', label: 'Sino dourado', x: 1320, y: 1010, texture: 'bell', questId: 'biscoito_bells' },
    { id: 'sino-3', label: 'Sino dourado', x: 1920, y: 470, texture: 'bell', questId: 'biscoito_bells' },
  ],
  exits: [
    {
      id: 'to-forest',
      x: -20,
      y: 600,
      width: 50,
      height: 180,
      target: 'forest',
      targetSpawn: 'fromVillage',
      label: 'Floresta Encantada',
    },
    {
      id: 'to-trail',
      x: 2120,
      y: 210,
      width: 70,
      height: 200,
      target: 'trail',
      targetSpawn: 'fromVillage',
      label: 'Trilha das Estrelas',
      requiresQuest: 'biscoito_bells',
      lockedText:
        'Uma placa aponta para a Trilha das Estrelas, mas o caminho está coberto de sinos silenciosos. O Biscoito deve saber o que fazer.',
    },
  ],
  secrets: [],
  interactables: [
    {
      id: 'wish-well',
      name: 'Poço dos desejos',
      x: 1120,
      y: 740,
      radius: 80,
      once: true,
      flag: 'wish_well',
      rewardStars: 1,
      lines: [
        'Você se debruça no poço. O fundo brilha como se guardasse um pedaço do céu.',
        '"Que a pessoa que eu amo saiba o quanto ela é especial." Você joga uma moedinha. O poço responde com uma estrelinha.',
      ],
    },
    {
      id: 'village-sign',
      name: 'Placa da vila',
      x: 350,
      y: 700,
      radius: 60,
      lines: [
        '"Vila Aconchegante — aqui, todo mundo cabe."',
        'Abaixo, alguém escreveu: "Especialmente gatinhos."',
      ],
    },
  ],
  introFlag: 'intro_village',
  introTitle: 'Vila Aconchegante',
  introLines: [
    'Casinhas de telhado vermelho se aconchegam ao redor de uma praça. O cheiro de pão quentinho paira no ar.',
    'Gatinhos tomam sol nas janelas e coelhos conversam na fila da padaria. Um sino toca ao longe.',
    'A Trilha das Estrelas começa no caminho do nordeste. Mas antes, parece que a vila precisa de ajuda.',
  ],
};

export const AREAS: Record<TopAreaId, AreaDef> = { garden, forest, village };

export const AREA_PROGRESS: Record<TopAreaId, number> = { garden: 1, forest: 2, village: 3 };

export const AREA_NAME_BY_SAVE: Record<string, string> = {
  garden: 'Jardim dos Gatinhos',
  forest: 'Floresta Encantada',
  village: 'Vila Aconchegante',
  trail: 'Trilha das Estrelas',
  special: 'Lugar Especial',
};
