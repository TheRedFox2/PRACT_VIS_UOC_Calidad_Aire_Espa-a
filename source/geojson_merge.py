import geopandas as gpd
import pandas as pd

# 1. Cargar tus datos de contaminación procesados (los que tienen tu variable I)
# Asegúrate de usar el archivo donde limpiaste el código (quitando el 'ZON_')
df_datos = pd.read_csv("output/datos_uso_calidad_aire.csv")

# Si no habías creado la columna limpia en el paso anterior, créala aquí:
if 'ZoneCode_Mapa' not in df_datos.columns:
    df_datos['ZoneCode_Mapa'] = df_datos['AQ Zone Id'].str.replace('ZON_', '', regex=False)

# 2. Cargar tu nuevo mapa .json de España (o el europeo ya filtrado)
mapa_espana = gpd.read_file("output/zonas_calidad_aire_espana.geojson") 
# Asegúrate de que solo tiene las de España. Si no, desactiva el comentario de abajo:
# mapa_espana = mapa_espana[mapa_espana['ZoneCode'].astype(str).str.startswith('ES')].copy()

# 3. Extraer solo los códigos únicos de ambos lados para comparar
codigos_datos = set(df_datos['AQ Zone Id'].unique())
codigos_mapa = set(mapa_espana['ZoneId'].unique())

# 4. Calcular las estadísticas de coincidencia
coinciden = codigos_datos.intersection(codigos_mapa)
solo_en_datos = codigos_datos.difference(codigos_mapa)
solo_en_mapa = codigos_mapa.difference(codigos_datos)

# 5. Mostrar el reporte en la terminal
print("="*50)
print("       REPORTE DE AUDITORÍA DEL MERGE")
print("="*50)
print(f"Total de zonas únicas en tus datos de aire: {len(codigos_datos)}")
print(f"Total de zonas únicas en tu archivo .json: {len(codigos_mapa)}")
print(f"--> ZONAS QUE HACEN MERGE CORRECTAMENTE: {len(coinciden)}")
print(f"--> Zonas en tus datos que NO tienen mapa: {len(solo_en_datos)}")
print(f"--> Zonas en el mapa que NO tienen datos:  {len(solo_en_mapa)}")
print("="*50)

if len(solo_en_datos) > 0:
    print("\n⚠️ Códigos en tus DATOS que se quedan SIN MAPA (revisa si hay errores de texto):")
    print(list(solo_en_datos)[:10], "...etc" if len(solo_en_datos) > 10 else "")

if len(solo_en_mapa) > 0:
    print("\n🌍 Códigos en el MAPA que no tienen datos de contaminación asignados:")
    print(list(solo_en_mapa)[:10], "...etc" if len(solo_en_mapa) > 10 else "")