import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'crypto'

export async function userRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createUserBodySchema = z.object({
      username: z.string(),
    })

    const { username } = createUserBodySchema.parse(request.body)

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/meals',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    const result = await knex('users')
      .insert({
        id: randomUUID(),
        username,
        session_id: sessionId,
      })
      .returning('*')

    const user = result[0]

    return reply.status(201).send({
      status: 'success',
      data: user,
    })
  })

  app.get('/', async () => {
    const users = await knex('users').select()

    return { users }
  })
}
