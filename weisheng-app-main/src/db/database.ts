import Dexie, { Table } from 'dexie';
import { User, Contact, DatabaseVoiceprint, CallLog } from '../types';

export class ShengxiDatabase extends Dexie {
  users!: Table<User>;
  contacts!: Table<Contact>;
  voiceprints!: Table<DatabaseVoiceprint>;
  callLogs!: Table<CallLog>;

  constructor() {
    super('ShengxiDB');
    this.version(4).stores({
      users: 'id, email',
      contacts: 'id, name, voiceprintStatus, shareToken, createdAt',
      voiceprints: '++id, contactId',
      callLogs: '++id, contactId, timestamp'
    });
  }
}

export const db = new ShengxiDatabase();

// Seed initial data if needed
db.on('populate', () => {
  const now = new Date().toISOString();
  db.contacts.bulkAdd([
    { id: '1', name: 'Alisa Wang', avatar: '', voiceprintStatus: 'trained', createdAt: now, recordedAt: now },
    { id: '2', name: 'David Chen', avatar: '', voiceprintStatus: 'training', createdAt: now },
    { id: '3', name: 'Sarah Miller', avatar: '', voiceprintStatus: 'untrained', createdAt: now },
  ]);
});
