import { FastifyInstance } from 'fastify'
// import { knex } from '../database'

export async function userRoutes(app: FastifyInstance) {
  app.get('/users', async (request, reply) => {
    // await knex('users').select('*')

    return reply.status(200).send()
  })
}
