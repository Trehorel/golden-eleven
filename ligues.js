// DONNÉES : championnats, coupes, Europe
const T = (lv, ...g) => g.flatMap((a, i) => a.map(n => ({ n, l: lv[i] })));
const COUPES = {
  FR: 'Coupe de France', IT: 'Coppa Italia', DE: 'DFB-Pokal', EN: 'FA Cup', ES: 'Copa del Rey', PT: 'Taça de Portugal',
  BR: 'Copa do Brasil', AR: 'Copa Argentina', KSA: 'Coupe du Roi', US: 'US Open Cup', MX: 'Copa MX', JP: 'Coupe de l\'Empereur',
  MA: 'Coupe du Trône', EG: 'Coupe d\'Égypte', ZA: 'Nedbank Cup'
};

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
  { id: 'PL', n: 'Premier League', c: 'EN', f: '🇬🇧', t: 1, ucl: 4, uel: 2, cl: T([91, 82, 74, 64],
    ['Manchester City', 'Liverpool', 'Arsenal'], ['Chelsea', 'Tottenham Hotspur', 'Manchester United', 'Newcastle United', 'Aston Villa'],
    ['Brighton & Hove Albion', 'Crystal Palace', 'Brentford', 'Fulham', 'AFC Bournemouth', 'Everton', 'Nottingham Forest', 'Leeds United'],
    ['Sunderland', 'Ipswich Town', 'Coventry City', 'Hull City']) },
  { id: 'CH', n: 'Championship', c: 'EN', f: '🇬🇧', t: 2, cl: T([62, 57, 53],
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
    ['Benfica B', 'FC Porto B', 'Sporting CP B']) },

  // ---------- Autres continents (division unique, sans relégation) ----------
  { id: 'BR', n: 'Brasileirão', c: 'BR', f: '🇧🇷', t: 1, np: true, ucl: 0, uel: 0, cl: T([80, 72, 66, 60],
    ['Palmeiras', 'Flamengo'], ['Botafogo', 'Fluminense', 'Atlético Mineiro', 'São Paulo', 'Corinthians', 'Internacional', 'Grêmio'],
    ['Cruzeiro', 'Santos', 'Vasco da Gama', 'Bahia', 'Fortaleza', 'Athletico Paranaense', 'Red Bull Bragantino', 'Vitória'],
    ['Juventude', 'Ceará', 'Mirassol']) },
  { id: 'AR', n: 'Liga Profesional', c: 'AR', f: '🇦🇷', t: 1, np: true, ucl: 0, uel: 0, cl: T([78, 68, 62],
    ['River Plate', 'Boca Juniors'], ['Racing Club', 'Independiente', 'San Lorenzo', 'Estudiantes', 'Vélez Sarsfield', 'Talleres'],
    ['Rosario Central', "Newell's Old Boys", 'Lanús', 'Argentinos Juniors', 'Defensa y Justicia', 'Huracán', 'Godoy Cruz', 'Belgrano', 'Platense', 'Tigre']) },
  { id: 'KSA', n: 'Saudi Pro League', c: 'KSA', f: '🇸🇦', t: 1, np: true, ucl: 0, uel: 0, cl: T([80, 74, 62, 56],
    ['Al-Hilal'], ['Al-Nassr', 'Al-Ittihad', 'Al-Ahli', 'Al-Qadsiah'], ['Al-Shabab', 'Al-Ettifaq', 'Al-Fayha', 'Al-Taawoun', 'Al-Fateh', 'Damac'],
    ['Al-Khaleej', 'Al-Raed', 'Al-Riyadh', 'Al-Okhdood', 'Al-Kholood', 'Al-Orobah', 'Al-Najma']) },
  { id: 'US', n: 'MLS', c: 'US', f: '🇺🇸', t: 1, np: true, ucl: 0, uel: 0, cl: T([72, 66, 60, 56],
    ['Inter Miami'], ['LAFC', 'Seattle Sounders', 'Columbus Crew', 'LA Galaxy', 'Atlanta United'],
    ['FC Cincinnati', 'Philadelphia Union', 'New York City FC', 'New England Revolution', 'Real Salt Lake', 'Austin FC', 'Orlando City', 'Portland Timbers', 'Minnesota United'],
    ['Toronto FC', 'CF Montréal', 'Vancouver Whitecaps', 'Nashville SC', 'Charlotte FC']) },
  { id: 'MX', n: 'Liga MX', c: 'MX', f: '🇲🇽', t: 1, np: true, ucl: 0, uel: 0, cl: T([70, 64, 58],
    ['Club América', 'Tigres UANL', 'CF Monterrey'], ['Chivas Guadalajara', 'Cruz Azul', 'Pumas UNAM', 'Toluca', 'Pachuca', 'León'],
    ['Santos Laguna', 'Atlas', 'Club Tijuana', 'Necaxa', 'Mazatlán', 'Querétaro', 'Puebla', 'FC Juárez', 'Atlético San Luis']) },
  { id: 'JP', n: 'J1 League', c: 'JP', f: '🇯🇵', t: 1, np: true, ucl: 0, uel: 0, cl: T([66, 60, 54],
    ['Vissel Kobe', 'Kawasaki Frontale', 'Yokohama F. Marinos', 'Sanfrecce Hiroshima'],
    ['Urawa Red Diamonds', 'Kashima Antlers', 'Gamba Osaka', 'Cerezo Osaka', 'FC Tokyo', 'Nagoya Grampus'],
    ['Kashiwa Reysol', 'Avispa Fukuoka', 'Albirex Niigata', 'Shonan Bellmare', 'Machida Zelvia', 'Tokyo Verdy', 'Consadole Sapporo', 'Kyoto Sanga']) },
  { id: 'MA', n: 'Botola Pro', c: 'MA', f: '🇲🇦', t: 1, np: true, ucl: 0, uel: 0, cl: T([62, 56, 50],
    ['Wydad Casablanca', 'Raja Casablanca', 'AS FAR'], ['RS Berkane', 'FUS Rabat', 'Maghreb de Fès', 'Hassania Agadir', 'Olympic Safi', 'Difaâ El Jadida'],
    ['Moghreb Tétouan', 'IR Tanger', 'Youssoufia Berrechid', 'Mouloudia Oujda', 'US Touarga', 'Chabab Mohammédia', 'Renaissance de Zemamra']) },
  { id: 'EG', n: 'Egyptian Premier League', c: 'EG', f: '🇪🇬', t: 1, np: true, ucl: 0, uel: 0, cl: T([66, 58, 52],
    ['Al Ahly', 'Zamalek'], ['Pyramids FC', 'Al Masry', 'Ceramica Cleopatra', 'Future FC', 'Smouha', 'ENPPI'],
    ['Al Ittihad Alexandrie', 'Zed FC', 'Modern Sport', 'Haras El Hodoud', 'El Gouna', 'Ismaily', 'Pharco', 'Petrojet', 'National Bank of Egypt', 'Baladiyat El Mahalla']) },
  { id: 'ZA', n: 'Betway Premiership', c: 'ZA', f: '🇿🇦', t: 1, np: true, ucl: 0, uel: 0, cl: T([62, 56, 50],
    ['Mamelodi Sundowns'], ['Orlando Pirates', 'Kaizer Chiefs', 'Stellenbosch FC', 'Cape Town City', 'SuperSport United'],
    ['Sekhukhune United', 'AmaZulu', 'Golden Arrows', 'TS Galaxy', 'Chippa United', 'Polokwane City', 'Richards Bay', 'Magesi FC', 'Marumo Gallants', 'Royal AM']) }
];

// Divisions de niveau 1 qui ont une division de niveau 2 dans le même pays (montées / descentes)
const PAIRS = D.filter((d, i) => d.t === 1 && D[i + 1] && D[i + 1].t === 2 && D[i + 1].c === d.c);

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
