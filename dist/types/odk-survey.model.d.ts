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
export declare class ODKSurvey {
    private sections;
    static fromJSON(input: ISection[]): ODKSurvey;
    toXLSXBinary(): string;
    toXLSXBase64(): string;
    private toWorkbook();
}
