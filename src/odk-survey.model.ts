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
    readonly display: {
        readonly title: string;
        readonly 'title.spanish': string;
    };

    readonly section_name: string;

    readonly questions: IQuestion[];
}

export interface ISurvey {
    readonly display: {
        readonly title: string;
        readonly 'title.spanish': string;
    };

    readonly table_id: string;
    readonly form_id: string;

    readonly sections: ISection[];
}

/*
  Export/XLSX models
*/

export interface ISettingRow {
    readonly setting_name: string;
    readonly value: string;
    readonly 'display.title': string;
    readonly 'display.title.spanish': string;
}

export interface ISectionRow {
    readonly clause: string;
    readonly 'display.text': string;
    readonly 'display.text.spanish': string;
    readonly name: string;
    readonly type: string;
    readonly required: boolean | string;
}

export interface ISurveyRow {
    readonly clause: string;
    readonly 'display.text': string;
    readonly 'display.text.spanish': string;
    readonly name: string;
    readonly type: string;
}

const BASE_SURVEY_ROW: ISurveyRow = {
    clause: '',
    'display.text': '',
    'display.text.spanish': '',
    name: '',
    type: ''
};

const BASE_SECTION_ROW: ISectionRow = {
    clause: '',
    'display.text': '',
    'display.text.spanish': '',
    name: '',
    required: '',
    type: ''
};

const BASE_SETTING_ROW: ISettingRow = {
    'display.title': '',
    'display.title.spanish': '',
    setting_name: '',
    value: ''
};

/*
  Helpers
*/

export function createFormVersion(dateSeed: number[] = []): string {
    const today = new Date(...dateSeed);

    const year = `${today.getFullYear()}`;
    const month =
        today.getMonth() >= 10 ? `${today.getMonth()}` : `0${today.getMonth()}`;
    const date =
        today.getDate() >= 10 ? `${today.getDate()}` : `0${today.getDate()}`;

    return `${year}${month}${date}`;
}

export function createSurveyRow(partial?: Partial<ISurveyRow>): ISurveyRow {
    return {
        ...BASE_SURVEY_ROW,
        ...partial
    };
}

export function createSectionRow(partial?: Partial<ISectionRow>): ISectionRow {
    return {
        ...BASE_SECTION_ROW,
        ...partial
    };
}

export function createSettingRow(partial?: Partial<ISettingRow>): ISettingRow {
    return {
        ...BASE_SETTING_ROW,
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
                    return {
                        title: row['display.title'],
                        'title.spanish': row['display.title.spanish']
                    };
                case 'table_id':
                    return row.value;
                case 'form_id':
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

            const sectionJson = XLSX.utils.sheet_to_json<ISectionRow>(sheet);

            sectionJson.forEach(question => {
                if (['begin screen', 'end screen'].includes(question.clause)) {
                    return;
                }

                questions.push({
                    'display.text': question['display.text'],
                    'display.text.spanish': question['display.text.spanish'],
                    name: question.name,
                    required: question.required === 'TRUE',
                    type: question.type
                });
            });

            // load the section's settings (i.e. display) from the associated
            // row in the settings worksheet

            const settings = XLSX.utils
                .sheet_to_json<ISettingRow>(wb.Sheets.settings)
                .filter(settingRow => settingRow.setting_name === name);

            sections.push({
                display: {
                    title: settings[0]['display.title'],
                    'title.spanish': settings[0]['display.title.spanish']
                },
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
            display: parseSettingsTable('survey', wb),
            form_id: parseSettingsTable('form_id', wb),
            sections: parseSections(wb),
            table_id: parseSettingsTable('table_id', wb)
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
            createSettingRow({
                setting_name: 'table_id',
                value: this.input.table_id
            }),
            createSettingRow({
                'display.title': this.input.display.title,
                'display.title.spanish': this.input.display['title.spanish'],
                setting_name: 'survey'
            }),
            createSettingRow({
                setting_name: 'form_id',
                value:
                    this.input.form_id ||
                    `AUTOGEN${Math.floor(Math.random() * 100)}`
            }),
            createSettingRow({
                setting_name: 'form_version',
                value: createFormVersion()
            })
        ];

        const data: ISurveyRow[] = [];

        this.input.sections.forEach(section => {
            // append a sheet for each section

            XLSX.utils.book_append_sheet(
                wb,
                XLSX.utils.json_to_sheet([
                    createSectionRow({ clause: 'begin screen' }),
                    ...section.questions.map(question =>
                        createSectionRow(question)
                    ),
                    createSectionRow({ clause: 'end screen' })
                ]),
                section.section_name
            );

            // add the section to the main survey sheet

            data.push(
                createSurveyRow({
                    clause: `do section ${section.section_name}`
                })
            );

            // add the display data to the settings sheet

            settings.push(
                createSettingRow({
                    'display.title': section.display.title,
                    'display.title.spanish': section.display['title.spanish'],
                    setting_name: section.section_name
                })
            );
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
