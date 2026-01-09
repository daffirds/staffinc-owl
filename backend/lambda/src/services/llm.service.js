"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
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
exports.llmService = void 0;
var openai_1 = require("openai");
var LLMService = /** @class */ (function () {
    function LLMService() {
        this.client = null;
        this.model = 'gpt-4o-mini';
        var apiKey = process.env.OPENAI_API_KEY;
        if (apiKey) {
            this.client = new openai_1.default({ apiKey: apiKey });
        }
        else {
            console.warn('⚠️ OPENAI_API_KEY not set - LLM features will return mock data');
        }
    }
    LLMService.prototype.getJsonResponse = function (prompt) {
        return __awaiter(this, void 0, void 0, function () {
            var response, content, error_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        // Return mock data if client not initialized
                        if (!this.client) {
                            console.warn('LLM client not initialized, returning empty response');
                            return [2 /*return*/, {}];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.client.chat.completions.create({
                                model: this.model,
                                messages: [
                                    { role: 'system', content: 'You are a helpful assistant that outputs JSON only.' },
                                    { role: 'user', content: prompt },
                                ],
                                response_format: { type: 'json_object' },
                            })];
                    case 2:
                        response = _c.sent();
                        content = ((_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || '{}';
                        return [2 /*return*/, JSON.parse(content)];
                    case 3:
                        error_1 = _c.sent();
                        console.error('LLM Error:', error_1);
                        return [2 /*return*/, { error: String(error_1) }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    LLMService.prototype.extractTextFromImage = function (imageUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_2;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this.client)
                            return [2 /*return*/, ''];
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.client.chat.completions.create({
                                model: this.model,
                                messages: [
                                    {
                                        role: 'user',
                                        content: [
                                            { type: 'text', text: 'Transcribe the text in this image exactly as it appears. Return only the raw text.' },
                                            {
                                                type: 'image_url',
                                                image_url: {
                                                    url: imageUrl,
                                                    detail: 'high'
                                                },
                                            },
                                        ],
                                    },
                                ],
                            })];
                    case 2:
                        response = _c.sent();
                        return [2 /*return*/, ((_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || ''];
                    case 3:
                        error_2 = _c.sent();
                        console.error('LLM Vision Error:', error_2);
                        return [2 /*return*/, ''];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    LLMService.prototype.normalizeInternalNotes = function (text) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = "\n      Summarize and standardize these recruitment interview notes. \n      Focus on key strengths, weaknesses, and overall impression.\n      Return JSON: { \"summary\": \"...\" }\n      \n      Notes:\n      ".concat(text.slice(0, 16000), "\n    ");
                        return [4 /*yield*/, this.getJsonResponse(prompt)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.summary || text];
                }
            });
        });
    };
    LLMService.prototype.normalizeScores = function (text) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt;
            return __generator(this, function (_a) {
                prompt = "\n      Extract numerical scores from this text/document. \n      Normalize all scores to a 1-10 scale.\n      Return JSON: { \"technical\": 8.5, \"communication\": 7.0, ... }\n      If no score found for a category, omit it.\n      \n      Document Content:\n      ".concat(text.slice(0, 16000), "\n    ");
                return [2 /*return*/, this.getJsonResponse(prompt)];
            });
        });
    };
    LLMService.prototype.normalizeClientFeedback = function (text) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = "\n      Summarize the client's rejection or acceptance feedback.\n      Highlight the main reason for the decision.\n      Return JSON: { \"summary\": \"...\" }\n      \n      Feedback:\n      ".concat(text.slice(0, 16000), "\n    ");
                        return [4 /*yield*/, this.getJsonResponse(prompt)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.summary || text];
                }
            });
        });
    };
    LLMService.prototype.analyzeGaps = function (requirements, internalNotes, internalScores, clientFeedback) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt;
            return __generator(this, function (_a) {
                prompt = "\n      Analyze the recruitment gap for this candidate.\n      \n      Client Requirements: ".concat(requirements, "\n      Internal Notes: ").concat(internalNotes, "\n      Internal Scores: ").concat(JSON.stringify(internalScores), "\n      Client Feedback: ").concat(clientFeedback, "\n      \n      Determine if any of these gap metrics are TRUE (boolean):\n      1. hidden_criteria: Client rejected for a reason NOT mentioned in requirements.\n      2. assessment_conflict: Internal notes say X is good, Client says X is bad.\n      3. calibration_gap: Both mention skill X, but Internal rated high and Client rated low.\n      4. score_mismatch: Internal avg score >= 7 but Client rejected.\n      \n      Also provide a short explanation for each strictly if it is TRUE.\n      \n      Return JSON structure:\n      {\n        \"has_hidden_criteria\": boolean,\n        \"hidden_criteria_explanation\": \"...\",\n        \"has_assessment_conflict\": boolean,\n        \"assessment_conflict_explanation\": \"...\",\n        \"has_calibration_gap\": boolean,\n        \"calibration_gap_explanation\": \"...\",\n        \"has_score_mismatch\": boolean\n      }\n    ");
                return [2 /*return*/, this.getJsonResponse(prompt)];
            });
        });
    };
    return LLMService;
}());
exports.llmService = new LLMService();
