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

// Paleta verde
const C = {
  entradas:   'rgba(74,148,74,0.82)',     // verde medio
  salidas:    'rgba(34,85,55,0.85)',       // verde oscuro
  invLine:    '#8DC63F',                   // verde lima brillante
  avanceLine: '#C8E678',                   // verde lima claro
  grid:       'rgba(52,77,34,0.5)',
  tick:       '#8FA870',
  tickPct:    '#C8E678',
  bg:         'rgba(22,35,14,0.85)',
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
        pointBorderColor: '#16230e',
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
        pointBorderColor: '#16230e',
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
        backgroundColor: 'rgba(16,26,10,0.96)',
        titleColor: '#e0ecc8',
        bodyColor: '#8FA870',
        borderColor: '#344d22',
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
          // Mostrar etiquetas en línea de Inventario (idx 2) y Avance (idx 3)
          return ctx.datasetIndex === 2 || ctx.datasetIndex === 3
        },
        formatter(value, ctx) {
          if (ctx.datasetIndex === 3) return value.toFixed(1) + '%'
          return '$ ' + fmtFull(value)
        },
        color(ctx) {
          return ctx.datasetIndex === 3 ? C.avanceLine : C.invLine
        },
        font: { size: 10, weight: '700', family: 'Inter' },
        anchor: 'end',
        align: 'top',
        offset: 4,
        padding: { top: 2, bottom: 2, left: 5, right: 5 },
        backgroundColor: 'rgba(16,26,10,0.75)',
        borderRadius: 4,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { color: '#344d22' },
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
