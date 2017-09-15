/// <reference types="node" />
import { EventEmitter } from "events";
import * as d3 from "d3";
export interface Job {
    refreshLayout: boolean;
    size: number[];
    words: any;
}
export interface Word {
    value: any;
    text: string;
}
export interface Options {
    orientation?: string;
    minFontSize?: number;
    maxFontSize?: number;
    scale?: string;
    seedColors?: string[];
    showEase?: (normalizedTime: number) => number;
}
export declare enum STATUS {
    COMPLETE = 0,
    INCOMPLETE = 1,
}
export declare class TagCloud extends EventEmitter {
    _element: HTMLElement;
    _d3SvgContainer: d3.Selection<d3.BaseType, any, any, undefined>;
    _svgGroup: d3.Selection<d3.BaseType, any, any, undefined>;
    _size: number[];
    _fontFamily: string;
    _fontStyle: string;
    _fontWeight: string;
    _spiral: string;
    _timeInterval: number;
    _padding: number;
    _orientation: string;
    _minFontSize: number;
    _maxFontSize: number;
    _textScale: string;
    _optionsAsString: string;
    _seedColor: string[];
    _showEase: (normalizedTime: number) => number;
    _words: any;
    _setTimeoutId: any;
    _completedJob?: Job;
    _pendingJob?: Job;
    _layoutIsUpdating: boolean;
    _allInViewBox: boolean;
    _DOMisUpdating: boolean;
    _colorScale: Function;
    _cloudWidth: number;
    _cloudHeight: number;
    constructor(domNode: HTMLElement);
    setOptions(options: Options): void;
    resize(): void;
    setData(data: any[]): void;
    destroy(): void;
    getStatus(): STATUS;
    _updateContainerSize(): void;
    _isJobRunning(): any;
    _processPendingJob(): Promise<void>;
    _pickPendingJob(): Promise<Job>;
    _emptyDOM(): void;
    _updateDOM(job: Job): Promise<void>;
    _makeTextSizeMapper(): any;
    _makeNewJob(): Job;
    _makeJobPreservingLayout(): Job;
    _invalidate(keepLayout: boolean): void;
    _updateLayout(job: Job): Promise<void>;
}
