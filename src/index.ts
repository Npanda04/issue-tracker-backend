// src/app.ts
import express, { Request, Response } from 'express';

import { PrismaClient } from '@prisma/client'
import { issueSchema } from './validation/issueValidation';


const prisma = new PrismaClient()

const app = express();

app.use(express.json())
const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, Express with TypeScript!');
});



app.post("/api/issue", async (req: Request, res: Response) => {
  const body = req.body;
  console.log(body)

  // Validate the request body using the Zod schema
  const validation = issueSchema.safeParse(body);

  if (!validation.success) {
    return res.json({
      message: "Invalid input",
      errors: validation.error.errors,
    });
  }

  try {
    // Create a new issue using Prisma
    const newIssue = await prisma.issue.create({
      data: {
        title: body.title,
        description: body.description,
      },
    });

    return res.json({
      message: "Issue created",
      issue: newIssue,
    });
  } catch (error) {
    console.error('Error creating issue:', error);
    return res.status(500).json({
      message: 'Internal Server Error',
    });
  }
});



app.get("/api/allissues", async (req: Request, res: Response) => {
    try {
        const allIssues = await prisma.issue.findMany();

        // Logging issue statuses
        allIssues.forEach((issue) => {
            console.log(issue.status);
        });

        return res.json({
            issues: allIssues,
        });
    } catch (error) {
        console.error('Error fetching all issues:', error);
        return res.status(500).json({
            message: 'Internal Server Error',
        });
    } finally {
        await prisma.$disconnect();
    }
});


app.get("/api/issue/:id", async (req: Request, res: Response) => {
    const issueId = parseInt(req.params.id, 10);

    try {
        // Find the issue by ID
        const issue = await prisma.issue.findUnique({
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
    } catch (error) {
        console.error('Error fetching issue:', error);

        return res.status(500).json({
            message: 'Internal Server Error',
        });
    } finally {
        await prisma.$disconnect();
    }
});


app.patch("/api/issue/:id", async (req: Request, res: Response) => {
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
        const existingIssue = await prisma.issue.findUnique({
            where: {
                id: issueId,
            },
        });

        if (!existingIssue) {
            return res.status(404).json({
                message: 'Issue not found',
            });
        }

        const updatedIssue = await prisma.issue.update({
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
    } catch (error) {
        console.error('Error updating issue:', error);
        return res.status(500).json({
            message: 'Internal Server Error',
        });
    } finally {
        await prisma.$disconnect();
    }
});





app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
