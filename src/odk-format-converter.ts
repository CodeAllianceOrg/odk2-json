// Import here Polyfills if needed. Recommended core-js (npm i -D core-js)
// import "core-js/fn/array.find"
// ...

import * as XLSX from 'xlsx'

export class ODKConverter {
  public fromJSON(input: any): ODKSurvey {
    return new ODKSurvey()
  }
}

export class ODKSurvey {
  public toXLSXBase64(): string {
    const wb = XLSX.utils.book_new()

    const settings = [
      {
        setting_name: 'table_id',
        value: 'a'
      },
      {
        setting_name: 'form_id',
        value: 'a'
      },
      {
        setting_name: 'survey',
        'display.title': 'Sample'
      }
    ]

    const data = [
      {
        type: 'text',
        name: 'name',
        'display.text': 'display.text'
      }
    ]

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'survey')
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(settings),
      'settings'
    )

    return XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
  }
}
