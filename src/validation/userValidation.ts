import {z} from "zod";

export const userSchema = z.object({
    firstname: z.string().min(1).max(255),
    lastname:z.string().min(1).max(255),
    email: z.string().email(),
    password: z.string()
});