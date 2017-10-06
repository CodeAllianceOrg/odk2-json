import * as XLSX from 'xlsx';

interface ISetting {
    readonly setting_name: string;
    readonly value?: string;
    readonly 'display.title'?: string;
}

export class ODKSurvey {
    public static fromJSON(input: any): ODKSurvey {
        return new ODKSurvey();
    }

    public toXLSXBase64(): string {
        const wb = XLSX.utils.book_new();

        const settings: ISetting[] = [
            {
                setting_name: 'table_id',
                value: 'a'
            },
            {
                setting_name: 'form_id',
                value: 'a'
            },
            {
                'display.title': 'Sample',
                setting_name: 'survey'
            }
        ];

        const data = [
            {
                'display.text': 'display.text',
                name: 'name',
                type: 'text'
            }
        ];

        XLSX.utils.book_append_sheet(
            wb,
            XLSX.utils.json_to_sheet(data),
            'survey'
        );
        XLSX.utils.book_append_sheet(
            wb,
            XLSX.utils.json_to_sheet(settings),
            'settings'
        );

        return XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    }
}
