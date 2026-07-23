import React, { useMemo } from 'react'
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

function fmtFull(v) {
  if (v === 0 || v === null || v === undefined) return '0'
  return Math.round(Math.abs(v)).toLocaleString('es-CO')
}

function fmtAxis(v) {
  const abs = Math.abs(v)
  if (abs >= 1e9) return (v / 1e9).toFixed(1).replace(/\.0$/, '') + ' B'
  if (abs >= 1e6) return Math.round(v / 1e6) + ' M'
  if (abs >= 1e3) return Math.round(v / 1e3) + ' K'
  return v.toFixed(0)
}

// Colores pastel para proyectos
const PROJECT_COLORS = {
  FLORA:   '#e08080',
  TERRA:   '#7ab366',
  PIAZZA:  '#8cc4e0',
  ALBURA:  '#c9a8d9',
  MADERO:  '#a8a8a8',
}

const DEFAULT_COLORS = [
  '#e08080', '#7ab366', '#8cc4e0', '#c9a8d9', '#a8a8a8',
  '#f0a66a', '#6fb3d9', '#b8b8b8', '#d9a680', '#80d9b8',
]

export default function ComparativeChart({ data }) {
  const processedData = useMemo(() => {
    const projects = [...new Set(data.map(d => d.proyecto))].sort()

    const projectDataByMonth = {}
    projects.forEach(proj => {
      projectDataByMonth[proj] = {}
      MONTHS.forEach((_, idx) => {
        projectDataByMonth[proj][idx] = { inv: 0, avance: 0 }
      })
    })

    data.forEach(row => {
      const proj = row.proyecto
      const month = row.month
      if (projectDataByMonth[proj] && projectDataByMonth[proj][month]) {
        projectDataByMonth[proj][month].inv = row.inventarioFinal
        projectDataByMonth[proj][month].avance = row.avanceObra
      }
    })

    return { projects, projectDataByMonth }
  }, [data])

  const { projects, projectDataByMonth } = processedData

  if (data.length === 0) return null

  // Gráfico de Inventario
  const inventoryChartData = {
    labels: MONTHS,
    datasets: projects.map((proj, idx) => ({
      type: 'line',
      label: proj,
      data: MONTHS.map((_, month) => projectDataByMonth[proj][month].inv),
      borderColor: PROJECT_COLORS[proj] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
      backgroundColor: 'transparent',
      borderWidth: 2.5,
      pointRadius: 4,
      pointBackgroundColor: PROJECT_COLORS[proj] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      tension: 0.35,
    })),
  }

  // Gráfico de Avance
  const advanceChartData = {
    labels: MONTHS,
    datasets: projects.map((proj, idx) => ({
      type: 'line',
      label: proj,
      data: MONTHS.map((_, month) => projectDataByMonth[proj][month].avance),
      borderColor: PROJECT_COLORS[proj] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
      backgroundColor: 'transparent',
      borderWidth: 2.5,
      pointRadius: 4,
      pointBackgroundColor: PROJECT_COLORS[proj] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      tension: 0.35,
    })),
  }

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    layout: { padding: { top: 20 } },
    plugins: {
      legend: { display: true, position: 'top' },
      tooltip: {
        backgroundColor: 'rgba(44,38,32,0.96)',
        titleColor: '#ffffff',
        bodyColor: '#b8b0a8',
        borderColor: '#e8e4df',
        borderWidth: 1,
        padding: 12,
        titleFont: { size: 12, weight: '600' },
        bodyFont: { size: 11 },
      },
      datalabels: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { color: '#e8e4df' },
        ticks: { color: '#7a7269', font: { size: 10, family: 'Inter' } },
      },
    },
  }

  const inventoryOptions = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
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

  const advanceOptions = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
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

  return (
    <div className={styles.container}>
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Inventario al cierre del mes (COP)</h3>
          <div className={styles.chartWrap}>
            <Chart type="line" data={inventoryChartData} options={inventoryOptions} />
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Avance acumulado de obra (%)</h3>
          <div className={styles.chartWrap}>
            <Chart type="line" data={advanceChartData} options={advanceOptions} />
          </div>
        </div>
      </div>
    </div>
  )
}
