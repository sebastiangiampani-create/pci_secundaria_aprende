(() => {
  const originalFetch = window.fetch.bind(window);
  const ORIENTATION_RE = /data\/orientaciones\/([a-z0-9_]+)\.txt(?:\?|$)/i;
  const FILES = [
    'agro_ambiente','arte','ciencias_naturales','ciencias_sociales_humanidades',
    'comunicacion','economia_administracion','educacion','educacion_fisica',
    'energia_sustentabilidad','informatica','lenguas','literatura','matematica_fisica','turismo'
  ];
  const processed = new Map();
 