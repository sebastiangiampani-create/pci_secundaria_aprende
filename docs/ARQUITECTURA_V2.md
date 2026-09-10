# Arquitectura funcional PCI Secundaria Aprende V2

Este documento fija las reglas acordadas para la V2. Ante diferencias con documentos de trabajo anteriores, prevalecen estas definiciones hasta una nueva decisión explícita.

## 1. Separación obligatoria de fases

### Fase 1 — Mapa curricular / composición por orientación

La Fase 1 sirve exclusivamente para tomar decisiones de composición curricular.

Se trabaja con:
- orientación u orientaciones de la escuela;
- materias/materializaciones de Formación General (FG) y Formación Orientada (FO) que intervienen en decisiones de agrupamiento;
- 3.º, 4.º y 5.º año;
- laboratorios, talleres y Proyecto de Vinculación;
- agrupamientos;
- articulaciones FG ↔ FO;
- docente o docentes;
- drag & drop;
- validación inmediata de cada decisión: permitido / no permitido.

Las cargas horarias oficiales **no son una decisión de Fase 1, no se editan y no deben formar parte del banco visible de materias/materializaciones**. Cuando una regla de composición necesita una carga horaria —por ejemplo, el máximo permitido para un laboratorio— ese dato puede conservarse como metadato interno para validación, sin mezclarlo con la decisión curricular que realiza el usuario.

En Fase 1 **no existen** contenidos, objetivos, contexto problematizador, práctica/producto/eje, sinopsis, electividad ni planes.

El resultado es una **matriz curricular preconfigurada**. Esa estructura se transfiere a Fase 2 sin volver a decidir qué materias integran cada espacio.

Las materias o espacios que no requieren una decisión de agrupamiento no deben mezclarse dentro del banco de arrastre de esta fase. Pueden formar parte de la representación final del mapa, pero no del conjunto de elementos que el usuario debe decidir dónde ubicar.

### Fase 2 — Construcción curricular

Parte exactamente de los espacios resultantes de Fase 1.

Permite desarrollar, según el tipo de espacio:
- nombre;
- objetivos de aprendizaje;
- contenidos priorizados;
- contexto problematizador en laboratorios;
- práctica/producto/eje en talleres;
- sinopsis;
- contenidos de profundización opcionales;
- electividad;
- planes.

## 2. Drag & drop transversal

El drag & drop es una condición funcional transversal:
- Fase 1: materias/materializaciones → espacios y agrupamientos;
- Fase 2: contenidos → espacios curriculares;
- Planes: contenidos disponibles del espacio → plan/período/secuencia.

La interfaz puede complementar el arrastre con controles accesibles, pero no debe reemplazar el flujo principal de drag & drop.

## 3. Impresión y exportación

Todo espacio curricular debe poder imprimirse y exportarse a PDF individualmente.

Incluye, como mínimo:
- troncales;
- laboratorios;
- talleres;
- otros formatos;
- Proyecto de Vinculación;
- cada alternativa de una electividad;
- cada plan.

También deben imprimirse/exportarse las vistas globales pertinentes:
- mapa de Fase 1;
- mapa por orientación;
- mapa por año;
- matriz curricular completa;
- matriz por orientación;
- tabla de control;
- planes.

## 4. Formación General — estructura V2

- Lengua y Literatura: 5 espacios anuales, uno por año.
- Matemática: 5 espacios anuales, uno por año.
- Lenguas Adicionales: 5 espacios anuales, uno por año.
- Ciencias Naturales: 10 laboratorios.
- Ciencias Sociales: 10 o 12 laboratorios, nunca 11. La diferencia surge exclusivamente de las decisiones de composición de 3.º año.
- Artes: 6 talleres.
- Tecnologías: 10 talleres.
- Educación Física: 10 talleres.

## 5. Límite horario de laboratorios

Ningún laboratorio puede superar 9 horas cátedra.

La regla se aplica a:
- laboratorios FG;
- laboratorios FO;
- laboratorios articulados FG + FO.

La validación debe producirse durante la composición, antes de aceptar un drop inválido. La carga horaria utilizada para esta comprobación es metadato del sistema, no un campo que el usuario deba decidir o editar en Fase 1.

## 6. Formación Orientada — estructura V2

Por cada orientación:
- 4 laboratorios FO;
- 4 talleres FO;
- 1 Proyecto de Vinculación anual en Nivel 5.

Distribución de laboratorios y talleres:
- 3.º: 1 laboratorio + 1 taller;
- 4.º: 1 laboratorio + 1 taller;
- 5.º: 2 laboratorios + 2 talleres.

El **Proyecto de Vinculación** es un único espacio anual de Nivel 5. En la matriz ocupa C9 + C10 como una troncal anual y no se divide en dos espacios cuatrimestrales.

Las demás reglas curriculares particulares del Proyecto de Vinculación se completarán solo con definición explícita; no se deben inventar.

## 7. Regla especial — Ciencias Sociales de 3.º

Materias FG de 3.º:
- Historia;
- Geografía;
- FEC;
- Economía.

La materialización FO de 3.º destinada al laboratorio obligatorio FO es la única materialización FO que, con las reglas actuales, puede conformar un laboratorio por sí sola.

### Caso A — Laboratorio FO independiente

El laboratorio FO contiene la materialización FO sin materia FG.

Las cuatro materias FG de Sociales pueden organizarse:
- las 4 juntas en un laboratorio FG; o
- en 2 laboratorios FG de 2 materias cada uno.

No puede quedar ninguna materia FG aislada.

### Caso B — Laboratorio FO articulado con FG

El laboratorio FO contiene:
- la materialización FO de 3.º; y
- una materia FG de Sociales.

El espacio sigue computando como **Laboratorio FO obligatorio**. La materia FG conserva su origen FG.

Las otras 3 materias FG deben quedar juntas en un único laboratorio FG. En este caso no se habilitan además dos agrupamientos FG independientes.

No se presume una articulación con más de una materia FG sin una futura definición explícita.

## 8. Identidad del espacio y origen de sus componentes

Son conceptos distintos:
- una materia/materialización conserva `origen = FG | FO`;
- un espacio conserva su identidad curricular (`Laboratorio FG`, `Laboratorio FO`, etc.).

Ejemplo: un Laboratorio FO puede contener una materialización FO + Historia FG y sigue satisfaciendo el lugar obligatorio de Laboratorio FO.

## 9. Modelo de contenidos de Formación Orientada

Jerarquía general:

`Orientación → Bloques → Ejes → Contenidos priorizados`

Los contenidos priorizados FO no se asignan de antemano a una materialización ni a un año específico. Quedan disponibles para 3.º, 4.º y 5.º y la escuela los distribuye entre los espacios construidos en Fase 1.

Un mismo contenido priorizado puede asignarse a múltiples espacios. No se consume al utilizarlo.

En un espacio articulado conviven:
- biblioteca FG de las materias FG incluidas;
- biblioteca FO de la orientación.

El origen de cada contenido debe conservarse para trazabilidad y control.

## 10. Contenidos de profundización

- Se escriben manualmente.
- Son opcionales.
- Un espacio puede tener cero, uno o varios.
- Una vez creados en Fase 2 quedan disponibles para los planes del espacio.
- Se pueden arrastrar a los planes igual que los contenidos priorizados.

La V2 no debe repetir el error de la V1 por el cual un contenido manual agregado en la construcción curricular podía quedar fuera del selector/bolsa de contenidos del plan.

## 11. Electividad — únicamente Fase 2

La electividad no interviene en Fase 1 y no modifica el mapa de materias/materializaciones.

En Fase 2, un espacio solo se considera electivo cuando su alternativa melliza está completa. Mientras no lo esté, el espacio permanece obligatorio.

### Elementos compartidos por el par electivo
- objetivos de aprendizaje;
- contenidos priorizados asignados.

### Elementos propios de cada alternativa
- nombre;
- contexto problematizador (laboratorio) o práctica/producto/eje (taller);
- sinopsis;
- planes;
- contenidos de profundización.

Los contenidos de profundización pueden ser diferentes entre las dos alternativas y son opcionales en ambas.

En la matriz desarrollada de Fase 2 pueden mostrarse simultáneamente las alternativas mellizas dentro de un mismo cuatrimestre. En Fase 1 existe un único espacio estructural.

## 12. Agro y Ambiente

No se dispone de un documento 2025 de contenidos priorizados para esta orientación. Se utiliza el Diseño Curricular Jurisdiccional vigente como fuente.

La interfaz debe mostrar la salvedad:

**“No se han realizado contenidos priorizados para esta orientación. Se utiliza como fuente el Diseño Curricular Jurisdiccional vigente.”**

Esta diferencia de fuente debe quedar registrada en los datos y no ocultarse al usuario.

## 13. Reglas de implementación

- No modificar el repositorio estable `Matriz-PCI-Completa`.
- No modificar `main` de este repositorio durante el desarrollo sin aprobación.
- No incorporar claves de producción ni credenciales al repositorio.
- Separar reglas curriculares, catálogos oficiales, estado de escuela y presentación.
- Las reglas deben poder probarse sin depender de la interfaz.
- No corregir silenciosamente una fuente oficial: cualquier anomalía o ambigüedad se conserva y se señala para resolución.
