import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'

const FILE_PATH = import.meta.env.BASE_URL + 'InventarioPorProyecto.xlsx'

function excelSerialToYM(serial) {
  const date = new Date((serial - 25569) * 86400 * 1000)
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() }
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

    const avance = Number(r[1]) || 0
    rows.push({
      proyecto:          String(r[0]).trim(),
      avanceObra:        avance <= 1 ? avance * 100 : avance,
      year:              ym.year,
      month:             ym.month,
      inventarioInicial: Number(r[3])  || 0,
      entradasAlmacen:   Number(r[4])  || 0,
      entradasTraslados: Number(r[5])  || 0,
      reintegrosObra:    Number(r[6])  || 0,
      salidasAlmacen:    Number(r[7])  || 0,
      salidasTraslados:  Number(r[8])  || 0,
      devolucionesProv:  Number(r[9])  || 0,
      devolucionesValor: Number(r[10]) || 0,
      ajustes:           Number(r[11]) || 0,
      salidasBodega:     Number(r[12]) || 0,
      entradasBodega:    Number(r[13]) || 0,
      inventarioFinal:   Number(r[14]) || 0,
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
