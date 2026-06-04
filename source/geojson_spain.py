import geopandas as gpd
import os

print("1/3 🌍 Leyendo el JSON original de la EEA...")
# Cargamos tu archivo original con las coordenadas en metros
mapa_completo = gpd.read_file("Datos/AQZoneGeometries_GeojsonFiles.json")

print("2/3 🇪🇸 Filtrando zonas de España...")
# Filtramos por el campo Country o ZoneCode
mapa_espana = mapa_completo[mapa_completo['Country'] == 'ES'].copy()  # Nota: En tu captura salía 'DE' (Alemania), cámbialo por 'ES' si estás con España.

# =========================================================================
# 🔥 LA SOLUCIÓN DEFINITIVA: REPROYECTAR A COORDENADAS GEOGRÁFICAS (GRADOS)
# Pasamos de metros (EPSG:3035) a Latitud/Longitud estándar (EPSG:4326)
# =========================================================================
print("🔄 Cambiando sistema de coordenadas a formato estándar (Grados)...")
mapa_espana = mapa_espana.to_crs(epsg=4326)

mapa_espana['area_temp'] = mapa_espana.geometry.area
mapa_espana = mapa_espana.sort_values(by='area_temp', ascending=False)

# Ahora sí, eliminamos duplicados manteniendo solo el polígono principal de cada zona
mapa_espana = mapa_espana.drop_duplicates(subset=['ZoneId'], keep='first')

# --- Pon esto justo después del drop_duplicates --- 
print(f"DEBUG: Filas originales de España en el JSON: {len(mapa_completo[mapa_completo['Country'] == 'ES'])}")
print(f"DEBUG: Filas que quedan tras eliminar duplicados: {len(mapa_espana)}")
print("\nDEBUG: ¿Qué zonas hay en Galicia? Vamos a ver sus códigos:")
print(mapa_espana[mapa_espana['ZoneId'].str.contains('ES11', na=False)]['ZoneId'].values)

mapa_espana = mapa_espana.drop(columns=['area_temp'])

mapa_espana['geometry'] = mapa_espana['geometry'].simplify(tolerance=0.02, preserve_topology=True)



print("3/3 💾 Guardando el mapa GeoJSON corregido...")
os.makedirs("output", exist_ok=True)
mapa_espana.to_file("output/zonas_calidad_aire_espana.geojson", driver="GeoJSON")

print("¡Hecho! El GeoJSON ahora tiene las coordenadas perfectas para Folium y Plotly.")