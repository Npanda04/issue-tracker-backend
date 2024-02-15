// src/app.ts
import express, { Request, Response } from 'express';

import { PrismaClient } from '@prisma/client'
import { issueSchema } from './validation/issueValidation';
import { userSchema } from './validation/userValidation';


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


app.delete("/api/issue/:id", async (req: Request, res: Response) => {
    const issueId = parseInt(req.params.id, 10);
  
    try {
      // Check if the issue exists before attempting to delete
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
  
      // Delete the issue
      await prisma.issue.delete({
        where: {
          id: issueId,
        },
      });
  
      return res.status(200).json({
        message: 'Successfully deleted',
      });
    } catch (error) {
      console.error('Error deleting issue:', error);
      return res.status(500).json({
        message: 'Internal Server Error',
      });
    } finally {
      await prisma.$disconnect();
    }
  });
  


  app.patch("/api/issue/assign/:issueId/:userId", async (req: Request, res: Response) => {
    const issueId = parseInt(req.params.issueId, 10);
    const userId = parseInt(req.params.userId, 10);
  
    try {
      await prisma.$transaction([
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
    } catch (error) {
      console.error('Error assigning issue:', error);
      return res.status(500).json({
        message: 'Internal Server Error',
      });
    } finally {
      await prisma.$disconnect();
    }
  });











  app.post("/api/user", async (req: Request, res: Response)=>{

    const body = req.body;
    const validateUser = userSchema.safeParse(body)

    if(!validateUser.success){
        return res.json({
            message : "invalid inputs "
        })
    }

    const existUser = await prisma.user.findUnique({
        where:{
            email : body.email
        }
    })

    if(existUser){
        return res.json({
            message: "email already exist"
        })
    }

    await prisma.user.create({
        data:{
            firstname: body.firstname,
            lastname: body.lastname,
            email: body.email,
            password : body.password
        }
    })

    return res.json({
        message : "user created success "
    })
  })





app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
