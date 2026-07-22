import React from 'react'
import styles from './Header.module.css'

export default function Header({ projects, years, project, year, onProjectChange, onYearChange, loading }) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>Control de Inventarios y Avance de Obra</h1>
        <p className={styles.subtitle}>
          <span className={styles.tag}>Moneda:</span> COP
          {loading && <span className={styles.loadingDot}> · Cargando datos…</span>}
        </p>
      </div>

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
    </header>
  )
}
