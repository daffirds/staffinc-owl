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
exports.handler = void 0;
var database_1 = require("../config/database");
var aws_service_1 = require("../services/aws.service");
var llm_service_1 = require("../services/llm.service");
var corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
};
var handler = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var data, client_requirement_id, requirement, reqText, getText, rawNotes, rawScores, rawFeedback, _a, normNotes, normScoresDict, normFeedback, avgScore, scoreValues, gapAnalysis, newCandidate, error_1;
    var _b, _c, _d, _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                _g.trys.push([0, 14, , 15]);
                if (!event.body) {
                    return [2 /*return*/, {
                            statusCode: 400,
                            headers: corsHeaders,
                            body: JSON.stringify({ error: 'Missing body' }),
                        }];
                }
                data = JSON.parse(event.body);
                client_requirement_id = data.client_requirement_id;
                return [4 /*yield*/, database_1.default.clientRequirement.findUnique({
                        where: { id: client_requirement_id },
                    })];
            case 1:
                requirement = _g.sent();
                if (!requirement) {
                    return [2 /*return*/, {
                            statusCode: 404,
                            headers: corsHeaders,
                            body: JSON.stringify({ error: 'Client Requirement not found' }),
                        }];
                }
                reqText = requirement.standardizedRequirements || requirement.rawContent || '';
                getText = function (key, raw) { return __awaiter(void 0, void 0, void 0, function () {
                    var presignedUrl;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (raw)
                                    return [2 /*return*/, raw];
                                if (!key) return [3 /*break*/, 3];
                                return [4 /*yield*/, aws_service_1.awsService.getPresignedGetUrl(key)];
                            case 1:
                                presignedUrl = _a.sent();
                                return [4 /*yield*/, llm_service_1.llmService.extractTextFromImage(presignedUrl)];
                            case 2: return [2 /*return*/, _a.sent()];
                            case 3: return [2 /*return*/, ''];
                        }
                    });
                }); };
                return [4 /*yield*/, getText(data.notes_key, data.notes_text)];
            case 2:
                rawNotes = _g.sent();
                return [4 /*yield*/, getText(data.scores_key, data.scores_text)];
            case 3:
                rawScores = _g.sent();
                return [4 /*yield*/, getText(data.feedback_key, data.feedback_text)];
            case 4:
                rawFeedback = _g.sent();
                return [4 /*yield*/, Promise.all([
                        llm_service_1.llmService.normalizeInternalNotes(rawNotes),
                        llm_service_1.llmService.normalizeScores(rawScores),
                        llm_service_1.llmService.normalizeClientFeedback(rawFeedback),
                    ])];
            case 5:
                _a = _g.sent(), normNotes = _a[0], normScoresDict = _a[1], normFeedback = _a[2];
                avgScore = 0;
                scoreValues = Object.values(normScoresDict).filter(function (v) { return typeof v === 'number'; });
                if (scoreValues.length > 0) {
                    avgScore = scoreValues.reduce(function (a, b) { return a + b; }, 0) / scoreValues.length;
                }
                return [4 /*yield*/, llm_service_1.llmService.analyzeGaps(reqText, normNotes, normScoresDict, normFeedback)];
            case 6:
                gapAnalysis = _g.sent();
                return [4 /*yield*/, database_1.default.candidate.create({
                        data: {
                            clientRequirementId: client_requirement_id,
                            interviewerId: data.interviewer_id || null,
                            candidateName: data.candidate_name || null,
                            role: data.role || null,
                            interviewDate: data.interview_date ? new Date(data.interview_date) : null,
                            rawInternalNotes: rawNotes,
                            rawInternalScores: rawScores,
                            rawClientFeedback: rawFeedback,
                            standardizedInternalNotes: normNotes,
                            standardizedScores: JSON.stringify(normScoresDict),
                            avgInternalScore: avgScore,
                            standardizedClientFeedback: normFeedback,
                            isAccepted: (_b = data.is_accepted) !== null && _b !== void 0 ? _b : false,
                            hasHiddenCriteria: (_c = gapAnalysis.has_hidden_criteria) !== null && _c !== void 0 ? _c : false,
                            hiddenCriteriaExplanation: gapAnalysis.hidden_criteria_explanation || null,
                            hasAssessmentConflict: (_d = gapAnalysis.has_assessment_conflict) !== null && _d !== void 0 ? _d : false,
                            assessmentConflictExplanation: gapAnalysis.assessment_conflict_explanation || null,
                            hasCalibrationGap: (_e = gapAnalysis.has_calibration_gap) !== null && _e !== void 0 ? _e : false,
                            calibrationGapExplanation: gapAnalysis.calibration_gap_explanation || null,
                            hasScoreMismatch: (_f = gapAnalysis.has_score_mismatch) !== null && _f !== void 0 ? _f : false,
                        },
                    })];
            case 7:
                newCandidate = _g.sent();
                if (!data.notes_key) return [3 /*break*/, 9];
                return [4 /*yield*/, database_1.default.document.create({
                        data: { candidateId: newCandidate.id, filePath: data.notes_key, documentType: 'NOTES', contentType: 'application/octet-stream' }
                    })];
            case 8:
                _g.sent();
                _g.label = 9;
            case 9:
                if (!data.scores_key) return [3 /*break*/, 11];
                return [4 /*yield*/, database_1.default.document.create({
                        data: { candidateId: newCandidate.id, filePath: data.scores_key, documentType: 'SCORES', contentType: 'application/octet-stream' }
                    })];
            case 10:
                _g.sent();
                _g.label = 11;
            case 11:
                if (!data.feedback_key) return [3 /*break*/, 13];
                return [4 /*yield*/, database_1.default.document.create({
                        data: { candidateId: newCandidate.id, filePath: data.feedback_key, documentType: 'FEEDBACK', contentType: 'application/octet-stream' }
                    })];
            case 12:
                _g.sent();
                _g.label = 13;
            case 13: return [2 /*return*/, {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        status: 'success',
                        candidate_id: newCandidate.id,
                        gaps: gapAnalysis,
                    }),
                }];
            case 14:
                error_1 = _g.sent();
                console.error('Process Handler Error:', error_1);
                return [2 /*return*/, {
                        statusCode: 500,
                        headers: corsHeaders,
                        body: JSON.stringify({ error: String(error_1) }),
                    }];
            case 15: return [2 /*return*/];
        }
    });
}); };
exports.handler = handler;
