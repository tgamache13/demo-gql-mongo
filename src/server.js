import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import graphQLHTTP from 'express-graphql';
import mongoose from 'mongoose';

import config from './config';
import { Schema } from './schema';
import * as middleware from './http-middleware';
import { logger } from './utils/logger';
import User from './db-models/user-model';

logger.info('Server starting ...');

const GRAPHQL_PORT = parseInt(config.http_port);

let graphQLServer;

mongoose.Promise = global.Promise;

function startGraphQLServer(callback) {
  //logger.debug('mongo URI ' + config.mongo.uri);
  logger.debug('mongo DB ' + config.mongo.db);

  mongoose.set('useCreateIndex', true);
  let promiseDb = mongoose.connect(
    config.mongo.uri + '/' + config.mongo.db,
    {
      autoReconnect: true,
      useNewUrlParser: true
    }
  );

  if (config.db_debug_log) {
    mongoose.set('debug', true);
  }

  promiseDb
    .then(db => {
      logger.info('Mongoose connected ok ');
      logger.debug(
        'Mongo DB ' + User.db.host + ':' + User.db.port + '/' + User.db.name
      );
    })
    .catch(err => {
      logger.error('Mongoose connection error:', err.stack);
      process.exit(1);
    });

  const graphQLApp = express();

  graphQLApp.use('/healthcheck', require('express-healthcheck')());

  graphQLApp.use(
    cors({
      origin: config.cors_origin,
      credentials: true
    })
  );

  graphQLApp.use(cookieParser());

  const graphQLHTTPOpts = {
    graphiql: true,
    pretty: true,
    schema: Schema
  };

  if (process.env.NODE_ENV !== 'production') {
    graphQLHTTPOpts.formatError = error => ({
      message: error.message,
      locations: error.locations,
      stack: error.stack
    });
  }

  graphQLApp.use(
    '/graph',
    middleware.getViewer,
    // middleware.loginRequired,
    graphQLHTTP((request, response, graphQLParams) => ({
      ...graphQLHTTPOpts,
      context: request.gqlviewer
    }))
  );

  graphQLServer = graphQLApp.listen(GRAPHQL_PORT, () => {
    logger.info(
      `GraphQL server is now running on http://localhost:${GRAPHQL_PORT}`
    );
    if (callback) {
      callback();
    }
  });
}

function startServers(callback) {
  // Shut down the server
  if (graphQLServer) {
    graphQLServer.close();
  }

  let doneTasks = 0;

  function handleTaskDone() {
    doneTasks++;
    if (doneTasks === 1 && callback) {
      callback();
    }
  }
  startGraphQLServer(handleTaskDone);
}

startServers();
