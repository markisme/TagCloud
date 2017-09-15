"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var d3 = require("d3");
var d3Cloud = require("d3-cloud");
var ORIENTATIONS = {
    'single': function () { return 0; },
    'right angled': function (tag) {
        return hashCode(tag.text) % 2 * 90;
    },
    'multiple': function (tag) {
        var hashcode = Math.abs(hashCode(tag.text));
        return ((hashcode % 12) * 15) - 90; // fan out 12 * 15 degrees over top-right and bottom-right quadrant (=-90 deg offset)
    }
};
var D3_SCALING_FUNCTIONS = {
    'linear': function () { return d3.scaleLinear(); },
    'log': function () { return d3.scaleLog(); },
    'square root': function () { return d3.scaleSqrt(); }
};
var STATUS;
(function (STATUS) {
    STATUS[STATUS["COMPLETE"] = 0] = "COMPLETE";
    STATUS[STATUS["INCOMPLETE"] = 1] = "INCOMPLETE";
})(STATUS = exports.STATUS || (exports.STATUS = {}));
var TagCloud = (function (_super) {
    __extends(TagCloud, _super);
    function TagCloud(domNode) {
        var _this = _super.call(this) || this;
        _this._size = [1, 1];
        // SETTING (non-configurable)
        _this._fontFamily = 'Impact';
        _this._fontStyle = 'normal';
        _this._fontWeight = 'normal';
        _this._spiral = 'archimedean'; // layout shape
        _this._timeInterval = 1000; // time allowed for layout algorithm
        _this._padding = 5;
        // OPTIONS
        _this._orientation = 'right angled';
        _this._minFontSize = 10;
        _this._maxFontSize = 36;
        _this._textScale = 'log';
        _this._seedColor = ['#00a69b', '#57c17b', '#6f87d8', '#663db8', '#bc52bc', '#9e3533', '#daa05d'];
        _this._showEase = d3.easeBounceOut;
        _this._allInViewBox = false;
        _this._DOMisUpdating = false;
        // DOM
        _this._element = domNode;
        _this._d3SvgContainer = d3.select(_this._element).append('svg');
        _this._svgGroup = _this._d3SvgContainer.append('g');
        _this.resize();
        return _this;
    }
    TagCloud.prototype.setOptions = function (options) {
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
    };
    TagCloud.prototype.resize = function () {
        var newWidth = this._element.offsetWidth;
        var newHeight = this._element.offsetHeight;
        if (newWidth === this._size[0] && newHeight === this._size[1]) {
            return;
        }
        var wasInside = this._size[0] >= this._cloudWidth && this._size[1] >= this._cloudHeight;
        var willBeInside = this._cloudWidth <= newWidth && this._cloudHeight <= newHeight;
        this._size[0] = newWidth;
        this._size[1] = newHeight;
        if (wasInside && willBeInside && this._allInViewBox) {
            this._invalidate(true);
        }
        else {
            this._invalidate(false);
        }
    };
    TagCloud.prototype.setData = function (data) {
        this._words = data.map(toWordTag);
        this._invalidate(false);
    };
    TagCloud.prototype.destroy = function () {
        clearTimeout(this._setTimeoutId);
        this._element.innerHTML = '';
    };
    TagCloud.prototype.getStatus = function () {
        return this._allInViewBox ? STATUS.COMPLETE : STATUS.INCOMPLETE;
    };
    TagCloud.prototype._updateContainerSize = function () {
        this._d3SvgContainer.attr('width', this._size[0]);
        this._d3SvgContainer.attr('height', this._size[1]);
        this._svgGroup.attr('width', this._size[0]);
        this._svgGroup.attr('height', this._size[1]);
    };
    TagCloud.prototype._isJobRunning = function () {
        return (this._setTimeoutId || this._layoutIsUpdating || this._DOMisUpdating);
    };
    TagCloud.prototype._processPendingJob = function () {
        return __awaiter(this, void 0, void 0, function () {
            var job, cloudBBox;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this._pendingJob) {
                            return [2 /*return*/];
                        }
                        if (this._isJobRunning()) {
                            return [2 /*return*/];
                        }
                        this._completedJob = undefined;
                        return [4 /*yield*/, this._pickPendingJob()];
                    case 1:
                        job = _a.sent();
                        if (!job.words.length) return [3 /*break*/, 5];
                        if (!job.refreshLayout) return [3 /*break*/, 3];
                        return [4 /*yield*/, this._updateLayout(job)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this._updateDOM(job)];
                    case 4:
                        _a.sent();
                        cloudBBox = this._svgGroup[0][0].getBBox();
                        this._cloudWidth = cloudBBox.width;
                        this._cloudHeight = cloudBBox.height;
                        this._allInViewBox = cloudBBox.x >= 0 &&
                            cloudBBox.y >= 0 &&
                            cloudBBox.x + cloudBBox.width <= this._element.offsetWidth &&
                            cloudBBox.y + cloudBBox.height <= this._element.offsetHeight;
                        return [3 /*break*/, 6];
                    case 5:
                        this._emptyDOM();
                        _a.label = 6;
                    case 6:
                        if (this._pendingJob) {
                            this._processPendingJob(); // pick up next job
                        }
                        else {
                            this._completedJob = job;
                            this.emit('renderComplete');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    TagCloud.prototype._pickPendingJob = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve, reject) {
                            _this._setTimeoutId = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                                var job;
                                return __generator(this, function (_a) {
                                    job = this._pendingJob;
                                    this._pendingJob = undefined;
                                    this._setTimeoutId = null;
                                    resolve(job);
                                    return [2 /*return*/];
                                });
                            }); }, 0);
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    TagCloud.prototype._emptyDOM = function () {
        this._svgGroup.selectAll('text').remove();
        this._cloudWidth = 0;
        this._cloudHeight = 0;
        this._allInViewBox = true;
        this._DOMisUpdating = false;
    };
    TagCloud.prototype._updateDOM = function (job) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var canSkipDomUpdate, affineTransform, svgTextNodes, stage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        canSkipDomUpdate = this._pendingJob || this._setTimeoutId;
                        if (canSkipDomUpdate) {
                            this._DOMisUpdating = false;
                            return [2 /*return*/];
                        }
                        this._colorScale = d3.scaleOrdinal(this._seedColor);
                        this._DOMisUpdating = true;
                        affineTransform = positionWord.bind(null, this._element.offsetWidth / 2, this._element.offsetHeight / 2);
                        svgTextNodes = this._svgGroup.selectAll('text');
                        stage = svgTextNodes.data(job.words, getText);
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                var enterSelection = stage.enter();
                                var enteringTags = enterSelection.append('text');
                                enteringTags.style('font-size', getSizeInPixels);
                                enteringTags.style('font-style', _this._fontStyle);
                                enteringTags.style('font-weight', function () { return _this._fontWeight; });
                                enteringTags.style('font-family', function () { return _this._fontFamily; });
                                enteringTags.style('fill', function (tag) { return _this._colorScale(tag.text); });
                                enteringTags.attr('text-anchor', function () { return 'middle'; });
                                enteringTags.attr('transform', "translate(" + _this._element.offsetWidth / 2 + ", " + _this._element.offsetHeight / 2 + ")rotate(0)");
                                enteringTags.text(getText);
                                var enteringTransition = enteringTags.transition();
                                enteringTransition.duration(1500);
                                enteringTransition.ease(d3.easeBounceOut);
                                enteringTransition.attr('transform', affineTransform);
                                enteringTags.on('click', function (event) {
                                    _this.emit('select', event);
                                });
                                var self = _this;
                                enteringTags.on('mouseover', function (event) {
                                    d3.select(this).style('cursor', 'pointer');
                                    self.emit('mouseover', this);
                                });
                                enteringTags.on('mouseout', function (event) {
                                    d3.select(this).style('cursor', 'default');
                                    self.emit('mouseout', this);
                                });
                                var movingTags = stage.transition();
                                movingTags.duration(1000);
                                movingTags.style('font-size', getSizeInPixels);
                                movingTags.style('font-style', _this._fontStyle);
                                movingTags.style('font-weight', function () { return _this._fontWeight; });
                                movingTags.style('font-family', function () { return _this._fontFamily; });
                                movingTags.attr('transform', affineTransform);
                                var exitingTags = stage.exit();
                                var exitTransition = exitingTags.transition();
                                exitTransition.duration(200);
                                exitingTags.style('fill-opacity', 1e-6);
                                exitingTags.attr('font-size', 1);
                                exitingTags.remove();
                                var exits = 0;
                                var moves = 0;
                                var resolveWhenDone = function () {
                                    if (exits === 0 && moves === 0) {
                                        _this._DOMisUpdating = false;
                                        resolve(true);
                                    }
                                };
                                exitTransition.each(function () { return exits++; });
                                exitTransition.on('end', function () {
                                    exits--;
                                    resolveWhenDone();
                                });
                                movingTags.each(function () { return moves++; });
                                movingTags.on('end', function () {
                                    moves--;
                                    resolveWhenDone();
                                });
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    TagCloud.prototype._makeTextSizeMapper = function () {
        var mapSizeToFontSize = D3_SCALING_FUNCTIONS[this._textScale]();
        var range = this._words.length === 1 ? [this._maxFontSize, this._maxFontSize] : [this._minFontSize, this._maxFontSize];
        mapSizeToFontSize.range(range);
        if (this._words) {
            mapSizeToFontSize.domain(d3.extent(this._words, getValue));
        }
        return mapSizeToFontSize;
    };
    TagCloud.prototype._makeNewJob = function () {
        return {
            refreshLayout: true,
            size: this._size.slice(),
            words: this._words.map(toWordTag)
        };
    };
    TagCloud.prototype._makeJobPreservingLayout = function () {
        return {
            refreshLayout: false,
            size: this._size.slice(),
            words: this._completedJob.words.map(function (tag) {
                return {
                    x: tag.x,
                    y: tag.y,
                    rotate: tag.rotate,
                    size: tag.size,
                    text: tag.text
                };
            })
        };
    };
    TagCloud.prototype._invalidate = function (keepLayout) {
        if (!this._words) {
            return;
        }
        this._updateContainerSize();
        var canReuseLayout = keepLayout && !this._isJobRunning() && this._completedJob;
        this._pendingJob = (canReuseLayout) ? this._makeJobPreservingLayout() : this._makeNewJob();
        this._processPendingJob();
    };
    TagCloud.prototype._updateLayout = function (job) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var mapSizeToFontSize, tagCloudLayoutGenerator;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mapSizeToFontSize = this._makeTextSizeMapper();
                        tagCloudLayoutGenerator = d3Cloud();
                        tagCloudLayoutGenerator.size(job.size);
                        tagCloudLayoutGenerator.padding(this._padding);
                        tagCloudLayoutGenerator.rotate(ORIENTATIONS[this._orientation]);
                        tagCloudLayoutGenerator.font(this._fontFamily);
                        tagCloudLayoutGenerator.fontStyle(this._fontStyle);
                        tagCloudLayoutGenerator.fontWeight(this._fontWeight);
                        tagCloudLayoutGenerator.fontSize(function (tag) { return mapSizeToFontSize(tag.value); });
                        tagCloudLayoutGenerator.random(seed);
                        tagCloudLayoutGenerator.spiral(this._spiral);
                        tagCloudLayoutGenerator.words(job.words);
                        tagCloudLayoutGenerator.text(getText);
                        tagCloudLayoutGenerator.timeInterval(this._timeInterval);
                        this._layoutIsUpdating = true;
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                tagCloudLayoutGenerator.on('end', function () {
                                    _this._layoutIsUpdating = false;
                                    resolve(true);
                                });
                                tagCloudLayoutGenerator.start();
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return TagCloud;
}(events_1.EventEmitter));
exports.TagCloud = TagCloud;
function seed() {
    return 0.5; // constant seed (not random) to ensure constant layouts for identical data
}
function toWordTag(word) {
    return { value: word.value, text: word.text };
}
function getText(word) {
    return word.text;
}
function positionWord(xTranslate, yTranslate, word) {
    if (isNaN(word.x) || isNaN(word.y) || isNaN(word.rotate)) {
        // move off-screen
        return "translate(" + xTranslate * 3 + ", " + yTranslate * 3 + ")rotate(0)";
    }
    return "translate(" + (word.x + xTranslate) + ", " + (word.y + yTranslate) + ")rotate(" + word.rotate + ")";
}
function getValue(tag) {
    return tag.value;
}
function getSizeInPixels(tag) {
    return tag.size + "px";
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
function hashCode(str) {
    str = JSON.stringify(str);
    var hash = 0;
    if (str.length === 0) {
        return hash;
    }
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}
//# sourceMappingURL=index.js.map