import { it, beforeAll, afterAll, beforeEach, describe, expect } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('Meals routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new meal', async () => {
    const createUserResponse = await request(app.server).post('/users').send({
      username: 'johndoe',
    })

    const cookies = createUserResponse.get('Set-Cookie')

    const mealsResponse = await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'suco detox',
        description: 'suco',
        on_diet: true,
      })
      .expect(201)

    expect(mealsResponse.body.data).toEqual(
      expect.objectContaining({
        name: 'suco detox',
        description: 'suco',
        on_diet: 1,
      }),
    )
  })

  it('should be able to list all meals', async () => {
    const createUserResponse = await request(app.server).post('/users').send({
      username: 'johndoe',
    })

    const cookies = createUserResponse.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      name: 'suco detox',
      description: 'suco',
      on_diet: true,
    })

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      name: 'pizza',
      description: 'pizza',
      on_diet: false,
    })

    const mealsResponse = await request(app.server).get('/meals').expect(200)

    expect(mealsResponse.body.data).toEqual([
      expect.objectContaining({
        name: 'suco detox',
        description: 'suco',
        on_diet: 1,
      }),
      expect.objectContaining({
        name: 'pizza',
        description: 'pizza',
        on_diet: 0,
      }),
    ])
  })

  it('should be able to list a specific meal', async () => {
    const createUserResponse = await request(app.server).post('/users').send({
      username: 'johndoe',
    })

    const cookies = createUserResponse.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      name: 'suco detox',
      description: 'suco',
      on_diet: true,
    })

    const getMealResponse = await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'pizza',
        description: 'pizza',
        on_diet: false,
      })

    const mealId = getMealResponse.body.data.id
    const mealResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .expect(200)

    expect(mealResponse.body.data).toEqual(
      expect.objectContaining({
        name: 'pizza',
        description: 'pizza',
        on_diet: 0,
      }),
    )
  })

  it('should be able to delete a specific meal', async () => {
    const createUserResponse = await request(app.server).post('/users').send({
      username: 'johndoe',
    })

    const cookies = createUserResponse.get('Set-Cookie')

    const mealResponse = await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'suco detox',
        description: 'suco',
        on_diet: true,
      })

    const mealId = mealResponse.body.data.id

    await request(app.server)
      .delete(`/meals/${mealId}`)
      .set('Cookie', cookies)
      .send()
      .expect(202)
  })

  it('should not be able to delete a specific meal twice', async () => {
    const createUserResponse = await request(app.server).post('/users').send({
      username: 'johndoe',
    })

    const cookies = createUserResponse.get('Set-Cookie')

    const mealResponse = await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'suco detox',
        description: 'suco',
        on_diet: true,
      })

    const mealId = mealResponse.body.data.id

    await request(app.server)
      .delete(`/meals/${mealId}`)
      .set('Cookie', cookies)
      .send()

    await request(app.server)
      .delete(`/meals/${mealId}`)
      .set('Cookie', cookies)
      .send()
      .expect(404)
  })

  it('should be able to list a specific meal according user', async () => {
    const createUserResponse = await request(app.server).post('/users').send({
      username: 'johndoe',
    })
    const userId = createUserResponse.body.data.id
    const cookies = createUserResponse.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      name: 'suco detox',
      description: 'suco',
      on_diet: true,
    })

    const listMeal = await request(app.server)
      .get(`/meals/user/${userId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(listMeal.body.data).toEqual([
      expect.objectContaining({
        user_id: userId,
        name: 'suco detox',
        description: 'suco',
        on_diet: 1,
      }),
    ])
  })
})
