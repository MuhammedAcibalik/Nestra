/**
 * CQRS Module - Barrel Export
 * Command Query Responsibility Segregation Infrastructure
 */

// Interfaces
export {
    ICommand,
    ICommandHandler,
    IQuery,
    IQueryHandler,
    ICommandBus,
    IQueryBus,
    ICommandResult,
    IPaginatedResult,
    ICommandMetadata,
    IQueryMetadata
} from './interfaces';

// Command Bus
export { CommandBus, getCommandBus, initializeCommandBus } from './command-bus';

// Query Bus
export { QueryBus, getQueryBus, initializeQueryBus } from './query-bus';
