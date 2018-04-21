import { EventEmitter } from "events";
import * as d3 from "d3";
import * as d3Cloud from "d3-cloud";

const ORIENTATIONS: { [key: string]: Function } = {
    'single': () => 0,
    'right angled': (tag: any) => {
        return hashCode(tag.text) % 2 * 90;
    },
    'multiple': (tag: any) => {
        let hashcode = Math.abs(hashCode(tag.text));
        return ((hashcode % 12) * 15) - 90; // fan out 12 * 15 degrees over top-right and bottom-right quadrant (=-90 deg offset)
    }
};
const D3_SCALING_FUNCTIONS: { [key: string]: Function } = {
    'linear': () => d3.scaleLinear(),
    'log': () => d3.scaleLog(),
    'square root': () => d3.scaleSqrt()
};

export interface Job {
    refreshLayout: boolean;
    size: number[];
    words: any;
}

export interface Word {
    value: any;
    text: string;
    link?: string;
    target?: string;
}

export interface Options {
    orientation?: string;
    minFontSize?: number;
    maxFontSize?: number;
    scale?: string;
    seedColors?: string[];
    showEase?: (normalizedTime: number) => number;
    showDuration?: number;
}

export enum STATUS {
    COMPLETE,
    INCOMPLETE
}

export class TagCloud extends EventEmitter {

    // DOM
    _element: HTMLElement;
    _d3SvgContainer: d3.Selection<d3.BaseType, any, any, undefined>;
    _svgGroup: d3.Selection<d3.BaseType, any, any, undefined>;
    _size: number[] = [1, 1];

    // SETTING (non-configurable)
    _fontFamily: string = 'Impact';
    _fontStyle: string = 'normal';
    _fontWeight: string = 'normal';
    _spiral: string = 'archimedean'; // layout shape
    _timeInterval: number = 1000; // time allowed for layout algorithm
    _padding: number = 5;

    // OPTIONS
    _orientation: string = 'right angled';
    _minFontSize: number = 10;
    _maxFontSize: number = 36;
    _textScale: string = 'log';
    _optionsAsString: string;
    _seedColor: string[] = ['#00a69b', '#57c17b', '#6f87d8', '#663db8', '#bc52bc', '#9e3533', '#daa05d'];
    _showEase: (normalizedTime: number) => number = d3.easeQuadIn;
    _showDuration: number = 800;

    // DATA
    _words: any;

    // UTIL
    _setTimeoutId: any;
    _completedJob?: Job;
    _pendingJob?: Job;
    _layoutIsUpdating: boolean;
    _allInViewBox: boolean = false;
    _DOMisUpdating: boolean = false;

    _colorScale: Function;

    _cloudWidth: number;
    _cloudHeight: number;

    constructor(domNode: HTMLElement) {

        super();

        // DOM
        this._element = domNode;
        this._d3SvgContainer = d3.select(this._element).append('svg');
        this._svgGroup = this._d3SvgContainer.append('g');
        this.resize();

    }

    setOptions(options: Options) {

        if (JSON.stringify(options) === this._optionsAsString) {
            return;
        }
        this._optionsAsString = JSON.stringify(options);
        if (options.orientation) {
            this._orientation = options.orientation;
        }
        if (options.minFontSize) {
            this._minFontSize = options.maxFontSize ? Math.min(options.minFontSize, options.maxFontSize) : options.minFontSize;
        }
        if (options.maxFontSize) {
            this._maxFontSize = options.minFontSize ? Math.max(options.minFontSize, options.maxFontSize) : options.maxFontSize;
        }
        if (options.scale) {
            this._textScale = options.scale;
        }
        if (options.seedColors) {
            this._seedColor = options.seedColors;
        }
        if (options.showEase) {
            this._showEase = options.showEase;
        }
        this._invalidate(false);
    }

    resize() {
        let newWidth = this._element.offsetWidth;
        let newHeight = this._element.offsetHeight;

        if (newWidth === this._size[0] && newHeight === this._size[1]) {
            return;
        }

        let wasInside = this._size[0] >= this._cloudWidth && this._size[1] >= this._cloudHeight;
        let willBeInside = this._cloudWidth <= newWidth && this._cloudHeight <= newHeight;
        this._size[0] = newWidth;
        this._size[1] = newHeight;
        if (wasInside && willBeInside && this._allInViewBox) {
            this._invalidate(true);
        } else {
            this._invalidate(false);
        }

    }

    setData(data: any[]) {
        this._words = data;
        this._invalidate(false);
    }

    destroy() {
        clearTimeout(this._setTimeoutId);
        this._element.innerHTML = '';
    }

    getStatus() {
        return this._allInViewBox ? STATUS.COMPLETE : STATUS.INCOMPLETE;
    }

    _updateContainerSize() {
        this._d3SvgContainer.attr('width', this._size[0]);
        this._d3SvgContainer.attr('height', this._size[1]);
    }

    _isJobRunning() {
        return (this._setTimeoutId || this._layoutIsUpdating || this._DOMisUpdating);
    }

    async _processPendingJob() {

        if (!this._pendingJob) {
            return;
        }

        if (this._isJobRunning()) {
            return;
        }

        this._completedJob = undefined;
        let job = await this._pickPendingJob();
        if (job.words.length) {
            if (job.refreshLayout) {
                await this._updateLayout(job);
            }
            await this._updateDOM(job);
            let cloudBBox = (<SVGSVGElement>this._svgGroup.node()!).getBBox();
            this._cloudWidth = cloudBBox.width;
            this._cloudHeight = cloudBBox.height;
            this._allInViewBox = cloudBBox.x >= 0 &&
                cloudBBox.y >= 0 &&
                cloudBBox.x + cloudBBox.width <= this._element.offsetWidth &&
                cloudBBox.y + cloudBBox.height <= this._element.offsetHeight;
        } else {
            this._emptyDOM();
        }

        if (this._pendingJob) {
            this._processPendingJob(); // pick up next job
        } else {
            this._completedJob = job;
            this.emit('renderComplete');
        }

    }

    async _pickPendingJob() {
        return new Promise<Job>((resolve, reject) => {
            // this._setTimeoutId = setTimeout(async () => {
            let job = this._pendingJob;
            this._pendingJob = undefined;
            // this._setTimeoutId = null;
            resolve(job);
            // }, 0);
        });
    }

    _emptyDOM() {
        this._svgGroup.selectAll('text').remove();
        this._cloudWidth = 0;
        this._cloudHeight = 0;
        this._allInViewBox = true;
        this._DOMisUpdating = false;
    }

    async _updateDOM(job: Job) {
        let canSkipDomUpdate = this._pendingJob || this._setTimeoutId;
        if (canSkipDomUpdate) {
            this._DOMisUpdating = false;
            return;
        }

        this._colorScale = d3.scaleOrdinal(this._seedColor);
        this._DOMisUpdating = true;
        let svgTextNodes = this._svgGroup.selectAll('text');
        let stage = svgTextNodes.data(job.words, getText);
        let xTranslate: number = this._element.offsetWidth / 2;
        let yTranslate: number = this._element.offsetHeight / 2;
        function positionWord(word: any) {
            if (isNaN(word.x) || isNaN(word.y) || isNaN(word.rotate)) {
                // move off-screen
                return `translate(${xTranslate * 3}, ${yTranslate * 3})rotate(0)`;
            }
            return `translate(${word.x + xTranslate}, ${word.y + yTranslate}) rotate(${word.rotate})`;
        }

        let enterSelection = stage.enter();
        let aTags = enterSelection.append('a');
        aTags.attr('xlink:href', (tag: any) => tag.link);
        aTags.attr('target', (tag: any) => tag.target);

        let enteringTags = aTags.append('text');
        enteringTags.style('font-style', this._fontStyle);
        enteringTags.style('fill', (tag: any) => this._colorScale(tag.text));
        enteringTags.attr('text-anchor', () => 'middle');
        enteringTags.style('font-family', () => this._fontFamily);
        enteringTags.attr('transform', `translate(${this._element.offsetWidth / 2}, ${this._element.offsetHeight / 2})rotate(0)`);
        enteringTags.text(getText);

        enteringTags.on('click', (event: any) => {
            this.emit('select', event);
        });
        let self = this;
        enteringTags.on('mouseover', function (event: any) {
            d3.select(this).style('cursor', 'pointer');
            self.emit('mouseover', this);
        });

        enteringTags.on('mouseout', function (event: any) {
            d3.select(this).style('cursor', 'default');
            self.emit('mouseout', this);
        });

        let enteringTransition = enteringTags.transition();
        enteringTransition.duration(this._showDuration);
        enteringTransition.ease(this._showEase);
        enteringTransition.attr('transform', positionWord);
        enteringTransition.style('font-size', getSizeInPixels);
        enteringTransition.style('font-weight', () => this._fontWeight);

        let movingTransition = stage.transition();
        movingTransition.duration(1000);
        movingTransition.style('font-size', getSizeInPixels);
        movingTransition.style('font-style', this._fontStyle);
        movingTransition.style('font-weight', () => this._fontWeight);
        movingTransition.attr('transform', positionWord);

        let exitingTags = stage.exit();
        let exitTransition = exitingTags.transition();
        exitTransition.duration(200);
        exitTransition.style('fill-opacity', 1e-6);
        exitTransition.attr('font-size', 1);
        exitingTags.remove();
        return new Promise((resolve, reject) => {
            let exits = 0;
            let moves = 0;
            let enters = 0;
            let resolveWhenDone = () => {
                if (exits === 0 && moves === 0 && enters == 0) {
                    this._DOMisUpdating = false;
                    resolve(true);
                }
            };
            exitTransition.each(() => {
                exits++;
            });
            exitTransition.on('end', () => {
                console.log('end one exits', exits);
                exits--;
                resolveWhenDone();
            });
            exitTransition.on('interrupt', () => {
                console.log('interrupt one', exits);
                exits--;
                resolveWhenDone();
            });
            movingTransition.each(() => moves++);
            movingTransition.on('end', () => {
                moves--;
                resolveWhenDone();
            });
            enteringTransition.each(() => enters++);
            enteringTransition.on('end', () => {
                enters--;
                resolveWhenDone();
            });
        });
    }

    _makeTextSizeMapper() {
        let mapSizeToFontSize = D3_SCALING_FUNCTIONS[this._textScale]();
        let range = this._words.length === 1 ? [this._maxFontSize, this._maxFontSize] : [this._minFontSize, this._maxFontSize];
        mapSizeToFontSize.range(range);
        if (this._words) {
            mapSizeToFontSize.domain(d3.extent(this._words, getValue));
        }
        return mapSizeToFontSize;
    }

    _makeNewJob(): Job {
        return {
            refreshLayout: true,
            size: this._size.slice(),
            words: this._words
        };
    }

    _makeJobPreservingLayout(): Job {
        return {
            refreshLayout: false,
            size: this._size.slice(),
            words: this._completedJob!.words.map((tag: any) => {
                return {
                    x: tag.x,
                    y: tag.y,
                    rotate: tag.rotate,
                    size: tag.size,
                    text: tag.text,
                    link: tag.link,
                    target: tag.target
                };
            })
        };
    }

    _invalidate(keepLayout: boolean) {

        if (!this._words) {
            return;
        }
        this._updateContainerSize();

        let canReuseLayout = keepLayout && !this._isJobRunning() && this._completedJob;
        this._pendingJob = (canReuseLayout) ? this._makeJobPreservingLayout() : this._makeNewJob();
        this._processPendingJob();
    }


    async _updateLayout(job: Job) {
        let mapSizeToFontSize = this._makeTextSizeMapper();
        let tagCloudLayoutGenerator = d3Cloud();
        tagCloudLayoutGenerator.size(job.size);
        tagCloudLayoutGenerator.padding(this._padding);
        tagCloudLayoutGenerator.rotate(ORIENTATIONS[this._orientation]);
        tagCloudLayoutGenerator.font(this._fontFamily);
        tagCloudLayoutGenerator.fontStyle(this._fontStyle);
        tagCloudLayoutGenerator.fontWeight(this._fontWeight);
        tagCloudLayoutGenerator.fontSize((tag: any) => mapSizeToFontSize(tag.value));
        tagCloudLayoutGenerator.random(seed);
        tagCloudLayoutGenerator.spiral(this._spiral);
        tagCloudLayoutGenerator.words(job.words);
        tagCloudLayoutGenerator.text(getText);
        tagCloudLayoutGenerator.timeInterval(this._timeInterval);

        this._layoutIsUpdating = true;
        return new Promise((resolve, reject) => {
            tagCloudLayoutGenerator.on('end', () => {
                this._layoutIsUpdating = false;
                resolve(true);
            });
            tagCloudLayoutGenerator.start();
        });
    }

}


function seed() {
    return 0.5; // constant seed (not random) to ensure constant layouts for identical data
}

function getText(word: Word) {
    return word.text;
}

function getValue(tag: any) {
    return tag.value;
}

function getSizeInPixels(tag: any) {
    return `${tag.size}px`;
}

// const colorScale = d3.scaleOrdinal(seedColors);
// function getFill(tag: any) {
//     return colorScale(tag.text);
// }

/**
 * Hash a string to a number. Ensures there is no random element in positioning strings
 * Retrieved from http://stackoverflow.com/questions/26057572/string-to-unique-hash-in-javascript-jquery
 * @param str
 */
function hashCode(str: string) {
    str = JSON.stringify(str);
    let hash = 0;
    if (str.length === 0) {
        return hash;
    }
    for (let i = 0; i < str.length; i++) {
        let char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}
