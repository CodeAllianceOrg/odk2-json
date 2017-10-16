debugger;

import {
    ODKSurvey,
    ISection,
    ISurvey,
    ISurveyRow,
    ISettingRow
} from '../src/odk-survey.model';
import { get_header_row, to_json } from './utils';
import * as XLSXConverter2 from 'jswebviewer/xlsxconverter/XLSXConverter2';
import * as XLSX from 'xlsx';

const ODK2_MIN_NUM_COLS = 3;
const ODK2_REQUIRED_COLS = ['type', 'name', 'display.text'];

const EXAMPLE_SURVEY: ISurvey = {
    title: 'isurvey',
    table_id: 'table_id',
    sections: [
        {
            section_name: 'helloworld',
            questions: [
                {
                    type: 'text',
                    name: 'name',
                    'display.text': 'display text'
                }
            ]
        }
    ]
};

function createExampleSurvey(survey?: Partial<ISurvey>): XLSX.WorkBook {
    const odkSurvey = ODKSurvey.fromJSON({
        ...EXAMPLE_SURVEY,
        ...survey
    });

    const xlsx = odkSurvey.toXLSXBase64();

    return XLSX.read(xlsx, { type: 'base64' });
}

describe('ODKSurvey', () => {
    it('exports XLSX with the correct columns', () => {
        /*
          https://github.com/sheetjs/js-xlsx#guessing-file-type

          per the link:

          Excel is extremely aggressive in reading files. Adding an XLS extension to any display text file (where the only characters are ANSI display chars) tricks Excel into thinking that the file is potentially a CSV or TSV file, even if it is only one column! This library attempts to replicate that behavior.

          The best approach is to validate the desired worksheet and ensure it has the expected number of rows or columns. Extracting the range is extremely simple
        */

        const subject = ODKSurvey.fromJSON(EXAMPLE_SURVEY);

        const xlsx = subject.toXLSXBase64();

        let wb: XLSX.WorkBook;

        expect(() => (wb = XLSX.read(xlsx, { type: 'base64' }))).not.toThrow();

        const colNames = get_header_row(wb.Sheets.survey);

        ODK2_REQUIRED_COLS.forEach(col => expect(colNames).toContain(col));
    });

    describe('export formats', () => {
        it('exports in valid ODK 2.0 XLSX as a Base64 string', () => {
            const wb = createExampleSurvey();

            const jsonWorkbook = to_json(wb);

            expect(() =>
                XLSXConverter2.processJSONWb(jsonWorkbook)
            ).not.toThrow();
        });

        it('exports in valid ODK 2.0 XLSX as a Binary string', () => {
            const subject = ODKSurvey.fromJSON(EXAMPLE_SURVEY);

            const xlsx = subject.toXLSXBinary();

            const wb = XLSX.read(xlsx, { type: 'binary' });

            const jsonWorkbook = to_json(wb);

            expect(() =>
                XLSXConverter2.processJSONWb(jsonWorkbook)
            ).not.toThrow();
        });
    });

    describe('sections', () => {
        it('creates an excel worksheet for each section', () => {
            const sections: ISection[] = [
                {
                    section_name: 'testsection',
                    questions: []
                },
                {
                    section_name: 'anothersection',
                    questions: []
                }
            ];

            const wb = createExampleSurvey({ sections });

            sections.forEach(section => {
                expect(wb.SheetNames).toContain(section.section_name);
            });
        });

        it('adds each section to the main survey sheet', () => {
            const sections: ISection[] = [
                {
                    section_name: 'testsection',
                    questions: []
                },
                {
                    section_name: 'anothersection',
                    questions: []
                }
            ];

            const wb = createExampleSurvey({ sections });

            // get the clause column data in order
            let clauses: string[] = XLSX.utils
                .sheet_to_json<ISurveyRow>(wb.Sheets.survey)
                .map(val => val.clause);

            // limit to `do section` values
            clauses = clauses.filter(
                clause => clause.indexOf('do section') !== -1
            );

            // remove 'do section'
            clauses = clauses.map(clause => clause.replace('do section ', ''));

            expect(sections.map(section => section.section_name)).toEqual(
                clauses
            );
        });
    });

    describe('text questions', () => {
        it('adds text questions to a section', () => {
            const sections: ISection[] = [
                {
                    section_name: 'testsection',

                    questions: [
                        {
                            type: 'text',
                            name: 'name',
                            'display.text': 'enter name'
                        }
                    ]
                }
            ];

            const wb = createExampleSurvey({ sections });

            const sheet = wb.Sheets.testsection;

            const json = XLSX.utils.sheet_to_json<ISurveyRow>(sheet);

            const arr = json.filter(row => row.type === 'text');

            expect(arr.length).toEqual(1);

            const textQuestion = arr[0];
            const expectedQuestionProps = sections[0].questions[0];

            expect(textQuestion.name).toEqual(expectedQuestionProps.name);
            expect(textQuestion['display.text']).toEqual(
                expectedQuestionProps['display.text']
            );
        });
    });

    describe('survey properties', () => {
        it('should support the survey name', () => {
            const survey: Partial<ISurvey> = {
                title: 'mysurveytitle'
            };

            const wb = createExampleSurvey(survey);

            const settingsJsonArray = XLSX.utils.sheet_to_json<ISettingRow>(
                wb.Sheets.settings
            );

            const arr = settingsJsonArray.filter(
                row => row.setting_name === 'survey'
            );

            expect(arr.length).toEqual(1);

            const expected = survey.title;
            const actual = arr[0]['display.title'];

            expect(actual).toEqual(expected);
        });

        it('should support the survey id', () => {
            const survey: Partial<ISurvey> = {
                table_id: 'mytableid'
            };

            const wb = createExampleSurvey(survey);

            const settingsJsonArray = XLSX.utils.sheet_to_json<ISettingRow>(
                wb.Sheets.settings
            );

            const arr = settingsJsonArray.filter(
                row => row.setting_name === 'table_id'
            );

            expect(arr.length).toEqual(1);

            const expected = survey.table_id;
            const actual = arr[0]['value'];

            expect(actual).toEqual(expected);
        });
    });
});
