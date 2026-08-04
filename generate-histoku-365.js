#!/usr/bin/env node

/**
 * GENERADOR DE HISTOKU 365 DÍAS
 * Genera puzzles históricos únicos para Efemeris
 * Temática varía por mes del año
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============ TEMÁTICAS POR MES ============

const MONTHLY_THEMES = {
  1: {
    name: "Antigüedad",
    color: "#8B7355",
    description: "Imperios antiguos, Roma y Grecia",
    characters: [
      ["Julio César", "Cleopatra", "Cicerón", "Marco Antonio", "Acta del Senado"],
      ["Alejandro Magno", "Aristóteles", "Demóstenes", "Filipo II", "Plano de Conquista"],
      ["Nerón", "Séneca", "Agripina", "Burro", "Edito Imperial"]
    ],
    locations: [
      ["Ágora Ateniense", "Foro Romano", "Senado", "Templo"],
      ["Palacio de Menfis", "Biblioteca de Alejandría", "Puerto de Tiro", "Templo Ptolemaico"],
      ["Palacio Imperial", "Coliseo", "Catacumbas", "Casa Dorada"]
    ],
    events: [
      "Conspiración en el Senado",
      "Intriga Helenística",
      "Secreto Imperial"
    ]
  },

  2: {
    name: "Edad Media",
    color: "#7B3F00",
    description: "Reinos medievales y caballerías",
    characters: [
      ["Carlomagno", "Juana de Arco", "Ricardo Corazón de León", "Saladino", "Pergamino Perdido"],
      ["Guillermo el Conquistador", "Matilde de Flandes", "Esteban de Inglaterra", "Enrique I", "Crónica Real"],
      ["Barbarroja", "Eleonora de Aquitania", "Enrique II", "Tomás Becket", "Reliquias Sagradas"]
    ],
    locations: [
      ["Torre del Castillo", "Sala del Trono", "Cámara Secreta", "Mazmorra"],
      ["Fortaleza Normanda", "Capilla Real", "Armería", "Tesorería"],
      ["Salón de Justicia", "Torre de Vigilancia", "Cripta", "Biblioteca Monástica"]
    ],
    events: [
      "Intriga Medieval",
      "Secreto de la Corte",
      "Conspiración Feudal"
    ]
  },

  3: {
    name: "Renacimiento",
    color: "#C74736",
    description: "Maestros del Renacimiento italiano",
    characters: [
      ["Leonardo da Vinci", "Miguel Ángel", "Maquiavelo", "Petrarca", "Manuscrito Secreto"],
      ["Rafael Sanzio", "Botticelli", "Brunelleschi", "Donatello", "Obra Maestra"],
      ["Lorenzo el Magnífico", "Lucrezia Borgia", "Girolamo Savonarola", "Nicolás Maquiavelo", "Tratado Oculto"]
    ],
    locations: [
      ["Taller de Pintura", "Biblioteca Vaticana", "Piazza San Pietro", "Estudio Florentino"],
      ["Capilla Sixtina", "Galería de los Uffizi", "Catedral de Brunelleschi", "Palacio Rucellai"],
      ["Sala de la Signoria", "Convento de San Marcos", "Iglesia de la Santísima Trinidad", "Torre del Ghibellino"]
    ],
    events: [
      "Secreto Renacentista",
      "Intriga Artística",
      "Conspiración Florentina"
    ]
  },

  4: {
    name: "Era de Exploración",
    color: "#1E40AF",
    description: "Descubridores y conquistadores",
    characters: [
      ["Cristóbal Colón", "Fernando de Magallanes", "Hernán Cortés", "Francisco Pizarro", "Mapa del Tesoro"],
      ["Bartolomé Díaz", "Vasco da Gama", "Pedro Álvarez Cabral", "Juan Ponce de León", "Diario de Viajes"],
      ["Américo Vespucio", "Giovanni da Verrazzano", "Jacques Cartier", "Álvar Núñez Cabeza de Vaca", "Carta de Navegación"]
    ],
    locations: [
      ["Bodega del Barco", "Camarote del Capitán", "Cubierta Principal", "Bodega de Provisiones"],
      ["Cámara de Mapas", "Navío Insignia", "Almacén de Especias", "Castillo de Proa"],
      ["Sala de Cartas", "Bodega Trasera", "Cocina del Barco", "Camarote de Oficiales"]
    ],
    events: [
      "Robo en Alta Mar",
      "Conspiración de Navegantes",
      "Secreto del Descubrimiento"
    ]
  },

  5: {
    name: "Ilustración",
    color: "#DC2626",
    description: "Filósofos y pensadores ilustrados",
    characters: [
      ["Voltaire", "Jean-Jacques Rousseau", "René Descartes", "Isaac Newton", "Tratado Perdido"],
      ["Denis Diderot", "Jean d'Alembert", "Montesquieu", "David Hume", "Enciclopedia Secreta"],
      ["Immanuel Kant", "David Hume", "Adam Smith", "Benjamin Franklin", "Manuscrito Revolucionario"]
    ],
    locations: [
      ["Salón de Filosofía", "Biblioteca del Palacio", "Gabinete de Ciencias", "Cámara Privada"],
      ["Sala de Tertulias", "Despacho del Filósofo", "Laboratorio Experimental", "Archivos Secretos"],
      ["Academia de Ciencias", "Estudio del Pensador", "Biblioteca Privada", "Cámara de Correspondencia"]
    ],
    events: [
      "Conspiración Ilustrada",
      "Secreto Filosófico",
      "Intriga Intelectual"
    ]
  },

  6: {
    name: "Revolución Industrial",
    color: "#7C3AED",
    description: "Inventores y revolucionarios industriales",
    characters: [
      ["James Watt", "Thomas Edison", "Nikola Tesla", "Isambard Brunel", "Plano Revolucionario"],
      ["George Stephenson", "Joseph Jacquard", "Samuel Morse", "Charles Babbage", "Invento Secreto"],
      ["Richard Arkwright", "Jedediah Strutt", "Edmund Cartwright", "Henry Bessemer", "Fórmula Industrial"]
    ],
    locations: [
      ["Taller Mecánico", "Fábrica Principal", "Laboratorio", "Oficina del Ingeniero"],
      ["Sala de Máquinas", "Fundición", "Depósito de Herramientas", "Despacho Directivo"],
      ["Taller de Prototipos", "Fábrica Textil", "Laboratorio de Experimentos", "Archivo de Planos"]
    ],
    events: [
      "Sabotaje Industrial",
      "Robo de Invento",
      "Conspiración Técnica"
    ]
  },

  7: {
    name: "Era Moderna Temprana",
    color: "#0891B2",
    description: "Científicos que transformaron el mundo",
    characters: [
      ["Albert Einstein", "Charles Darwin", "Louis Pasteur", "Marie Curie", "Fórmula Secreta"],
      ["Nikola Tesla", "Joseph Lister", "Rudolf Virchow", "Santiago Ramón y Cajal", "Descubrimiento Crucial"],
      ["Wilhelm Röntgen", "Max Planck", "Henri Becquerel", "Pierre Curie", "Teoría Revolucionaria"]
    ],
    locations: [
      ["Laboratorio Científico", "Observatorio", "Biblioteca Universitaria", "Clínica Médica"],
      ["Sala de Investigación", "Microscopio de Precisión", "Despacho del Catedrático", "Archivo de Experimentos"],
      ["Laboratorio de Física", "Estudio del Naturalista", "Sala de Conferencias", "Cámara de Pruebas"]
    ],
    events: [
      "Descubrimiento Robado",
      "Secreto Científico",
      "Conspiración Académica"
    ]
  },

  8: {
    name: "Era Contemporánea",
    color: "#059669",
    description: "Líderes del siglo XX",
    characters: [
      ["Winston Churchill", "Franklin D. Roosevelt", "Iósif Stalin", "Charles de Gaulle", "Documentos Secretos"],
      ["Dwight D. Eisenhower", "Bernard Montgomery", "Georgy Zhukov", "Harold Alexander", "Órdenes Militares"],
      ["Mahatma Gandhi", "Nelson Mandela", "Ho Chi Minh", "Fidel Castro", "Manifiestos Revolucionarios"]
    ],
    locations: [
      ["Salón Norte", "Salón Sur", "Salón Este", "Salón Oeste"],
      ["Sala de Conferencias", "Despacho Presidencial", "Sala de Comunicaciones", "Armería"],
      ["Bunker de Mando", "Centro de Operaciones", "Cuarto de Estrategia", "Sala Segura"]
    ],
    events: [
      "Conferencia Internacional",
      "Conspiración Política",
      "Secreto de Guerra"
    ]
  },

  9: {
    name: "Era Espacial",
    color: "#1E3A8A",
    description: "Pioneros del espacio",
    characters: [
      ["Neil Armstrong", "Yuri Gagarin", "Buzz Aldrin", "Valentina Tereshkova", "Registro Satelital"],
      ["John Glenn", "Alan Shepard", "Gherman Titov", "Sally Ride", "Datos de Comunicaciones"],
      ["Wernher von Braun", "Sergei Korolyov", "Chris Kraft", "Konstantin Tsiolkovsky", "Plano de Misión"]
    ],
    locations: [
      ["Centro de Control", "Módulo Lunar", "Cápsula Espacial", "Sala de Comunicaciones"],
      ["Sala de Lanzamiento", "Nave Orbital", "Centro de Entrenamiento", "Observatorio de Satélites"],
      ["Bunker de Control", "Laboratorio Cero-G", "Sala de Telemetría", "Cuarto de Contingencias"]
    ],
    events: [
      "Misterio Espacial",
      "Sabotaje de Misión",
      "Secreto de la Carrera Espacial"
    ]
  },

  10: {
    name: "Revolución Científica",
    color: "#EA580C",
    description: "Científicos contemporáneos",
    characters: [
      ["Stephen Hawking", "Richard Feynman", "Carl Sagan", "Roger Penrose", "Teoría Revolucionaria"],
      ["Richard Dawkins", "Daniel Dennett", "Noam Chomsky", "Freeman Dyson", "Hallazgo Crucial"],
      ["Brian Greene", "Sean Carroll", "Lisa Randall", "Juan Maldacena", "Ecuación Secreta"]
    ],
    locations: [
      ["Instituto de Física", "Computadora Cuántica", "Biblioteca de Astrofísica", "Despacho del Director"],
      ["Sala de Seminarios", "Laboratorio de Cosmología", "Oficina de Investigación", "Archivo de Cálculos"],
      ["Centro de Estudios", "Torre de Observación", "Sala de Conferencias Científicas", "Cámara Acorazada"]
    ],
    events: [
      "Avance Científico",
      "Conspiración Académica",
      "Secreto de Investigación"
    ]
  },

  11: {
    name: "Artes & Cultura",
    color: "#BE185D",
    description: "Artistas y creadores",
    characters: [
      ["Pablo Picasso", "Salvador Dalí", "Charlie Chaplin", "Alfred Hitchcock", "Obra Maestra"],
      ["Audrey Hepburn", "Marlon Brando", "Ingrid Bergman", "Stanley Kubrick", "Película Perdida"],
      ["Federico Fellini", "Akira Kurosawa", "Elia Kazan", "Billy Wilder", "Guión Secreto"]
    ],
    locations: [
      ["Estudio de Pintura", "Salas de Cine", "Teatro Principal", "Galería de Arte"],
      ["Sala de Proyección", "Estudio de Cine", "Atelier de Arte", "Museo de Cera"],
      ["Cinemateca", "Teatro de Opera", "Galería Privada", "Estudio de Danza"]
    ],
    events: [
      "Robo Artístico",
      "Conspiración Creativa",
      "Secreto de la Industria del Entretenimiento"
    ]
  },

  12: {
    name: "Historia Hispana",
    color: "#EAB308",
    description: "Personalidades españolas destacadas",
    characters: [
      ["Isabel la Católica", "Miguel de Cervantes", "Antoni Gaudí", "Federico García Lorca", "Documento de la Corona"],
      ["El Cid Campeador", "Isabel de Castilla", "Reyes Católicos", "Cristóbal Colón", "Carta Real"],
      ["Francisco Goya", "Miguel de Unamuno", "Jorge Luis Borges", "Pablo Casals", "Manuscrito Español"]
    ],
    locations: [
      ["Salón de la Corte", "Torre del Alcázar", "Biblioteca del Monasterio", "Cámara Real"],
      ["Sala de Tronos", "Capilla de Reyes Nuevos", "Archivo Secreto", "Torre de Homenaje"],
      ["Sala del Consejo", "Biblioteca de Alcalá", "Cámara Privada", "Torre de Vigilancia"]
    ],
    events: [
      "Intriga Hispana",
      "Secreto Real",
      "Conspiración Cortesana"
    ]
  }
};

// ============ PUZZLES PREDISEÑADOS (VALIDADOS) ============

const PRESET_PUZZLES = {
  "2026-08-04": {
    title: "El Caso de la Conferencia de Yalta",
    description: "Los tres grandes líderes mundiales se reúnen en una mansión histórica. Pero alguien ha robado documentos secretos de la conferencia. ¿Quién fue?",
    characters: [
      { id: 1, name: "Winston Churchill", type: "personaje" },
      { id: 2, name: "Franklin D. Roosevelt", type: "personaje" },
      { id: 3, name: "Iósif Stalin", type: "personaje" },
      { id: 4, name: "Charles de Gaulle", type: "personaje" },
      { id: 5, name: "Documentos Secretos", type: "victim" }
    ],
    locations: [
      { id: 1, name: "Salón Norte", zone: "A" },
      { id: 2, name: "Salón Sur", zone: "B" },
      { id: 3, name: "Salón Este", zone: "C" },
      { id: 4, name: "Salón Oeste", zone: "D" }
    ],
    clues: [
      { id: 1, text: "Churchill está en el Salón Norte", type: "definite" },
      { id: 2, text: "Roosevelt no está en el Salón Este ni en el Salón Norte", type: "exclusion" },
      { id: 3, text: "Stalin está junto a De Gaulle (horizontalmente adyacentes)", type: "adjacency" },
      { id: 4, text: "De Gaulle está en el Salón Sur", type: "definite" },
      { id: 5, text: "Los Documentos están solos en el Salón Sur", type: "alone" },
      { id: 6, text: "Stalin está al Este de Churchill", type: "direction" }
    ],
    solution: { 1: 1, 2: 4, 3: 3, 4: 2, 5: 2 },
    killer: {
      id: 4,
      name: "Charles de Gaulle",
      reason: "Es el único personaje que estaba solo con los Documentos en el Salón Sur. Mientras los demás conversaban, De Gaulle aprovechó para robar los documentos secretos de la conferencia."
    }
  },

  "2026-08-05": {
    title: "El Robo del Telescopio de Griffith",
    description: "Cuatro astrónomos de renombre mundial se reúnen en el Observatorio Griffith. Esa noche, el famoso telescopio histórico desaparece. ¿Quién lo robó?",
    characters: [
      { id: 1, name: "Edwin Hubble", type: "personaje" },
      { id: 2, name: "Georges Lemaître", type: "personaje" },
      { id: 3, name: "Cecilia Payne-Gaposchkin", type: "personaje" },
      { id: 4, name: "Harlow Shapley", type: "personaje" },
      { id: 5, name: "Telescopio Histórico", type: "victim" }
    ],
    locations: [
      { id: 1, name: "Cúpula Norte", zone: "A" },
      { id: 2, name: "Cúpula Sur", zone: "B" },
      { id: 3, name: "Oficina Este", zone: "C" },
      { id: 4, name: "Biblioteca Oeste", zone: "D" }
    ],
    clues: [
      { id: 1, text: "Hubble está en la Cúpula Norte", type: "definite" },
      { id: 2, text: "Payne-Gaposchkin no está en la Oficina Este", type: "exclusion" },
      { id: 3, text: "Lemaître está junto a Shapley (verticalmente adyacentes)", type: "adjacency" },
      { id: 4, text: "El Telescopio está en la Biblioteca Oeste", type: "definite" },
      { id: 5, text: "Shapley no está en la Cúpula Norte ni en la Cúpula Sur", type: "exclusion" },
      { id: 6, text: "Payne-Gaposchkin está en la Cúpula Sur", type: "definite" }
    ],
    solution: { 1: 1, 2: 3, 3: 2, 4: 4, 5: 4 },
    killer: {
      id: 4,
      name: "Harlow Shapley",
      reason: "Es el único que estaba en la Biblioteca Oeste con el Telescopio. Como director, Shapley tenía acceso a todas las áreas y aprovechó para robar la joya científica del observatorio."
    }
  }
};

// ============ FUNCIONES GENERADORAS ============

function getMonthTheme(dayOfYear) {
  const month = new Date(2026, 0, dayOfYear).getMonth() + 1;
  return MONTHLY_THEMES[month];
}

function generateValidTemplates(theme, seed) {
  /**
   * Generar 3 templates válidos diferentes para la temática
   * Cada template tiene una solución única garantizada
   */
  const templates = [];

  for (let i = 0; i < 3; i++) {
    // Rotación de soluciones para garantizar variedad
    const solutions = [
      { 1: 1, 2: 2, 3: 3, 4: 4, 5: 2 },  // Killer en pos 2
      { 1: 2, 2: 1, 3: 4, 4: 3, 5: 3 },  // Killer en pos 3
      { 1: 3, 2: 4, 3: 1, 4: 2, 5: 4 }   // Killer en pos 4
    ];

    templates.push({
      case: `${theme.events[i % theme.events.length]} #${i + 1}`,
      description: `${theme.events[i % theme.events.length]} en ${theme.name}`,
      solution: solutions[i],
      killer: { id: Object.values(solutions[i]).indexOf(Object.values(solutions[i])[(4)]) + 1 }
    });
  }

  return templates;
}

function buildPuzzle(dayOfYear, template, theme) {
  const charSet = theme.characters[dayOfYear % theme.characters.length];
  const locationSet = theme.locations[dayOfYear % theme.locations.length];
  const solution = template.solution;

  const characters = [
    { id: 1, name: charSet[0], type: "personaje" },
    { id: 2, name: charSet[1], type: "personaje" },
    { id: 3, name: charSet[2], type: "personaje" },
    { id: 4, name: charSet[3], type: "personaje" },
    { id: 5, name: charSet[4], type: "victim" }
  ];

  const locations = locationSet.map((name, idx) => ({
    id: idx + 1,
    name,
    zone: String.fromCharCode(65 + idx)
  }));

  // Generar pistas basadas en la solución
  const clues = generateCluesFromSolution(characters, locations, solution);

  // El "killer" es, por construcción de las plantillas de solución, quien
  // comparte ubicación con la víctima (characters[4]) — ver generateValidTemplates.
  const victima = characters[4];
  const ubicacionVictima = locations[solution[5] - 1]?.name || 'el lugar del misterio';

  return {
    title: template.case,
    description: template.description,
    characters,
    locations,
    clues,
    solution,
    killer: {
      id: template.killer.id,
      name: characters[template.killer.id - 1]?.name || "Desconocido",
      reason: `Es quien coincidía con "${victima.name}" en ${ubicacionVictima}, la única persona en ese mismo lugar además de la propia víctima.`
    }
  };
}

function generateCluesFromSolution(characters, locations, solution) {
  /**
   * Generar 6 pistas que lleven lógicamente a la solución
   * Tipos: definite, exclusion, adjacency, direction, alone
   */
  const clues = [];

  // Pista 1: Ubicación definitiva (personaje 1)
  clues.push({
    id: 1,
    text: `${characters[0].name} está en ${locations[solution[1] - 1].name}`,
    type: "definite"
  });

  // Pista 2: Exclusiones para personaje 2
  const excludeLocs = [1, 2, 3, 4].filter(i => i !== solution[2]).slice(0, 2);
  clues.push({
    id: 2,
    text: `${characters[1].name} no está en ${locations[excludeLocs[0] - 1].name} ni en ${locations[excludeLocs[1] - 1].name}`,
    type: "exclusion"
  });

  // Pista 3: Adyacencia
  clues.push({
    id: 3,
    text: `${characters[2].name} está junto a ${characters[3].name} (adyacentes)`,
    type: "adjacency"
  });

  // Pista 4: Ubicación víctima
  clues.push({
    id: 4,
    text: `${characters[4].name} está en ${locations[solution[5] - 1].name}`,
    type: "definite"
  });

  // Pista 5: Exclusiones para personaje 4
  const excludeLocs2 = [1, 2, 3].filter(i => i !== solution[4]).slice(0, 2);
  clues.push({
    id: 5,
    text: `${characters[3].name} no está en ${locations[excludeLocs2[0] - 1].name} ni en ${locations[excludeLocs2[1] - 1].name}`,
    type: "exclusion"
  });

  // Pista 6: Ubicación definitiva alternativa
  clues.push({
    id: 6,
    text: `${characters[2].name} está en ${locations[solution[3] - 1].name}`,
    type: "definite"
  });

  return clues;
}

function calculateDifficulty(day) {
  const difficulties = ['fácil', 'media', 'difícil'];
  // Aumentar dificultad progresivamente en el año
  const progression = Math.floor(day / 121); // Cambio cada ~120 días
  return difficulties[Math.min(progression, 2)];
}

// ============ MAIN ============

function main() {
  console.log('🎲 Generando 365 puzzles de Histoku para Efemeris...\n');
  console.log('📅 Temática por mes: Antigüedad → Hispana\n');

  const histokuData = {};
  let generated = 0;

  for (let day = 1; day <= 365; day++) {
    // Fecha en calendario LOCAL, no toISOString() (que convierte a UTC y
    // desplaza un día entero en cualquier huso horario adelantado a UTC,
    // como España en verano).
    const fecha = new Date(2026, 0, day);
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const date = `2026-${mes}-${dia}`;
    const theme = getMonthTheme(day);

    // Si existe puzzle prediseñado, usarlo
    if (PRESET_PUZZLES[date]) {
      histokuData[date] = {
        ...PRESET_PUZZLES[date],
        date,
        theme: theme.name,
        difficulty: calculateDifficulty(day),
        day_of_year: day,
        grid_size: 4
      };
    } else {
      // Generar puzzle proceduralmente
      const templates = generateValidTemplates(theme, day);
      const template = templates[day % templates.length];
      const puzzle = buildPuzzle(day, template, theme);

      histokuData[date] = {
        ...puzzle,
        date,
        theme: theme.name,
        difficulty: calculateDifficulty(day),
        day_of_year: day,
        grid_size: 4
      };
    }

    generated++;

    // Log de progreso
    if (day === 1 || day === 216 || day === 365 || day % 50 === 0 || day <= 5) {
      const puzzle = histokuData[date];
      console.log(`✓ ${date} (${theme.name}): ${puzzle.title}`);
    }
  }

  // Guardar JSON
  const outputPath = path.join(__dirname, 'public', 'histoku-365dias.json');
  fs.writeFileSync(outputPath, JSON.stringify(histokuData, null, 2));

  console.log(`\n✅ Generados ${generated}/365 puzzles`);
  console.log(`📁 Archivo guardado: ${outputPath}`);
  console.log(`📊 Tamaño: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
  console.log(`\n📅 Primer puzzle: ${Object.keys(histokuData)[0]}`);
  console.log(`📅 Último puzzle: ${Object.keys(histokuData)[364]}`);
}

main();
