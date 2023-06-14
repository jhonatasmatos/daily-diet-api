import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function mealRoutes(app: FastifyInstance) {
  app.post(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const [{ id }] = await knex('users')
        .where('session_id', sessionId)
        .select()

      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        onDiet: z.boolean(),
      })

      const { name, description, onDiet } = createMealBodySchema.parse(
        request.body,
      )

      const result = await knex('meals')
        .insert({
          id: randomUUID(),
          user_id: id,
          name,
          description,
          on_diet: onDiet,
        })
        .returning('*')

      const meal = result[0]

      return reply.status(201).send({
        status: 'success',
        data: meal,
      })
    },
  )

  app.get('/', async () => {
    const meals = await knex('meals').select()

    return { meals }
  })

  app.get('/:id', async (request) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealParamsSchema.parse(request.params)

    const meals = await knex('meals').where(id).select()

    return { meals }
  })

  app.delete(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealParamsSchema.parse(request.params)

      await knex('meals').where(id).delete()

      return reply.status(202).send()
    },
  )

  app.get(
    '/user/:id',
    { preHandler: [checkSessionIdExists] },
    async (request) => {
      const getUserParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getUserParamsSchema.parse(request.params)

      const meal = await knex('meals').where('user_id', id).select()

      return { meal }
    },
  )

  app.put(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealParamsSchema.parse(request.params)

      const { sessionId } = request.cookies

      const [user] = await knex('users')
        .where('session_id', sessionId)
        .select('id')

      const userId = user.id

      const editMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        onDiet: z.boolean(),
      })

      const { name, description, onDiet } = editMealBodySchema.parse(
        request.body,
      )

      const meal = await knex('meals')
        .where({ id, user_id: userId })
        .first()
        .update({
          name,
          description,
          on_diet: onDiet,
        })

      if (!meal) {
        return reply.status(401).send({
          error: 'Meal not found',
        })
      }

      return reply.status(202).send()
    },
  )
}
