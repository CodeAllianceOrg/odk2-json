import { ODKConverter, ODKSurvey } from '../src/odk-format-converter'
import * as XLSX from 'xlsx'
import { _ } from 'underscore'
import * as XLSXConverter2 from 'jswebviewer/xlsxconverter/XLSXConverter2'

const ODK2_MIN_NUM_COLS = 3
const ODK2_REQUIRED_COLS = ['type', 'name', 'display.text']

/**
 * Remove empty strings for the XLSXConverter
 */
function removeEmptyStrings(rObjArr) {
  var outArr = []
  _.each(rObjArr, function(row) {
    var outRow = Object.create(row.__proto__)
    _.each(row, function(value, key) {
      if (_.isString(value) && value.trim() === '') {
        return
      }
      outRow[key] = value
    })
    if (_.keys(outRow).length > 0) {
      outArr.push(outRow)
    }
  })
  return outArr
}

function to_json(workbook) {
  var result = {}
  _.each(workbook.SheetNames, function(sheetName) {
    var rObjArr = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      raw: true
    })
    rObjArr = removeEmptyStrings(rObjArr)
    if (rObjArr.length > 0) {
      result[sheetName] = rObjArr
    }
  })
  return result
}

// https://github.com/SheetJS/js-xlsx/issues/214#issuecomment-96843418
function get_header_row(sheet) {
  const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1 })

  return aoa[0]
}

describe('ODKConverter', () => {
  it('is instantiable', () => {
    expect(new ODKConverter()).toBeInstanceOf(ODKConverter)
  })

  it('accepts a Javascript Object as input', () => {
    let odk = new ODKConverter()

    expect(() => odk.fromJSON({})).not.toThrow()
  })

  it('outputs an ODK data structure', () => {
    let odk = new ODKConverter()

    let subject = odk.fromJSON({})

    expect(subject).toBeInstanceOf(ODKSurvey)
  })
})

describe('ODKSurvey', () => {
  it('exports XLSX with the correct columns', () => {
    /*
          https://github.com/sheetjs/js-xlsx#guessing-file-type

          per the link:

          Excel is extremely aggressive in reading files. Adding an XLS extension to any display text file (where the only characters are ANSI display chars) tricks Excel into thinking that the file is potentially a CSV or TSV file, even if it is only one column! This library attempts to replicate that behavior.

          The best approach is to validate the desired worksheet and ensure it has the expected number of rows or columns. Extracting the range is extremely simple
        */

    let odk = new ODKConverter()

    let subject = odk.fromJSON({})

    let xlsx = subject.toXLSXBase64()

    let wb: XLSX.WorkBook

    expect(() => (wb = XLSX.read(xlsx, { type: 'base64' }))).not.toThrow()

    let range = XLSX.utils.decode_range(wb.Sheets[wb.SheetNames[0]]['!ref'])
    let ncols = range.e.c - range.s.c + 1

    expect(ncols).toBeGreaterThanOrEqual(ODK2_MIN_NUM_COLS)

    let colNames = get_header_row(wb.Sheets['survey'])

    ODK2_REQUIRED_COLS.forEach(col => expect(colNames).toContain(col))
  })

  it('exports in valid ODK 2.0 XLSX', () => {
    let odk = new ODKConverter()

    let subject = odk.fromJSON({})

    let xlsx = subject.toXLSXBase64()

    let wb = XLSX.read(xlsx, { type: 'base64' })

    let jsonWorkbook = to_json(wb)

    expect(() => XLSXConverter2.processJSONWb(jsonWorkbook)).not.toThrow()
  })
})
