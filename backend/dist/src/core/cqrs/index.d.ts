/**
 * CQRS Module - Barrel Export
 * Command Query Responsibility Segregation Infrastructure
 */
export { ICommand, ICommandHandler, IQuery, IQueryHandler, ICommandBus, IQueryBus, ICommandResult, IPaginatedResult, ICommandMetadata, IQueryMetadata } from './interfaces';
export { CommandBus, getCommandBus, initializeCommandBus } from './command-bus';
export { QueryBus, getQueryBus, initializeQueryBus } from './query-bus';
//# sourceMappingURL=index.d.ts.map