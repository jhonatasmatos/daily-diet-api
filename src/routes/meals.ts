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
        on_diet: z.boolean(),
      })

      const {
        name,
        description,
        on_diet: onDiet,
      } = createMealBodySchema.parse(request.body)

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

  app.get('/', async (request, reply) => {
    const meals = await knex('meals').select()

    return reply.status(200).send({
      status: 'success',
      data: meals,
    })
  })

  app.get('/:id', async (request, reply) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealParamsSchema.parse(request.params)

    const { sessionId } = request.cookies

    const [user] = await knex('users')
      .where('session_id', sessionId)
      .select('id')

    const userId = user.id

    const mealExists = await knex('meals')
      .where({ id, user_id: userId })
      .first()

    if (!mealExists) {
      return reply.status(404).send({
        message: 'Meal not found',
      })
    }

    const meal = await knex('meals').where({ id, user_id: userId }).first()

    return reply.status(200).send({
      status: 'success',
      data: meal,
    })
  })

  app.delete(
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

      const mealExists = await knex('meals')
        .where({ id, user_id: userId })
        .first()

      if (!mealExists) {
        return reply.status(404).send({
          message: 'Meal not found',
        })
      }

      await knex('meals').where({ id, user_id: userId }).delete()

      return reply.status(202).send()
    },
  )

  app.get(
    '/user/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getUserParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getUserParamsSchema.parse(request.params)

      const meals = await knex('meals').where('user_id', id).select()

      return reply.status(200).send({
        status: 'success',
        data: meals,
      })
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
        return reply.status(404).send({
          message: 'Meal not found',
        })
      }

      return reply.status(202).send()
    },
  )

  app.get(
    '/summary',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const [user] = await knex('users')
        .where('session_id', sessionId)
        .select('id')

      const userId = user.id

      const [count] = await knex('meals')
        .count('id', {
          as: 'registered meals',
        })
        .where('user_id', userId)

      const refDieta = await knex('meals')
        .count('id', { as: 'meals on diet' })
        .where({ on_diet: true, user_id: userId })

      const refForaDieta = await knex('meals')
        .count('id', { as: 'meals off diet' })
        .where({ on_diet: false, user_id: userId })

      const summary = {
        'registered meals': parseInt(
          JSON.parse(JSON.stringify(count))['registered meals'],
        ),

        'meals on diet': parseInt(
          JSON.parse(JSON.stringify(refDieta))[0]['meals on diet'],
        ),

        'meals off diet': parseInt(
          JSON.parse(JSON.stringify(refForaDieta))[0]['meals off diet'],
        ),
      }

      return reply.status(200).send({
        status: 'success',
        data: summary,
      })
    },
  )
}
