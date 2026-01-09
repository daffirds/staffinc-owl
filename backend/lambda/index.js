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
var setup_1 = require("./handlers/setup");
var process_candidate_1 = require("./handlers/process-candidate");
var get_presigned_url_1 = require("./handlers/get-presigned-url");
var metrics_1 = require("./handlers/metrics");
var db_admin_1 = require("./handlers/db-admin");
var handler = function (event, context, callback) { return __awaiter(void 0, void 0, void 0, function () {
    var path, isPath, hasPath;
    return __generator(this, function (_a) {
        // Enable CORS for all OPTIONS requests (pre-flight)
        if (event.httpMethod === 'OPTIONS') {
            return [2 /*return*/, {
                    statusCode: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Credentials': true,
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
                    },
                    body: '',
                }];
        }
        path = event.path;
        isPath = function (suffix) { return path.endsWith(suffix); };
        hasPath = function (segment) { return path.includes(segment); };
        // --- UPLOAD FLOW ---
        if (isPath('/upload/presigned')) {
            return [2 /*return*/, (0, get_presigned_url_1.handler)(event, context, callback)];
        }
        if (isPath('/upload/process')) {
            return [2 /*return*/, (0, process_candidate_1.handler)(event, context, callback)];
        }
        // --- SETUP FLOW ---
        if (isPath('/clients') || isPath('/interviewers') || isPath('/requirements')) {
            return [2 /*return*/, (0, setup_1.handler)(event, context, callback)];
        }
        // --- METRICS FLOW ---
        if (hasPath('/metrics/')) {
            return [2 /*return*/, (0, metrics_1.handler)(event, context, callback)];
        }
        // --- ADMIN FLOW ---
        if (isPath('/admin/db')) {
            return [2 /*return*/, (0, db_admin_1.handler)(event, context, callback)];
        }
        return [2 /*return*/, {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify({ error: 'Route not found' }),
            }];
    });
}); };
exports.handler = handler;
