import { it, beforeAll, afterAll, beforeEach, describe, expect } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('Users routes', () => {
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

  it('should be able to create a new user', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({
        username: 'johndoe',
      })
      .expect(201)

    expect(userResponse.body.data).toEqual(
      expect.objectContaining({
        username: 'johndoe',
      }),
    )

    expect(userResponse.body.data.session_id).not.toBeNull()
  })

  it('should not be able to create a new user with existing username', async () => {
    await request(app.server).post('/users').send({
      username: 'johndoe',
    })

    const userResponse = await request(app.server)
      .post('/users')
      .send({
        username: 'johndoe',
      })
      .expect(400)

    expect(userResponse.body).toEqual(
      expect.objectContaining({
        status: 'error',
        message: 'User already registered',
      }),
    )
  })

  it('should be able to list all users', async () => {
    await request(app.server).post('/users').send({
      username: 'johndoe',
    })

    const userResponse = await request(app.server).get('/users').expect(200)

    expect(userResponse.body.data).toEqual([
      expect.objectContaining({
        username: 'johndoe',
      }),
    ])
  })
})
