import * as XLSX from 'xlsx';
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
export declare function createSurveyRow(partial?: Partial<ISurveyRow>): ISurveyRow;
export declare function parseSettingsTable(key?: string, wb?: XLSX.WorkBook): any;
export declare function parseSections(wb: XLSX.WorkBook): ISection[];
export declare class ODKSurvey {
    private readonly input;
    constructor(input: ISurvey);
    static fromJSON(input: ISurvey): ODKSurvey;
    static fromXLSXBase64(input: string): ODKSurvey;
    toJSON(): ISurvey;
    toXLSXBinary(): string;
    toXLSXBase64(): string;
    private toWorkbook();
}
