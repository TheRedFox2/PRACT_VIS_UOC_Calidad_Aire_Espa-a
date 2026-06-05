
# Visualización datos de calidad aérea de la EEA sobre los últimos 5 años en España

Análisis y Visualización de los datos obtenidos a partir de la web abierta de la EEA sobre la calidad del aire en España en los años 2020-2025. Los datos pueden encontrarse en: [EEA](https://www.eea.europa.eu/en/datahub/datahubitem-view/3b390c9c-f321-490a-b25a-ae93b2ed80c1) y contienen información sobre contaminantes principales y regulaciones europeas sobre diferentes zonas de estudio del territorio español.
## Uso

Los datos originales se encuentran en `Datos`, y los scripts para tranformarlos en `source`. El script de transformación para obtener el GeoJson de las zonas no puede subirse debido a su gran tamaño (1GB), por lo que solo podemos indicar el enlace (https://discomap.eea.europa.eu/map/FME/AQZones/)

En `output` se pueden encontrar todos los datos ya transformados y utilizables.

Para la visualización, tan solo es necesario abrir en 'Live server' el archivo `index.html`. A su vez, se ha creado una 'github pages' para mantener el .html en abierto.





## Estructura del Proyecto

La organización del repositorio se divide en directorios de código fuente, gestión de datos y los archivos principales de la aplicación:

```text
/
├── D3/                    # Proyecto de D3 en su carpeta
├── D3 - copia/            # Copia de seguridad previa del proyecto
├── Datos/                 # Archivos CSV/JSON con la información de la EEA
├── output/                # Resultados generados durante el procesamiento
├── source/                # Código python de transformación de datos
├── index.html             # Punto de entrada principal de la aplicación
├── estilos.css            # Hoja de estilos del proyecto
├── script.js              # Lógica principal de la aplicación
├── graficas_objetivos.js  # Lógica específica para gráficos de objetivos
├── script_excedencia.js   # Gestión de datos de cumplimiento normativo
├── script_todos_anios.js  # Lógica para la normalización y evolución histórica
└── LICENSE                # Licencia del proyecto

```
## License

Se aplica la licencia Creative Commons Legal Code CC0 1.0 Universal

### Nota extra
*" Los directorios 'D3 - copia' y otros elementos temporales como 'D3' o diferentes scripts de python son parte del entorno de desarrollo y no afectan a la funcionalidad del despliegue en producción"*.