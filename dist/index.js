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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const issueValidation_1 = require("./validation/issueValidation");
const userValidation_1 = require("./validation/userValidation");
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
app.use(express_1.default.json());
const port = process.env.PORT || 3000;
app.get('/', (req, res) => {
    res.send('Hello, Express with TypeScript!');
});
app.post("/api/issue", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    console.log(body);
    // Validate the request body using the Zod schema
    const validation = issueValidation_1.issueSchema.safeParse(body);
    if (!validation.success) {
        return res.json({
            message: "Invalid input",
            errors: validation.error.errors,
        });
    }
    try {
        // Create a new issue using Prisma
        const newIssue = yield prisma.issue.create({
            data: {
                title: body.title,
                description: body.description,
            },
        });
        return res.json({
            message: "Issue created",
            issue: newIssue,
        });
    }
    catch (error) {
        console.error('Error creating issue:', error);
        return res.status(500).json({
            message: 'Internal Server Error',
        });
    }
}));
app.get("/api/allissues", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allIssues = yield prisma.issue.findMany();
        // Logging issue statuses
        allIssues.forEach((issue) => {
            console.log(issue.status);
        });
        return res.json({
            issues: allIssues,
        });
    }
    catch (error) {
        console.error('Error fetching all issues:', error);
        return res.status(500).json({
            message: 'Internal Server Error',
        });
    }
    finally {
        yield prisma.$disconnect();
    }
}));
app.get("/api/issue/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const issueId = parseInt(req.params.id, 10);
    try {
        // Find the issue by ID
        const issue = yield prisma.issue.findUnique({
            where: {
                id: issueId,
            },
        });
        if (!issue) {
            return res.status(404).json({
                message: 'Issue not found',
            });
        }
        return res.json({
            message: 'Success',
            issue,
        });
    }
    catch (error) {
        console.error('Error fetching issue:', error);
        return res.status(500).json({
            message: 'Internal Server Error',
        });
    }
    finally {
        yield prisma.$disconnect();
    }
}));
app.patch("/api/issue/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const issueId = parseInt(req.params.id, 10);
    const { title, description, status } = req.body;
    try {
        // Check if the provided status is valid
        if (status && !['OPEN', 'IN_PROGRESS', 'CLOSED'].includes(status)) {
            return res.status(400).json({
                message: 'Invalid status value',
            });
        }
        // Check if the issue exists
        const existingIssue = yield prisma.issue.findUnique({
            where: {
                id: issueId,
            },
        });
        if (!existingIssue) {
            return res.status(404).json({
                message: 'Issue not found',
            });
        }
        const updatedIssue = yield prisma.issue.update({
            where: {
                id: issueId,
            },
            data: {
                title: title !== undefined ? title : existingIssue.title,
                description: description !== undefined ? description : existingIssue.description,
                status: status !== undefined ? status : existingIssue.status,
            },
        });
        return res.json({
            message: 'Issue updated successfully',
            updatedIssue,
        });
    }
    catch (error) {
        console.error('Error updating issue:', error);
        return res.status(500).json({
            message: 'Internal Server Error',
        });
    }
    finally {
        yield prisma.$disconnect();
    }
}));
app.delete("/api/issue/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const issueId = parseInt(req.params.id, 10);
    try {
        // Check if the issue exists before attempting to delete
        const existingIssue = yield prisma.issue.findUnique({
            where: {
                id: issueId,
            },
        });
        if (!existingIssue) {
            return res.status(404).json({
                message: 'Issue not found',
            });
        }
        // Delete the issue
        yield prisma.issue.delete({
            where: {
                id: issueId,
            },
        });
        return res.status(200).json({
            message: 'Successfully deleted',
        });
    }
    catch (error) {
        console.error('Error deleting issue:', error);
        return res.status(500).json({
            message: 'Internal Server Error',
        });
    }
    finally {
        yield prisma.$disconnect();
    }
}));
app.patch("/api/issue/assign/:issueId/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const issueId = parseInt(req.params.issueId, 10);
    const userId = parseInt(req.params.userId, 10);
    try {
        yield prisma.$transaction([
            // Update the issue to assign it to the user
            prisma.issue.update({
                where: {
                    id: issueId,
                },
                data: {
                    userId: userId,
                },
            }),
            // Update the user to include the assigned issue
            prisma.user.update({
                where: {
                    id: userId,
                },
                data: {
                    issues: {
                        connect: {
                            id: issueId,
                        },
                    },
                },
            }),
        ]);
        return res.status(200).json({
            message: 'Issue assigned successfully',
        });
    }
    catch (error) {
        console.error('Error assigning issue:', error);
        return res.status(500).json({
            message: 'Internal Server Error',
        });
    }
    finally {
        yield prisma.$disconnect();
    }
}));
app.post("/api/user", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    const validateUser = userValidation_1.userSchema.safeParse(body);
    if (!validateUser.success) {
        return res.json({
            message: "invalid inputs "
        });
    }
    const existUser = yield prisma.user.findUnique({
        where: {
            email: body.email
        }
    });
    if (existUser) {
        return res.json({
            message: "email already exist"
        });
    }
    yield prisma.user.create({
        data: {
            firstname: body.firstname,
            lastname: body.lastname,
            email: body.email,
            password: body.password
        }
    });
    return res.json({
        message: "user created success "
    });
}));
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
