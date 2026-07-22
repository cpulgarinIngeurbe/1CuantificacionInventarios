import React, { useState, useMemo } from 'react'
import { useExcelData } from './hooks/useExcelData'
import Header from './components/Header'
import InventoryChart from './components/InventoryChart'
import styles from './App.module.css'

export default function App() {
  const { data, fileName, loadFile } = useExcelData()

  const projects = useMemo(() => [...new Set(data.map(d => d.proyecto))].sort(), [data])
  const years    = useMemo(() => [...new Set(data.map(d => d.year))].sort(), [data])

  const [project, setProject] = useState('')
  const [year, setYear]       = useState('')

  // Auto-select first project/year when data loads
  React.useEffect(() => {
    if (projects.length) setProject(projects[0])
  }, [projects])

  React.useEffect(() => {
    if (years.length) setYear(years[years.length - 1]) // default: most recent year
  }, [years])

  const filteredRows = useMemo(() =>
    data.filter(d => d.proyecto === project && d.year === Number(year)),
    [data, project, year]
  )

  return (
    <div className={styles.app}>
      <Header
        fileName={fileName}
        projects={projects}
        years={years}
        project={project}
        year={year}
        onProjectChange={setProject}
        onYearChange={setYear}
        onFileLoad={loadFile}
      />
      <main className={styles.main}>
        <InventoryChart rows={filteredRows} />
      </main>
    </div>
  )
}
