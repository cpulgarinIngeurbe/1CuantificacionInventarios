import React, { useState, useRef, useEffect } from 'react'
import styles from './Header.module.css'

export default function Header({ projects, years, project, selectedYears, onProjectChange, onYearsChange, loading }) {
  const [yearMenuOpen, setYearMenuOpen] = useState(false)
  const yearMenuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (yearMenuRef.current && !yearMenuRef.current.contains(e.target)) {
        setYearMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleYear = (y) => {
    if (selectedYears.includes(y)) {
      onYearsChange(selectedYears.filter(x => x !== y))
    } else {
      onYearsChange([...selectedYears, y].sort((a, b) => a - b))
    }
  }

  const yearLabel = selectedYears.length === 0
    ? 'Todos'
    : [...selectedYears].sort((a, b) => a - b).join(', ')

  return (
    <header className={styles.header}>
      <img src="/1CuantificacionInventarios/logo.png" alt="Ingeurbe" className={styles.logo} />
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
          <div className={styles.filterGroup} ref={yearMenuRef} style={{ position: 'relative' }}>
            <label className={styles.filterLabel}>Año</label>
            <button
              type="button"
              className={styles.select}
              onClick={() => setYearMenuOpen(o => !o)}
            >
              {yearLabel}
            </button>
            {yearMenuOpen && (
              <div className={styles.yearDropdown}>
                <label className={styles.yearOption}>
                  <input
                    type="checkbox"
                    checked={selectedYears.length === 0}
                    onChange={() => onYearsChange([])}
                  />
                  Todos
                </label>
                {years.map(y => (
                  <label key={y} className={styles.yearOption}>
                    <input
                      type="checkbox"
                      checked={selectedYears.includes(y)}
                      onChange={() => toggleYear(y)}
                    />
                    {y}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
