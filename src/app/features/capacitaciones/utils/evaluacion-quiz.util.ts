import { EvaluacionDTO, EvaluacionPregunta } from '../models/capacitaciones-modulos.models';

const QUIZ_MARKER = '[QUIZ_JSON]';

interface QuizMetadata {
  tipo: 'multiple';
  preguntas: EvaluacionPregunta[];
}

export function normalizeQuizQuestions(preguntas: EvaluacionPregunta[] | undefined): EvaluacionPregunta[] {
  const safe = Array.isArray(preguntas) ? preguntas : [];
  return safe
    .map((p) => ({
      id: p.id,
      enunciado: String(p.enunciado || '').trim(),
      opciones: (Array.isArray(p.opciones) ? p.opciones : [])
        .map((o) => ({ id: o.id, texto: String(o.texto || '').trim(), esCorrecta: !!o.esCorrecta }))
        .filter((o) => o.texto.length > 0),
    }))
    .filter((p) => p.enunciado.length > 0 && p.opciones.length >= 2);
}

export function splitDescripcionAndQuiz(rawDescription: string | null | undefined): {
  descripcionVisible: string;
  metadata: QuizMetadata | null;
} {
  const raw = String(rawDescription || '');
  const markerIndex = raw.indexOf(QUIZ_MARKER);

  if (markerIndex < 0) {
    return {
      descripcionVisible: raw.trim(),
      metadata: null,
    };
  }

  const descripcionVisible = raw.slice(0, markerIndex).trim();
  const jsonPart = raw.slice(markerIndex + QUIZ_MARKER.length).trim();

  try {
    const parsed = JSON.parse(jsonPart) as QuizMetadata;
    if (!parsed || parsed.tipo !== 'multiple') {
      return { descripcionVisible, metadata: null };
    }

    return {
      descripcionVisible,
      metadata: {
        tipo: parsed.tipo,
        preguntas: normalizeQuizQuestions(parsed.preguntas),
      },
    };
  } catch {
    return {
      descripcionVisible,
      metadata: null,
    };
  }
}

export function buildDescripcionWithQuiz(baseDescripcion: string, preguntas: EvaluacionPregunta[]): string {
  const descripcionVisible = String(baseDescripcion || '').trim();

  const safeQuestions = normalizeQuizQuestions(preguntas);
  const payload: QuizMetadata = {
    tipo: 'multiple',
    preguntas: safeQuestions,
  };

  return `${descripcionVisible}\n\n${QUIZ_MARKER}${JSON.stringify(payload)}`;
}

export function hydrateEvaluacionFromDescription(ev: EvaluacionDTO): EvaluacionDTO {
  const split = splitDescripcionAndQuiz(ev.descripcion);

  if (!split.metadata) {
    return {
      ...ev,
      descripcion: split.descripcionVisible,
      tipo: 'multiple',
      preguntas: normalizeQuizQuestions(ev.preguntas),
    };
  }

  return {
    ...ev,
    descripcion: split.descripcionVisible,
    tipo: split.metadata.tipo,
    preguntas: split.metadata.preguntas,
  };
}

export function prepareEvaluacionForApi(ev: EvaluacionDTO): EvaluacionDTO {
  const preguntas = normalizeQuizQuestions(ev.preguntas);

  return {
    ...ev,
    tipo: 'multiple',
    preguntas,
    descripcion: buildDescripcionWithQuiz(ev.descripcion, preguntas),
  };
}
