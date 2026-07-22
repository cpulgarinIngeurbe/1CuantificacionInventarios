import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'

function excelSerialToYM(serial) {
  const date = new Date((serial - 25569) * 86400 * 1000)
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() }
}

export function useExcelData() {
  const [data, setData] = useState([])
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)

  const loadFile = useCallback((file) => {
    if (!file) return
    setLoading(true)
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: 'array' })
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
          proyecto:           String(r[0]).trim(),
          avanceObra:         avance <= 1 ? avance * 100 : avance,
          year:               ym.year,
          month:              ym.month,
          inventarioInicial:  Number(r[3])  || 0,
          entradasAlmacen:    Number(r[4])  || 0,
          entradasTraslados:  Number(r[5])  || 0,
          reintegrosObra:     Number(r[6])  || 0,
          salidasAlmacen:     Number(r[7])  || 0,
          salidasTraslados:   Number(r[8])  || 0,
          devolucionesProv:   Number(r[9])  || 0,
          devolucionesValor:  Number(r[10]) || 0,
          ajustes:            Number(r[11]) || 0,
          salidasBodega:      Number(r[12]) || 0,
          entradasBodega:     Number(r[13]) || 0,
          inventarioFinal:    Number(r[14]) || 0,
        })
      }
      setData(rows)
      setLoading(false)
    }
    reader.readAsArrayBuffer(file)
  }, [])

  return { data, fileName, loading, loadFile }
}
