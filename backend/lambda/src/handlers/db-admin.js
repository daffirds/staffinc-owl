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
var child_process_1 = require("child_process");
var database_1 = require("../config/database");
var corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
};
var handler = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var adminKey, body, action, sql, output, result, serialized, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                adminKey = event.headers['x-admin-key'];
                // TODO: In production, use AWS Secrets Manager or a stronger mechanism
                if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'temp-secret-key') {
                    return [2 /*return*/, {
                            statusCode: 403,
                            headers: corsHeaders,
                            body: JSON.stringify({ error: 'Unauthorized' }),
                        }];
                }
                body = JSON.parse(event.body || '{}');
                action = body.action, sql = body.sql;
                // --- ACTION 1: Initial Setup (Prisma Push) ---
                if (action === 'push') {
                    console.log('Starting DB Push...');
                    output = (0, child_process_1.execSync)('npx prisma db push --accept-data-loss', {
                        encoding: 'utf-8',
                        env: __assign(__assign({}, process.env), { 
                            // Ensure these are explicitly set for the child process
                            DATABASE_URL: "postgresql://".concat(process.env.DB_USER, ":").concat(process.env.DB_PASS, "@").concat(process.env.DB_HOST, ":").concat(process.env.DB_PORT, "/").concat(process.env.DB_NAME) }),
                    });
                    return [2 /*return*/, {
                            statusCode: 200,
                            headers: corsHeaders,
                            body: JSON.stringify({ message: 'Push Successful', output: output }),
                        }];
                }
                if (!(action === 'query' && sql)) return [3 /*break*/, 2];
                return [4 /*yield*/, database_1.default.$queryRawUnsafe(sql)];
            case 1:
                result = _a.sent();
                serialized = JSON.stringify(result, function (_, v) {
                    return typeof v === 'bigint' ? v.toString() : v;
                });
                return [2 /*return*/, {
                        statusCode: 200,
                        headers: corsHeaders,
                        body: JSON.stringify({ result: JSON.parse(serialized) }),
                    }];
            case 2: return [2 /*return*/, {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: 'Invalid action' }),
                }];
            case 3:
                error_1 = _a.sent();
                console.error('DB Admin Error:', error_1);
                return [2 /*return*/, {
                        statusCode: 500,
                        headers: corsHeaders,
                        body: JSON.stringify({ error: String(error_1) }),
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.handler = handler;
