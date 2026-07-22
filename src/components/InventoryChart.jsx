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

function fmtCOP(v) {
  const abs = Math.abs(v)
  if (abs >= 1e9) return (v / 1e9).toFixed(1).replace(/\.0$/, '') + ' B'
  if (abs >= 1e6) return Math.round(v / 1e6) + ' M'
  if (abs >= 1e3) return Math.round(v / 1e3) + ' K'
  return v.toFixed(0)
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
        backgroundColor: 'rgba(68,114,196,0.8)',
        borderColor: 'rgba(68,114,196,1)',
        borderWidth: 0,
        borderRadius: { topLeft: 3, topRight: 3 },
        yAxisID: 'yCOP',
        order: 3,
      },
      {
        type: 'bar',
        label: 'Salidas',
        data: salidas,
        backgroundColor: 'rgba(237,125,49,0.8)',
        borderColor: 'rgba(237,125,49,1)',
        borderWidth: 0,
        borderRadius: { bottomLeft: 3, bottomRight: 3 },
        yAxisID: 'yCOP',
        order: 3,
      },
      {
        type: 'line',
        label: 'Inventario al cierre del mes',
        data: invFinal,
        borderColor: '#e94560',
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: '#e94560',
        pointBorderColor: '#0d1117',
        pointBorderWidth: 2,
        tension: 0.35,
        yAxisID: 'yCOP',
        order: 1,
      },
      {
        type: 'line',
        label: 'Avance acumulado (%)',
        data: avance,
        borderColor: '#0f9461',
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: '#0f9461',
        pointBorderColor: '#0d1117',
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
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(13,17,23,0.95)',
        titleColor: '#e6edf3',
        bodyColor: '#8b949e',
        borderColor: '#30363d',
        borderWidth: 1,
        padding: 14,
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 12 },
        callbacks: {
          label(ctx) {
            const v = ctx.parsed.y
            if (ctx.dataset.yAxisID === 'yPct') return `  ${ctx.dataset.label}: ${v.toFixed(1)}%`
            return `  ${ctx.dataset.label}: ${fmtCOP(v)} COP`
          },
        },
      },
      datalabels: {
        display(ctx) {
          // Solo mostrar en la línea de Inventario Final (índice 2)
          return ctx.datasetIndex === 2
        },
        formatter(value) {
          return fmtCOP(value)
        },
        color: '#e94560',
        font: { size: 11, weight: '600', family: 'Inter' },
        anchor: 'end',
        align: 'top',
        offset: 4,
        padding: { top: 2, bottom: 2, left: 4, right: 4 },
        backgroundColor: 'rgba(13,17,23,0.7)',
        borderRadius: 4,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { color: '#30363d' },
        ticks: { color: '#8b949e', font: { size: 11, family: 'Inter' } },
      },
      yCOP: {
        type: 'linear',
        position: 'left',
        grid: { color: 'rgba(48,54,61,0.6)', drawBorder: false },
        border: { display: false },
        ticks: {
          color: '#8b949e',
          font: { size: 11, family: 'Inter' },
          callback: v => fmtCOP(v),
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
          color: '#0f9461',
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
          <svg width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24" opacity="0.25">
            <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p>Cargue el archivo Excel para ver la gráfica</p>
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
          { color: '#4472c4', type: 'box', label: 'Entradas: compras / recepciones de almacén' },
          { color: '#ed7d31', type: 'box', label: 'Salidas: consumo en obra' },
          { color: '#e94560', type: 'line', label: 'Inventario al cierre del mes' },
          { color: '#0f9461', type: 'line', label: 'Avance acumulado de obra' },
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
