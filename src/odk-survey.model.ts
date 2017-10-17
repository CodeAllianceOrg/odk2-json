import * as XLSX from 'xlsx';

/*
  Internal models
*/

export interface IQuestion {
    readonly type: string;
    readonly name: string;
    readonly 'display.text': string;
    readonly 'display.text.spanish': string;
    readonly required: boolean;
}

export interface ISection {
    readonly section_name: string;

    readonly questions: IQuestion[];
}

export interface ISurvey {
    readonly title: string;
    readonly table_id: string;

    readonly sections: ISection[];
}

/*
  Export/XLSX models
*/

export interface ISettingRow {
    readonly setting_name: string;
    readonly value?: string;
    readonly display?: string;
    readonly 'display.title'?: string;
}

export interface ISurveyRow {
    readonly clause: string;
    readonly 'display.text': string;
    readonly 'display.text.spanish': string;
    readonly name: string;
    readonly type: string;
    readonly required: boolean | string;
}

const BASE_SURVEY_ROW: ISurveyRow = {
    clause: '',
    'display.text': '',
    'display.text.spanish': '',
    name: '',
    required: false,
    type: ''
};

/*
  Helpers
*/

export function createSurveyRow(partial?: Partial<ISurveyRow>): ISurveyRow {
    return {
        ...BASE_SURVEY_ROW,
        ...partial
    };
}

export function parseSettingsTable(
    key: string = '',
    wb: XLSX.WorkBook = XLSX.utils.book_new()
): any {
    const sheet = wb.Sheets.settings;
    const json = XLSX.utils.sheet_to_json<ISettingRow>(sheet);

    for (const row of json) {
        if (key === row.setting_name) {
            switch (key) {
                case 'survey':
                    return row['display.title'];
                case 'table_id':
                    return row.value;
            }
        }
    }

    return null;
}

export function parseSections(wb: XLSX.WorkBook): ISection[] {
    const sections: ISection[] = [];

    const surveyJson = XLSX.utils.sheet_to_json<ISurveyRow>(wb.Sheets.survey);

    // find the sections in order in the main survey sheet

    surveyJson
        .filter(row => row.clause.indexOf('do section') !== -1)
        .forEach(row => {
            const name = row.clause.replace('do section ', '');
            const questions: IQuestion[] = [];

            // find the sheet associated with this section in order to find the questions

            const sheet = wb.Sheets[name];

            const sectionJson = XLSX.utils.sheet_to_json<ISurveyRow>(sheet);

            sectionJson.forEach(question => {
                questions.push({
                    'display.text': question['display.text'],
                    'display.text.spanish': question['display.text.spanish'],
                    name: question.name,
                    required: question.required === 'TRUE',
                    type: question.type
                });
            });

            sections.push({
                questions,
                section_name: name
            });
        });

    return sections;
}

export class ODKSurvey {
    constructor(private readonly input: ISurvey) {}

    public static fromJSON(input: ISurvey): ODKSurvey {
        const survey = new ODKSurvey(input);

        return survey;
    }

    public static fromXLSXBase64(input: string): ODKSurvey {
        const wb = XLSX.read(input, { type: 'base64' });

        return new ODKSurvey({
            sections: parseSections(wb),
            table_id: parseSettingsTable('table_id', wb),
            title: parseSettingsTable('survey', wb)
        });
    }

    public toJSON(): ISurvey {
        return this.input;
    }

    public toXLSXBinary(): string {
        const wb = this.toWorkbook();

        return XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    }

    public toXLSXBase64(): string {
        const wb = this.toWorkbook();

        return XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    }

    private toWorkbook(): XLSX.WorkBook {
        const wb = XLSX.utils.book_new();

        const settings: ISettingRow[] = [
            {
                setting_name: 'table_id',
                value: this.input.table_id
            },
            {
                'display.title': this.input.title,
                setting_name: 'survey'
            }
        ];

        const data: ISurveyRow[] = [];

        this.input.sections.forEach(section => {
            // append a sheet for each section

            XLSX.utils.book_append_sheet(
                wb,
                XLSX.utils.json_to_sheet(
                    section.questions.map(question => createSurveyRow(question))
                ),
                section.section_name
            );

            // add the section to the main survey sheet

            data.push(
                createSurveyRow({
                    clause: `do section ${section.section_name}`
                })
            );

            // add the display data to the settings sheet

            settings.push({
                display: '',
                setting_name: section.section_name
            });
        });

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

        return wb;
    }
}
