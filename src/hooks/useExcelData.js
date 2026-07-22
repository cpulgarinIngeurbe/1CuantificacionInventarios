import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'

const FILE_PATH = import.meta.env.BASE_URL + 'InventarioPorProyecto.xlsx'

function excelSerialToYM(serial) {
  const date = new Date((serial - 25569) * 86400 * 1000)
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() }
}

// Los valores vienen como texto con comas de miles: "17,360,690.5356"
function n(v) {
  if (typeof v === 'number') return v
  if (typeof v === 'string') return parseFloat(v.replace(/,/g, '')) || 0
  return 0
}

function parseRows(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: 0 })

  const rows = []
  for (let i = 1; i < raw.length; i++) {
    const r = raw[i]
    if (!r[0]) continue
    const ym = typeof r[2] === 'number' ? excelSerialToYM(r[2]) : null
    if (!ym) continue

    const avance = n(r[1])
    rows.push({
      proyecto:          String(r[0]).trim(),
      avanceObra:        avance <= 1 ? avance * 100 : avance,
      year:              ym.year,
      month:             ym.month,
      inventarioInicial: n(r[3]),
      entradasAlmacen:   n(r[4]),
      entradasTraslados: n(r[5]),
      reintegrosObra:    n(r[6]),
      salidasAlmacen:    n(r[7]),
      salidasTraslados:  n(r[8]),
      devolucionesProv:  n(r[9]),
      devolucionesValor: n(r[10]),
      ajustes:           n(r[11]),
      salidasBodega:     n(r[12]),
      entradasBodega:    n(r[13]),
      inventarioFinal:   n(r[14]),
    })
  }
  return rows
}

export function useExcelData() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    fetch(FILE_PATH)
      .then(res => {
        if (!res.ok) throw new Error(`No se pudo cargar el archivo (${res.status})`)
        return res.arrayBuffer()
      })
      .then(buf => {
        setData(parseRows(buf))
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return { data, loading, error }
}
