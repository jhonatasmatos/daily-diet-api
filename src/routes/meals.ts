import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'crypto'

export async function mealRoutes(app: FastifyInstance) {
  app.post('/meals', async (request, reply) => {
    const createMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      onDiet: z.enum(['true', 'false']),
    })

    const { name, description, onDiet } = createMealBodySchema.parse(
      request.body,
    )

    await knex('meals').insert({
      id: randomUUID(),
      name,
      description,
      on_diet: onDiet,
    })

    return reply.status(201).send()
  })

  app.get('/meals', async () => {
    const meals = await knex('meals').select()

    return { meals }
  })

  app.get('/meals/:id', async (request) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealParamsSchema.parse(request.params)

    const meals = await knex('meals').where({ id }).select()

    return { meals }
  })

  // app.get('/meals/user/:id', async (request) => {
  //   const getUserParamsSchema = z.object({
  //     id: z.string().uuid(),
  //   })

  //   const { id } = getUserParamsSchema.parse(request.params)

  //   const meal = await knex('meals').where({ id }).select()

  //   return { meal }
  // })
}
