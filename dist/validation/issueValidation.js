"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueSchema = void 0;
const zod_1 = require("zod");
exports.issueSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().min(1)
});
