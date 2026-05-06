import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: 'postgresql://postgres:Yodapiglancelot1@db.gderranndelfqovozmaa.supabase.co:5432/postgres',
  },
})