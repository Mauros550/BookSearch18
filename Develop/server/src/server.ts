// server/src/server.ts

import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

import db from './config/connection.js';
import { typeDefs } from './services/typeDef.js';      // ← ensure “typeDefs.js”
import { resolvers } from './services/resolvers.js';
import { authMiddleware } from './services/auth.js';

// ── ESM __dirname Polyfill ───────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// ──────────────────────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 3001;

async function startServer() {
  // 1️⃣ Bootstrap Apollo
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  // 2️⃣ Express middleware
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => authMiddleware({ req }),
    })
  );

  // 3️⃣ Static assets in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(resolve(__dirname, '../Client/dist')));
    app.get('*', (_req, res) => {
      res.sendFile(resolve(__dirname, '../Client/dist/index.html'));
    });
  }

  // 4️⃣ Start HTTP server immediately
  app.listen(PORT, () => {
    console.log(`🚀 GraphQL Server ready at http://localhost:${PORT}/graphql`);
  });

  // 5️⃣ Then watch MongoDB events
  db.on('error', (err) => console.error('❌ MongoDB connection error:', err));
  db.once('open', () => console.log('✅ MongoDB connected'));
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
