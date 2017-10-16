import * as XLSX from 'xlsx';

export interface ISettingRow {
    readonly setting_name: string;
    readonly value?: string;
    readonly display?: string;
    readonly 'display.title'?: string;
}

export interface IQuestion {
    readonly type: 'text';
    readonly name: string;
    readonly 'display.text': string;
}

export interface ISection {
    readonly section_name: string;

    readonly questions: IQuestion[];
}

export interface ISurveyRow {
    readonly clause: string;
    readonly 'display.text': string;
    readonly name: string;
    readonly type: string;
}

export interface ISurvey {
    readonly title: string;
    readonly table_id: string;

    readonly sections: ISection[];
}

const BASE_SURVEY_ROW: ISurveyRow = {
    clause: '',
    'display.text': '',
    name: '',
    type: ''
};

function createSurveyRow(partial?: Partial<ISurveyRow>): ISurveyRow {
    return {
        ...BASE_SURVEY_ROW,
        ...partial
    };
}

export class ODKSurvey {
    private input: ISurvey;

    public static fromJSON(input: ISurvey): ODKSurvey {
        const survey = new ODKSurvey();

        survey.input = input;

        return survey;
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
