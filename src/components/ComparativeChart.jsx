import React, { useMemo, useState, useEffect } from 'react'
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
  if (abs >= 1e9) return (v / 1e9).toFixed(1).replace(/\.0$/, '') + ' B'
  if (abs >= 1e6) return Math.round(v / 1e6) + ' M'
  if (abs >= 1e3) return Math.round(v / 1e3) + ' K'
  return v.toFixed(0)
}

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

export default function ComparativeChart({ data, year }) {
  const processedData = useMemo(() => {
    const filteredData = year ? data.filter(d => d.year === Number(year)) : data
    const projects = [...new Set(filteredData.map(d => d.proyecto))].sort()

    const projectDataByMonth = {}
    projects.forEach(proj => {
      projectDataByMonth[proj] = Array(12).fill(null)
    })

    filteredData.forEach(row => {
      const proj = row.proyecto
      const month = row.month
      if (projectDataByMonth[proj] && month >= 0 && month < 12) {
        projectDataByMonth[proj][month] = {
          inv: row.inventarioFinal || 0,
          avance: row.avanceObra || 0,
        }
      }
    })

    return { projects, projectDataByMonth }
  }, [data, year])

  const { projects, projectDataByMonth } = processedData
  const [selectedProjects, setSelectedProjects] = useState({})

  // Sincronizar selectedProjects cuando cambien los proyectos
  useEffect(() => {
    setSelectedProjects(
      projects.reduce((acc, proj) => {
        acc[proj] = true
        return acc
      }, {})
    )
  }, [projects])

  if (data.length === 0) return null

  const toggleProject = (proj) => {
    setSelectedProjects(prev => ({
      ...prev,
      [proj]: !prev[proj]
    }))
  }

  const activeProjects = projects.filter(p => selectedProjects[p])

  // Gráfico de Inventario
  const inventoryChartData = {
    labels: MONTHS,
    datasets: activeProjects.map((proj, idx) => ({
      type: 'line',
      label: proj,
      data: projectDataByMonth[proj].map(d => d ? d.inv : null),
      borderColor: PROJECT_COLORS[proj] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
      backgroundColor: 'transparent',
      borderWidth: 2.5,
      pointRadius: 4,
      pointBackgroundColor: PROJECT_COLORS[proj] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      tension: 0.35,
      spanGaps: false,
    })),
  }

  // Gráfico de Avance
  const advanceChartData = {
    labels: MONTHS,
    datasets: activeProjects.map((proj, idx) => ({
      type: 'line',
      label: proj,
      data: projectDataByMonth[proj].map(d => d ? d.avance : null),
      borderColor: PROJECT_COLORS[proj] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
      backgroundColor: 'transparent',
      borderWidth: 2.5,
      pointRadius: 4,
      pointBackgroundColor: PROJECT_COLORS[proj] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      tension: 0.35,
      spanGaps: false,
    })),
  }

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    layout: { padding: { top: 20 } },
    plugins: {
      legend: { display: false },
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
          return ctx.dataset.label
        },
        color(ctx) {
          return '#ffffff'
        },
        font: { size: 7, weight: '600', family: 'Inter' },
        anchor: 'center',
        align: 'left',
        offset: 10,
        backgroundColor(ctx) {
          return PROJECT_COLORS[ctx.dataset.label] || DEFAULT_COLORS[ctx.datasetIndex % DEFAULT_COLORS.length]
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
      <div className={styles.filterSection}>
        <label className={styles.filterTitle}>Seleccionar Proyectos</label>
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
                style={{ backgroundColor: PROJECT_COLORS[proj] || DEFAULT_COLORS[projects.indexOf(proj) % DEFAULT_COLORS.length] }}
              />
            </label>
          ))}
        </div>
      </div>

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
