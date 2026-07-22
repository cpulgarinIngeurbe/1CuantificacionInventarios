import React, { useRef } from 'react'
import styles from './Header.module.css'

export default function Header({ fileName, projects, years, project, year, onProjectChange, onYearChange, onFileLoad }) {
  const inputRef = useRef()

  function handleFile(e) {
    const file = e.target.files[0]
    if (file) onFileLoad(file)
    e.target.value = ''
  }

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>Control de Inventarios y Avance de Obra</h1>
        <p className={styles.subtitle}>
          {fileName
            ? <><span className={styles.tag}>Archivo:</span> {fileName} <span className={styles.divider}>|</span> <span className={styles.tag}>Moneda:</span> COP</>
            : 'Cargue un archivo Excel para comenzar  ·  Moneda: COP'
          }
        </p>
      </div>

      <div className={styles.right}>
        {projects.length > 0 && (
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Proyecto</label>
              <select className={styles.select} value={project} onChange={e => onProjectChange(e.target.value)}>
                {projects.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Año</label>
              <select className={styles.select} value={year} onChange={e => onYearChange(Number(e.target.value))}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        )}

        <button className={styles.uploadBtn} onClick={() => inputRef.current.click()}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {fileName ? 'Cambiar archivo' : 'Cargar Excel'}
        </button>
        <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFile} />
      </div>
    </header>
  )
}
