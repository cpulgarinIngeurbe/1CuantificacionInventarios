#!/usr/bin/env python3
"""
Script para unificar todas las pestañas de un Excel en una sola.
Valida primero que todas las pestañas tengan las mismas columnas.
Procesa encabezados de dos filas y los concatena.
Resultado: guarda en carpeta 'transformacion/' sin modificar el original.
"""

import pandas as pd
import openpyxl
import sys
from pathlib import Path


def read_sheet_with_double_header(excel_file, sheet_name):
    """Lee una pestaña y concatena los encabezados de dos filas."""
    # Leer primeras 2 filas sin header para procesarlas
    raw_df = pd.read_excel(excel_file, sheet_name=sheet_name, header=None, nrows=2)

    # Obtener encabezados de ambas filas
    row1 = raw_df.iloc[0].tolist()  # Primera fila
    row2 = raw_df.iloc[1].tolist()  # Segunda fila

    # Crear encabezados concatenados
    new_columns = []
    for i in range(len(row1)):
        col_name1 = row1[i] if pd.notna(row1[i]) else ""
        col_name2 = row2[i] if pd.notna(row2[i]) else ""

        # Si ambas tienen valor, concatenar con espacio
        if col_name1 and col_name2:
            new_col = f"{col_name1} {col_name2}"
        # Si solo la primera tiene valor
        elif col_name1:
            new_col = str(col_name1)
        # Si solo la segunda tiene valor
        elif col_name2:
            new_col = str(col_name2)
        else:
            new_col = f"Columna_{i}"

        new_columns.append(new_col)

    # Leer los datos a partir de la fila 3
    df = pd.read_excel(excel_file, sheet_name=sheet_name, header=None, skiprows=2)

    # Si el dataframe tiene filas, asignar columnas
    if len(df) > 0:
        df.columns = new_columns
    else:
        # Si no hay datos, crear un dataframe vacío con las columnas correctas
        df = pd.DataFrame(columns=new_columns)

    return df


def validate_columns(excel_file):
    """Valida que todas las pestañas tengan las mismas columnas."""
    wb = openpyxl.load_workbook(excel_file)
    sheet_names = wb.sheetnames

    if not sheet_names:
        print("[ERROR] El archivo no contiene pestañas.")
        return False, None, None

    # Leer primera pestaña con encabezados concatenados
    first_df = read_sheet_with_double_header(excel_file, sheet_names[0])
    first_columns = set(first_df.columns)

    print(f"[INFO] Validando columnas en {len(sheet_names)} pestañas...")
    print(f"[INFO] Columnas esperadas: {len(first_columns)}")
    print(f"[INFO] Ejemplo de encabezados:")
    for col in list(first_df.columns)[:3]:
        print(f"       - {col}")

    all_match = True
    for sheet_name in sheet_names[1:]:
        df = read_sheet_with_double_header(excel_file, sheet_name)
        current_columns = set(df.columns)

        if current_columns != first_columns:
            print(f"[ERROR] Pestaña '{sheet_name}' tiene columnas diferentes")
            all_match = False
        else:
            print(f"[OK] Pestaña '{sheet_name}' OK ({len(df)} filas)")

    if all_match:
        print("[OK] Validacion exitosa: Todas las pestañas tienen las mismas columnas.\n")
        return True, sheet_names, first_df.columns.tolist()
    else:
        print("[ERROR] Las pestañas no tienen las mismas columnas.")
        return False, None, None


def merge_sheets(input_excel, output_excel):
    """Unifica todas las pestañas en una sola."""
    print("[INFO] Iniciando proceso de unificacion...\n")

    # Validar columnas
    is_valid, sheet_names, columns = validate_columns(input_excel)

    if not is_valid:
        return False

    # Leer todas las pestañas
    print("[INFO] Leyendo datos de todas las pestañas...")
    all_data = []

    for sheet_name in sheet_names:
        df = read_sheet_with_double_header(input_excel, sheet_name)
        all_data.append(df)
        print(f"[+] {sheet_name}: {len(df)} filas")

    # Unificar
    merged_df = pd.concat(all_data, ignore_index=True)
    print(f"\n[OK] Datos unificados: {len(merged_df)} filas totales\n")

    # Guardar en archivo de salida
    print(f"[INFO] Guardando en: {output_excel}")

    with pd.ExcelWriter(output_excel, engine='openpyxl') as writer:
        merged_df.to_excel(writer, sheet_name='DATOS_UNIFICADOS', index=False)

    print("[OK] Archivo guardado exitosamente.\n")
    return True


if __name__ == "__main__":
    # Rutas
    repo_root = Path(__file__).parent
    input_excel = repo_root / "datos" / "InformeInventario.xlsx"
    output_dir = repo_root / "transformacion"
    output_excel = output_dir / "InformeInventario_Unificado.xlsx"

    # Crear directorio si no existe
    output_dir.mkdir(exist_ok=True)

    if not input_excel.exists():
        print(f"[ERROR] Archivo no encontrado: {input_excel}")
        sys.exit(1)

    success = merge_sheets(str(input_excel), str(output_excel))

    if success:
        print(f"[SUCCESS] Archivo generado en: transformacion/InformeInventario_Unificado.xlsx")
        sys.exit(0)
    else:
        print("[ERROR] El proceso falló.")
        sys.exit(1)
