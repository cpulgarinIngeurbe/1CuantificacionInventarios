import React, { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarController, BarElement,
  LineController, LineElement, PointElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Chart } from 'react-chartjs-2'
import styles from './InventoryChart.module.css'

ChartJS.register(
  CategoryScale, LinearScale,
  BarController, BarElement,
  LineController, LineElement, PointElement,
  Title, Tooltip, Legend, Filler,
  ChartDataLabels
)

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

// Formato completo con separadores de miles (puntos colombianos)
function fmtFull(v) {
  if (v === 0 || v === null || v === undefined) return '0'
  return Math.round(Math.abs(v)).toLocaleString('es-CO')
}

// Formato compacto para ejes
function fmtAxis(v) {
  const abs = Math.abs(v)
  if (abs >= 1e9) return (v / 1e9).toFixed(1).replace(/\.0$/, '') + ' B'
  if (abs >= 1e6) return Math.round(v / 1e6) + ' M'
  if (abs >= 1e3) return Math.round(v / 1e3) + ' K'
  return v.toFixed(0)
}

// Paleta de colores pastel con énfasis verde corporativo
const C = {
  entradas:   'rgba(143,188,226,0.85)',   // azul pastel
  salidas:    'rgba(240,166,106,0.85)',   // naranja pastel
  invLine:    '#d99999',                  // rojo pastel
  avanceLine: '#7ab366',                  // verde pastel
  grid:       'rgba(200,200,200,0.3)',
  tick:       '#7a7269',
  tickPct:    '#5c9966',
  bg:         'rgba(255,255,255,0.95)',
}

export default function InventoryChart({ rows }) {
  const sorted = useMemo(() =>
    [...rows].sort((a, b) => a.month - b.month), [rows])

  const labels   = sorted.map(d => MONTHS[d.month])
  const entradas = sorted.map(d => d.entradasAlmacen + d.entradasTraslados + d.reintegrosObra + d.entradasBodega)
  const salidas  = sorted.map(d => -(Math.abs(d.salidasAlmacen) + Math.abs(d.salidasTraslados) + Math.abs(d.devolucionesProv) + Math.abs(d.salidasBodega)))
  const invFinal = sorted.map(d => d.inventarioFinal)
  const avance   = sorted.map(d => d.avanceObra)

  const chartData = {
    labels,
    datasets: [
      {
        type: 'bar',
        label: 'Entradas',
        data: entradas,
        backgroundColor: C.entradas,
        borderWidth: 0,
        borderRadius: { topLeft: 4, topRight: 4 },
        yAxisID: 'yCOP',
        order: 3,
      },
      {
        type: 'bar',
        label: 'Salidas',
        data: salidas,
        backgroundColor: C.salidas,
        borderWidth: 0,
        borderRadius: { bottomLeft: 4, bottomRight: 4 },
        yAxisID: 'yCOP',
        order: 3,
      },
      {
        type: 'line',
        label: 'Inventario al cierre del mes',
        data: invFinal,
        borderColor: C.invLine,
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: C.invLine,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        tension: 0.35,
        yAxisID: 'yCOP',
        order: 1,
      },
      {
        type: 'line',
        label: 'Avance acumulado (%)',
        data: avance,
        borderColor: C.avanceLine,
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: C.avanceLine,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        tension: 0.35,
        yAxisID: 'yPct',
        order: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    layout: { padding: { top: 36 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(44,38,32,0.96)',
        titleColor: '#ffffff',
        bodyColor: '#b8b0a8',
        borderColor: '#e8e4df',
        borderWidth: 1,
        padding: 14,
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 12 },
        callbacks: {
          label(ctx) {
            const v = ctx.parsed.y
            if (ctx.dataset.yAxisID === 'yPct') return `  ${ctx.dataset.label}: ${v.toFixed(1)}%`
            return `  ${ctx.dataset.label}: $ ${fmtFull(v)}`
          },
        },
      },
      datalabels: {
        display(ctx) {
          // Mostrar etiquetas en barras (0, 1) y líneas (2, 3)
          return true
        },
        formatter(value, ctx) {
          if (value === 0 || value === null || value === undefined) return ''
          if (ctx.datasetIndex === 3) return value.toFixed(1) + '%'
          if (ctx.datasetIndex === 0 || ctx.datasetIndex === 1) {
            return fmtFull(Math.abs(value))
          }
          return '$ ' + fmtFull(value)
        },
        color(ctx) {
          if (ctx.datasetIndex === 0) return '#ffffff'
          if (ctx.datasetIndex === 1) return '#ffffff'
          return ctx.datasetIndex === 3 ? C.avanceLine : C.invLine
        },
        font(ctx) {
          if (ctx.datasetIndex === 0 || ctx.datasetIndex === 1) {
            return { size: 8, weight: '600', family: 'Inter' }
          }
          return { size: 10, weight: '700', family: 'Inter' }
        },
        anchor(ctx) {
          if (ctx.datasetIndex === 0) return 'end'
          if (ctx.datasetIndex === 1) return 'start'
          return 'end'
        },
        align(ctx) {
          if (ctx.datasetIndex === 0) return 'top'
          if (ctx.datasetIndex === 1) return 'bottom'
          return 'top'
        },
        offset(ctx) {
          if (ctx.datasetIndex === 0 || ctx.datasetIndex === 1) return 2
          return 4
        },
        padding(ctx) {
          if (ctx.datasetIndex === 0 || ctx.datasetIndex === 1) {
            return { top: 1, bottom: 1, left: 3, right: 3 }
          }
          return { top: 2, bottom: 2, left: 5, right: 5 }
        },
        backgroundColor(ctx) {
          if (ctx.datasetIndex === 0) return 'rgba(59,89,152,0.8)'
          if (ctx.datasetIndex === 1) return 'rgba(230,126,34,0.8)'
          return 'rgba(255,255,255,0.9)'
        },
        borderRadius: 3,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { color: '#e8e4df' },
        ticks: { color: C.tick, font: { size: 11, family: 'Inter' } },
      },
      yCOP: {
        type: 'linear',
        position: 'left',
        grid: { color: C.grid },
        border: { display: false },
        ticks: {
          color: C.tick,
          font: { size: 11, family: 'Inter' },
          callback: v => fmtAxis(v),
        },
      },
      yPct: {
        type: 'linear',
        position: 'right',
        min: 0,
        max: 100,
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: C.tickPct,
          font: { size: 11, family: 'Inter' },
          callback: v => v + '%',
          stepSize: 20,
        },
      },
    },
  }

  if (rows.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.leftLabel}>Inventario (COP)</span>
          <span className={styles.rightLabel}>Avance de obra (%)</span>
        </div>
        <div className={styles.empty}>
          <svg width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24" opacity="0.2">
            <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p>Seleccione un proyecto para ver la gráfica</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.leftLabel}>Inventario (COP)</span>
        <span className={styles.rightLabel}>Avance de obra (%)</span>
      </div>

      <div className={styles.chartWrap}>
        <Chart type="bar" data={chartData} options={options} />
      </div>

      <div className={styles.legend}>
        {[
          { color: C.entradas,   type: 'box',  label: 'Entradas: compras / recepciones de almacén' },
          { color: C.salidas,    type: 'box',  label: 'Salidas: consumo en obra' },
          { color: C.invLine,    type: 'line', label: 'Inventario al cierre del mes' },
          { color: C.avanceLine, type: 'line', label: 'Avance acumulado de obra' },
        ].map(item => (
          <div key={item.label} className={styles.legendItem}>
            {item.type === 'box'
              ? <span className={styles.legendBox} style={{ background: item.color }} />
              : <span className={styles.legendLine} style={{ background: item.color }} />
            }
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
