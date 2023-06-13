import fastify from 'fastify'

import { mealRoutes } from './routes/meals'
import { userRoutes } from './routes/users'

export const app = fastify()

app.register(mealRoutes)
app.register(userRoutes)
