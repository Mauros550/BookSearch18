// server/src/server.ts

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

import db from './config/connection.js';
import { typeDefs } from './services/typeDef.js';
import { resolvers } from './services/resolvers.js';
import { authMiddleware } from './services/auth.js';

const PORT = process.env.PORT || 3001;

async function startServer() {
  // 1️⃣ Start Apollo
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  // 2️⃣ Configure Express
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // 3️⃣ Mount GraphQL
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => authMiddleware({ req }),
    })
  );

  // 4️⃣ Launch HTTP server
  app.listen(PORT, () => {
    console.log(`🚀 GraphQL Server ready at http://localhost:${PORT}/graphql`);
  });

  // 5️⃣ MongoDB event logs
  db.on('error', (err) => console.error('❌ MongoDB connection error:', err));
  db.once('open', () => console.log('✅ MongoDB connected'));
}

// Boot it up
startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
