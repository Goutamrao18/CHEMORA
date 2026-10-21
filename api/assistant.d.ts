import { z } from 'zod';
import type { Request, Response } from 'express';

export const AssistantRequestSchema: z.ZodObject<any>;
export default function handler(req: Request, res: Response): Promise<any>;
