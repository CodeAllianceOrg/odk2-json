import { _ } from 'underscore';
import * as XLSX from 'xlsx';

/**
 * Remove empty strings for the XLSXConverter
 */
function removeEmptyStrings(rObjArr) {
    const outArr = [];

    _.each(rObjArr, function(row) {
        const outRow = Object.create(row.__proto__);
        _.each(row, function(value, key) {
            if (_.isString(value) && value.trim() === '') {
                return;
            }
            outRow[key] = value;
        });
        if (_.keys(outRow).length > 0) {
            outArr.push(outRow);
        }
    });

    return outArr;
}

export function to_json(workbook) {
    const result = {};
    _.each(workbook.SheetNames, function(sheetName) {
        let rObjArr = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
            raw: true
        });
        rObjArr = removeEmptyStrings(rObjArr);
        if (rObjArr.length > 0) {
            result[sheetName] = rObjArr;
        }
    });
    return result;
}

// https://github.com/SheetJS/js-xlsx/issues/214#issuecomment-96843418
export function get_header_row(sheet) {
    const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    return aoa[0];
}
