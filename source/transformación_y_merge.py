import pandas as pd
import numpy as np
import os

# 1. Cargar ambos datasets
df_aire = pd.read_csv('./Datos/Assesment_DataExtract.csv')
df_zonas = pd.read_csv('./Datos/Zones_DataExtract.csv')

# 2. Seleccionar solo las columnas que necesitas del dataset de zonas para no saturar tu memoria
# Nos quedamos con el ID de la zona y la población residente
df_zonas_clean = df_zonas[['AQ Zone Id', 'Resident Population', 'Geographical Name']].drop_duplicates()

# 3. Hacer el merge (unión) por la columna 'AQ Zone Id'
df_final = pd.merge(df_aire, df_zonas_clean, on='AQ Zone Id', how='left')

# 4. Limpieza rápida: Asegurar que la población sea numérica y rellenar nulos si los hay con 1 
# (para que el log10(1) sea 0 y no dé error matemático)
df_final['Resident Population'] = pd.to_numeric(df_final['Resident Population'], errors='coerce').fillna(1)

# 5. Calcular tu variable de impacto 'I'
# Filtramos o vigilamos que Exceedance Threshold no sea 0
df_final['Exceedance Threshold'] = df_final['Exceedance Threshold'].replace(0, np.nan)
df_final['I'] = (df_final['Air Pollution Level'] / df_final['Exceedance Threshold']) * np.log10(df_final['Resident Population'])

df_final = df_final.dropna(subset=['I'])

# Guardo el archivo en 'output'
output_dir = "output" 
output_file = os.path.join(output_dir, "datos_uso_calidad_aire.csv")

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

df_final.to_csv(output_file, index=False, encoding="utf-8")