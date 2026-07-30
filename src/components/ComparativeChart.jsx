import React, { useMemo, useState, useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  LineController, LineElement, PointElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Chart } from 'react-chartjs-2'
import styles from './ComparativeChart.module.css'

ChartJS.register(
  CategoryScale, LinearScale,
  LineController, LineElement, PointElement,
  Title, Tooltip, Legend, Filler,
  ChartDataLabels
)

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function fmtAxis(v) {
  const abs = Math.abs(v)
  if (abs >= 1e6) return Math.round(v / 1e6) + ' MM'
  if (abs >= 1e3) return Math.round(v / 1e3) + ' K'
  return v.toFixed(0)
}

function fmtCOP(v) {
  if (v === null || v === undefined) return '-'
  return '$ ' + Math.round(v).toLocaleString('es-CO')
}

// Plugin estable (no se recrea en cada render): react-chartjs-2 solo registra el arreglo
// `plugins` en el montaje inicial, así que los datos a dibujar viajan por `options.plugins.avgMarkers`,
// que sí se actualiza en cada render y llega "fresco" a este hook en cada dibujo.
// Cada círculo se posiciona en el valor real de su promedio sobre el mismo eje Y de las curvas,
// con un mínimo de espacio vertical entre ellos para que no se superpongan.
const avgMarkersPlugin = {
  id: 'avgMarkers',
  afterDatasetsDraw(chart, _args, pluginOptions) {
    const markers = (pluginOptions && pluginOptions.markers) || []
    const scaleY = chart.scales && chart.scales.y
    if (!scaleY || markers.length === 0) return
    const { ctx, chartArea } = chart
    const dotX = chartArea.right + 210
    const MIN_GAP = 18

    const items = markers
      .map(m => ({ ...m, rawY: scaleY.getPixelForValue(m.value) }))
      .sort((a, b) => a.rawY - b.rawY)

    let prevY = -Infinity
    items.forEach(item => {
      item.y = Math.max(item.rawY, prevY + MIN_GAP)
      prevY = item.y
    })

    ctx.save()
    items.forEach(item => {
      ctx.beginPath()
      ctx.arc(dotX, item.y, 6, 0, Math.PI * 2)
      ctx.fillStyle = item.color
      ctx.fill()
      ctx.lineWidth = 1.5
      ctx.strokeStyle = '#ffffff'
      ctx.stroke()

      ctx.fillStyle = '#2c2620'
      ctx.font = "600 10px 'Inter', sans-serif"
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'left'
      ctx.fillText(`${item.proj}  ${fmtCOP(item.value)}`, dotX + 11, item.y)
    })
    ctx.restore()
  },
}

// Presupuesto total (Ppto.) por proyecto
const PROJECT_BUDGETS = {
  '53 LIVING':         27477699037.18,
  '63 LIVING':         43322405844.12,
  ALBURA:              176016162712.33,
  CORTTEZA:            114663016327.97,
  FLORA:               134919714632.99,
  MADERO:              102996550236.60,
  NATIVA:              218221285049.31,
  PIAZZA:              112750252904.11,
  'RESERVA DEL LAGO':  54214479912.33,
  TERRA:               97713675427.16,
  TREZE:               59479490197.10,
}

const PROJECT_COLORS = {
  FLORA:   '#e08080',
  TERRA:   '#7ab366',
  PIAZZA:  '#8cc4e0',
  ALBURA:  '#c9a8d9',
  MADERO:  '#a8a8a8',
}

// Colores distintos entre sí y de los fijos en PROJECT_COLORS (ninguno debe repetirse)
const DEFAULT_COLORS = [
  '#f0a66a', '#e8c15c', '#5cb8a8', '#7f8fd9', '#d97fb0',
  '#b8895c', '#a3d95c', '#5c7fd9', '#8f5cd9', '#5cd9b3',
]

// Asigna un color estable por proyecto (independiente de filtros de año/etapa/selección)
function buildColorMap(allProjects) {
  const map = {}
  let defaultIdx = 0
  allProjects.forEach(proj => {
    if (PROJECT_COLORS[proj]) {
      map[proj] = PROJECT_COLORS[proj]
    } else {
      map[proj] = DEFAULT_COLORS[defaultIdx % DEFAULT_COLORS.length]
      defaultIdx++
    }
  })
  return map
}

const STAGES = ['Arranque', 'Ejecución', 'Cierre']
const STAGE_RANGE_LABEL = {
  Arranque: '0% - 15%',
  'Ejecución': '15% - 60%',
  Cierre: '60%+',
}

function stageForAvance(avance) {
  if (avance === null || avance === undefined) return null
  if (avance < 15) return 'Arranque'
  if (avance < 60) return 'Ejecución'
  return 'Cierre'
}

export default function ComparativeChart({ data, selectedYears }) {
  const [selectedStages, setSelectedStages] = useState(() =>
    STAGES.reduce((acc, s) => { acc[s] = true; return acc }, {})
  )

  // Color estable por proyecto, calculado sobre todos los proyectos del dataset (no cambia con filtros)
  const colorByProject = useMemo(() => {
    const allProjects = [...new Set(data.map(d => d.proyecto))].sort()
    return buildColorMap(allProjects)
  }, [data])

  // Etapa de cada proyecto según su último avance conocido (independiente del año filtrado)
  const stageByProject = useMemo(() => {
    const rowsByProject = {}
    data.forEach(d => {
      if (!rowsByProject[d.proyecto]) rowsByProject[d.proyecto] = []
      rowsByProject[d.proyecto].push(d)
    })
    const map = {}
    Object.entries(rowsByProject).forEach(([proj, rows]) => {
      const sorted = [...rows].sort((a, b) => (a.year - b.year) || (a.month - b.month))
      let lastAvance = null
      for (let i = sorted.length - 1; i >= 0; i--) {
        if (sorted[i].avanceObra !== null && sorted[i].avanceObra !== undefined) {
          lastAvance = sorted[i].avanceObra
          break
        }
      }
      map[proj] = stageForAvance(lastAvance)
    })
    return map
  }, [data])

  const toggleStage = (stage) => {
    setSelectedStages(prev => ({ ...prev, [stage]: !prev[stage] }))
  }

  const processedData = useMemo(() => {
    const filteredData = selectedYears.length === 0
      ? data
      : data.filter(d => selectedYears.includes(d.year))
    const allProjects = [...new Set(filteredData.map(d => d.proyecto))].sort()
    const projects = allProjects.filter(p => selectedStages[stageByProject[p]] !== false)

    // Un solo año seleccionado: 12 meses fijos. Todos o varios años: línea de tiempo cronológica.
    const singleYear = selectedYears.length === 1
    let periods
    if (singleYear) {
      periods = MONTHS.map((label, month) => ({ key: String(month), label }))
    } else {
      const seen = new Map()
      filteredData.forEach(d => {
        const key = `${d.year}-${d.month}`
        if (!seen.has(key)) seen.set(key, { year: d.year, month: d.month })
      })
      periods = [...seen.values()]
        .sort((a, b) => a.year - b.year || a.month - b.month)
        .map(p => ({ key: `${p.year}-${p.month}`, label: `${MONTHS[p.month]} ${String(p.year).slice(-2)}` }))
    }
    const periodIndexByKey = new Map(periods.map((p, i) => [p.key, i]))

    const projectDataByPeriod = {}
    projects.forEach(proj => {
      projectDataByPeriod[proj] = Array(periods.length).fill(null)
    })

    filteredData.forEach(row => {
      const proj = row.proyecto
      const key = singleYear ? String(row.month) : `${row.year}-${row.month}`
      const idx = periodIndexByKey.get(key)
      if (projectDataByPeriod[proj] && idx !== undefined) {
        projectDataByPeriod[proj][idx] = {
          inv: row.inventarioFinal || 0,
          avance: row.avanceObra || 0,
        }
      }
    })

    return { projects, periods, projectDataByPeriod }
  }, [data, selectedYears, selectedStages, stageByProject])

  const { projects, periods, projectDataByPeriod } = processedData

  // Promedio de inventario por proyecto, según los períodos visibles con el filtro actual
  const avgInvByProject = useMemo(() => {
    const map = {}
    projects.forEach(proj => {
      const vals = projectDataByPeriod[proj]
        .filter(d => d && d.inv !== null && d.inv !== undefined)
        .map(d => d.inv)
      map[proj] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    })
    return map
  }, [projects, projectDataByPeriod])

  const [selectedProjects, setSelectedProjects] = useState({})
  const [visibleDatasets, setVisibleDatasets] = useState({})
  const [expandedChart, setExpandedChart] = useState(null)
  const [hoveredLegend, setHoveredLegend] = useState(null)
  const inventoryChartRef = useRef(null)
  const advanceChartRef = useRef(null)

  // Sincronizar selectedProjects cuando cambien los proyectos
  useEffect(() => {
    setSelectedProjects(
      projects.reduce((acc, proj) => {
        acc[proj] = true
        return acc
      }, {})
    )
  }, [projects])

  // Inicializar visibleDatasets cuando cambien los proyectos activos
  useEffect(() => {
    const activeProjects = projects.filter(p => selectedProjects[p])
    setVisibleDatasets(
      activeProjects.reduce((acc, proj) => {
        acc[`inventory-${proj}`] = true
        acc[`advance-${proj}`] = true
        return acc
      }, {})
    )
  }, [selectedProjects, projects])

  if (data.length === 0) return null

  const toggleProject = (proj) => {
    setSelectedProjects(prev => ({
      ...prev,
      [proj]: !prev[proj]
    }))
  }

  const toggleAll = () => {
    const allSelected = projects.every(p => selectedProjects[p])
    setSelectedProjects(
      projects.reduce((acc, proj) => {
        acc[proj] = !allSelected
        return acc
      }, {})
    )
  }

  const activeProjects = projects.filter(p => selectedProjects[p])
  const allSelected = projects.every(p => selectedProjects[p])

  const toggleDataset = (datasetId) => {
    setVisibleDatasets(prev => ({
      ...prev,
      [datasetId]: !prev[datasetId]
    }))
  }

  // Gráfico de Inventario
  const inventoryChartData = {
    labels: periods.map(p => p.label),
    datasets: activeProjects
      .filter(proj => visibleDatasets[`inventory-${proj}`] !== false)
      .map(proj => ({
        type: 'line',
        label: proj,
        data: projectDataByPeriod[proj].map(d => d ? d.inv : null),
        borderColor: colorByProject[proj],
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: colorByProject[proj],
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        tension: 0.35,
        spanGaps: false,
      })),
  }

  // Columna de círculos de promedio: se dibuja directamente sobre el mismo eje Y del gráfico
  // (misma escala que las curvas), separada a la derecha de las etiquetas de fin de curva,
  // y con un mínimo de espacio vertical entre círculos para que no se superpongan entre sí.
  const avgMarkerColumn = activeProjects
    .filter(proj => visibleDatasets[`inventory-${proj}`] !== false)
    .filter(proj => avgInvByProject[proj] !== null && avgInvByProject[proj] !== undefined)
    .map(proj => ({ proj, color: colorByProject[proj], value: avgInvByProject[proj] }))

  // Gráfico de Avance
  const advanceChartData = {
    labels: periods.map(p => p.label),
    datasets: activeProjects
      .filter(proj => visibleDatasets[`advance-${proj}`] !== false)
      .map((proj, idx) => ({
        type: 'line',
        label: proj,
        data: projectDataByPeriod[proj].map(d => d ? d.avance : null),
        borderColor: colorByProject[proj],
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: colorByProject[proj],
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        tension: 0.35,
        spanGaps: false,
      })),
  }

  const createChartOptions = (chartType) => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      layout: { padding: { top: 20, right: chartType === 'inventory' ? 460 : 150 } },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(44,38,32,0.96)',
          titleColor: '#ffffff',
          bodyColor: '#b8b0a8',
          borderColor: '#e8e4df',
          borderWidth: 1,
          padding: 12,
          titleFont: { size: 12, weight: '600' },
          bodyFont: { size: 11 },
          itemSort(a, b) {
            return (b.parsed.y ?? -Infinity) - (a.parsed.y ?? -Infinity)
          },
          callbacks: {
            label(ctx) {
              const label = ctx.dataset.label
              let text = `${label}: ${ctx.formattedValue}`
              if (chartType === 'inventory') {
                const avance = projectDataByPeriod[label]?.[ctx.dataIndex]?.avance
                if (avance !== null && avance !== undefined) {
                  text += ` (${Math.round(avance)}%)`
                }
              }
              return text
            },
          },
        },
        datalabels: {
          display(ctx) {
            // Encontrar el último punto con datos válidos
            const data = ctx.dataset.data
            for (let i = data.length - 1; i >= 0; i--) {
              if (data[i] !== null && data[i] !== undefined) {
                return ctx.dataIndex === i
              }
            }
            return false
          },
          formatter(value, ctx) {
            const label = ctx.dataset.label
            if (chartType === 'inventory') {
              const avance = projectDataByPeriod[label]?.[ctx.dataIndex]?.avance
              if (avance !== null && avance !== undefined) {
                return `${label}  ${Math.round(avance)}%`
              }
            }
            return label
          },
          color(ctx) {
            return '#ffffff'
          },
          font: { size: 8, weight: '600', family: 'Inter' },
          anchor: 'center',
          align: 'right',
          offset: 10,
          backgroundColor(ctx) {
            return colorByProject[ctx.dataset.label]
          },
          borderRadius: 2,
          padding: { top: 1, bottom: 1, left: 3, right: 3 },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { color: '#e8e4df' },
          ticks: { color: '#7a7269', font: { size: 10, family: 'Inter' } },
        },
      },
    }

    if (chartType === 'inventory') {
      return {
        ...baseOptions,
        scales: {
          ...baseOptions.scales,
          y: {
            type: 'linear',
            position: 'left',
            grid: { color: 'rgba(200,200,200,0.2)' },
            border: { display: false },
            ticks: {
              color: '#7a7269',
              font: { size: 10, family: 'Inter' },
              callback: v => fmtAxis(v),
            },
          },
        },
      }
    }

    if (chartType === 'advance') {
      return {
        ...baseOptions,
        scales: {
          ...baseOptions.scales,
          y: {
            type: 'linear',
            position: 'left',
            min: 0,
            max: 100,
            grid: { color: 'rgba(200,200,200,0.2)' },
            border: { display: false },
            ticks: {
              color: '#7a7269',
              font: { size: 10, family: 'Inter' },
              callback: v => v + '%',
              stepSize: 20,
            },
          },
        },
      }
    }

    return baseOptions
  }

  const inventoryOptions = createChartOptions('inventory')
  inventoryOptions.plugins.avgMarkers = { markers: avgMarkerColumn }
  const advanceOptions = createChartOptions('advance')

  return (
    <div className={styles.container}>
      <div className={styles.filterSection}>
        <div className={styles.filterHeader}>
          <label className={styles.filterTitle}>Filtrar por Etapa de Avance</label>
        </div>
        <div className={styles.filterGrid}>
          {STAGES.map(stage => (
            <label key={stage} className={styles.filterItem}>
              <input
                type="checkbox"
                checked={!!selectedStages[stage]}
                onChange={() => toggleStage(stage)}
                className={styles.checkbox}
              />
              <span className={styles.filterLabel}>{stage} ({STAGE_RANGE_LABEL[stage]})</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterHeader}>
          <label className={styles.filterTitle}>Seleccionar Proyectos</label>
          <button className={styles.toggleAllBtn} onClick={toggleAll}>
            {allSelected ? 'Desseleccionar todo' : 'Seleccionar todo'}
          </button>
        </div>
        <div className={styles.filterGrid}>
          {projects.map(proj => (
            <label key={proj} className={styles.filterItem}>
              <input
                type="checkbox"
                checked={selectedProjects[proj]}
                onChange={() => toggleProject(proj)}
                className={styles.checkbox}
              />
              <span className={styles.filterLabel}>{proj}</span>
              <span
                className={styles.colorDot}
                style={{ backgroundColor: colorByProject[proj] }}
              />
            </label>
          ))}
        </div>
      </div>

      {expandedChart && (
        <div className={styles.expandedOverlay} onClick={() => setExpandedChart(null)}>
          <div className={styles.expandedChart} onClick={e => e.stopPropagation()}>
            <button
              className={styles.closeButton}
              onClick={() => setExpandedChart(null)}
              aria-label="Cerrar"
            >
              ✕
            </button>
            {expandedChart === 'inventory' && (
              <>
                <h3 className={styles.expandedTitle}>Inventario al cierre del mes (COP)</h3>
                <div className={styles.expandedChartWrap}>
                  <Chart type="line" data={inventoryChartData} options={inventoryOptions} plugins={[avgMarkersPlugin]} />
                </div>
              </>
            )}
            {expandedChart === 'advance' && (
              <>
                <h3 className={styles.expandedTitle}>Avance acumulado de obra (%)</h3>
                <div className={styles.expandedChartWrap}>
                  <Chart type="line" data={advanceChartData} options={advanceOptions} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Inventario al cierre del mes (COP)</h3>
            <button
              className={styles.expandButton}
              onClick={() => setExpandedChart('inventory')}
              aria-label="Expandir"
              title="Expandir gráfico"
            >
              ⛶
            </button>
          </div>
          <div className={styles.chartBody}>
            <div className={styles.sideLegend}>
              {activeProjects.map((proj, idx) => (
                <div
                  key={proj}
                  className={styles.legendItem}
                  onClick={() => toggleDataset(`inventory-${proj}`)}
                  onMouseEnter={() => setHoveredLegend(`inventory-${proj}`)}
                  onMouseLeave={() => setHoveredLegend(null)}
                >
                  <span
                    className={styles.legendDot}
                    style={{
                      backgroundColor: colorByProject[proj],
                      opacity: visibleDatasets[`inventory-${proj}`] !== false ? 1 : 0.3,
                    }}
                  />
                  <span className={styles.legendText}>{proj}</span>
                  {hoveredLegend === `inventory-${proj}` && (
                    <div className={styles.tooltip}>
                      {proj}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className={styles.chartWrap}>
              <Chart ref={inventoryChartRef} type="line" data={inventoryChartData} options={inventoryOptions} plugins={[avgMarkersPlugin]} />
            </div>
          </div>

          <table className={styles.budgetTable}>
            <thead>
              <tr>
                <th>Proyecto</th>
                <th>Presupuesto Total</th>
              </tr>
            </thead>
            <tbody>
              {activeProjects.map(proj => (
                <tr key={proj}>
                  <td>
                    <span className={styles.budgetTableProject}>
                      <span className={styles.legendDot} style={{ backgroundColor: colorByProject[proj] }} />
                      {proj}
                    </span>
                  </td>
                  <td>{fmtCOP(PROJECT_BUDGETS[proj])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Avance acumulado de obra (%)</h3>
            <button
              className={styles.expandButton}
              onClick={() => setExpandedChart('advance')}
              aria-label="Expandir"
              title="Expandir gráfico"
            >
              ⛶
            </button>
          </div>
          <div className={styles.chartBody}>
            <div className={styles.chartWrap}>
              <Chart ref={advanceChartRef} type="line" data={advanceChartData} options={advanceOptions} />
            </div>
            <div className={styles.sideLegend}>
              {activeProjects.map((proj, idx) => (
                <div
                  key={proj}
                  className={styles.legendItem}
                  onClick={() => toggleDataset(`advance-${proj}`)}
                  onMouseEnter={() => setHoveredLegend(`advance-${proj}`)}
                  onMouseLeave={() => setHoveredLegend(null)}
                >
                  <span
                    className={styles.legendDot}
                    style={{
                      backgroundColor: colorByProject[proj],
                      opacity: visibleDatasets[`advance-${proj}`] !== false ? 1 : 0.3,
                    }}
                  />
                  <span className={styles.legendText}>{proj}</span>
                  {hoveredLegend === `advance-${proj}` && (
                    <div className={styles.tooltip}>
                      {proj}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
