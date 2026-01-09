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
var handler = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var httpMethod, path_1, queryStringParameters, body, jsonBody, isPath, corsHeaders, name_1, client, skip, limit, clients, name_2, interviewer, skip, limit, interviewers, client_id, role_title, raw_content, standardized_requirements, requirement, clientId, skip, limit, requirements, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 13, , 14]);
                httpMethod = event.httpMethod, path_1 = event.path, queryStringParameters = event.queryStringParameters, body = event.body;
                jsonBody = body ? JSON.parse(body) : {};
                isPath = function (suffix) { return path_1.endsWith(suffix); };
                corsHeaders = {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                };
                if (!isPath('/clients')) return [3 /*break*/, 4];
                if (!(httpMethod === 'POST')) return [3 /*break*/, 2];
                name_1 = jsonBody.name;
                return [4 /*yield*/, database_1.default.client.create({ data: { name: name_1 } })];
            case 1:
                client = _a.sent();
                return [2 /*return*/, {
                        statusCode: 201,
                        headers: corsHeaders,
                        body: JSON.stringify(client),
                    }];
            case 2:
                if (!(httpMethod === 'GET')) return [3 /*break*/, 4];
                skip = parseInt((queryStringParameters === null || queryStringParameters === void 0 ? void 0 : queryStringParameters.skip) || '0');
                limit = parseInt((queryStringParameters === null || queryStringParameters === void 0 ? void 0 : queryStringParameters.limit) || '100');
                return [4 /*yield*/, database_1.default.client.findMany({ skip: skip, take: limit })];
            case 3:
                clients = _a.sent();
                return [2 /*return*/, {
                        statusCode: 200,
                        headers: corsHeaders,
                        body: JSON.stringify(clients),
                    }];
            case 4:
                if (!isPath('/interviewers')) return [3 /*break*/, 8];
                if (!(httpMethod === 'POST')) return [3 /*break*/, 6];
                name_2 = jsonBody.name;
                return [4 /*yield*/, database_1.default.interviewer.create({ data: { name: name_2 } })];
            case 5:
                interviewer = _a.sent();
                return [2 /*return*/, {
                        statusCode: 201,
                        headers: corsHeaders,
                        body: JSON.stringify(interviewer),
                    }];
            case 6:
                if (!(httpMethod === 'GET')) return [3 /*break*/, 8];
                skip = parseInt((queryStringParameters === null || queryStringParameters === void 0 ? void 0 : queryStringParameters.skip) || '0');
                limit = parseInt((queryStringParameters === null || queryStringParameters === void 0 ? void 0 : queryStringParameters.limit) || '100');
                return [4 /*yield*/, database_1.default.interviewer.findMany({ skip: skip, take: limit })];
            case 7:
                interviewers = _a.sent();
                return [2 /*return*/, {
                        statusCode: 200,
                        headers: corsHeaders,
                        body: JSON.stringify(interviewers),
                    }];
            case 8:
                if (!isPath('/requirements')) return [3 /*break*/, 12];
                if (!(httpMethod === 'POST')) return [3 /*break*/, 10];
                client_id = jsonBody.client_id, role_title = jsonBody.role_title, raw_content = jsonBody.raw_content, standardized_requirements = jsonBody.standardized_requirements;
                return [4 /*yield*/, database_1.default.clientRequirement.create({
                        data: {
                            clientId: client_id,
                            roleTitle: role_title,
                            rawContent: raw_content,
                            standardizedRequirements: standardized_requirements,
                        },
                    })];
            case 9:
                requirement = _a.sent();
                return [2 /*return*/, {
                        statusCode: 201,
                        headers: corsHeaders,
                        body: JSON.stringify(requirement),
                    }];
            case 10:
                if (!(httpMethod === 'GET')) return [3 /*break*/, 12];
                clientId = queryStringParameters === null || queryStringParameters === void 0 ? void 0 : queryStringParameters.client_id;
                skip = parseInt((queryStringParameters === null || queryStringParameters === void 0 ? void 0 : queryStringParameters.skip) || '0');
                limit = parseInt((queryStringParameters === null || queryStringParameters === void 0 ? void 0 : queryStringParameters.limit) || '100');
                return [4 /*yield*/, database_1.default.clientRequirement.findMany({
                        where: clientId ? { clientId: clientId } : undefined,
                        skip: skip,
                        take: limit,
                        include: { client: true },
                    })];
            case 11:
                requirements = _a.sent();
                return [2 /*return*/, {
                        statusCode: 200,
                        headers: corsHeaders,
                        body: JSON.stringify(requirements),
                    }];
            case 12: return [2 /*return*/, {
                    statusCode: 404,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: 'Route not found' }),
                }];
            case 13:
                error_1 = _a.sent();
                console.error('Setup Handler Error:', error_1);
                return [2 /*return*/, {
                        statusCode: 500,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Credentials': true,
                        },
                        body: JSON.stringify({ error: String(error_1) }),
                    }];
            case 14: return [2 /*return*/];
        }
    });
}); };
exports.handler = handler;
