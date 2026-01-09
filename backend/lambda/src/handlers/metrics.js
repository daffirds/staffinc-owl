"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var handler = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var path_1, queryStringParameters, isPath, corsHeaders, clientId, interviewerId, whereClause, total, accepted, rejected, rejectedWhere, hiddenCriteria, assessmentConflict, calibrationGap, scoreMismatch, scoreMismatchCandidates, avgScoreMismatch, validScores, sum, metric, clientId, skip, limit, whereClause, candidates, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 12, , 13]);
                path_1 = event.path, queryStringParameters = event.queryStringParameters;
                isPath = function (suffix) { return path_1.endsWith(suffix); };
                corsHeaders = {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                };
                if (!isPath('/metrics/overview')) return [3 /*break*/, 9];
                clientId = queryStringParameters === null || queryStringParameters === void 0 ? void 0 : queryStringParameters.client_id;
                interviewerId = queryStringParameters === null || queryStringParameters === void 0 ? void 0 : queryStringParameters.interviewer_id;
                whereClause = {};
                if (clientId)
                    whereClause.requirement = { clientId: clientId };
                if (interviewerId)
                    whereClause.interviewerId = interviewerId;
                return [4 /*yield*/, database_1.default.candidate.count({ where: whereClause })];
            case 1:
                total = _a.sent();
                return [4 /*yield*/, database_1.default.candidate.count({ where: __assign(__assign({}, whereClause), { isAccepted: true }) })];
            case 2:
                accepted = _a.sent();
                return [4 /*yield*/, database_1.default.candidate.count({ where: __assign(__assign({}, whereClause), { isAccepted: false }) })];
            case 3:
                rejected = _a.sent();
                rejectedWhere = __assign(__assign({}, whereClause), { isAccepted: false });
                return [4 /*yield*/, database_1.default.candidate.count({ where: __assign(__assign({}, rejectedWhere), { hasHiddenCriteria: true }) })];
            case 4:
                hiddenCriteria = _a.sent();
                return [4 /*yield*/, database_1.default.candidate.count({ where: __assign(__assign({}, rejectedWhere), { hasAssessmentConflict: true }) })];
            case 5:
                assessmentConflict = _a.sent();
                return [4 /*yield*/, database_1.default.candidate.count({ where: __assign(__assign({}, rejectedWhere), { hasCalibrationGap: true }) })];
            case 6:
                calibrationGap = _a.sent();
                return [4 /*yield*/, database_1.default.candidate.count({ where: __assign(__assign({}, rejectedWhere), { hasScoreMismatch: true }) })];
            case 7:
                scoreMismatch = _a.sent();
                return [4 /*yield*/, database_1.default.candidate.findMany({
                        where: __assign(__assign({}, rejectedWhere), { hasScoreMismatch: true }),
                        select: { avgInternalScore: true },
                    })];
            case 8:
                scoreMismatchCandidates = _a.sent();
                avgScoreMismatch = 0;
                if (scoreMismatchCandidates.length > 0) {
                    validScores = scoreMismatchCandidates
                        .map(function (c) { return c.avgInternalScore; })
                        .filter(function (s) { return s !== null; });
                    if (validScores.length > 0) {
                        sum = validScores.reduce(function (acc, val) { return acc + Number(val); }, 0);
                        avgScoreMismatch = sum / validScores.length;
                    }
                }
                return [2 /*return*/, {
                        statusCode: 200,
                        headers: corsHeaders,
                        body: JSON.stringify({
                            total: total,
                            accepted: accepted,
                            rejected: rejected,
                            metrics: {
                                hidden_criteria: hiddenCriteria,
                                assessment_conflict: assessmentConflict,
                                calibration_gap: calibrationGap,
                                score_mismatch: scoreMismatch,
                                score_mismatch_avg: avgScoreMismatch,
                            },
                        }),
                    }];
            case 9:
                if (!isPath('/metrics/candidates')) return [3 /*break*/, 11];
                metric = queryStringParameters === null || queryStringParameters === void 0 ? void 0 : queryStringParameters.metric;
                clientId = queryStringParameters === null || queryStringParameters === void 0 ? void 0 : queryStringParameters.client_id;
                skip = parseInt((queryStringParameters === null || queryStringParameters === void 0 ? void 0 : queryStringParameters.skip) || '0');
                limit = parseInt((queryStringParameters === null || queryStringParameters === void 0 ? void 0 : queryStringParameters.limit) || '50');
                whereClause = { isAccepted: false };
                if (clientId)
                    whereClause.requirement = { clientId: clientId };
                // Apply metric filter
                if (metric === 'hidden_criteria')
                    whereClause.hasHiddenCriteria = true;
                else if (metric === 'assessment_conflict')
                    whereClause.hasAssessmentConflict = true;
                else if (metric === 'calibration_gap')
                    whereClause.hasCalibrationGap = true;
                else if (metric === 'score_mismatch')
                    whereClause.hasScoreMismatch = true;
                return [4 /*yield*/, database_1.default.candidate.findMany({
                        where: whereClause,
                        orderBy: { createdAt: 'desc' },
                        skip: skip,
                        take: limit,
                    })];
            case 10:
                candidates = _a.sent();
                return [2 /*return*/, {
                        statusCode: 200,
                        headers: corsHeaders,
                        body: JSON.stringify(candidates),
                    }];
            case 11: return [2 /*return*/, {
                    statusCode: 404,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: 'Route not found' }),
                }];
            case 12:
                error_1 = _a.sent();
                console.error('Metrics Handler Error:', error_1);
                return [2 /*return*/, {
                        statusCode: 500,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Credentials': true,
                        },
                        body: JSON.stringify({ error: String(error_1) }),
                    }];
            case 13: return [2 /*return*/];
        }
    });
}); };
exports.handler = handler;
