import React, { useState, useMemo } from 'react'
import { useExcelData } from './hooks/useExcelData'
import Header from './components/Header'
import InventoryChart from './components/InventoryChart'
import styles from './App.module.css'

export default function App() {
  const { data, loading, error } = useExcelData()

  const projects = useMemo(() => [...new Set(data.map(d => d.proyecto))].sort(), [data])
  const years    = useMemo(() => [...new Set(data.map(d => d.year))].sort(), [data])

  const [project, setProject] = useState('')
  const [year, setYear]       = useState('')

  React.useEffect(() => {
    if (projects.length) setProject(projects[0])
  }, [projects])

  React.useEffect(() => {
    if (years.length) setYear(years[years.length - 1])
  }, [years])

  const filteredRows = useMemo(() =>
    data.filter(d => d.proyecto === project && d.year === Number(year)),
    [data, project, year]
  )

  return (
    <div className={styles.app}>
      <Header
        projects={projects}
        years={years}
        project={project}
        year={year}
        onProjectChange={setProject}
        onYearChange={setYear}
        loading={loading}
      />
      <main className={styles.main}>
        {error && (
          <div className={styles.error}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}
        <InventoryChart rows={filteredRows} loading={loading} />
      </main>
    </div>
  )
}
