import fastify from 'fastify'

import { userRoutes } from './routes/users'

export const app = fastify()

app.register(userRoutes)
