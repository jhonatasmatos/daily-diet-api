import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'crypto'

export async function userRoutes(app: FastifyInstance) {
  app.post('/users', async (request, reply) => {
    const createUserBodySchema = z.object({
      username: z.string(),
    })

    const { username } = createUserBodySchema.parse(request.body)

    await knex('users').insert({
      id: randomUUID(),
      username,
    })

    return reply.status(201).send()
  })

  app.get('/users', async () => {
    const users = await knex('users').select()

    return { users }
  })

  app.get('/users/:id', async (request) => {
    const getUserParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getUserParamsSchema.parse(request.params)

    const user = await knex('users').where({ id }).select()

    return { user }
  })
}
