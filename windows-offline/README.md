# PCI Secundaria Aprende — Windows Offline r37

Este directorio agrega un envoltorio Electron a la versión r37 estable sin modificar la aplicación web original.

## Variantes

- **Setup**: instalación tradicional en Windows. Los datos quedan en el perfil local del usuario.
- **Portable**: no requiere instalación. Los datos quedan en la carpeta `PCI-Datos` junto al ejecutable portable.

## Persistencia y respaldo

La aplicación conserva el mismo almacenamiento local de r37. El menú **Archivo** agrega:

- Exportar respaldo completo.
- Restaurar respaldo completo.
- Abrir carpeta de datos locales.

## Modo offline

Durante la compilación se empaquetan localmente XLSX y ExcelJS. Las solicitudes externas usadas por r37 para esas librerías se redirigen al paquete local. Google Fonts se reemplaza por las fuentes de respaldo del sistema y el badge de licencia se sirve localmente.

La versión online de `main` no es modificada por este paquete.
