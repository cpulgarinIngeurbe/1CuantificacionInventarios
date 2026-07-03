#!/usr/bin/env python3
"""
Script para generar un HTML con la tabla de datos del Excel transformado.
"""

import pandas as pd
from pathlib import Path


def generate_html_from_excel(excel_file, output_html):
    """Lee el Excel y genera un HTML con la tabla de datos."""

    print("[INFO] Leyendo datos del Excel...")
    df = pd.read_excel(excel_file, sheet_name='DATOS_UNIFICADOS')

    # Generar filas de tabla
    table_rows = ""
    for idx, row in df.iterrows():
        sucursal = row.get('Sucursal', 'N/A')
        mes_ano = row.get('Mes-Año', 'N/A')

        # Formatear valores numéricos con separadores de miles
        def format_number(val):
            if pd.isna(val):
                return "0"
            try:
                return f"{float(val):,.0f}"
            except:
                return str(val)

        inventario_inicial = format_number(row.get('Inventario Inicial', 0))
        entradas_almacen = format_number(row.get('Entradas Almacén', 0))
        salidas_almacen = format_number(row.get('Salidas Almacén', 0))
        inventario_final = format_number(row.get('Inventario Final', 0))

        table_rows += f"""
<tr class="hover:bg-surface-container-low transition-colors group">
<td class="px-xl py-md">
<div class="flex items-center gap-md">
<div class="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center text-secondary">
<span class="material-symbols-outlined text-[20px]">warehouse</span>
</div>
<div>
<span class="font-body-md text-body-md font-medium block">{sucursal}</span>
<span class="font-label-sm text-label-sm text-on-surface-variant">{mes_ano}</span>
</div>
</div>
</td>
<td class="px-xl py-md text-right font-data-mono text-body-md">{inventario_inicial}</td>
<td class="px-xl py-md text-right font-data-mono text-body-md">{entradas_almacen}</td>
<td class="px-xl py-md text-right font-data-mono text-body-md">{salidas_almacen}</td>
<td class="px-xl py-md text-right font-data-mono text-body-md text-secondary font-bold">{inventario_final}</td>
<td class="px-xl py-md text-center">
<span class="inline-flex items-center px-sm py-xs rounded-full text-[10px] font-bold uppercase bg-on-tertiary-container/10 text-on-tertiary-container">Activo</span>
</td>
</tr>"""

    # Estadísticas generales
    total_registros = len(df)
    sucursales_unicas = df['Sucursal'].nunique() if 'Sucursal' in df.columns else 0

    # HTML template
    html_content = f"""<!DOCTYPE html>
<html class="light" lang="es">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Cuantificación de Inventarios</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {{
        darkMode: "class",
        theme: {{
          extend: {{
            "colors": {{
                    "on-background": "#0b1c30",
                    "error-container": "#ffdad6",
                    "on-secondary-container": "#fefcff",
                    "surface-bright": "#f8f9ff",
                    "surface-container-highest": "#d3e4fe",
                    "primary-container": "#131b2e",
                    "background": "#f8f9ff",
                    "tertiary-container": "#002113",
                    "on-error": "#ffffff",
                    "surface-variant": "#d3e4fe",
                    "inverse-on-surface": "#eaf1ff",
                    "outline": "#76777d",
                    "primary-fixed-dim": "#bec6e0",
                    "secondary-container": "#2170e4",
                    "on-primary-fixed-variant": "#3f465c",
                    "on-tertiary": "#ffffff",
                    "surface-container-low": "#eff4ff",
                    "tertiary": "#000000",
                    "on-primary-container": "#7c839b",
                    "tertiary-fixed-dim": "#4edea3",
                    "surface-tint": "#565e74",
                    "outline-variant": "#c6c6cd",
                    "on-primary": "#ffffff",
                    "surface-container": "#e5eeff",
                    "secondary-fixed": "#d8e2ff",
                    "surface-dim": "#cbdbf5",
                    "on-tertiary-fixed": "#002113",
                    "error": "#ba1a1a",
                    "secondary": "#0058be",
                    "inverse-surface": "#213145",
                    "tertiary-fixed": "#6ffbbe",
                    "on-error-container": "#93000a",
                    "on-secondary-fixed-variant": "#004395",
                    "surface-container-high": "#dce9ff",
                    "on-surface": "#0b1c30",
                    "primary": "#000000",
                    "on-secondary-fixed": "#001a42",
                    "surface-container-lowest": "#ffffff",
                    "on-secondary": "#ffffff",
                    "surface": "#f8f9ff",
                    "on-tertiary-container": "#009668",
                    "on-tertiary-fixed-variant": "#005236",
                    "primary-fixed": "#dae2fd",
                    "inverse-primary": "#bec6e0",
                    "on-surface-variant": "#45464d",
                    "on-primary-fixed": "#131b2e",
                    "secondary-fixed-dim": "#adc6ff"
            }},
            "borderRadius": {{
                    "DEFAULT": "0.125rem",
                    "lg": "0.25rem",
                    "xl": "0.5rem",
                    "full": "0.75rem"
            }},
            "spacing": {{
                    "md": "16px",
                    "base": "4px",
                    "container-margin": "24px",
                    "xs": "4px",
                    "sm": "8px",
                    "lg": "24px",
                    "xl": "32px",
                    "gutter": "16px"
            }},
            "fontFamily": {{
                    "body-lg": ["Inter"],
                    "headline-lg-mobile": ["Inter"],
                    "label-sm": ["Inter"],
                    "headline-lg": ["Inter"],
                    "body-md": ["Inter"],
                    "label-md": ["Inter"],
                    "headline-md": ["Inter"],
                    "data-mono": ["JetBrains Mono"]
            }},
            "fontSize": {{
                    "body-lg": ["16px", {{"lineHeight": "24px", "letterSpacing": "0em", "fontWeight": "400"}}],
                    "headline-lg-mobile": ["24px", {{"lineHeight": "32px", "letterSpacing": "-0.02em", "fontWeight": "600"}}],
                    "label-sm": ["11px", {{"lineHeight": "14px", "letterSpacing": "0.05em", "fontWeight": "600"}}],
                    "headline-lg": ["30px", {{"lineHeight": "38px", "letterSpacing": "-0.02em", "fontWeight": "600"}}],
                    "body-md": ["14px", {{"lineHeight": "20px", "letterSpacing": "0em", "fontWeight": "400"}}],
                    "label-md": ["12px", {{"lineHeight": "16px", "letterSpacing": "0.02em", "fontWeight": "500"}}],
                    "headline-md": ["20px", {{"lineHeight": "28px", "letterSpacing": "-0.01em", "fontWeight": "600"}}],
                    "data-mono": ["14px", {{"lineHeight": "20px", "letterSpacing": "-0.01em", "fontWeight": "400"}}]
            }}
          }},
        }},
      }}
    </script>
<style>
        body {{ background-color: #F8FAFC; font-family: 'Inter', sans-serif; }}
        .data-card {{
            background-color: #ffffff;
            border: 1px solid #E2E8F0;
            border-radius: 0.25rem;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.02);
            transition: transform 0.2s ease;
        }}
        .data-card:hover {{ transform: translateY(-2px); }}
        .material-symbols-outlined {{
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            vertical-align: middle;
        }}
        ::-webkit-scrollbar {{ width: 6px; height: 6px; }}
        ::-webkit-scrollbar-track {{ background: #f1f1f1; }}
        ::-webkit-scrollbar-thumb {{ background: #cbd5e1; border-radius: 10px; }}
        ::-webkit-scrollbar-thumb:hover {{ background: #94a3b8; }}
    </style>
</head>
<body class="bg-background text-on-background">
<!-- SideNavBar -->
<aside class="h-screen w-64 fixed left-0 top-0 bg-surface-container-lowest flex flex-col py-lg px-md border-r border-outline-variant z-50">
<div class="mb-xl px-sm">
<h1 class="font-headline-md text-headline-md font-bold text-on-surface">Inventory Pro</h1>
<p class="text-on-surface-variant font-label-md text-label-md opacity-70">Enterprise Suite</p>
</div>
<nav class="flex-grow space-y-1">
<a class="flex items-center gap-md p-md text-secondary font-bold border-r-4 border-secondary bg-surface-container-high transition-colors" href="#">
<span class="material-symbols-outlined">assessment</span>
<span class="font-body-md text-body-md">Reports</span>
</a>
<a class="flex items-center gap-md p-md text-on-surface-variant hover:bg-surface-container-high transition-colors" href="#">
<span class="material-symbols-outlined">inventory_2</span>
<span class="font-body-md text-body-md">Inventory</span>
</a>
</nav>
<div class="mt-auto p-md flex items-center gap-md">
<div class="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold">
                IG
            </div>
<div class="flex flex-col">
<span class="font-label-md text-label-md font-bold">Ingeurbe</span>
<span class="font-label-sm text-label-sm text-on-surface-variant">Admin</span>
</div>
</div>
</aside>
<!-- Main Content -->
<main class="ml-64 min-h-screen">
<!-- TopAppBar -->
<header class="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 bg-surface flex justify-between items-center h-16 px-xl border-b border-outline-variant">
<div class="flex items-center">
<h2 class="font-headline-md text-headline-md font-semibold text-on-surface">Cuantificación de Inventarios</h2>
</div>
<div class="flex items-center gap-lg">
<button class="bg-secondary text-on-secondary px-lg py-sm rounded-lg font-label-md text-label-md hover:opacity-90 transition-all flex items-center gap-sm">
<span class="material-symbols-outlined text-[18px]">download</span>
                    Descargar
                </button>
</div>
</header>
<!-- Content Canvas -->
<div class="pt-24 pb-xl px-xl space-y-xl max-w-[1400px] mx-auto">
<!-- Summary Metrics -->
<section class="grid grid-cols-1 md:grid-cols-3 gap-lg">
<div class="data-card p-lg flex flex-col justify-between h-32 border-l-4 border-secondary">
<p class="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider">Total de Registros</p>
<div class="flex items-baseline gap-sm">
<span class="font-headline-lg text-headline-lg text-on-surface">{total_registros}</span>
<span class="text-secondary text-label-md font-bold font-data-mono">movimientos</span>
</div>
</div>
<div class="data-card p-lg flex flex-col justify-between h-32 border-l-4 border-on-secondary-fixed-variant">
<p class="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider">Sucursales</p>
<div class="flex items-baseline gap-sm">
<span class="font-headline-lg text-headline-lg text-on-surface">{sucursales_unicas}</span>
<span class="text-on-surface-variant text-label-md font-data-mono">activas</span>
</div>
</div>
<div class="data-card p-lg flex flex-col justify-between h-32 border-l-4 border-tertiary-fixed-dim">
<p class="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider">Estado</p>
<div class="flex items-baseline gap-sm">
<span class="font-headline-lg text-headline-lg text-on-surface">✓</span>
<span class="text-on-tertiary-container text-label-md font-data-mono">actualizado</span>
</div>
</div>
</section>
<!-- Data Table -->
<section class="data-card overflow-hidden">
<div class="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-bright">
<h3 class="font-headline-md text-headline-md font-bold text-on-surface">Detalle de Inventarios</h3>
<div class="flex gap-sm">
<input class="border border-outline-variant rounded px-md py-xs text-body-md focus:ring-1 focus:ring-secondary focus:border-secondary outline-none" placeholder="Buscar sucursal..." type="text" id="searchInput"/>
</div>
</div>
<div class="overflow-x-auto">
<table class="w-full text-left border-collapse">
<thead>
<tr class="bg-surface-container-low border-b border-outline-variant">
<th class="px-xl py-md font-label-sm text-label-sm uppercase text-on-surface-variant">Sucursal</th>
<th class="px-xl py-md font-label-sm text-label-sm uppercase text-on-surface-variant text-right">Inventario Inicial</th>
<th class="px-xl py-md font-label-sm text-label-sm uppercase text-on-surface-variant text-right">Entradas</th>
<th class="px-xl py-md font-label-sm text-label-sm uppercase text-on-surface-variant text-right">Salidas</th>
<th class="px-xl py-md font-label-sm text-label-sm uppercase text-on-surface-variant text-right">Inventario Final</th>
<th class="px-xl py-md font-label-sm text-label-sm uppercase text-on-surface-variant text-center">Estado</th>
</tr>
</thead>
<tbody class="divide-y divide-outline-variant" id="tableBody">
{table_rows}
</tbody>
</table>
</div>
<div class="p-md bg-surface-bright flex justify-between items-center border-t border-outline-variant">
<span class="font-label-md text-label-md text-on-surface-variant">Mostrando {total_registros} registros</span>
</div>
</section>
</div>
</main>
<script>
    document.getElementById('searchInput')?.addEventListener('keyup', function(e) {{
        const search = e.target.value.toLowerCase();
        document.querySelectorAll('#tableBody tr').forEach(row => {{
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(search) ? '' : 'none';
        }});
    }});
</script>
</body>
</html>"""

    # Guardar HTML
    with open(output_html, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"[OK] HTML generado: {output_html}")
    return True


if __name__ == "__main__":
    repo_root = Path(__file__).parent
    excel_file = repo_root / "transformacion" / "InformeInventario_Unificado.xlsx"
    output_html = repo_root / "index.html"

    if not excel_file.exists():
        print(f"[ERROR] Archivo no encontrado: {excel_file}")
        exit(1)

    if generate_html_from_excel(str(excel_file), str(output_html)):
        print("[SUCCESS] Proceso completado exitosamente.")
    else:
        print("[ERROR] El proceso falló.")
