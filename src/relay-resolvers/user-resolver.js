import { logger } from '../utils/logger';
import { connectionFromDataSource } from '../paging-processor/connection-from-datasource';
import { fetchUserList } from '../db-handlers/user/user-list-fetch';

export const resolveListUsers = async (obj, args, viewer, info) => {
  logger.debug(`in resolveListUsers`);
  logger.debug(` args ` + JSON.stringify(args));

  const businessKey = '_id';
  const fetchParameters = {};

  const execDetails = {
    queryFunction: fetchUserList,
    businessKey: businessKey,
    fetchParameters: fetchParameters
  };

  return connectionFromDataSource(execDetails, obj, args, viewer, info);
};
