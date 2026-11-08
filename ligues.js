// DONNÉES : championnats, coupes, Europe
const T = (lv, ...g) => g.flatMap((a, i) => a.map(n => ({ n, l: lv[i] })));
const COUPES = { FR: 'Coupe de France', IT: 'Coppa Italia', DE: 'DFB-Pokal', EN: 'FA Cup', ES: 'Copa del Rey', PT: 'Taça de Portugal' };

// Ordre important : chaque division de niveau 1 est suivie de sa division de niveau 2
const D = [
  { id: 'L1', n: 'Ligue 1', c: 'FR', f: '🇫🇷', t: 1, ucl: 4, uel: 2, cl: T([90, 77, 70, 63],
    ['Paris Saint-Germain'], ['Olympique de Marseille', 'Olympique Lyonnais', 'AS Monaco', 'RC Lens', 'LOSC Lille'],
    ['Stade Rennais', 'OGC Nice', 'RC Strasbourg Alsace', 'Toulouse FC', 'Stade Brestois 29'],
    ['Le Havre AC', 'AJ Auxerre', 'Angers SCO', 'FC Lorient', 'Paris FC', 'Le Mans FC', 'ESTAC Troyes']) },
  { id: 'L2', n: 'Ligue 2', c: 'FR', f: '🇫🇷', t: 2, cl: T([62, 56, 52],
    ['AS Saint-Étienne', 'Stade de Reims', 'Montpellier HSC', 'FC Metz', 'FC Nantes'],
    ['Red Star FC', 'AS Nancy-Lorraine', 'FC Annecy', 'FC Sochaux-Montbéliard', 'Dijon FCO', 'USL Dunkerque', 'EA Guingamp'],
    ['Grenoble Foot 38', 'Clermont Foot 63', 'Pau FC', 'Rodez AF', 'US Boulogne CO', 'Stade Lavallois']) },
  { id: 'SA', n: 'Serie A', c: 'IT', f: '🇮🇹', t: 1, ucl: 4, uel: 2, cl: T([86, 80, 74, 66, 60],
    ['Inter Milan'], ['Napoli', 'Juventus', 'AC Milan', 'AS Roma', 'Atalanta'], ['Lazio', 'Bologna', 'Fiorentina', 'Como'],
    ['Torino', 'Udinese', 'Genoa', 'Sassuolo', 'Cagliari', 'Parma', 'Lecce', 'Monza'], ['Venezia', 'Frosinone']) },
  { id: 'SB', n: 'Serie B', c: 'IT', f: '🇮🇹', t: 2, cl: T([58, 54, 50],
    ['Sampdoria', 'Palermo', 'Empoli', 'Salernitana', 'Bari'], ['Spezia', 'Catanzaro', 'Modena', 'Brescia', 'Pescara', 'Cesena'],
    ['Reggiana', 'Südtirol', 'Mantova', 'Juve Stabia', 'Carrarese', 'Cittadella', 'Virtus Entella', 'Venezia', 'Frosinone']) },
  { id: 'BL', n: 'Bundesliga', c: 'DE', f: '🇩🇪', t: 1, ucl: 4, uel: 2, cl: T([91, 82, 72, 65, 58],
    ['FC Bayern München'], ['Bayer 04 Leverkusen', 'Borussia Dortmund', 'RB Leipzig', 'VfB Stuttgart'],
    ['Eintracht Frankfurt', 'SC Freiburg', 'TSG Hoffenheim', 'SV Werder Bremen', 'Borussia Mönchengladbach'],
    ['1. FSV Mainz 05', 'FC Augsburg', '1. FC Union Berlin', '1. FC Köln', 'Hamburger SV', 'FC Schalke 04'], ['SV Elversberg', 'SC Paderborn 07']) },
  { id: 'B2', n: '2. Bundesliga', c: 'DE', f: '🇩🇪', t: 2, cl: T([58, 54, 50],
    ['Hertha BSC', 'Hannover 96', 'Fortuna Düsseldorf', '1. FC Nürnberg', 'SV Darmstadt 98', '1. FC Kaiserslautern'],
    ['Karlsruher SC', 'FC Magdeburg', 'Eintracht Braunschweig', 'VfL Bochum', 'Holstein Kiel', 'Greuther Fürth'],
    ['Hansa Rostock', 'Dynamo Dresden', 'Arminia Bielefeld', '1. FC Saarbrücken', 'MSV Duisburg']) },
  { id: 'PL', n: 'Premier League', c: 'EN', f: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', t: 1, ucl: 4, uel: 2, cl: T([91, 82, 74, 64],
    ['Manchester City', 'Liverpool', 'Arsenal'], ['Chelsea', 'Tottenham Hotspur', 'Manchester United', 'Newcastle United', 'Aston Villa'],
    ['Brighton & Hove Albion', 'Crystal Palace', 'Brentford', 'Fulham', 'AFC Bournemouth', 'Everton', 'Nottingham Forest', 'Leeds United'],
    ['Sunderland', 'Ipswich Town', 'Coventry City', 'Hull City']) },
  { id: 'CH', n: 'Championship', c: 'EN', f: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', t: 2, cl: T([62, 57, 53],
    ['Leicester City', 'Southampton', 'Sheffield United', 'West Bromwich Albion', 'Middlesbrough', 'Norwich City', 'Watford', 'Stoke City'],
    ['Birmingham City', 'Blackburn Rovers', 'Bristol City', 'Derby County', 'Millwall', 'Swansea City', 'Preston North End', 'Queens Park Rangers', 'Portsmouth', 'Wrexham'],
    ['Charlton Athletic', 'Oxford United', 'Sheffield Wednesday', 'Hull City', 'Ipswich Town', 'Coventry City']) },
  { id: 'LL', n: 'La Liga', c: 'ES', f: '🇪🇸', t: 1, ucl: 4, uel: 2, cl: T([92, 85, 76, 69, 62],
    ['Real Madrid', 'FC Barcelona'], ['Atlético de Madrid'], ['Villarreal CF', 'Athletic Club', 'Real Sociedad', 'Real Betis'],
    ['Sevilla FC', 'Valencia CF', 'Celta Vigo', 'CA Osasuna', 'Getafe CF', 'Rayo Vallecano'],
    ['Deportivo Alavés', 'RCD Espanyol', 'Elche CF', 'Levante UD', 'Málaga CF', 'Racing Santander', 'Deportivo La Coruña']) },
  { id: 'HY', n: 'La Liga Hypermotion', c: 'ES', f: '🇪🇸', t: 2, cl: T([63, 57, 52],
    ['Girona FC', 'RCD Mallorca', 'UD Las Palmas', 'UD Almería', 'Real Valladolid', 'CD Leganés'],
    ['Granada CF', 'Cádiz CF', 'Real Oviedo', 'Real Sporting', 'SD Eibar', 'CD Tenerife', 'Córdoba CF'],
    ['CD Castellón', 'Burgos CF', 'Albacete Balompié', 'FC Andorra', 'AD Ceuta FC', 'CD Eldense', 'CE Sabadell', 'Celta Fortuna', 'Real Sociedad B']) },
  { id: 'PT', n: 'Liga Portugal', c: 'PT', f: '🇵🇹', t: 1, ucl: 2, uel: 2, cl: T([84, 74, 64, 57],
    ['Benfica', 'FC Porto', 'Sporting CP'], ['SC Braga'],
    ['Vitória SC', 'FC Famalicão', 'Gil Vicente FC', 'Estoril Praia', 'Moreirense FC', 'CD Santa Clara'],
    ['Rio Ave FC', 'Casa Pia AC', 'Arouca', 'Nacional da Madeira', 'Tondela', 'Alverca', 'Académico de Viseu', 'Leixões SC']) },
  { id: 'P2', n: 'Liga Portugal 2', c: 'PT', f: '🇵🇹', t: 2, cl: T([55, 50, 47],
    ['Marítimo', 'Portimonense SC', 'FC Vizela', 'Farense', 'Académica de Coimbra', 'FC Paços de Ferreira', 'Chaves'],
    ['Leiria', 'Feirense', 'SCU Torreense', 'FC Penafiel', 'Sporting da Covilhã', 'UD Oliveirense', 'Lusitânia de Lourosa', 'Leixões SC'],
    ['Benfica B', 'FC Porto B', 'Sporting CP B']) }
];

// Saison 1 : participants européens (clubs jouables + clubs étrangers "nom:niveau")
const EU1 = {
  UCL: {
    p: ['Arsenal', 'Aston Villa', 'Atlético de Madrid', 'FC Barcelona', 'FC Bayern München', 'Borussia Dortmund', 'Como', 'Inter Milan',
      'RB Leipzig', 'RC Lens', 'LOSC Lille', 'Liverpool', 'Manchester City', 'Manchester United', 'Napoli', 'Paris Saint-Germain',
      'FC Porto', 'Real Betis', 'Real Madrid', 'AS Roma', 'Sporting CP', 'VfB Stuttgart', 'Villarreal CF'],
    f: ['PSV Eindhoven:80', 'Feyenoord:76', 'Club Brugge:74', 'Galatasaray:74', 'Fenerbahçe:72', 'Shakhtar Donetsk:70', 'Slavia Praha:66',
      'AEK Athens:64', 'Bodø/Glimt:62', 'LASK:60', 'Viking FK:58', 'Sabah FK:56', 'Slovan Bratislava:56']
  },
  UEL: {
    p: ['AFC Bournemouth', 'Celta Vigo', 'Crystal Palace', 'TSG Hoffenheim', 'Juventus', 'Bayer 04 Leverkusen', 'Olympique Lyonnais',
      'Olympique de Marseille', 'AC Milan', 'Real Sociedad', 'Stade Rennais', 'Sunderland', 'Benfica', 'SCU Torreense'],
    f: ['Celtic:68', 'Olympiacos:66', 'AZ Alkmaar:66', 'Beşiktaş:66', 'RB Salzbourg:66', 'Sparta Prague:64', 'RSC Anderlecht:64',
      'Union Saint-Gilloise:62', 'GNK Dinamo Zagreb:62', 'Ferencváros:60', 'Viktoria Plzeň:60', 'Sturm Graz:60', 'Lech Poznań:58',
      'NEC Nijmegen:58', 'Jagiellonia Białystok:56', 'Hapoel Beer-Sheva:54', 'Omonia Nicosie:54', 'Levski Sofia:52', 'Lillestrøm:52',
      'OFI Crète:52', 'Celje:50', 'Ararat-Armenia:48']
  }
};
