# PCI Secundaria Aprende — V2

Nueva versión de la plataforma de construcción del Proyecto Curricular Institucional (PCI).

## Estado

El desarrollo activo se realiza en la rama `desarrollo-v2`. La rama `main` se mantiene sin cambios hasta validación.

La aplicación toma como referencia funcional y visual la versión estable de `sebastiangiampani-create/Matriz-PCI-Completa`, pero la V2 separa explícitamente dos etapas:

1. **Fase 1 — Mapa curricular / composición:** decisiones de agrupamiento y articulación de materias/materializaciones, horas y docentes, sin contenidos.
2. **Fase 2 — Construcción curricular:** objetivos, contenidos, contexto/práctica, sinopsis, profundización opcional, electividad y planes sobre la estructura ya resuelta en Fase 1.

## Principios transversales

- Drag & drop en Fase 1, Fase 2 y planes.
- Impresión y exportación PDF de cada espacio y de las vistas globales.
- Un contenido priorizado puede utilizarse en más de un espacio.
- Los contenidos de profundización son opcionales, se escriben manualmente y quedan disponibles para los planes.
- La electividad existe únicamente en Fase 2.
- Ningún laboratorio puede superar 9 horas cátedra.

Ver `docs/ARQUITECTURA_V2.md` y `data/reglas-v2.json`.

## Pruebas

```bash
npm test
```
