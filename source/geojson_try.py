import geopandas as gpd
import pandas as pd
import plotly.express as px
import folium
import os

print("1/4 🚀 Cargando datos de contaminación...")
df_datos = pd.read_csv("output/datos_uso_calidad_aire.csv")

if 'Compiled' in df_datos.columns:
    df_datos = df_datos.drop(columns=['Compiled'])


df_resumen = df_datos.groupby('AQ Zone Id')['I'].mean().reset_index()

print("2/4 🌍 Cargando y suavizando el mapa GeoJSON...")
mapa_espana = gpd.read_file("output/zonas_calidad_aire_espana.geojson")
# Simplificamos un poco para asegurar ligereza en el navegador

mapa_espana['geometry'] = mapa_espana['geometry'].simplify(tolerance=0.01, preserve_topology=True)

mapa_espana = mapa_espana.drop(columns=['Updated'])


mapa_espana.to_file("output/zonas_calidad_aire_espana_limpio.geojson", driver="GeoJSON")

print("3/4 🔄 Fusionando mapa con datos...")
mapa_final = mapa_espana.merge(df_datos, left_on="ZoneId", right_on="AQ Zone Id", how="inner")

# Nos aseguramos de que el índice I sea numérico por si acaso
mapa_final['I'] = pd.to_numeric(mapa_final['I'], errors='coerce')

print("4/4 🗺️ Creando mapa interactivo con Folium (Ultra rápido)...")
# Creamos el mapa base centrado en España
# ✅ 1. Al crear el mapa base, evita cargar todo el planeta y desactiva controles innecesarios
m = folium.Map(tiles="cartodbpositron", zoom_start=6, location=[40.416775, -3.703790],
               zoom_control=True, scrollWheelZoom=True, dragging=True)


# Añadimos la capa de colores (Choropleth)
folium.Choropleth(
    geo_data=mapa_final.__geo_interface__,
    name="Índice I",
    data=mapa_final,
    columns=["ZoneId", "I"],
    key_on="feature.properties.ZoneId",  # Vincula el GeoJSON con el DataFrame
    fill_color="YlOrRd",  # Escala semafórica: Amarillo -> Naranja -> Rojo
    fill_opacity=0.7,
    line_opacity=0.2,
    legend_name="Índice de Impacto Ambiental (I)"
).add_to(m)

# Añadimos interactividad para que al pasar el ratón muestre los datos
folium.GeoJson(
    mapa_final.__geo_interface__,
    tooltip=folium.GeoJsonTooltip(
        fields=["Geographical Name", "ZoneId", "I"],
        aliases=["Nombre", "Código de Zona:", "Valor Índice I:"],
        localize=True
    ),
    style_function=lambda x: {'fillColor': '#ffffff00', 'color': '#00000000'} # Capa invisible encima solo para el tooltip
).add_to(m)

# Guardar el mapa como un archivo web HTML
os.makedirs("output", exist_ok=True)
mapa_html = "output/mapa_calidad_aire.html"
m.save(mapa_html)

print(f"\n==============================================")
print(f"🥳 ¡MAPA GENERADO CON ÉXITO EN 2 SEGUNDOS!")
print(f"Busca el archivo en: {mapa_html}")
print(f"Hazle doble clic desde tu explorador de archivos para abrirlo.")
print(f"==============================================")