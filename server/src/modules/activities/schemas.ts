import { z } from 'zod'

export const createActivitySchema = z.object({
  title: z.string().trim().min(1, 'Dê um título à atividade.'),
  details: z.string().trim().default(''),
  people: z.array(z.string().min(1)).min(1, 'Escolha ao menos um responsável.'),
})

export const updateActivitySchema = createActivitySchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  { message: 'Envie ao menos um campo para atualizar.' },
)

export const listQuerySchema = z.object({
  status: z.enum(['open', 'done']).optional(),
})

export type CreateActivityInput = z.infer<typeof createActivitySchema>
