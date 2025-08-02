export * from './base';
export * from './user';
export * from './project';
export * from './client';
export * from './document';

// Repository instances
import { UserRepository } from './user';
import { ProjectRepository } from './project';
import { ClientRepository } from './client';
import { DocumentRepository } from './document';

export const userRepository = new UserRepository();
export const projectRepository = new ProjectRepository();
export const clientRepository = new ClientRepository();
export const documentRepository = new DocumentRepository();