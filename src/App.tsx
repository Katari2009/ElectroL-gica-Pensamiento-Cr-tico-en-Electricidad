/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen,
  Target,
  Layers,
  Info,
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  FileText, 
  Trophy, 
  Clock, 
  User, 
  GraduationCap,
  AlertTriangle,
  HardHat,
  Cpu,
  Rocket,
  Volume2,
  Type,
  Contrast,
  Settings
} from 'lucide-react';
import { jsPDF } from 'jspdf';

// --- Types ---
interface Question {
  id: number;
  title: string;
  scenario: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    feedback: string;
  }[];
  category: string;
}

interface UserData {
  name: string;
  course: string;
  startTime: number;
  endTime?: number;
  score: number;
  answers: {
    questionId: number;
    selectedOptionId: string;
    isCorrect: boolean;
    section: 'CT' | 'SR';
  }[];
  selectedCTQuestionIds: number[];
  selectedSRQuestionIds: number[];
}

// --- Data ---
const CT_QUESTIONS: Question[] = [
  {
    id: 1,
    title: "El Peso de la Costumbre",
    category: "Apelación a la Tradición",
    scenario: "Un técnico veterano dice que no usa guantes dieléctricos porque 'en 20 años nunca ha pasado nada'.",
    options: [
      { id: "a", text: "La experiencia valida el riesgo.", isCorrect: false, feedback: "Error. La física no perdona la costumbre." },
      { id: "b", text: "Falacia de tradición.", isCorrect: true, feedback: "¡Correcto! La seguridad es técnica, no histórica." },
      { id: "c", text: "Sesgo de confirmación.", isCorrect: false, feedback: "No es el punto central aquí." }
    ]
  },
  {
    id: 2,
    title: "Costo Hundido",
    category: "Costo Hundido",
    scenario: "Usaste cable de calibre menor por error. Tu colega dice: 'Ya terminamos, déjalo así para no perder el día'.",
    options: [
      { id: "a", text: "Optimización de tiempo.", isCorrect: false, feedback: "Peligroso. El re-trabajo es mejor que un incendio." },
      { id: "b", text: "Falacia de costo hundido.", isCorrect: true, feedback: "¡Correcto! No arriesgues vidas por horas perdidas." }
    ]
  },
  {
    id: 3,
    title: "La Palabra del Jefe",
    category: "Ad Verecundiam (Autoridad)",
    scenario: "El jefe ordena omitir la protección térmica porque 'él sabe que aguanta'.",
    options: [
      { id: "a", text: "Obediencia jerárquica.", isCorrect: false, feedback: "La norma técnica manda sobre el cargo." },
      { id: "b", text: "Falacia de autoridad.", isCorrect: true, feedback: "¡Correcto! La verdad técnica es independiente del rango." }
    ]
  },
  {
    id: 4,
    title: "Visión de Túnel",
    category: "Sesgo de Confirmación",
    scenario: "Buscas solo fallas en rodamientos e ignoras bornes sueltos porque 'crees' que es mecánico.",
    options: [
      { id: "a", text: "Sesgo de confirmación.", isCorrect: true, feedback: "¡Correcto! Ignoras evidencia que contradice tu idea." },
      { id: "b", text: "Falsa dicotomía.", isCorrect: false, feedback: "No es una elección entre dos opciones." }
    ]
  },
  {
    id: 5,
    title: "Ataque al Colega",
    category: "Ad Hominem",
    scenario: "Rechazas una sugerencia de seguridad de un aprendiz porque 'él es nuevo y no sabe nada'.",
    options: [
      { id: "a", text: "Derecho de piso.", isCorrect: false, feedback: "Atacar a la persona no invalida su argumento técnico." },
      { id: "b", text: "Falacia Ad Hominem.", isCorrect: true, feedback: "¡Correcto! Una buena idea es válida sin importar quién la diga." }
    ]
  },
  {
    id: 6,
    title: "O todo o nada",
    category: "Falsa Dicotomía",
    scenario: "Un supervisor dice: 'O cambiamos todo el tablero o no hacemos nada'.",
    options: [
      { id: "a", text: "Falsa dicotomía.", isCorrect: true, feedback: "¡Correcto! Siempre hay opciones intermedias de reparación." },
      { id: "b", text: "Pendiente resbaladiza.", isCorrect: false, feedback: "No se asume una cadena de desastres." }
    ]
  },
  {
    id: 7,
    title: "Si permitimos esto...",
    category: "Pendiente Resbaladiza",
    scenario: "Si dejamos que usen herramientas chinas, pronto la empresa quebrará y todos seremos indigentes.",
    options: [
      { id: "a", text: "Análisis preventivo.", isCorrect: false, feedback: "Es una exageración sin base lógica." },
      { id: "b", text: "Pendiente resbaladiza.", isCorrect: true, feedback: "¡Correcto! Asumes consecuencias extremas sin pruebas." }
    ]
  },
  {
    id: 8,
    title: "El Experto Ignorante",
    category: "Efecto Dunning-Kruger",
    scenario: "Un alumno que recién aprendió a usar el multímetro cree que puede reparar una subestación solo.",
    options: [
      { id: "a", text: "Efecto Dunning-Kruger.", isCorrect: true, feedback: "¡Correcto! Sobreestima su habilidad por falta de conocimiento." },
      { id: "b", text: "Sesgo de anclaje.", isCorrect: false, feedback: "No se está basando en el primer dato recibido." }
    ]
  },
  {
    id: 9,
    title: "Generalización Apurada",
    category: "Generalización Apurada",
    scenario: "Dos interruptores de marca X fallaron, por lo tanto, toda la marca X es basura.",
    options: [
      { id: "a", text: "Control de calidad.", isCorrect: false, feedback: "Muestra insuficiente para juzgar a toda la marca." },
      { id: "b", text: "Generalización apurada.", isCorrect: true, feedback: "¡Correcto! Concluyes demasiado con muy poca evidencia." }
    ]
  },
  {
    id: 10,
    title: "Falsa Causalidad",
    category: "Post Hoc Ergo Propter Hoc",
    scenario: "Cambié la ampolleta y justo se cortó la luz en la cuadra. ¡Yo causé el apagón!",
    options: [
      { id: "a", text: "Falsa causalidad.", isCorrect: true, feedback: "¡Correcto! Coincidencia temporal no implica causa." },
      { id: "b", text: "Ad Ignorantiam.", isCorrect: false, feedback: "No se basa en la falta de prueba contraria." }
    ]
  },
  {
    id: 11,
    title: "Razonamiento Circular",
    category: "Petición de Principio",
    scenario: "Este plano es correcto porque yo lo hice, y yo no cometo errores en los planos.",
    options: [
      { id: "a", text: "Confianza profesional.", isCorrect: false, feedback: "Es un círculo vicioso que no prueba nada." },
      { id: "b", text: "Razonamiento circular.", isCorrect: true, feedback: "¡Correcto! La conclusión ya está en la premisa." }
    ]
  },
  {
    id: 12,
    title: "Hombre de Paja",
    category: "Hombre de Paja",
    scenario: "Dices que hay que revisar la tierra. Tu jefe responde: '¿O sea que crees que soy un irresponsable?'.",
    options: [
      { id: "a", text: "Hombre de paja.", isCorrect: true, feedback: "¡Correcto! Deforma tu argumento para atacarlo más fácil." },
      { id: "b", text: "Ad Hominem.", isCorrect: false, feedback: "Es una distorsión del argumento, no un ataque directo." }
    ]
  },
  {
    id: 13,
    title: "Prueba de Ignorancia",
    category: "Ad Ignorantiam",
    scenario: "Nadie ha probado que el arco eléctrico sea mortal a esta distancia, así que es seguro.",
    options: [
      { id: "a", text: "Principio de incertidumbre.", isCorrect: false, feedback: "La falta de prueba no es prueba de seguridad." },
      { id: "b", text: "Apelación a la ignorancia.", isCorrect: true, feedback: "¡Correcto! Asumir algo como falso solo porque no se ha probado." }
    ]
  },
  {
    id: 14,
    title: "Efecto Arrastre",
    category: "Ad Populum",
    scenario: "Todos los eléctricos del sindicato dicen que esa norma es inútil, así que no la sigas.",
    options: [
      { id: "a", text: "Efecto arrastre.", isCorrect: true, feedback: "¡Correcto! La mayoría no siempre tiene la razón técnica." },
      { id: "b", text: "Falacia de autoridad.", isCorrect: false, feedback: "Se refiere a la masa, no a una figura de poder." }
    ]
  },
  {
    id: 15,
    title: "Pista Falsa",
    category: "Red Herring",
    scenario: "Te preguntan por qué no usaste casco. Respondes: '¿Sabías que el cobre subió de precio ayer?'.",
    options: [
      { id: "a", text: "Pista falsa.", isCorrect: true, feedback: "¡Correcto! Desvías la atención del tema principal." },
      { id: "b", text: "Falsa dicotomía.", isCorrect: false, feedback: "No estás ofreciendo dos opciones." }
    ]
  },
  {
    id: 16,
    title: "Evidencia Anecdótica",
    category: "Evidencia Anecdótica",
    scenario: "Mi abuelo trabajó 50 años con cables pelados y murió de viejo. Las normas son exageradas.",
    options: [
      { id: "a", text: "Evidencia anecdótica.", isCorrect: true, feedback: "¡Correcto! Un caso aislado no anula la estadística de riesgo." },
      { id: "b", text: "Tradición.", isCorrect: false, feedback: "Se basa en un relato personal, no en una costumbre social." }
    ]
  },
  {
    id: 17,
    title: "Efecto Halo",
    category: "Efecto Halo",
    scenario: "Como esa marca de herramientas hace buenos destornilladores, sus multímetros deben ser los mejores.",
    options: [
      { id: "a", text: "Efecto Halo.", isCorrect: true, feedback: "¡Correcto! Extiendes una virtud a áreas no relacionadas." },
      { id: "b", text: "Confirmación.", isCorrect: false, feedback: "Es una generalización de prestigio." }
    ]
  },
  {
    id: 18,
    title: "Sesgo de Disponibilidad",
    category: "Disponibilidad",
    scenario: "No quiero trabajar en altura porque ayer vi un video de una caída, aunque las escalas son nuevas.",
    options: [
      { id: "a", text: "Sesgo de disponibilidad.", isCorrect: true, feedback: "¡Correcto! Juzgas el riesgo por la facilidad de recordar un ejemplo." },
      { id: "b", text: "Pendiente resbaladiza.", isCorrect: false, feedback: "Es un miedo basado en memoria reciente." }
    ]
  },
  {
    id: 19,
    title: "Anclaje",
    category: "Anclaje",
    scenario: "El primer presupuesto fue de 1M. El segundo es de 800k y te parece barato, aunque valga 500k.",
    options: [
      { id: "a", text: "Sesgo de anclaje.", isCorrect: true, feedback: "¡Correcto! Te quedas pegado al primer número que escuchas." },
      { id: "b", text: "Costo hundido.", isCorrect: false, feedback: "No has invertido dinero aún." }
    ]
  },
  {
    id: 20,
    title: "Sesgo de Auto-conveniencia",
    category: "Auto-conveniencia",
    scenario: "Si el motor funciona, es por mi habilidad. Si falla, es porque el cableado era viejo.",
    options: [
      { id: "a", text: "Sesgo de auto-conveniencia.", isCorrect: true, feedback: "¡Correcto! Te llevas el crédito y culpas al entorno de los fallos." },
      { id: "b", text: "Ad Hominem.", isCorrect: false, feedback: "No estás atacando a nadie directamente." }
    ]
  }
];

const SR_QUESTIONS: Question[] = [
  {
    id: 101,
    title: "Residuos Peligrosos",
    category: "Responsabilidad Ambiental",
    scenario: "Terminas una obra y te sobran trozos de cable de plomo y baterías viejas. Tu jefe dice que los tires al contenedor de basura común.",
    options: [
      { id: "a", text: "Obedecer para ahorrar tiempo.", isCorrect: false, feedback: "Incorrecto. Los residuos eléctricos requieren manejo especial." },
      { id: "b", text: "Gestionar reciclaje especializado.", isCorrect: true, feedback: "¡Correcto! La responsabilidad ambiental es parte de la ética técnica." }
    ]
  },
  {
    id: 102,
    title: "Seguridad Comunitaria",
    category: "Responsabilidad Social",
    scenario: "Ves un poste con cables colgando cerca de una escuela. No es tu zona de trabajo ni tu empresa.",
    options: [
      { id: "a", text: "Seguir de largo, no es mi problema.", isCorrect: false, feedback: "Incorrecto. Como técnico, tienes el deber de reportar riesgos públicos." },
      { id: "b", text: "Reportar a la compañía eléctrica.", isCorrect: true, feedback: "¡Correcto! La seguridad de la comunidad es responsabilidad de todos los expertos." }
    ]
  },
  {
    id: 103,
    title: "Honestidad en el Cobro",
    category: "Ética Profesional",
    scenario: "Un cliente no sabe nada de electricidad. La falla es solo un fusible, pero podrías cobrarle por cambiar todo el tablero.",
    options: [
      { id: "a", text: "Cobrar el tablero para ganar más.", isCorrect: false, feedback: "Incorrecto. La honestidad construye confianza y prestigio profesional." },
      { id: "b", text: "Cobrar solo lo justo y explicar la falla.", isCorrect: true, feedback: "¡Correcto! La integridad es la base de la responsabilidad individual." }
    ]
  },
  {
    id: 104,
    title: "Mentoria al Aprendiz",
    category: "Responsabilidad Individual",
    scenario: "Un aprendiz comete un error menor. Tienes la opción de humillarlo frente a todos o enseñarle en privado.",
    options: [
      { id: "a", text: "Humillarlo para que aprenda.", isCorrect: false, feedback: "Incorrecto. El maltrato daña el ambiente laboral y el aprendizaje." },
      { id: "b", text: "Enseñarle de forma constructiva.", isCorrect: true, feedback: "¡Correcto! Formar a las nuevas generaciones es una responsabilidad ética." }
    ]
  },
  {
    id: 105,
    title: "Uso de Materiales",
    category: "Responsabilidad Social",
    scenario: "Te ofrecen materiales robados a mitad de precio para una instalación social.",
    options: [
      { id: "a", text: "Aceptar para ayudar a la gente.", isCorrect: false, feedback: "Incorrecto. Fomentar el robo daña a toda la sociedad y es ilegal." },
      { id: "b", text: "Rechazar y comprar legalmente.", isCorrect: true, feedback: "¡Correcto! La procedencia de los materiales define tu ética." }
    ]
  },
  {
    id: 106,
    title: "Eficiencia Energética",
    category: "Responsabilidad Ambiental",
    scenario: "Un cliente quiere instalar luces de alto consumo. Sabes que existen opciones LED mucho más eficientes.",
    options: [
      { id: "a", text: "Instalar lo que pide sin decir nada.", isCorrect: false, feedback: "Incorrecto. Asesorar sobre eficiencia es parte de tu rol social." },
      { id: "b", text: "Sugerir la opción eficiente.", isCorrect: true, feedback: "¡Correcto! Ayudar a reducir el consumo beneficia al planeta y al cliente." }
    ]
  },
  {
    id: 107,
    title: "Denuncia de Riesgos",
    category: "Responsabilidad Individual",
    scenario: "Ves a un colega trabajando sin arnés en altura. Si lo reportas, se enojará contigo.",
    options: [
      { id: "a", text: "Callar para evitar conflictos.", isCorrect: false, feedback: "Incorrecto. El silencio te hace cómplice de un posible accidente fatal." },
      { id: "b", text: "Intervenir o reportar el riesgo.", isCorrect: true, feedback: "¡Correcto! Cuidar la vida de los compañeros es la mayor responsabilidad." }
    ]
  },
  {
    id: 108,
    title: "Certificaciones Falsas",
    category: "Ética Profesional",
    scenario: "Te piden firmar una certificación TE1 de una instalación que no revisaste personalmente.",
    options: [
      { id: "a", text: "Firmar para hacer el favor.", isCorrect: false, feedback: "Incorrecto. Tu firma garantiza seguridad; nunca firmes a ciegas." },
      { id: "b", text: "Negarte si no puedes inspeccionar.", isCorrect: true, feedback: "¡Correcto! La fe pública de tu firma es sagrada." }
    ]
  },
  {
    id: 109,
    title: "Impacto en el Vecindario",
    category: "Responsabilidad Social",
    scenario: "Para terminar rápido, dejas escombros y cables en la vereda obstruyendo el paso de sillas de ruedas.",
    options: [
      { id: "a", text: "Limpiar mañana, hoy estoy cansado.", isCorrect: false, feedback: "Incorrecto. El espacio público debe respetarse siempre." },
      { id: "b", text: "Limpiar y despejar de inmediato.", isCorrect: true, feedback: "¡Correcto! El respeto al entorno es responsabilidad ciudadana." }
    ]
  },
  {
    id: 110,
    title: "Ahorro de Agua y Energía",
    category: "Responsabilidad Ambiental",
    scenario: "En la faena, dejan las luces del campamento encendidas todo el día 'porque la empresa paga'.",
    options: [
      { id: "a", text: "No es mi dinero, no importa.", isCorrect: false, feedback: "Incorrecto. El desperdicio de energía afecta a todos." },
      { id: "b", text: "Apagar y promover el ahorro.", isCorrect: true, feedback: "¡Correcto! La conciencia ambiental empieza por pequeñas acciones." }
    ]
  },
  {
    id: 111,
    title: "Trato Igualitario",
    category: "Responsabilidad Social",
    scenario: "Un cliente te trata mal por tu apariencia. Tienes la tentación de dejarle un cable suelto a propósito.",
    options: [
      { id: "a", text: "Vengarse sutilmente.", isCorrect: false, feedback: "Incorrecto. Un profesional nunca compromete la seguridad por rencor." },
      { id: "b", text: "Mantener el profesionalismo.", isCorrect: true, feedback: "¡Correcto! Tu ética está por encima de las ofensas personales." }
    ]
  },
  {
    id: 112,
    title: "Uso de Herramientas",
    category: "Responsabilidad Individual",
    scenario: "Usas un destornillador como cincel, sabiendo que podrías dañarlo y que otro colega lo necesitará después.",
    options: [
      { id: "a", text: "Es solo una herramienta.", isCorrect: false, feedback: "Incorrecto. Cuidar el equipo común es respeto al trabajo de todos." },
      { id: "b", text: "Usar la herramienta adecuada.", isCorrect: true, feedback: "¡Correcto! La responsabilidad individual incluye el cuidado de los activos." }
    ]
  },
  {
    id: 113,
    title: "Información al Cliente",
    category: "Responsabilidad Social",
    scenario: "Instalas un sistema solar. El cliente no entiende el mantenimiento. ¿Qué haces?",
    options: [
      { id: "a", text: "Irme rápido, ya cobré.", isCorrect: false, feedback: "Incorrecto. La educación del usuario previene accidentes." },
      { id: "b", text: "Explicar el manual pacientemente.", isCorrect: true, feedback: "¡Correcto! Empoderar al cliente es responsabilidad social." }
    ]
  },
  {
    id: 114,
    title: "Consumo de Sustancias",
    category: "Responsabilidad Individual",
    scenario: "Un compañero llega con hálito alcohólico a trabajar en baja tensión.",
    options: [
      { id: "a", text: "Cubrirlo para que no lo echen.", isCorrect: false, feedback: "Incorrecto. Estás permitiendo que arriesgue su vida y la de otros." },
      { id: "b", text: "Informar al supervisor de inmediato.", isCorrect: true, feedback: "¡Correcto! La seguridad no admite complicidad en negligencias." }
    ]
  },
  {
    id: 115,
    title: "Respeto a la Privacidad",
    category: "Ética Profesional",
    scenario: "Trabajando en una casa, ves documentos privados del cliente. ¿Qué haces?",
    options: [
      { id: "a", text: "Leerlos por curiosidad.", isCorrect: false, feedback: "Incorrecto. La confidencialidad es un pilar de la ética." },
      { id: "b", text: "Ignorarlos y respetar la privacidad.", isCorrect: true, feedback: "¡Correcto! El respeto al hogar del cliente es fundamental." }
    ]
  },
  {
    id: 116,
    title: "Cuidado del Patrimonio",
    category: "Responsabilidad Social",
    scenario: "Debes hacer una canalización en un edificio histórico. Hacerlo por fuera es más fácil pero daña la fachada.",
    options: [
      { id: "a", text: "Hacerlo por fuera, es más rápido.", isCorrect: false, feedback: "Incorrecto. Debemos preservar el valor estético y cultural." },
      { id: "b", text: "Buscar una ruta oculta y respetuosa.", isCorrect: true, feedback: "¡Correcto! La estética urbana es responsabilidad del técnico." }
    ]
  },
  {
    id: 117,
    title: "Reporte de Incidentes",
    category: "Responsabilidad Individual",
    scenario: "Causaste un pequeño chispazo por descuido. No pasó nada grave, pero podría haber pasado.",
    options: [
      { id: "a", text: "Ocultarlo para no quedar mal.", isCorrect: false, feedback: "Incorrecto. Reportar 'casi-accidentes' previene tragedias futuras." },
      { id: "b", text: "Reportar para analizar la causa.", isCorrect: true, feedback: "¡Correcto! La honestidad técnica salva vidas." }
    ]
  },
  {
    id: 118,
    title: "Solidaridad Técnica",
    category: "Responsabilidad Social",
    scenario: "Ves a un colega de otra empresa con problemas para entender un diagrama que tú conoces bien.",
    options: [
      { id: "a", text: "Burlarme de su falta de conocimiento.", isCorrect: false, feedback: "Incorrecto. La soberbia no ayuda al gremio." },
      { id: "b", text: "Ofrecer ayuda desinteresada.", isCorrect: true, feedback: "¡Correcto! La colaboración fortalece la comunidad técnica." }
    ]
  },
  {
    id: 119,
    title: "Uso de EPP",
    category: "Responsabilidad Individual",
    scenario: "Hace mucho calor y el casco te molesta. Estás solo en la zona de trabajo.",
    options: [
      { id: "a", text: "Quitármelo un rato.", isCorrect: false, feedback: "Incorrecto. La seguridad no depende de quién te mire." },
      { id: "b", text: "Mantener el casco puesto.", isCorrect: true, feedback: "¡Correcto! La responsabilidad individual es autodisciplina." }
    ]
  },
  {
    id: 120,
    title: "Publicidad Engañosa",
    category: "Ética Profesional",
    scenario: "Te piden poner en tu publicidad que eres 'Ingeniero' cuando aún eres técnico nivel medio.",
    options: [
      { id: "a", text: "Ponerlo para conseguir más clientes.", isCorrect: false, feedback: "Incorrecto. Mentir sobre tus títulos es fraude y falta de ética." },
      { id: "b", text: "Poner tu título real con orgullo.", isCorrect: true, feedback: "¡Correcto! La verdad es la base de la responsabilidad profesional." }
    ]
  }
];

const QUESTIONS_PER_SESSION = 7;

// --- Components ---

const DynamicBackground = memo(({ step, section }: { step: string, section: string }) => {
  // Dynamic colors based on section
  const primaryColor = section === 'SR' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(59, 130, 246, 0.4)';
  const secondaryColor = section === 'SR' ? 'rgba(5, 150, 105, 0.3)' : 'rgba(37, 99, 235, 0.3)';
  const accentColor = step === 'results' ? 'rgba(234, 179, 8, 0.5)' : primaryColor;

  // Memoize particles to prevent re-calculation on every render
  const energyBolts = useMemo(() => [...Array(4)], []);
  const celebrationParticles = useMemo(() => [...Array(25)], []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#010413]">
      {/* Intense Moving Gradients - Optimized Blur */}
      <div className="absolute inset-0 opacity-60">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: ['-10%', '10%', '-10%'],
            y: ['-10%', '10%', '-10%']
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-full h-full rounded-full blur-[100px] will-change-transform"
          style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }}
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: ['10%', '-10%', '10%'],
            y: ['10%', '-10%', '10%']
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 right-0 w-full h-full rounded-full blur-[100px] will-change-transform"
          style={{ background: `radial-gradient(circle, ${secondaryColor} 0%, transparent 70%)` }}
        />
      </div>

      {/* Technical Grid Overlay - Optimized opacity */}
      <div className="absolute inset-0 opacity-[0.2] animate-flow" 
           style={{ 
             backgroundImage: `linear-gradient(to right, ${section === 'SR' ? '#10b981' : '#3b82f6'} 2px, transparent 2px), linear-gradient(to bottom, ${section === 'SR' ? '#10b981' : '#3b82f6'} 2px, transparent 2px)`,
             backgroundSize: '100px 100px',
             maskImage: 'radial-gradient(circle at center, black, transparent 80%)'
           }} />

      {/* High-Voltage Energy Bolts - Reduced count and simplified */}
      <div className="absolute inset-0">
        {energyBolts.map((_, i) => (
          <motion.div
            key={i}
            animate={{
              opacity: [0, 0.8, 0],
              x: ['-100%', '200%']
            }}
            transition={{
              duration: 2 + i * 0.5,
              repeat: Infinity,
              delay: i * 1.2,
              ease: "easeInOut"
            }}
            className={`absolute h-[2px] w-full blur-[1px] will-change-transform ${section === 'SR' ? 'bg-emerald-400' : 'bg-blue-400'}`}
            style={{ top: `${15 + (i * 20)}%` }}
          />
        ))}
      </div>

      {/* Results Celebration - Optimized particle count */}
      {step === 'results' && (
        <div className="absolute inset-0 overflow-hidden">
          {celebrationParticles.map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -100, x: `${(i * 4) % 100}%` }}
              animate={{ 
                y: ['0vh', '110vh'],
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 1.5 + (i % 3) * 0.5, 
                repeat: Infinity, 
                delay: (i % 10) * 0.2,
                ease: "linear"
              }}
              className="absolute w-[3px] h-20 bg-gradient-to-b from-yellow-200 to-transparent blur-[1px] will-change-transform"
              style={{ boxShadow: '0 0 15px rgba(234,179,8,0.5)' }}
            />
          ))}
        </div>
      )}

      {/* Constant Scanning Beam - Simplified */}
      <motion.div 
        animate={{ y: ['-100%', '200%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-[40vh] bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none blur-lg will-change-transform"
      />

      {/* Dark Vignette for Focus */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(1,4,19,0.9)_100%)]" />
    </div>
  );
});
DynamicBackground.displayName = 'DynamicBackground';

const Logo = ({ className = "" }: { className?: string }) => (
  <div className={`flex flex-col leading-none ${className}`}>
    {/* Texto Principal */}
    <span className="font-sans font-black text-lg tracking-tighter text-white italic">
      PACE-UDA
    </span>
    {/* Subtítulo Regional */}
    <span className="text-[8px] font-black tracking-[0.2em] text-blue-400 uppercase">
      ATACAMA
    </span>
  </div>
);

export default function App() {
  const [step, setStep] = useState<'onboarding' | 'pedagogical-info' | 'selection' | 'quiz' | 'results' | 'review'>('onboarding');
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentSection, setCurrentSection] = useState<'CT' | 'SR'>('CT');
  const [completedSections, setCompletedSections] = useState<('CT' | 'SR')[]>([]);
  
  // Accessibility States
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
  const [highContrast, setHighContrast] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-CL';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };
  const [userData, setUserData] = useState<UserData>(() => {
    const saved = localStorage.getItem('electrologica_user');
    return saved ? JSON.parse(saved) : {
      name: '',
      course: '',
      startTime: 0,
      score: 0,
      answers: [],
      selectedCTQuestionIds: [],
      selectedSRQuestionIds: []
    };
  });

  useEffect(() => {
    const ctIds = userData.selectedCTQuestionIds || [];
    const srIds = userData.selectedSRQuestionIds || [];
    
    if (currentSection === 'CT' && ctIds.length > 0) {
      setActiveQuestions(CT_QUESTIONS.filter(q => ctIds.includes(q.id)));
    } else if (currentSection === 'SR' && srIds.length > 0) {
      setActiveQuestions(SR_QUESTIONS.filter(q => srIds.includes(q.id)));
    }
  }, [userData.selectedCTQuestionIds, userData.selectedSRQuestionIds, currentSection]);

  useEffect(() => {
    localStorage.setItem('electrologica_user', JSON.stringify(userData));
  }, [userData]);

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const startQuiz = (e: FormEvent) => {
    e.preventDefault();
    if (!userData.name || !userData.course) return;
    
    // Select random questions for both sections
    const shuffledCT = [...CT_QUESTIONS].sort(() => 0.5 - Math.random());
    const selectedCT = shuffledCT.slice(0, QUESTIONS_PER_SESSION);
    
    const shuffledSR = [...SR_QUESTIONS].sort(() => 0.5 - Math.random());
    const selectedSR = shuffledSR.slice(0, QUESTIONS_PER_SESSION);
    
    setUserData(prev => ({
      ...prev,
      selectedCTQuestionIds: selectedCT.map(q => q.id),
      selectedSRQuestionIds: selectedSR.map(q => q.id),
      answers: [],
      score: 0,
      startTime: 0,
      endTime: undefined
    }));
    
    setCurrentSection('CT');
    setCompletedSections([]);
    setActiveQuestions(selectedCT);
    setCurrentQuestionIdx(0);
    setSelectedOptionId(null);
    setShowFeedback(false);
    
    setStep('pedagogical-info');
  };

  const beginEvaluation = () => {
    setUserData(prev => ({ ...prev, startTime: Date.now() }));
    setStep('selection');
  };

  const selectSection = (section: 'CT' | 'SR') => {
    setCurrentSection(section);
    setCurrentQuestionIdx(0);
    setSelectedOptionId(null);
    setShowFeedback(false);
    setStep('quiz');
  };

  const handleAnswer = (optionId: string, isCorrect: boolean) => {
    if (selectedOptionId) return;
    
    setSelectedOptionId(optionId);
    setShowFeedback(true);
    
    const pointsPerQuestion = 100 / (QUESTIONS_PER_SESSION * 2);
    
    setUserData(prev => ({
      ...prev,
      score: isCorrect ? Math.round(prev.score + pointsPerQuestion) : prev.score,
      answers: [...prev.answers, {
        questionId: activeQuestions[currentQuestionIdx].id,
        selectedOptionId: optionId,
        isCorrect,
        section: currentSection
      }]
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIdx < activeQuestions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedOptionId(null);
      setShowFeedback(false);
    } else {
      const newCompleted = [...completedSections, currentSection];
      setCompletedSections(newCompleted);
      
      if (newCompleted.length < 2) {
        // Return to selection screen to choose the next section
        setStep('selection');
      } else {
        setUserData(prev => ({ ...prev, endTime: Date.now(), score: Math.min(prev.score, 100) }));
        setStep('results');
      }
    }
  };

  const calculateTime = () => {
    if (!userData.endTime) return '0s';
    const diff = Math.floor((userData.endTime - userData.startTime) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getRank = () => {
    if (userData.score >= 95) return "Maestro en Lógica y Ética";
    if (userData.score >= 70) return "Técnico Especialista";
    if (userData.score >= 40) return "Técnico en Formación";
    return "Ayudante / Aprendiz";
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();
    const duration = calculateTime();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`Liceo El Palomar - Copiapó | Programa de Integración Escolar (PIE)`, 105, 25, { align: 'center' });
    
    doc.setFontSize(22);
    doc.text("REPORTE: ELECTROLOGICA", 20, 25);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Estudiante: ${userData.name}`, 20, 50);
    doc.text(`Curso: ${userData.course}`, 20, 58);
    doc.text(`Fecha: ${timestamp}`, 20, 66);
    doc.text(`Tiempo: ${duration}`, 20, 74);
    doc.text(`Puntaje: ${userData.score}/100`, 20, 82);
    doc.text(`Rango: ${getRank()}`, 20, 90);

    doc.line(20, 95, 190, 95);
    doc.setFontSize(14);
    doc.text("Desglose de Actividades:", 20, 105);
    
    let yPos = 115;
    
    const sections = [
      { id: 'CT', label: 'SECCIÓN 1: PENSAMIENTO CRÍTICO' },
      { id: 'SR', label: 'SECCIÓN 2: RESPONSABILIDAD SOCIAL E INDIVIDUAL' }
    ];

    sections.forEach(sec => {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 100, 200);
      doc.text(sec.label, 20, yPos);
      yPos += 10;
      doc.setTextColor(0, 0, 0);

      const sectionAnswers = userData.answers.filter(a => a.section === sec.id);
      sectionAnswers.forEach((ans, idx) => {
        const bank = sec.id === 'CT' ? CT_QUESTIONS : SR_QUESTIONS;
        const q = bank.find(q => q.id === ans.questionId)!;
        const opt = q.options.find(o => o.id === ans.selectedOptionId)!;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`${idx + 1}. ${q.title} (${q.category})`, 20, yPos);
        yPos += 6;
        
        doc.setFont("helvetica", "normal");
        const splitScenario = doc.splitTextToSize(q.scenario, 170);
        doc.text(splitScenario, 20, yPos);
        yPos += (splitScenario.length * 5) + 2;
        
        doc.setTextColor(ans.isCorrect ? 0 : 200, ans.isCorrect ? 150 : 0, 0);
        doc.text(`Resultado: ${ans.isCorrect ? 'CORRECTO' : 'INCORRECTO'}`, 20, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 5;
        
        const splitFeedback = doc.splitTextToSize(`Feedback: ${opt.feedback}`, 170);
        doc.text(splitFeedback, 20, yPos);
        yPos += (splitFeedback.length * 5) + 10;

        if (yPos > 270) { doc.addPage(); yPos = 20; }
      });
      yPos += 5;
    });

    doc.save(`Reporte_ElectroLogica_${userData.name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-blue-500/30 transition-colors duration-300 relative bg-transparent ${
      highContrast ? 'bg-black text-white' : 'text-slate-100'
    } ${fontSize === 'large' ? 'text-lg' : 'text-base'}`}>
      {/* Dynamic Background - Ensuring it's behind everything but visible */}
      {!highContrast && (
        <DynamicBackground step={step} section={currentSection} />
      )}

      {/* Main Content Wrapper */}
      <div className="relative z-10">
        {/* Accessibility Toolbar */}
        <div className="fixed top-4 right-4 z-50 flex gap-2">
        <div className="hidden sm:block mr-4 p-2 bg-black rounded-xl border border-slate-800 shadow-xl">
          <Logo className="scale-90" />
        </div>
        <button
          onClick={() => setHighContrast(!highContrast)}
          className={`p-3 rounded-full shadow-lg transition-all ${
            highContrast ? 'bg-yellow-400 text-black' : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
          title="Modo Alto Contraste"
        >
          <Contrast className="w-5 h-5" />
        </button>
        <button
          onClick={() => setFontSize(fontSize === 'normal' ? 'large' : 'normal')}
          className={`p-3 rounded-full shadow-lg transition-all border-2 ${
            fontSize === 'large' ? 'bg-blue-500 text-white border-blue-400 scale-110' : 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700'
          }`}
          title="Aumentar Tamaño de Letra"
        >
          <Type className="w-5 h-5" />
        </button>
        {isSpeaking && (
          <button
            onClick={stopSpeaking}
            className="p-3 rounded-full bg-red-500 text-white shadow-lg animate-pulse"
            title="Detener Lectura"
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Background Decoration */}
      {!highContrast && (
        <DynamicBackground step={step} section={currentSection} />
      )}

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Mobile Logo */}
        <div className="sm:hidden flex justify-center mb-6">
          <div className="p-2 bg-black rounded-xl border border-slate-800 shadow-xl">
            <Logo />
          </div>
        </div>
        <AnimatePresence mode="wait">
          {step === 'onboarding' && (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl ${fontSize === 'large' ? 'space-y-10' : 'space-y-0'}`}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20 animate-float">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className={`font-bold tracking-tight ${fontSize === 'large' ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'}`}>ElectroLógica</h1>
                  <p className={`text-slate-400 font-medium ${fontSize === 'large' ? 'text-lg' : 'text-base'}`}>Liceo El Palomar - Copiapó</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h2 className={`font-semibold text-blue-400 ${fontSize === 'large' ? 'text-2xl' : 'text-xl'}`}>Bienvenido, Técnico</h2>
                    <p className={`text-slate-300 leading-relaxed ${fontSize === 'large' ? 'text-2xl' : 'text-base'}`}>
                      Bienvenido al portal de aprendizaje inclusivo del Liceo El Palomar. 
                      Esta herramienta está diseñada para que todos los técnicos puedan aprender sobre seguridad y lógica sin barreras.
                    </p>
                  <ul className="space-y-3">
                    {[
                      { icon: ShieldAlert, text: "4 Escenarios Críticos" },
                      { icon: Cpu, text: "Análisis de Falacias" },
                      { icon: FileText, text: "Reporte Profesional PDF" }
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-400">
                        <item.icon className={`text-yellow-500 ${fontSize === 'large' ? 'w-7 h-7' : 'w-5 h-5'}`} />
                        <span className={fontSize === 'large' ? 'text-xl' : 'text-base'}>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <form onSubmit={startQuiz} className="space-y-6 bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                  <div className="space-y-2">
                    <label className={`font-medium text-slate-400 flex items-center gap-2 ${fontSize === 'large' ? 'text-lg' : 'text-sm'}`}>
                      <User className="w-4 h-4" /> Nombre Completo
                    </label>
                    <input
                      required
                      type="text"
                      value={userData.name}
                      onChange={e => setUserData(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${fontSize === 'large' ? 'text-xl' : 'text-base'}`}
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`font-medium text-slate-400 flex items-center gap-2 ${fontSize === 'large' ? 'text-lg' : 'text-sm'}`}>
                      <GraduationCap className="w-4 h-4" /> Curso / Especialidad
                    </label>
                    <select
                      required
                      value={userData.course}
                      onChange={e => setUserData(prev => ({ ...prev, course: e.target.value }))}
                      className={`w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none ${fontSize === 'large' ? 'text-xl' : 'text-base'}`}
                    >
                      <option value="" disabled>Selecciona tu curso</option>
                      <option value="3ºE Electricidad">3ºE Electricidad</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group active:scale-95 hover:animate-shake"
                  >
                    Iniciar Evaluación
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {step === 'pedagogical-info' && (
            <motion.div
              key="pedagogical-info"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-yellow-500 rounded-2xl shadow-lg shadow-yellow-600/20 animate-float">
                  <BookOpen className={`text-slate-950 ${fontSize === 'large' ? 'w-10 h-10' : 'w-8 h-8'}`} />
                </div>
                <div>
                  <h2 className={`font-bold tracking-tight ${fontSize === 'large' ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'}`}>Contexto Pedagógico</h2>
                  <p className={`text-slate-400 ${fontSize === 'large' ? 'text-lg' : 'text-base'}`}>Programa de Integración Escolar (PIE)</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-6">
                  <div className={`bg-slate-950/50 p-5 rounded-2xl border border-slate-800 ${highContrast ? 'border-yellow-400' : ''}`}>
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                      <Target className="w-5 h-5" />
                      <span className={`font-bold uppercase tracking-wider ${fontSize === 'large' ? 'text-base' : 'text-sm'}`}>Objetivo</span>
                    </div>
                    <p className={`text-slate-300 leading-relaxed ${fontSize === 'large' ? 'text-xl' : 'text-sm'}`}>
                      Identificar errores de razonamiento en el trabajo eléctrico para mejorar la seguridad de todos.
                    </p>
                  </div>

                  <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-2 text-yellow-500 mb-2">
                      <Layers className="w-5 h-5" />
                      <span className={`font-bold uppercase tracking-wider ${fontSize === 'large' ? 'text-base' : 'text-sm'}`}>Unidad</span>
                    </div>
                    <p className={`text-slate-300 leading-relaxed ${fontSize === 'large' ? 'text-lg' : 'text-sm'}`}>
                      Lógica, Falacias y Sesgos Cognitivos en el Contexto Laboral.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                      <Info className="w-5 h-5" />
                      <span className={`font-bold uppercase tracking-wider ${fontSize === 'large' ? 'text-base' : 'text-sm'}`}>Temática y Contenido</span>
                    </div>
                    <ul className={`text-slate-300 space-y-2 ${fontSize === 'large' ? 'text-lg' : 'text-sm'}`}>
                      <li className="flex gap-2">
                        <span className="text-blue-500 font-bold">1.</span>
                        Pensamiento Crítico: Falacias y Sesgos.
                      </li>
                      <li className="flex gap-2">
                        <span className="text-blue-500 font-bold">2.</span>
                        Responsabilidad Social e Individual: Ética y Ciudadanía.
                      </li>
                      <li className="flex gap-2">
                        <span className="text-blue-500 font-bold">3.</span>
                        Seguridad y Medio Ambiente en Electricidad.
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-2 text-purple-400 mb-2">
                      <GraduationCap className="w-5 h-5" />
                      <span className={`font-bold uppercase tracking-wider ${fontSize === 'large' ? 'text-base' : 'text-sm'}`}>Dirigido a</span>
                    </div>
                    <p className={`text-slate-300 leading-relaxed ${fontSize === 'large' ? 'text-lg' : 'text-sm'}`}>
                      Estudiantes de 3º Medio - Especialidad: Electricidad. (Asignatura: Filosofía / Educación Ciudadana).
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <button
                  onClick={() => setStep('onboarding')}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 rounded-xl transition-all"
                >
                  Volver al Registro
                </button>
                <button
                  onClick={beginEvaluation}
                  className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group active:scale-95 hover:animate-shake"
                >
                  Entendido, Comenzar Evaluación
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <h2 className={`font-bold tracking-tight ${fontSize === 'large' ? 'text-4xl' : 'text-3xl'}`}>Elige tu punto de partida</h2>
                <p className={`text-slate-400 max-w-lg mx-auto ${fontSize === 'large' ? 'text-xl' : 'text-base'}`}>
                  Ambas secciones son obligatorias para completar la evaluación. Selecciona con cuál deseas comenzar.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Card 1: Pensamiento Crítico */}
                <button
                  onClick={() => !completedSections.includes('CT') && selectSection('CT')}
                  disabled={completedSections.includes('CT')}
                  className={`group relative border rounded-3xl p-8 text-left transition-all duration-300 overflow-hidden active:scale-95 ${
                    completedSections.includes('CT')
                    ? 'bg-blue-500/10 border-blue-500/50 cursor-default'
                    : 'bg-slate-900/50 hover:bg-slate-800/80 border-slate-800 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/20'
                  } ${fontSize === 'large' ? 'p-10' : 'p-8'}`}
                >
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Cpu className={fontSize === 'large' ? 'w-32 h-32' : 'w-24 h-24'} />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <div className={`p-3 rounded-2xl w-fit ${completedSections.includes('CT') ? 'bg-blue-500 text-white' : 'bg-blue-500/10'}`}>
                      {completedSections.includes('CT') ? <CheckCircle2 className="w-8 h-8" /> : <Cpu className="w-8 h-8 text-blue-400" />}
                    </div>
                    <div>
                      <h3 className={`font-bold mb-2 ${fontSize === 'large' ? 'text-2xl' : 'text-xl'}`}>SECCIÓN PENSAMIENTO CRÍTICO</h3>
                      <p className={`text-slate-400 leading-relaxed ${fontSize === 'large' ? 'text-lg' : 'text-sm'}`}>
                        Análisis de falacias y sesgos cognitivos aplicados a la seguridad eléctrica.
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 font-bold pt-4 ${completedSections.includes('CT') ? 'text-blue-400' : 'text-blue-400'} ${fontSize === 'large' ? 'text-lg' : 'text-sm'}`}>
                      {completedSections.includes('CT') ? (
                        <span className="flex items-center gap-2">Sección Completada <CheckCircle2 className="w-4 h-4" /></span>
                      ) : (
                        <span className="flex items-center gap-2">Comenzar esta sección <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Card 2: Responsabilidad Social */}
                <button
                  onClick={() => !completedSections.includes('SR') && selectSection('SR')}
                  disabled={completedSections.includes('SR')}
                  className={`group relative border rounded-3xl p-8 text-left transition-all duration-300 overflow-hidden active:scale-95 ${
                    completedSections.includes('SR')
                    ? 'bg-green-500/10 border-green-500/50 cursor-default'
                    : 'bg-slate-900/50 hover:bg-slate-800/80 border-slate-800 hover:border-green-500 hover:shadow-2xl hover:shadow-green-500/20'
                  } ${fontSize === 'large' ? 'p-10' : 'p-8'}`}
                >
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ShieldAlert className={fontSize === 'large' ? 'w-32 h-32' : 'w-24 h-24'} />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <div className={`p-3 rounded-2xl w-fit ${completedSections.includes('SR') ? 'bg-green-500 text-white' : 'bg-green-500/10'}`}>
                      {completedSections.includes('SR') ? <CheckCircle2 className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8 text-green-400" />}
                    </div>
                    <div>
                      <h3 className={`font-bold mb-2 ${fontSize === 'large' ? 'text-2xl' : 'text-xl'}`}>SECCIÓN RESPONSABILIDAD SOCIAL E INDIVIDUAL</h3>
                      <p className={`text-slate-400 leading-relaxed ${fontSize === 'large' ? 'text-lg' : 'text-sm'}`}>
                        Ética profesional, ciudadanía y compromiso con el medio ambiente.
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 font-bold pt-4 ${completedSections.includes('SR') ? 'text-green-400' : 'text-green-400'} ${fontSize === 'large' ? 'text-lg' : 'text-sm'}`}>
                      {completedSections.includes('SR') ? (
                        <span className="flex items-center gap-2">Sección Completada <CheckCircle2 className="w-4 h-4" /></span>
                      ) : (
                        <span className="flex items-center gap-2">Comenzar esta sección <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <BookOpen className="text-blue-400" /> Revisión de Conceptos
                </h2>
                <button 
                  onClick={() => setStep('results')}
                  className="text-sm bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Volver
                </button>
              </div>

              <div className="space-y-4">
                {['CT', 'SR'].map(secId => (
                  <div key={secId} className="space-y-4">
                    <h3 className="text-blue-400 font-bold border-b border-slate-800 pb-2 mt-6">
                      {secId === 'CT' ? 'Sección 1: Pensamiento Crítico' : 'Sección 2: Responsabilidad Social'}
                    </h3>
                    {userData.answers.filter(a => a.section === secId).map((ans, i) => {
                      const bank = secId === 'CT' ? CT_QUESTIONS : SR_QUESTIONS;
                      const q = bank.find(q => q.id === ans.questionId);
                      const selectedOpt = q?.options.find(o => o.id === ans?.selectedOptionId);
                      if (!q) return null;
                      return (
                        <div key={q.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg">{i + 1}. {q.title}</h3>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${ans?.isCorrect ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                              {ans?.isCorrect ? 'CORRECTO' : 'INCORRECTO'}
                            </span>
                          </div>
                          <p className="text-slate-400 text-sm mb-4 italic">"{q.scenario}"</p>
                          <div className="p-4 bg-slate-950/50 rounded-xl border-l-4 border-blue-500">
                            <p className="text-sm text-slate-300">
                              <span className="font-bold text-blue-400">Explicación:</span> {selectedOpt?.feedback}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-6"
            >
              {/* Progress Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono text-blue-400 uppercase tracking-widest">
                  {currentSection === 'CT' ? 'Sección 1: Pensamiento Crítico' : 'Sección 2: Responsabilidad Social'}
                </span>
                <span className="text-sm font-mono text-slate-500">
                  {currentQuestionIdx + 1} / {activeQuestions.length}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestionIdx + 1) / activeQuestions.length) * 100}%` }}
                />
              </div>

              {/* Question Card */}
              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 md:p-10 shadow-xl">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-yellow-500 uppercase tracking-tighter mb-1 block">
                        {activeQuestions[currentQuestionIdx].category}
                      </span>
                      <h2 className={`font-bold text-white ${fontSize === 'large' ? 'text-3xl' : 'text-2xl'}`}>
                        {activeQuestions[currentQuestionIdx].title}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => speak(`${activeQuestions[currentQuestionIdx].title}. ${activeQuestions[currentQuestionIdx].scenario}`)}
                    className="flex items-center gap-2 p-3 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600/40 transition-all"
                    title="Leer en voz alta"
                  >
                    <Volume2 className="w-6 h-6" />
                    <span className="text-xs font-bold uppercase hidden sm:inline">Escuchar</span>
                  </button>
                </div>

                <p className={`text-slate-300 mb-8 leading-relaxed bg-slate-950/50 p-6 rounded-2xl border-l-4 border-blue-500 ${
                  fontSize === 'large' ? 'text-2xl' : 'text-lg'
                }`}>
                  {activeQuestions[currentQuestionIdx].scenario}
                </p>

                <div className="space-y-4">
                  {activeQuestions[currentQuestionIdx].options.map((option) => (
                    <button
                      key={option.id}
                      disabled={!!selectedOptionId}
                      onClick={() => handleAnswer(option.id, option.isCorrect)}
                      className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between group
                        ${!selectedOptionId 
                          ? highContrast 
                            ? 'border-white bg-black hover:bg-yellow-400 hover:text-black' 
                            : 'border-slate-800 bg-slate-800/30 hover:border-blue-500/50 hover:bg-blue-500/5' 
                          : selectedOptionId === option.id
                            ? option.isCorrect 
                              ? 'border-green-500 bg-green-500/10' 
                              : 'border-red-500 bg-red-500/10'
                            : 'border-slate-800 opacity-50'
                        }
                      `}
                    >
                      <span className={`font-medium ${fontSize === 'large' ? 'text-xl' : 'text-base'}`}>
                        {option.text}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speak(option.text);
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        {selectedOptionId === option.id && (
                          option.isCorrect ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <XCircle className="w-6 h-6 text-red-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Feedback Section */}
                <AnimatePresence>
                  {showFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-8 p-6 rounded-2xl border ${
                        activeQuestions[currentQuestionIdx].options.find(o => o.id === selectedOptionId)?.isCorrect
                        ? 'bg-green-500/5 border-green-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          activeQuestions[currentQuestionIdx].options.find(o => o.id === selectedOptionId)?.isCorrect
                          ? 'bg-green-500/20'
                          : 'bg-red-500/20'
                        }`}>
                          <HardHat className={`w-5 h-5 ${
                            activeQuestions[currentQuestionIdx].options.find(o => o.id === selectedOptionId)?.isCorrect
                            ? 'text-green-500'
                            : 'text-red-500'
                          }`} />
                        </div>
                        <div>
                          <h4 className={`font-bold mb-1 ${fontSize === 'large' ? 'text-xl' : 'text-base'}`}>Nota del Instructor:</h4>
                          <p className={`text-slate-300 ${fontSize === 'large' ? 'text-xl' : 'text-base'}`}>
                            {activeQuestions[currentQuestionIdx].options.find(o => o.id === selectedOptionId)?.feedback}
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={nextQuestion}
                        className={`mt-6 w-full bg-slate-100 text-slate-950 font-bold py-3 rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2 ${fontSize === 'large' ? 'text-xl py-4' : 'text-base'}`}
                      >
                        {currentQuestionIdx === activeQuestions.length - 1 
                          ? completedSections.length === 0 
                            ? 'Volver a Selección de Sección' 
                            : 'Finalizar Evaluación' 
                          : 'Siguiente Escenario'}
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {step === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl text-center"
            >
              <div className="inline-flex p-4 bg-yellow-500/20 rounded-full mb-6 relative">
                <Trophy className="w-12 h-12 text-yellow-500 animate-pulse-soft" />
                <Rocket className="absolute -top-2 -right-2 w-8 h-8 text-blue-500 animate-shake" />
              </div>
              
              <h2 className={`font-bold mb-2 ${fontSize === 'large' ? 'text-4xl' : 'text-3xl'}`}>¡Evaluación Completada!</h2>
              <p className={`text-slate-400 mb-8 ${fontSize === 'large' ? 'text-xl' : 'text-base'}`}>Has finalizado el módulo de Lógica y Ética Eléctrica.</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                  <span className={`font-mono text-slate-500 uppercase block mb-1 ${fontSize === 'large' ? 'text-sm' : 'text-xs'}`}>Puntaje</span>
                  <span className={`font-bold text-blue-400 ${fontSize === 'large' ? 'text-4xl' : 'text-3xl'}`}>{userData.score}</span>
                </div>
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                  <span className={`font-mono text-slate-500 uppercase block mb-1 ${fontSize === 'large' ? 'text-sm' : 'text-xs'}`}>Tiempo</span>
                  <span className={`font-bold text-blue-400 flex items-center justify-center gap-2 ${fontSize === 'large' ? 'text-4xl' : 'text-3xl'}`}>
                    <Clock className={fontSize === 'large' ? 'w-7 h-7' : 'w-5 h-5'} /> {calculateTime()}
                  </span>
                </div>
                <div className="col-span-2 md:col-span-1 bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                  <span className={`font-mono text-slate-500 uppercase block mb-1 ${fontSize === 'large' ? 'text-sm' : 'text-xs'}`}>Rango</span>
                  <span className={`font-bold text-yellow-500 ${fontSize === 'large' ? 'text-2xl' : 'text-lg'}`}>{getRank()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={generatePDF}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-3"
                >
                  <FileText className="w-6 h-6" />
                  Descargar Informe PDF
                </button>
                <button
                  onClick={() => setStep('review')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-5 h-5" />
                  Revisar Mis Respuestas
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('electrologica_user');
                    window.location.reload();
                  }}
                  className="w-full bg-slate-900/50 hover:bg-slate-900 text-slate-500 font-bold py-3 rounded-xl transition-all text-sm"
                >
                  Reiniciar Todo
                </button>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-800 text-left">
                <h3 className="font-bold text-slate-400 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" /> Resumen de Desempeño
                </h3>
                <div className="space-y-3">
                  {['CT', 'SR'].map(secId => (
                    <div key={secId} className="space-y-2">
                      <p className="text-xs font-bold text-slate-500 uppercase mt-4 mb-2">
                        {secId === 'CT' ? 'Pensamiento Crítico' : 'Responsabilidad Social'}
                      </p>
                      {userData.answers.filter(a => a.section === secId).map((ans, i) => {
                        const bank = secId === 'CT' ? CT_QUESTIONS : SR_QUESTIONS;
                        const q = bank.find(q => q.id === ans.questionId);
                        return (
                          <div key={i} className="flex items-center justify-between p-3 bg-slate-950/30 rounded-lg border border-slate-800/50">
                            <span className="text-sm text-slate-300">{q?.title}</span>
                            {ans.isCorrect ? (
                              <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">CORRECTO</span>
                            ) : (
                              <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">INCORRECTO</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 py-8 text-center text-slate-500 text-sm">
        <p>Creado por: Christian Nùñez, Asesor Pedagògico, Programa PACE-UDA, 2026</p>
        <p className="mt-2 text-blue-500 font-bold">Liceo El Palomar - Copiapó | Inclusión PIE</p>
      </footer>
      </div>
    </div>
  );
}
