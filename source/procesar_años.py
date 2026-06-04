import pandas as pd
import os
import numpy as np

def procesar_datos():
    # Definir rutas
    base_path = './Datos'
    output_dir = './output'
    
    # Asegurar que existe el directorio de salida
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    # Cargar el dataset de zonas una sola vez (es compartido)
    # Según la imagen, está en './Datos/Zones_DataExtract.csv'
    zones_path = os.path.join(base_path, 'Zones_DataExtract.csv')
    df_zonas = pd.read_csv(zones_path)
    
    # Preparar zonas (mismo código de limpieza)
    df_zonas_clean = df_zonas[['AQ Zone Id', 'Resident Population', 'Geographical Name']].drop_duplicates()
    
    # Recorrer carpetas (suponiendo que son años)
    # Buscamos directorios que sean números de año
    carpetas = [d for d in os.listdir(base_path) if os.path.isdir(os.path.join(base_path, d)) and d.isdigit()]
    
    for anio in carpetas:
        air_file_path = os.path.join(base_path, anio, 'Assesmet_DataExtract.csv')
        
        if os.path.exists(air_file_path):
            print(f"Procesando año: {anio}...")
            
            # Cargar dataset de aire específico del año
            df_aire = pd.read_csv(air_file_path)
            
            # Realizar el merge
            df_final = pd.merge(df_aire, df_zonas_clean, on='AQ Zone Id', how='left')
            
            # Limpieza de población
            df_final['Resident Population'] = pd.to_numeric(df_final['Resident Population'], errors='coerce').fillna(1)
            
            # Cálculo de variable 'I'
            df_final['Exceedance Threshold'] = df_final['Exceedance Threshold'].replace(0, np.nan)
            df_final['I'] = (df_final['Air Pollution Level'] / df_final['Exceedance Threshold']) * np.log10(df_final['Resident Population'])
            df_final = df_final.dropna(subset=['I'])
            
            # Guardar el archivo
            output_file = os.path.join(output_dir, f"datos_uso_calidad_aire_{anio}.csv")
            df_final.to_csv(output_file, index=False, encoding='utf-8')
            print(f"Guardado: {output_file}")
        else:
            print(f"Archivo no encontrado para el año: {anio} en {air_file_path}")

if __name__ == '__main__':
    procesar_datos()