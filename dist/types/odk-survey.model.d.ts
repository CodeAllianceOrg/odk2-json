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
    readonly 'display.text.spanish': string;
    readonly required: boolean;
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
    readonly required: boolean;
}
export interface ISurvey {
    readonly title: string;
    readonly table_id: string;
    readonly sections: ISection[];
}
export declare class ODKSurvey {
    private input;
    static fromJSON(input: ISurvey): ODKSurvey;
    toXLSXBinary(): string;
    toXLSXBase64(): string;
    private toWorkbook();
}
