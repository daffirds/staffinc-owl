"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var _a = process.env, DB_HOST = _a.DB_HOST, DB_USER = _a.DB_USER, DB_PASS = _a.DB_PASS, DB_PORT = _a.DB_PORT, DB_NAME = _a.DB_NAME;
var databaseUrl = "postgresql://".concat(DB_USER, ":").concat(DB_PASS, "@").concat(DB_HOST, ":").concat(DB_PORT, "/").concat(DB_NAME);
var prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: databaseUrl,
        },
    },
});
exports.default = prisma;
