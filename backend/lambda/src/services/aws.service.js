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
exports.awsService = void 0;
var client_s3_1 = require("@aws-sdk/client-s3");
var s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
var AWSService = /** @class */ (function () {
    function AWSService() {
        var region = process.env.AWS_DEFAULT_REGION || 'us-east-1';
        // AWS SDK v3 automatically looks for credentials in env vars or IAM roles
        this.s3Client = new client_s3_1.S3Client({
            region: region,
        });
        this.bucketName = process.env.AWS_S3_BUCKET || 'recruitment-docs';
    }
    /**
     * Generate a Presigned URL for uploading a file (PUT)
     * Frontend uses this URL to upload directly to S3
     */
    AWSService.prototype.getPresignedPutUrl = function (key_1, contentType_1) {
        return __awaiter(this, arguments, void 0, function (key, contentType, expiresIn) {
            var command;
            if (expiresIn === void 0) { expiresIn = 300; }
            return __generator(this, function (_a) {
                command = new client_s3_1.PutObjectCommand({
                    Bucket: this.bucketName,
                    Key: key,
                    ContentType: contentType,
                });
                return [2 /*return*/, (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn: expiresIn })];
            });
        });
    };
    /**
     * Generate a Presigned URL for reading a file (GET)
     * Used by the AI service to access the file
     */
    AWSService.prototype.getPresignedGetUrl = function (key_1) {
        return __awaiter(this, arguments, void 0, function (key, expiresIn) {
            var command;
            if (expiresIn === void 0) { expiresIn = 3600; }
            return __generator(this, function (_a) {
                command = new client_s3_1.GetObjectCommand({
                    Bucket: this.bucketName,
                    Key: key,
                });
                return [2 /*return*/, (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn: expiresIn })];
            });
        });
    };
    /**
     * Helper to verify bucket exists (mostly for local dev/first run)
     */
    AWSService.prototype.ensureBucketExists = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 4]);
                        return [4 /*yield*/, this.s3Client.send(new client_s3_1.HeadBucketCommand({ Bucket: this.bucketName }))];
                    case 1:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 2:
                        _a = _b.sent();
                        return [4 /*yield*/, this.s3Client.send(new client_s3_1.CreateBucketCommand({ Bucket: this.bucketName }))];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return AWSService;
}());
exports.awsService = new AWSService();
