// Contenido local (no depende de Wikidata): se elige de forma determinística
// según el día del año, para que cada fecha muestre siempre lo mismo.

export const CITAS_MOTIVACIONALES = [
  'El éxito es la suma de pequeños esfuerzos repetidos día tras día.',
  'No cuentes los días, haz que los días cuenten.',
  'Cada paso, por pequeño que sea, te acerca a la meta.',
  'La disciplina es el puente entre las metas y los logros.',
  'Un error no es un fracaso, es una lección disfrazada.',
  'Empieza donde estás, usa lo que tienes, haz lo que puedas.',
  'La constancia vence lo que la intensidad no logra sostener.',
  'Nada cambia si nada cambia: el primer paso siempre es tuyo.',
  'El momento perfecto para empezar es este.',
  'Lo que hoy parece difícil, mañana será tu fortaleza.',
  'Aprende a ver los obstáculos como parte del camino, no como el fin de él.',
  'La paciencia también es una forma de valentía.',
  'Cada día es una nueva oportunidad para mejorar un poco.',
  'El progreso, aunque lento, sigue siendo progreso.',
  'No se trata de tener tiempo, se trata de hacer tiempo.',
  'La confianza se construye una decisión a la vez.',
  'Duda menos, intenta más.',
  'Las grandes metas se logran con pequeños hábitos diarios.',
  'El esfuerzo de hoy es la libertad de mañana.',
  'Enfócate en el progreso, no en la perfección.',
  'Quien se prepara con calma, avanza con firmeza.',
  'Cada desafío superado es una prueba de lo que sos capaz de lograr.',
  'La motivación te inicia, el hábito te sostiene.',
  'No hay atajos para los lugares que valen la pena.',
  'Tu actitud de hoy define tu resultado de mañana.',
  'Ser constante vale más que ser perfecto.',
  'El cambio empieza con una decisión simple: intentarlo.',
  'Cree en el proceso, incluso cuando no ves resultados inmediatos.',
  'Lo que se practica con constancia, se vuelve posible.',
  'Cada amanecer es una hoja en blanco.',
]

export const REFRANES = [
  'A quien madruga, Dios le ayuda.',
  'Más vale tarde que nunca.',
  'No hay mal que por bien no venga.',
  'Al mal tiempo, buena cara.',
  'Quien mucho abarca, poco aprieta.',
  'En boca cerrada no entran moscas.',
  'Más vale pájaro en mano que ciento volando.',
  'Camarón que se duerme, se lo lleva la corriente.',
  'No hay peor sordo que el que no quiere oír.',
  'Perro que ladra no muerde.',
  'A caballo regalado no se le mira el diente.',
  'Dime con quién andas y te diré quién eres.',
  'El que no arriesga, no gana.',
  'Cría fama y échate a dormir.',
  'No dejes para mañana lo que puedas hacer hoy.',
  'Zapatero, a tus zapatos.',
  'Agua que no has de beber, déjala correr.',
  'A palabras necias, oídos sordos.',
  'Del dicho al hecho hay mucho trecho.',
  'Cada oveja con su pareja.',
  'El que a hierro mata, a hierro muere.',
  'No por mucho madrugar amanece más temprano.',
  'A grandes males, grandes remedios.',
  'Donde hay confianza, da asco.',
  'El que ríe último, ríe mejor.',
  'Ojos que no ven, corazón que no siente.',
  'A buen entendedor, pocas palabras bastan.',
  'Más vale prevenir que curar.',
  'Cuando el río suena, agua lleva.',
  'En todas partes se cuecen habas.',
]

// Curiosidades animales para la sección Waku-Waku. Contenido local (no depende
// de Wikidata en vivo: se probó contra el endpoint real y las fechas de
// descripción de especies casi nunca tienen precisión de día, así que no hay
// forma confiable de "un animal por fecha real"). wikidataUrl se completó a
// mano verificando cada QID contra la API de Wikidata, no de memoria.
export const CURIOSIDADES_ANIMALES = [
  {
    titulo: 'El pulpo tiene tres corazones y sangre azul',
    descripcion: 'Dos corazones bombean sangre hacia las branquias y un tercero hacia el resto del cuerpo; su sangre es azul porque usa hemocianina en lugar de hemoglobina para transportar oxígeno.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q40152',
  },
  {
    titulo: 'El colibrí es la única ave capaz de volar hacia atrás',
    descripcion: 'Gracias a una articulación especial en el hombro, bate sus alas describiendo un ocho, lo que le permite volar hacia atrás, de costado o quedarse suspendido en el aire.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q43624',
  },
  {
    titulo: 'El elefante africano es el mamífero terrestre más grande del mundo',
    descripcion: 'Puede pesar hasta 6 toneladas y usa sus grandes orejas para liberar calor corporal, ya que no cuenta con glándulas sudoríparas eficaces.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q36557',
  },
  {
    titulo: 'Los delfines mulares duermen con medio cerebro despierto',
    descripcion: 'Alternan qué hemisferio cerebral descansa para poder seguir respirando de forma consciente y vigilar a los depredadores mientras duermen.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q174199',
  },
  {
    titulo: 'El camaleón no cambia de color principalmente para camuflarse',
    descripcion: 'Su color varía sobre todo según el estado de ánimo, la temperatura y la comunicación con otros camaleones; camuflarse es solo una función secundaria.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q37686',
  },
  {
    titulo: 'El canguro rojo no puede caminar hacia atrás',
    descripcion: 'La forma de sus patas traseras y su cola solo le permiten avanzar dando saltos hacia adelante.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q53462',
  },
  {
    titulo: 'El ajolote puede regenerar extremidades enteras',
    descripcion: 'A diferencia de la mayoría de los vertebrados, conserva toda su vida la capacidad de regenerar patas, cola, piel e incluso tejido de la médula espinal.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q22718',
  },
  {
    titulo: 'El tardígrado puede sobrevivir en el vacío del espacio',
    descripcion: 'Este animal microscópico entra en un estado de criptobiosis que le permite resistir radiación extrema, congelamiento y la falta de oxígeno del espacio exterior.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q5194',
  },
  {
    titulo: 'El ornitorrinco es uno de los pocos mamíferos venenosos',
    descripcion: 'Los machos tienen un espolón en las patas traseras que inyecta veneno, y además pone huevos en lugar de parir crías, algo único entre los mamíferos.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q15343',
  },
  {
    titulo: 'La ballena azul es el animal más grande que existió jamás',
    descripcion: 'Puede medir más de 30 metros y pesar hasta 180 toneladas; su corazón por sí solo puede pesar tanto como un automóvil pequeño.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q42196',
  },
  {
    titulo: 'El avestruz es la ave más grande y más veloz corriendo',
    descripcion: 'No puede volar, pero corre a más de 70 km/h, y sus huevos son los más grandes que pone cualquier ave viva.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q17592',
  },
  {
    titulo: 'El pez payaso puede cambiar de sexo a lo largo de su vida',
    descripcion: 'Todos nacen machos; si la hembra dominante de un grupo muere, el macho más grande cambia de sexo para ocupar su lugar.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q472616',
  },
  {
    titulo: 'La rata topo desnuda es prácticamente inmune al cáncer',
    descripcion: 'Vive mucho más que otros roedores de su tamaño, apenas siente dolor en la piel y sus células resisten de forma natural el desarrollo de tumores.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q276290',
  },
  {
    titulo: 'La foca de Weddell puede bucear a más de 900 metros de profundidad',
    descripcion: 'Es capaz de contener la respiración por más de una hora gracias a que almacena grandes cantidades de oxígeno en la sangre y los músculos.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q313166',
  },
  {
    titulo: 'El ronroneo del gato podría ayudar a sanar huesos y tejidos',
    descripcion: 'Ronronea en una frecuencia (entre 25 y 150 Hz) que varios estudios asocian con la reducción del dolor y la estimulación de la regeneración ósea.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q146',
  },
  {
    titulo: 'El olfato del perro puede ser hasta 100.000 veces más sensible que el humano',
    descripcion: 'Tiene cientos de millones de receptores olfativos más que las personas y una porción del cerebro dedicada al olfato proporcionalmente mucho más grande.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q144',
  },
  {
    titulo: 'Algunas hormigas pueden cargar hasta 50 veces su propio peso',
    descripcion: 'Su fuerza relativa se debe a su tamaño reducido: cuanto más pequeño es un animal, proporcionalmente más gruesos y eficientes son sus músculos.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q7386',
  },
  {
    titulo: 'El gran tiburón blanco puede detectar una gota de sangre en 100 litros de agua',
    descripcion: 'Sus fosas nasales están recubiertas de receptores extremadamente sensibles que le permiten detectar rastros mínimos de sangre a gran distancia.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q129026',
  },
  {
    titulo: 'El colmillo del narval es en realidad un diente',
    descripcion: 'Ese largo cuerno en espiral, que puede superar los 2 metros, es un canino izquierdo que crece atravesando el labio superior.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q159426',
  },
]

// Sugerencias de Cronoteca para días sin obra real verificada. Estas 10 obras
// se sacaron del calendario día-exacto porque Wikidata solo registra el año
// de su estreno/publicación (sin mes ni día), así que nunca podrían ubicarse
// en un día real — quedan acá como respaldo genérico, marcadas explícitamente
// como "sugerencia" en la UI (ver App.jsx) para no aparentar precisión que no
// tienen.
export const CRONOTECA_SUGERENCIAS = [
  {
    tipo: 'libro',
    titulo: '1984',
    artista: 'George Orwell',
    descripcion: 'Novela distópica publicada en 1949. Retrato inquietante de un régimen totalitario que ha marcado la literatura del siglo XX.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q208460',
    wikipediaUrl: 'https://es.wikipedia.org/wiki/1984_(novela)',
    impacto: 'Obra fundamental sobre totalitarismo y control social',
  },
  {
    tipo: 'libro',
    titulo: 'Don Quijote de la Mancha',
    artista: 'Miguel de Cervantes',
    descripcion: 'Novela clásica publicada en 1605. Primera parte de una obra que definió la novela moderna.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q480',
    wikipediaUrl: 'https://es.wikipedia.org/wiki/Don_Quijote_de_la_Mancha',
    impacto: 'Fundacional de la novela moderna occidental',
  },
  {
    tipo: 'canción',
    titulo: 'Imagine',
    artista: 'John Lennon',
    descripcion: 'Canción de paz lanzada en 1971. Himno del movimiento de paz mundial.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q1971',
    wikipediaUrl: 'https://es.wikipedia.org/wiki/Imagine_(canci%C3%B3n_de_John_Lennon)',
    impacto: 'Una de las canciones más reconocidas del siglo XX',
  },
  {
    tipo: 'canción',
    titulo: 'A Change Is Gonna Come',
    artista: 'Sam Cooke',
    descripcion: 'Canción de protesta lanzada en 1964. Himno del movimiento de derechos civiles.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q2498428',
    wikipediaUrl: 'https://es.wikipedia.org/wiki/A_Change_Is_Gonna_Come',
    impacto: 'Declaración artística sobre justicia social',
  },
  {
    tipo: 'canción',
    titulo: 'Like a Rolling Stone',
    artista: 'Bob Dylan',
    descripcion: 'Canción revolucionaria lanzada en 1965. Transformó la música folk y el rock.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q214430',
    wikipediaUrl: 'https://es.wikipedia.org/wiki/Like_a_Rolling_Stone',
    impacto: 'Redefinió las posibilidades líricas del rock',
  },
  {
    tipo: 'libro',
    titulo: 'One Hundred Years of Solitude',
    artista: 'Gabriel García Márquez',
    descripcion: 'Novela publicada en 1967. Epopeya familiar que define el realismo mágico latinoamericano.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q178869',
    wikipediaUrl: 'https://es.wikipedia.org/wiki/Cien_a%C3%B1os_de_soledad',
    impacto: 'Obra fundacional del realismo mágico',
  },
  {
    tipo: 'libro',
    titulo: 'The Brothers Karamazov',
    artista: 'Fiódor Dostoievski',
    descripcion: 'Novela publicada entre 1879 y 1880. Exploración profunda de fe, duda y responsabilidad moral.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q183157',
    wikipediaUrl: 'https://es.wikipedia.org/wiki/Los_hermanos_Karamazov',
    impacto: 'Obra filosófica fundamental de la literatura rusa',
  },
  {
    tipo: 'libro',
    titulo: 'War and Peace',
    artista: 'León Tolstói',
    descripcion: 'Novela épica publicada entre 1865 y 1869. Retrato monumental de la sociedad rusa durante las Guerras Napoleónicas.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q161531',
    wikipediaUrl: 'https://es.wikipedia.org/wiki/Guerra_y_paz',
    impacto: 'Novela histórica de mayor envergadura',
  },
  {
    tipo: 'canción',
    titulo: 'Hey Jude',
    artista: 'The Beatles',
    descripcion: 'Canción épica lanzada en 1968. Una de las canciones más largas y exitosas del rock.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q607742',
    wikipediaUrl: 'https://es.wikipedia.org/wiki/Hey_Jude',
    impacto: 'Himno generacional del rock',
  },
  {
    tipo: 'libro',
    titulo: 'Wuthering Heights',
    artista: 'Emily Brontë',
    descripcion: 'Novela publicada en 1847. Pasión gótica que desafió las convenciones de su época.',
    wikidataUrl: 'https://www.wikidata.org/wiki/Q202975',
    wikipediaUrl: 'https://es.wikipedia.org/wiki/Cumbres_Borrascosas',
    impacto: 'Obra revolucionaria de la literatura romántica británica',
  },
]

export function elegirPorDia(lista, diaDelAnio) {
  return lista[diaDelAnio % lista.length]
}
