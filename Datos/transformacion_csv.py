import pandas as pd
import os

# Cargas el archivo de Eurostat (incluso si es .xlsx)
for file in os.listdir("./"):
    if file.endswith(".xlsx"):
        df = pd.read_excel(file,
                            sheet_name='Sheet 1',
                            skiprows=8,
                            )

    # Lo guardas como CSV limpio en 1 segundo
        df.to_csv(f'datos_{file[:8]}_limpios.csv', index=False)
    else: None