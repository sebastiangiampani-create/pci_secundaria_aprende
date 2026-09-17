(() => {
  const originalFetch = window.fetch.bind(window);
  const ORIENTATION_RE = /data\/orientaciones\/([a-z0-9_]+)\.txt(?:\?|$)/i;
  const processed = new Map();
  const audit = new Map();

  const clean = value => String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, ' ')
    .trim();

  function splitAtomic(raw) {
    const text = clean(raw);
    if (!text) return { parent: '', items: [] };

    // Separadores estructurales frecuentes en las fuentes oficiales FO.
    // Se evita cortar por punto o punto y coma para no fragmentar oraciones normales.
    let marked = text
      .replace(/\s*[•▪◦]\s+/g, ' \u241e ')
      .replace(/\.\s*[-–—]\s+(?=[A-ZÁÉÍÓÚÜÑ¿¡0-9])/g, '. \u241e ')
      .replace(/:\s*[-–—]\s+(?=[A-ZÁÉÍÓÚÜÑ¿¡0-9])/g, ': \u241e ')
      .replace(/\s+[-–—]\s+(?=[A-ZÁÉÍÓÚÜÑ¿¡0-9])/g, ' \u241e ')
      .replace(/\s+(?=\d{1,2}[.)]\s+[A-ZÁÉÍÓÚÜÑ¿¡])/g, ' \u241e ');

    let parts = marked.split('\u241e').map(clean).filter(Boolean);
    if (parts.length < 2) return { parent: '', items: [text] };

    // Une fragmentos absurdamente cortos con el siguiente para no crear falsos contenidos.
    const normalized = [];
    for (let i = 0; i < parts.length; i++) {
      let part = parts[i].replace(/^[-–—•▪◦]\s*/, '').trim();
      if (part.length < 12 && i + 1 < parts.length) {
        part = `${part} ${parts[++i]}`.trim();
      }
      if (part) normalized.push(part);
    }
    parts = normalized;

    let parent = '';
    if (parts.length > 1 && /[:：]\s*$/.test(parts[0]) && parts[0].length <= 220) {
      parent = parts.shift().replace(/[:：]\s*$/, '').trim();
    }

    return { parent, items: parts.length ? parts : [text] };
  }

  function atomicize(rows, file) {
    const out = [];
    let splitRows = 0;
    let atomicItems = 0;

    for (const row of Array.isArray(rows) ? rows : []) {
      const parsed = splitAtomic(row?.text);
      if (parsed.items.length <= 1) {
        out.push({ ...row, text: clean(row?.text) });
        continue;
      }

      splitRows++;
      parsed.items.forEach((item, index) => {
        atomicItems++;
        out.push({
          ...row,
          id: index === 0 ? row.id : `${row.id}__a${index + 1}`,
          legacyId: row.id,
          atomicIndex: index + 1,
          atomicCount: parsed.items.length,
          parentTopic: parsed.parent || '',
          text: item
        });
      });
    }

    audit.set(file, {
      file,
      originalRows: Array.isArray(rows) ? rows.length : 0,
      normalizedRows: out.length,
      splitRows,
      generatedAtomicItems: atomicItems
    });
    return out;
  }

  async function decodePayload(text) {
    const bytes = Uint8Array.from(atob(text.trim()), c => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return JSON.parse(await new Response(stream).text());
  }

  async function encodePayload(rows) {
    const bytes = new TextEncoder().encode(JSON.stringify(rows));
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
    const buffer = await new Response(stream).arrayBuffer();
    const arr = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < arr.length; i += 0x8000) {
      binary += String.fromCharCode(...arr.subarray(i, i + 0x8000));
    }
    return btoa(binary);
  }

  async function processOrientation(url, options) {
    const match = String(url).match(ORIENTATION_RE);
    if (!match) return originalFetch(url, options);
    const file = match[1];

    if (processed.has(file)) {
      return new Response(processed.get(file), {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-PCI-FO-Atomic': '1' }
      });
    }

    const response = await originalFetch(url, options);
    if (!response.ok) return response;

    try {
      const raw = await response.clone().text();
      const rows = await decodePayload(raw);
      const normalized = atomicize(rows, file);
      const encoded = await encodePayload(normalized);
      processed.set(file, encoded);
      return new Response(encoded, {
        status: response.status,
        statusText: response.statusText,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-PCI-FO-Atomic': '1' }
      });
    } catch (error) {
      console.error('[PCI FO normalizer]', file, error);
      return response;
    }
  }

  window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (ORIENTATION_RE.test(url)) return processOrientation(url, init);
    return originalFetch(input, init);
  };

  window.PCIFOContentAtomicizer = {
    splitAtomic,
    atomicize,
    audit: () => [...audit.values()]
  };
})();
