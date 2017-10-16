import * as XLSX from 'xlsx';

interface ISetting {
    readonly setting_name: string;
    readonly value?: string;
    readonly display?: string;
    readonly 'display.title'?: string;
}

export interface ISection {
    readonly section_name: string;
}

export interface ISurveyRow {
    readonly clause: string;
    readonly 'display.text': string;
    readonly name: string;
    readonly type: string;
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
    private sections: ISection[] = [];

    public static fromJSON(input: ISection[]): ODKSurvey {
        const survey = new ODKSurvey();

        survey.sections = input;

        return survey;
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

        const data: ISurveyRow[] = [];

        this.sections.forEach(section => {
            // append a sheet for each section

            XLSX.utils.book_append_sheet(
                wb,
                XLSX.utils.json_to_sheet([
                    createSurveyRow({
                        type: 'text',
                        name: 'name',
                        'display.text': 'Enter name:'
                    })
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

            settings.push({
                setting_name: section.section_name,
                display: ''
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

        return XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    }
}
